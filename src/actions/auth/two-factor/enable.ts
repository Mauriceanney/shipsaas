"use server";

import { revalidatePath } from "next/cache";

import { trackServerEvent, AUTH_EVENTS } from "@/lib/analytics";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { verifyTOTP, generateBackupCodes, formatBackupCodes } from "@/lib/two-factor";
import {
  setupTwoFactorSchema,
  type SetupTwoFactorInput,
} from "@/lib/validations/auth";

type EnableResult =
  | {
      success: true;
      backupCodes: string[];
    }
  | { success: false; error: string };

/**
 * Enable 2FA after verifying the first TOTP code
 * Returns backup codes on success
 */
export async function enableTwoFactorAction(
  input: SetupTwoFactorInput
): Promise<EnableResult> {
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

    // Get user with pending 2FA secret
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

    if (user.twoFactorEnabled) {
      return { success: false, error: "Two-factor authentication is already enabled" };
    }

    if (!user.twoFactorSecret) {
      return { success: false, error: "Please start 2FA setup first" };
    }

    // Verify the TOTP code
    const isValid = verifyTOTP(code, user.twoFactorSecret);

    if (!isValid) {
      return { success: false, error: "Invalid verification code" };
    }

    // Generate backup codes
    const { plainCodes, hashedCodes } = await generateBackupCodes(10);

    // Enable 2FA and store backup codes
    await db.user.update({
      where: { id: session.user.id },
      data: {
        twoFactorEnabled: true,
        twoFactorBackupCodes: hashedCodes,
      },
    });

    // Track 2FA enabled event
    trackServerEvent(session.user.id, AUTH_EVENTS.TWO_FACTOR_ENABLED);

    // Revalidate security settings page
    revalidatePath("/dashboard/security");

    // Return formatted backup codes for display
    return {
      success: true,
      backupCodes: formatBackupCodes(plainCodes),
    };
  } catch (error) {
    console.error("2FA enable error:", error);
    return { success: false, error: "Failed to enable two-factor authentication" };
  }
}
