"use server";

import { revalidatePath } from "next/cache";

import { db } from "@/lib/db";
import { sendWelcomeEmail } from "@/lib/email";
import {
  verifyEmailSchema,
  type VerifyEmailInput,
} from "@/lib/validations/auth";

type Result =
  | { success: true; message: string }
  | { success: false; error: string };

export async function verifyEmailAction(
  input: VerifyEmailInput
): Promise<Result> {
  try {
    // Validate input
    const validatedFields = verifyEmailSchema.safeParse(input);

    if (!validatedFields.success) {
      return {
        success: false,
        error: "Invalid verification link",
      };
    }

    const { token } = validatedFields.data;

    // Find the token
    const verificationToken = await db.verificationToken.findFirst({
      where: {
        token,
        identifier: { not: { startsWith: "password-reset:" } },
      },
    });

    if (!verificationToken) {
      return {
        success: false,
        error: "Invalid verification link",
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
        error: "This verification link has expired",
      };
    }

    const email = verificationToken.identifier;

    // Check if user exists and is not already verified
    const user = await db.user.findUnique({
      where: { email },
    });

    if (!user) {
      return {
        success: false,
        error: "User not found",
      };
    }

    if (user.emailVerified) {
      // Delete the token since it's no longer needed
      await db.verificationToken.delete({
        where: {
          identifier_token: {
            identifier: verificationToken.identifier,
            token: verificationToken.token,
          },
        },
      });

      return {
        success: true,
        message: "Your email is already verified",
      };
    }

    // Mark email as verified and welcome email as sent
    await db.user.update({
      where: { email },
      data: {
        emailVerified: new Date(),
        welcomeEmailSent: true,
      },
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

    // Send welcome email (graceful degradation)
    try {
      await sendWelcomeEmail(email, user.name ?? "there");
    } catch (emailError) {
      console.error("Failed to send welcome email:", emailError);
      // Don't throw - email verification was successful
    }

    // Revalidate dashboard
    revalidatePath("/dashboard");

    return {
      success: true,
      message: "Your email has been verified successfully",
    };
  } catch (error) {
    console.error("Email verification error:", error);
    return {
      success: false,
      error: "An error occurred while verifying your email",
    };
  }
}
