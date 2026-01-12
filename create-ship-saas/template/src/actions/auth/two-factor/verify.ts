"use server";

import { cookies } from "next/headers";
import { randomUUID } from "crypto";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { rateLimiters, getClientIpFromHeaders } from "@/lib/rate-limit";
import { user, loginHistory } from "@/lib/schema";
import { verifyTOTP } from "@/lib/two-factor";

const PENDING_2FA_COOKIE = "pending_2fa_user_id";
const PENDING_2FA_MAX_AGE = 5 * 60; // 5 minutes

export type VerifyTwoFactorResult =
  | { success: true; redirectTo: string }
  | { success: false; error: string };

/**
 * Set a pending 2FA verification cookie during login
 * Called after password verification but before 2FA check
 */
export async function setPending2FA(userId: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(PENDING_2FA_COOKIE, userId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: PENDING_2FA_MAX_AGE,
    path: "/",
  });
}

/**
 * Get the pending 2FA user ID from cookie
 */
export async function getPending2FAUserId(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(PENDING_2FA_COOKIE)?.value ?? null;
}

/**
 * Clear the pending 2FA cookie
 */
export async function clearPending2FA(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(PENDING_2FA_COOKIE);
}

/**
 * Verify 2FA code during login flow
 * @param code - The 6-digit TOTP code from the authenticator app
 */
export async function verifyTwoFactor(code: string): Promise<VerifyTwoFactorResult> {
  try {
    // Rate limiting - 5 attempts per 5 minutes per IP
    const clientIp = await getClientIpFromHeaders();
    const rateLimitResult = await rateLimiters.twoFactor(clientIp);

    if (!rateLimitResult.success) {
      return { success: false, error: "Too many verification attempts. Please try again later." };
    }

    // Validate code format
    if (!/^\d{6}$/.test(code)) {
      return { success: false, error: "Invalid code format. Please enter a 6-digit code." };
    }

    // Get pending 2FA user from cookie
    const userId = await getPending2FAUserId();

    if (!userId) {
      return { success: false, error: "Session expired. Please log in again." };
    }

    // Get user's 2FA secret
    const [existingUser] = await db
      .select({
        id: user.id,
        twoFactorSecret: user.twoFactorSecret,
        twoFactorEnabled: user.twoFactorEnabled,
      })
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);

    if (!existingUser?.twoFactorSecret || !existingUser.twoFactorEnabled) {
      await clearPending2FA();
      return { success: false, error: "Two-factor authentication is not enabled for this account" };
    }

    // Verify the TOTP code
    const isValid = verifyTOTP(code, existingUser.twoFactorSecret);

    if (!isValid) {
      // Log failed attempt
      await db.insert(loginHistory).values({
        id: randomUUID(),
        userId: existingUser.id,
        success: false,
        failReason: "Invalid 2FA code",
        provider: "credential",
      });

      return { success: false, error: "Invalid verification code. Please try again." };
    }

    // Clear the pending 2FA cookie
    await clearPending2FA();

    // Log successful 2FA verification
    await db.insert(loginHistory).values({
      id: randomUUID(),
      userId: existingUser.id,
      success: true,
      provider: "credential",
    });

    return { success: true, redirectTo: "/dashboard" };
  } catch (error) {
    console.error("Error verifying 2FA:", error);
    return { success: false, error: "Failed to verify two-factor authentication" };
  }
}
