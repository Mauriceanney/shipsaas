"use server";

import crypto from "crypto";

import bcrypt from "bcryptjs";

import { db } from "@/lib/db";
import { sendVerificationEmail } from "@/lib/email";
import { registerSchema } from "@/lib/validations/auth";

import type { RegisterInput } from "@/lib/validations/auth";

type Result =
  | { success: true; message: string }
  | { success: false; error: string };

export async function registerAction(input: RegisterInput): Promise<Result> {
  try {
    // Validate input
    const validatedFields = registerSchema.safeParse(input);

    if (!validatedFields.success) {
      return {
        success: false,
        error: validatedFields.error.errors[0]?.message ?? "Invalid input",
      };
    }

    const { name, email, password } = validatedFields.data;

    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return {
        success: false,
        error: "An account with this email already exists",
      };
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = await db.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
    });

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await db.verificationToken.create({
      data: {
        identifier: user.email,
        token: verificationToken,
        expires,
      },
    });

    // Send verification email (graceful degradation - don't fail registration if email fails)
    try {
      await sendVerificationEmail(user.email, verificationToken, name);
    } catch (emailError) {
      console.error("Failed to send verification email:", emailError);
      // Don't throw - user is created, they can request a new verification email
    }

    return {
      success: true,
      message: "Please check your email to verify your account",
    };
  } catch (error) {
    console.error("Registration error:", error);
    return {
      success: false,
      error: "An error occurred during registration",
    };
  }
}
