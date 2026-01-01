"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  generateTOTPSecret,
  generateTOTPUri,
  generateQRCode,
} from "@/lib/two-factor";

type SetupResult =
  | {
      success: true;
      secret: string;
      qrCode: string;
      manualEntry: string;
    }
  | { success: false; error: string };

/**
 * Initialize 2FA setup - generates secret and QR code
 * Does NOT enable 2FA until verified with enableTwoFactorAction
 */
export async function setupTwoFactorAction(): Promise<SetupResult> {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    // Check if user already has 2FA enabled
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { twoFactorEnabled: true, email: true },
    });

    if (!user) {
      return { success: false, error: "User not found" };
    }

    if (user.twoFactorEnabled) {
      return { success: false, error: "Two-factor authentication is already enabled" };
    }

    // Generate new secret
    const secret = generateTOTPSecret();

    // Generate QR code
    const otpauthUri = generateTOTPUri(user.email, secret);
    const qrCode = await generateQRCode(otpauthUri);

    // Store the secret temporarily (not enabled yet)
    await db.user.update({
      where: { id: session.user.id },
      data: { twoFactorSecret: secret },
    });

    // Revalidate security settings page
    revalidatePath("/dashboard/security");

    return {
      success: true,
      secret,
      qrCode,
      manualEntry: secret,
    };
  } catch (error) {
    console.error("2FA setup error:", error);
    return { success: false, error: "Failed to setup two-factor authentication" };
  }
}
