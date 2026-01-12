"use server";

import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { user } from "@/lib/schema";
import { verifyTOTP } from "@/lib/two-factor";

export type DisableTwoFactorResult =
  | { success: true }
  | { success: false; error: string };

/**
 * Disable 2FA for the current user
 * Requires verification with current TOTP code for security
 * @param code - The 6-digit TOTP code from the authenticator app
 */
export async function disableTwoFactor(code: string): Promise<DisableTwoFactorResult> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user) {
      return { success: false, error: "Not authenticated" };
    }

    // Validate code format
    if (!/^\d{6}$/.test(code)) {
      return { success: false, error: "Invalid code format. Please enter a 6-digit code." };
    }

    // Get user's 2FA settings
    const [existingUser] = await db
      .select({
        twoFactorSecret: user.twoFactorSecret,
        twoFactorEnabled: user.twoFactorEnabled,
      })
      .from(user)
      .where(eq(user.id, session.user.id))
      .limit(1);

    if (!existingUser?.twoFactorEnabled || !existingUser.twoFactorSecret) {
      return { success: false, error: "Two-factor authentication is not enabled" };
    }

    // Verify the TOTP code
    const isValid = verifyTOTP(code, existingUser.twoFactorSecret);

    if (!isValid) {
      return { success: false, error: "Invalid verification code. Please try again." };
    }

    // Disable 2FA and clear secrets
    await db
      .update(user)
      .set({
        twoFactorEnabled: false,
        twoFactorSecret: null,
        twoFactorBackupCodes: null,
      })
      .where(eq(user.id, session.user.id));

    return { success: true };
  } catch (error) {
    console.error("Error disabling 2FA:", error);
    return { success: false, error: "Failed to disable two-factor authentication" };
  }
}
