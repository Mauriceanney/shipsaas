"use server";

import { revalidatePath } from "next/cache";
import { cookies, headers } from "next/headers";

import { signIn } from "@/lib/auth";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";
import {
  rateLimiters,
  getClientIpFromHeaders,
} from "@/lib/rate-limit";
import {
  verifyTOTP,
  verifyBackupCode,
  generateDeviceToken,
  hashDeviceToken,
  getTrustedDeviceExpiry,
  parseDeviceName,
  TRUSTED_DEVICE_DURATION_DAYS,
  TRUSTED_DEVICE_COOKIE,
} from "@/lib/two-factor";
import {
  verifyTwoFactorSchema,
  type VerifyTwoFactorInput,
} from "@/lib/validations/auth";

type VerifyResult =
  | { success: true }
  | { success: false; error: string };

/**
 * Verify 2FA code during login
 * Accepts either TOTP code or backup code
 */
export async function verifyTwoFactorAction(
  input: VerifyTwoFactorInput
): Promise<VerifyResult> {
  try {
    // Rate limiting
    const clientIp = await getClientIpFromHeaders();
    const rateLimitResult = await rateLimiters.twoFactor(clientIp);

    if (!rateLimitResult.success) {
      return {
        success: false,
        error: "Too many verification attempts. Please try again later.",
      };
    }

    // Validate input
    const validatedFields = verifyTwoFactorSchema.safeParse(input);

    if (!validatedFields.success) {
      return {
        success: false,
        error: validatedFields.error.errors[0]?.message ?? "Invalid code",
      };
    }

    const { code, userId } = validatedFields.data;

    // Get user
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        twoFactorSecret: true,
        twoFactorEnabled: true,
        twoFactorBackupCodes: true,
      },
    });

    if (!user) {
      return { success: false, error: "User not found" };
    }

    if (!user.twoFactorEnabled || !user.twoFactorSecret) {
      return { success: false, error: "Two-factor authentication is not enabled" };
    }

    let isValid = false;

    // Try TOTP verification first (6 digits)
    if (code.length === 6 && /^\d+$/.test(code)) {
      isValid = verifyTOTP(code, user.twoFactorSecret);
    }

    // Try backup code verification (8 alphanumeric chars)
    if (!isValid && code.length === 8) {
      const backupCodeIndex = await verifyBackupCode(code, user.twoFactorBackupCodes);

      if (backupCodeIndex !== -1) {
        isValid = true;

        // Remove used backup code
        const updatedBackupCodes = [...user.twoFactorBackupCodes];
        updatedBackupCodes.splice(backupCodeIndex, 1);

        await db.user.update({
          where: { id: userId },
          data: { twoFactorBackupCodes: updatedBackupCodes },
        });
      }
    }

    if (!isValid) {
      return { success: false, error: "Invalid verification code" };
    }

    // Handle trusted device if requested
    const { rememberDevice } = validatedFields.data;
    if (rememberDevice) {
      const headersList = await headers();
      const userAgent = headersList.get("user-agent");
      const deviceName = parseDeviceName(userAgent);
      const deviceToken = generateDeviceToken();
      const tokenHash = await hashDeviceToken(deviceToken);
      const expiresAt = getTrustedDeviceExpiry();

      // Store trusted device in database
      await db.trustedDevice.create({
        data: {
          userId: user.id,
          tokenHash,
          deviceName,
          expiresAt,
        },
      });

      // Set the trusted device cookie
      const cookieStore = await cookies();
      cookieStore.set(TRUSTED_DEVICE_COOKIE, deviceToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: TRUSTED_DEVICE_DURATION_DAYS * 24 * 60 * 60, // 30 days in seconds
        path: "/",
      });
    }

    // Create session using the two-factor provider
    await signIn("two-factor", {
      userId: user.id,
      redirect: false,
    });

    // Revalidate dashboard
    revalidatePath("/dashboard");

    return { success: true };
  } catch (error) {
    logger.error(
      { err: error, userId: input.userId },
      "2FA verification error"
    );
    return { success: false, error: "Verification failed" };
  }
}
