"use server";

import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { user } from "@/lib/schema";
import { verifyTOTP } from "@/lib/two-factor";

export type EnableTwoFactorResult =
  | { success: true }
  | { success: false; error: string };

/**
 * Enable 2FA after verifying the user can generate valid codes
 * @param code - The 6-digit TOTP code from the authenticator app
 */
export async function enableTwoFactor(code: string): Promise<EnableTwoFactorResult> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user) {
      return { success: false, error: "Not authenticated" };
    }

    // Validate code format
    if (!/^\d{6}$/.test(code)) {
      return { success: false, error: "Invalid code format. Please enter a 6-digit code." };
    }

    // Get user's pending 2FA secret
    const [existingUser] = await db
      .select({
        twoFactorSecret: user.twoFactorSecret,
        twoFactorEnabled: user.twoFactorEnabled,
      })
      .from(user)
      .where(eq(user.id, session.user.id))
      .limit(1);

    if (!existingUser?.twoFactorSecret) {
      return { success: false, error: "Please set up two-factor authentication first" };
    }

    if (existingUser.twoFactorEnabled) {
      return { success: false, error: "Two-factor authentication is already enabled" };
    }

    // Verify the TOTP code
    const isValid = verifyTOTP(code, existingUser.twoFactorSecret);

    if (!isValid) {
      return { success: false, error: "Invalid verification code. Please try again." };
    }

    // Enable 2FA
    await db
      .update(user)
      .set({ twoFactorEnabled: true })
      .where(eq(user.id, session.user.id));

    return { success: true };
  } catch (error) {
    console.error("Error enabling 2FA:", error);
    return { success: false, error: "Failed to enable two-factor authentication" };
  }
}
