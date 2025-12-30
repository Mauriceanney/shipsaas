"use server";

import { AuthError } from "next-auth";

import { signIn } from "@/lib/auth";
import {
  rateLimiters,
  getClientIpFromHeaders,
} from "@/lib/rate-limit";
import { loginSchema, type LoginInput } from "@/lib/validations/auth";

type Result =
  | { success: true }
  | { success: false; error: string };

export async function loginAction(input: LoginInput): Promise<Result> {
  try {
    // Rate limiting
    const clientIp = await getClientIpFromHeaders();
    const rateLimitResult = await rateLimiters.auth(clientIp);

    if (!rateLimitResult.success) {
      return {
        success: false,
        error: "Too many login attempts. Please try again later.",
      };
    }

    // Validate input
    const validatedFields = loginSchema.safeParse(input);

    if (!validatedFields.success) {
      return {
        success: false,
        error: validatedFields.error.errors[0]?.message ?? "Invalid input",
      };
    }

    const { email, password } = validatedFields.data;

    await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    return { success: true };
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return { success: false, error: "Invalid email or password" };
        default:
          if (error.message === "EmailNotVerified") {
            return {
              success: false,
              error: "Please verify your email before logging in",
            };
          }
          if (error.message === "AccountDisabled") {
            return {
              success: false,
              error: "Your account has been disabled",
            };
          }
          return { success: false, error: "An error occurred during login" };
      }
    }

    throw error;
  }
}
