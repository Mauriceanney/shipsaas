"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { verifyTOTP, generateBackupCodes, formatBackupCodes } from "@/lib/two-factor";
import {
  setupTwoFactorSchema,
  type SetupTwoFactorInput,
} from "@/lib/validations/auth";

type RegenerateResult =
  | {
      success: true;
      backupCodes: string[];
    }
  | { success: false; error: string };

/**
 * Regenerate backup codes for 2FA
 * Requires TOTP verification
 * Invalidates all previous backup codes
 */
export async function regenerateBackupCodesAction(
  input: SetupTwoFactorInput
): Promise<RegenerateResult> {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    // Validate input
    const validatedFields = setupTwoFactorSchema.safeParse(input);

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
      },
    });

    if (!user) {
      return { success: false, error: "User not found" };
    }

    if (!user.twoFactorEnabled || !user.twoFactorSecret) {
      return { success: false, error: "Two-factor authentication is not enabled" };
    }

    // Verify TOTP code
    const isValid = verifyTOTP(code, user.twoFactorSecret);

    if (!isValid) {
      return { success: false, error: "Invalid verification code" };
    }

    // Generate new backup codes
    const { plainCodes, hashedCodes } = await generateBackupCodes(10);

    // Update user with new backup codes
    await db.user.update({
      where: { id: session.user.id },
      data: { twoFactorBackupCodes: hashedCodes },
    });

    // Revalidate security settings page
    revalidatePath("/dashboard/security");

    return {
      success: true,
      backupCodes: formatBackupCodes(plainCodes),
    };
  } catch (error) {
    console.error("Backup code regeneration error:", error);
    return { success: false, error: "Failed to regenerate backup codes" };
  }
}
