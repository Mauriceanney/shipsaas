"use server";

import bcrypt from "bcryptjs";

import { db } from "@/lib/db";
import { sendPasswordChangedEmail } from "@/lib/email";
import {
  resetPasswordSchema,
  type ResetPasswordInput,
} from "@/lib/validations/auth";

type Result =
  | { success: true; message: string }
  | { success: false; error: string };

export async function resetPasswordAction(
  input: ResetPasswordInput
): Promise<Result> {
  try {
    // Validate input
    const validatedFields = resetPasswordSchema.safeParse(input);

    if (!validatedFields.success) {
      return {
        success: false,
        error: validatedFields.error.errors[0]?.message ?? "Invalid input",
      };
    }

    const { token, password } = validatedFields.data;

    // Find the token
    const verificationToken = await db.verificationToken.findFirst({
      where: {
        token,
        identifier: { startsWith: "password-reset:" },
      },
    });

    if (!verificationToken) {
      return {
        success: false,
        error: "Invalid or expired reset link",
      };
    }

    // Check if token is expired
    if (new Date() > verificationToken.expires) {
      // Delete expired token
      await db.verificationToken.delete({
        where: {
          identifier_token: {
            identifier: verificationToken.identifier,
            token: verificationToken.token,
          },
        },
      });

      return {
        success: false,
        error: "This reset link has expired. Please request a new one.",
      };
    }

    // Extract email from identifier
    const email = verificationToken.identifier.replace("password-reset:", "");

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Update user password
    await db.user.update({
      where: { email },
      data: { password: hashedPassword },
    });

    // Delete the used token
    await db.verificationToken.delete({
      where: {
        identifier_token: {
          identifier: verificationToken.identifier,
          token: verificationToken.token,
        },
      },
    });

    // Send password changed confirmation email
    await sendPasswordChangedEmail(email);

    // TODO: Invalidate all sessions for this user (future enhancement)
    // This would require storing sessions in the database

    return {
      success: true,
      message: "Your password has been reset successfully",
    };
  } catch (error) {
    console.error("Reset password error:", error);
    return {
      success: false,
      error: "An error occurred while resetting your password",
    };
  }
}
