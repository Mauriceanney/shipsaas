"use server";

import { randomUUID } from "crypto";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { user, loginHistory } from "@/lib/schema";
import { verifyBackupCode as verifyCode } from "@/lib/two-factor";
import { getPending2FAUserId, clearPending2FA } from "./verify";

export type VerifyBackupCodeResult =
  | { success: true; redirectTo: string; remainingCodes: number }
  | { success: false; error: string };

/**
 * Verify a backup code during 2FA login
 * Backup codes are single-use and removed after successful verification
 * @param code - The backup code (with or without dash)
 */
export async function verifyBackupCode(code: string): Promise<VerifyBackupCodeResult> {
  try {
    // Normalize the code (remove dashes, uppercase)
    const normalizedCode = code.replace(/-/g, "").toUpperCase();

    // Validate code format (8 characters, hex)
    if (!/^[A-F0-9]{8}$/.test(normalizedCode)) {
      return { success: false, error: "Invalid backup code format" };
    }

    // Get pending 2FA user from cookie
    const userId = await getPending2FAUserId();

    if (!userId) {
      return { success: false, error: "Session expired. Please log in again." };
    }

    // Get user's backup codes
    const [existingUser] = await db
      .select({
        id: user.id,
        twoFactorEnabled: user.twoFactorEnabled,
        twoFactorBackupCodes: user.twoFactorBackupCodes,
      })
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);

    if (!existingUser?.twoFactorEnabled) {
      await clearPending2FA();
      return { success: false, error: "Two-factor authentication is not enabled for this account" };
    }

    if (!existingUser.twoFactorBackupCodes || existingUser.twoFactorBackupCodes.length === 0) {
      return { success: false, error: "No backup codes available. Please use your authenticator app." };
    }

    // Verify the backup code
    const codeIndex = verifyCode(normalizedCode, existingUser.twoFactorBackupCodes);

    if (codeIndex === -1) {
      // Log failed attempt
      await db.insert(loginHistory).values({
        id: randomUUID(),
        userId: existingUser.id,
        success: false,
        failReason: "Invalid backup code",
        provider: "credential",
      });

      return { success: false, error: "Invalid backup code. Please try again." };
    }

    // Remove the used backup code
    const remainingCodes = existingUser.twoFactorBackupCodes.filter((_, index) => index !== codeIndex);

    await db
      .update(user)
      .set({ twoFactorBackupCodes: remainingCodes })
      .where(eq(user.id, existingUser.id));

    // Clear the pending 2FA cookie
    await clearPending2FA();

    // Log successful verification
    await db.insert(loginHistory).values({
      id: randomUUID(),
      userId: existingUser.id,
      success: true,
      provider: "credential",
    });

    return {
      success: true,
      redirectTo: "/dashboard",
      remainingCodes: remainingCodes.length,
    };
  } catch (error) {
    console.error("Error verifying backup code:", error);
    return { success: false, error: "Failed to verify backup code" };
  }
}
