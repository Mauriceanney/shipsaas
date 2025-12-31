"use server";

import crypto from "crypto";

import { db } from "@/lib/db";
import { sendPasswordResetEmail } from "@/lib/email";
import { logger } from "@/lib/logger";
import { rateLimiters } from "@/lib/rate-limit";
import {
  forgotPasswordSchema,
  type ForgotPasswordInput,
} from "@/lib/validations/auth";

type Result = { success: true; message: string };

export async function forgotPasswordAction(
  input: ForgotPasswordInput
): Promise<Result> {
  // Always return success to prevent email enumeration
  const successMessage =
    "If an account exists with this email, you will receive a reset link";

  try {
    // Validate input first to get email for rate limiting
    const validatedFields = forgotPasswordSchema.safeParse(input);

    if (!validatedFields.success) {
      // Still return success to prevent enumeration
      return { success: true, message: successMessage };
    }

    const { email } = validatedFields.data;

    // Rate limiting - 5 requests per hour per email
    const rateLimitResult = await rateLimiters.forgotPassword(email);

    // Return success even when rate limited to prevent enumeration
    if (!rateLimitResult.success) {
      return { success: true, message: successMessage };
    }

    // Check if user exists
    const user = await db.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Return success even if user doesn't exist
      return { success: true, message: successMessage };
    }

    // Delete any existing password reset tokens for this user
    await db.verificationToken.deleteMany({
      where: {
        identifier: `password-reset:${email}`,
      },
    });

    // Generate new reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await db.verificationToken.create({
      data: {
        identifier: `password-reset:${email}`,
        token: resetToken,
        expires,
      },
    });

    // Send password reset email (graceful degradation - don't fail if email fails)
    try {
      await sendPasswordResetEmail(email, resetToken, user.name ?? undefined);
    } catch (emailError) {
      logger.error(
        { err: emailError, email },
        "Failed to send password reset email"
      );
      // Don't throw - user can request again
    }

    return { success: true, message: successMessage };
  } catch (error) {
    logger.error({ err: error }, "Forgot password error");
    // Still return success to prevent enumeration
    return { success: true, message: successMessage };
  }
}
