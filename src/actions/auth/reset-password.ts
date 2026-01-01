"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";

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

    // Fetch user to get their ID and name
    const user = await db.user.findUnique({
      where: { email },
      select: { id: true, name: true },
    });

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

    // Invalidate all sessions for this user (security requirement)
    // This prevents account takeover if an attacker had an active session
    if (user?.id) {
      try {
        // Revoke all UserSession records
        await db.userSession.updateMany({
          where: { 
            userId: user.id,
            revokedAt: null, // Only revoke active sessions
          },
          data: { 
            revokedAt: new Date(),
          },
        });

        // Delete all Auth.js Session records
        await db.session.deleteMany({
          where: { userId: user.id },
        });

        // Log session termination in login history
        await db.loginHistory.create({
          data: {
            userId: user.id,
            success: true,
            provider: "password-reset",
            deviceName: "All sessions terminated",
          },
        });
      } catch (sessionError) {
        // Log error but don't fail the password reset
        // Password security is more important than session cleanup
        console.error("Failed to invalidate sessions:", sessionError);
      }
    }

    // Send password changed confirmation email (graceful degradation)
    try {
      await sendPasswordChangedEmail(email, user?.name ?? undefined);
    } catch (emailError) {
      console.error("Failed to send password changed email:", emailError);
      // Don't throw - password was changed successfully
    }

    // Revalidate login page
    revalidatePath("/login");

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
