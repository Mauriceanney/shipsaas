"use server";

import { AuthError } from "next-auth";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";

import { signIn } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  rateLimiters,
  getClientIpFromHeaders,
} from "@/lib/rate-limit";
import { hashDeviceToken } from "@/lib/two-factor";
import { loginSchema, type LoginInput } from "@/lib/validations/auth";

/** Cookie name for trusted device token */
const TRUSTED_DEVICE_COOKIE = "trusted_device";

type Result =
  | { success: true }
  | { success: false; error: string }
  | { success: false; requires2FA: true; userId: string };

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

    // Check if user has 2FA enabled before attempting sign-in
    const user = await db.user.findUnique({
      where: { email },
      select: {
        id: true,
        password: true,
        emailVerified: true,
        disabled: true,
        twoFactorEnabled: true,
      },
    });

    // Validate credentials manually for 2FA check
    if (user && user.password && user.twoFactorEnabled) {
      const passwordMatch = await bcrypt.compare(password, user.password);

      if (passwordMatch) {
        // Check email verification
        if (!user.emailVerified) {
          return {
            success: false,
            error: "Please verify your email before logging in",
          };
        }

        // Check if disabled
        if (user.disabled) {
          return {
            success: false,
            error: "Your account has been disabled",
          };
        }

        // Check for trusted device before requiring 2FA
        const cookieStore = await cookies();
        const deviceToken = cookieStore.get(TRUSTED_DEVICE_COOKIE)?.value;

        if (deviceToken) {
          const tokenHash = await hashDeviceToken(deviceToken);
          const trustedDevice = await db.trustedDevice.findFirst({
            where: {
              userId: user.id,
              tokenHash,
              expiresAt: { gt: new Date() },
            },
          });

          if (trustedDevice) {
            // Update last used timestamp
            await db.trustedDevice.update({
              where: { id: trustedDevice.id },
              data: { lastUsedAt: new Date() },
            });

            // Device is trusted, proceed with normal sign-in (skip 2FA)
            await signIn("credentials", {
              email,
              password,
              redirect: false,
            });

            return { success: true };
          }
        }

        // No valid trusted device - require 2FA
        return {
          success: false,
          requires2FA: true,
          userId: user.id,
        };
      }
    }

    // No 2FA or validation failed - proceed with normal sign-in
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
