"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { verifyTOTP, verifyBackupCode } from "@/lib/two-factor";
import {
  disableTwoFactorSchema,
  type DisableTwoFactorInput,
} from "@/lib/validations/auth";

type DisableResult =
  | { success: true }
  | { success: false; error: string };

/**
 * Disable 2FA for authenticated user
 * Requires TOTP or backup code verification
 */
export async function disableTwoFactorAction(
  input: DisableTwoFactorInput
): Promise<DisableResult> {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    // Validate input
    const validatedFields = disableTwoFactorSchema.safeParse(input);

    if (!validatedFields.success) {
      return {
        success: false,
        error: validatedFields.error.errors[0]?.message ?? "Invalid code",
      };
    }

    const { code } = validatedFields.data;

    // Get user with 2FA data
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: {
        twoFactorSecret: true,
        twoFactorEnabled: true,
        twoFactorBackupCodes: true,
      },
    });

    if (!user) {
      return { success: false, error: "User not found" };
    }

    if (!user.twoFactorEnabled) {
      return { success: false, error: "Two-factor authentication is not enabled" };
    }

    if (!user.twoFactorSecret) {
      return { success: false, error: "Invalid 2FA configuration" };
    }

    // Verify code (TOTP or backup code)
    let isValid = false;

    // Try TOTP first
    if (code.length === 6 && /^\d+$/.test(code)) {
      isValid = verifyTOTP(code, user.twoFactorSecret);
    }

    // Try backup code if TOTP failed
    if (!isValid && code.length === 8) {
      const backupCodeIndex = await verifyBackupCode(code, user.twoFactorBackupCodes);
      isValid = backupCodeIndex !== -1;
    }

    if (!isValid) {
      return { success: false, error: "Invalid verification code" };
    }

    // Disable 2FA
    await db.user.update({
      where: { id: session.user.id },
      data: {
        twoFactorEnabled: false,
        twoFactorSecret: null,
        twoFactorBackupCodes: [],
      },
    });

    return { success: true };
  } catch (error) {
    console.error("2FA disable error:", error);
    return { success: false, error: "Failed to disable two-factor authentication" };
  }
}
