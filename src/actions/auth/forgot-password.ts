"use server";

import crypto from "crypto";

import { db } from "@/lib/db";
import { sendPasswordResetEmail } from "@/lib/email";
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
    // Validate input
    const validatedFields = forgotPasswordSchema.safeParse(input);

    if (!validatedFields.success) {
      // Still return success to prevent enumeration
      return { success: true, message: successMessage };
    }

    const { email } = validatedFields.data;

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
      console.error("Failed to send password reset email:", emailError);
      // Don't throw - user can request again
    }

    return { success: true, message: successMessage };
  } catch (error) {
    console.error("Forgot password error:", error);
    // Still return success to prevent enumeration
    return { success: true, message: successMessage };
  }
}
