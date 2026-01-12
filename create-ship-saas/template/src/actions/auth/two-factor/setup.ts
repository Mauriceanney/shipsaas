"use server";

import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { user } from "@/lib/schema";
import {
  generateSecret,
  generateQRCodeDataURL,
  generateBackupCodes,
  hashBackupCodes,
  formatBackupCodes,
} from "@/lib/two-factor";

export type TwoFactorSetupResult =
  | {
      success: true;
      secret: string;
      qrCode: string;
      backupCodes: string[];
    }
  | {
      success: false;
      error: string;
    };

/**
 * Initiate 2FA setup for the current user
 * Generates a new TOTP secret, QR code, and backup codes
 * Does NOT enable 2FA - that happens after verification
 */
export async function setupTwoFactor(): Promise<TwoFactorSetupResult> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user) {
      return { success: false, error: "Not authenticated" };
    }

    // Check if 2FA is already enabled
    const [existingUser] = await db
      .select({ twoFactorEnabled: user.twoFactorEnabled })
      .from(user)
      .where(eq(user.id, session.user.id))
      .limit(1);

    if (existingUser?.twoFactorEnabled) {
      return { success: false, error: "Two-factor authentication is already enabled" };
    }

    // Generate new secret and backup codes
    const secret = generateSecret();
    const backupCodes = generateBackupCodes(10);
    const hashedBackupCodes = hashBackupCodes(backupCodes);

    // Store the secret and backup codes (but don't enable 2FA yet)
    await db
      .update(user)
      .set({
        twoFactorSecret: secret,
        twoFactorBackupCodes: hashedBackupCodes,
      })
      .where(eq(user.id, session.user.id));

    // Generate QR code
    const qrCode = await generateQRCodeDataURL(session.user.email, secret);

    return {
      success: true,
      secret,
      qrCode,
      backupCodes: formatBackupCodes(backupCodes),
    };
  } catch (error) {
    console.error("Error setting up 2FA:", error);
    return { success: false, error: "Failed to set up two-factor authentication" };
  }
}
