"use server";

import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { user } from "@/lib/schema";
import { verifyTOTP, generateBackupCodes, hashBackupCodes, formatBackupCodes } from "@/lib/two-factor";

export type RegenerateBackupCodesResult =
  | { success: true; backupCodes: string[] }
  | { success: false; error: string };

/**
 * Regenerate backup codes for the current user
 * Requires TOTP verification for security
 * @param code - The 6-digit TOTP code from the authenticator app
 */
export async function regenerateBackupCodes(code: string): Promise<RegenerateBackupCodesResult> {
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

    // Generate new backup codes
    const newBackupCodes = generateBackupCodes(10);
    const hashedBackupCodes = hashBackupCodes(newBackupCodes);

    // Update backup codes in database
    await db
      .update(user)
      .set({ twoFactorBackupCodes: hashedBackupCodes })
      .where(eq(user.id, session.user.id));

    return {
      success: true,
      backupCodes: formatBackupCodes(newBackupCodes),
    };
  } catch (error) {
    console.error("Error regenerating backup codes:", error);
    return { success: false, error: "Failed to regenerate backup codes" };
  }
}
