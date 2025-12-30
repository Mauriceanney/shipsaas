import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import Credentials from "next-auth/providers/credentials";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";

import { db } from "@/lib/db";
import { hashDeviceToken, TRUSTED_DEVICE_COOKIE } from "@/lib/two-factor";
import { loginSchema } from "@/lib/validations/auth";

import {
  createUserSession,
  recordLoginAttempt,
} from "./session-tracking";

import type { Role } from "@prisma/client";
import type { NextAuthConfig } from "next-auth";

export const authConfig: NextAuthConfig = {
  pages: {
    signIn: "/login",
    signOut: "/login",
    error: "/login",
    verifyRequest: "/verify-email",
    newUser: "/dashboard",
  },
  events: {
    async createUser({ user }) {
      // Create FREE subscription for new OAuth users
      // (Email/password users get subscription created in registerAction)
      if (user.id) {
        // Check if subscription already exists (shouldn't, but be safe)
        const existing = await db.subscription.findUnique({
          where: { userId: user.id },
        });

        if (!existing) {
          await db.subscription.create({
            data: {
              userId: user.id,
              plan: "FREE",
              status: "ACTIVE",
            },
          });
        }
      }
    },
    async signIn({ user, account }) {
      if (user.id && account?.provider) {
        // Ensure user has a subscription (fallback for existing users)
        const existing = await db.subscription.findUnique({
          where: { userId: user.id },
        });

        if (!existing) {
          await db.subscription.create({
            data: {
              userId: user.id,
              plan: "FREE",
              status: "ACTIVE",
            },
          });
        }

        // Record successful login
        await recordLoginAttempt({
          userId: user.id,
          success: true,
          provider: account.provider,
        });

        // Create a user session for tracking
        const sessionToken = await createUserSession(user.id);

        // Store the session token in a cookie for later reference
        const cookieStore = await cookies();
        cookieStore.set("user-session-token", sessionToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: 30 * 24 * 60 * 60, // 30 days
          path: "/",
        });
      }
    },
  },
  callbacks: {
    async signIn({ user, account }) {
      // Skip 2FA check for the two-factor provider (already verified)
      if (account?.provider === "two-factor") {
        return true;
      }

      // Check 2FA for OAuth providers (Google, GitHub)
      if (account?.provider === "google" || account?.provider === "github") {
        // Find user by email to check 2FA status
        const dbUser = await db.user.findUnique({
          where: { email: user.email ?? undefined },
          select: {
            id: true,
            twoFactorEnabled: true,
            disabled: true,
          },
        });

        // Block disabled users
        if (dbUser?.disabled) {
          return "/login?error=AccountDisabled";
        }

        // If user has 2FA enabled, check for trusted device first
        if (dbUser?.twoFactorEnabled) {
          // Check for trusted device cookie
          const cookieStore = await cookies();
          const deviceToken = cookieStore.get(TRUSTED_DEVICE_COOKIE)?.value;

          if (deviceToken) {
            // Verify the device token
            const tokenHash = await hashDeviceToken(deviceToken);
            const trustedDevice = await db.trustedDevice.findFirst({
              where: {
                userId: dbUser.id,
                tokenHash,
                expiresAt: { gt: new Date() }, // Not expired
              },
            });

            if (trustedDevice) {
              // Update last used timestamp
              await db.trustedDevice.update({
                where: { id: trustedDevice.id },
                data: { lastUsedAt: new Date() },
              });

              // Device is trusted, skip 2FA
              return true;
            }
          }

          // No valid trusted device, require 2FA
          return `/login/verify-2fa?userId=${dbUser.id}`;
        }
      }

      // For credentials provider, 2FA is handled in the login action
      return true;
    },
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const { pathname } = nextUrl;

      // Define public routes that don't require authentication
      const publicRoutes = [
        "/",
        "/pricing",
        "/blog",
        "/terms",
        "/privacy",
        "/unsubscribe",
        "/login",
        "/login/verify-2fa",
        "/signup",
        "/forgot-password",
        "/reset-password",
        "/verify-email",
      ];

      // Auth routes - redirect logged-in users to dashboard
      const authRoutes = [
        "/login",
        "/signup",
        "/forgot-password",
        "/reset-password",
      ];

      // Check if current path is a public route
      const isPublicRoute = publicRoutes.some(
        (route) => pathname === route || pathname.startsWith(`${route}/`)
      );

      // Check if current path is an auth route
      const isAuthRoute = authRoutes.some(
        (route) => pathname === route || pathname.startsWith(`${route}/`)
      );

      // Skip API routes - they handle their own auth
      if (pathname.startsWith("/api")) {
        return true;
      }

      // Redirect logged-in users away from auth pages
      if (isLoggedIn && isAuthRoute) {
        return Response.redirect(new URL("/dashboard", nextUrl));
      }

      // Protected routes require authentication
      if (!isLoggedIn && !isPublicRoute) {
        return false; // Auth.js will redirect to signIn page
      }

      return true;
    },
    async jwt({ token, user, trigger }) {
      if (user) {
        token["id"] = user.id;
        token["role"] = user.role;
      }

      // Load subscription on sign in or when token is updated
      if (trigger === "signIn" || trigger === "update" || !token["subscription"]) {
        const userId = token["id"] as string;
        const subscription = await db.subscription.findUnique({
          where: { userId },
          select: {
            plan: true,
            status: true,
            stripeCurrentPeriodEnd: true,
            statusChangedAt: true,
          },
        });

        token["subscription"] = {
          plan: subscription?.plan ?? "FREE",
          status: subscription?.status ?? "INACTIVE",
          stripeCurrentPeriodEnd: subscription?.stripeCurrentPeriodEnd ?? null,
          statusChangedAt: subscription?.statusChangedAt ?? null,
        };
      }

      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token["id"] as string;
        session.user.role = token["role"] as Role;
      }

      session.subscription = token["subscription"] as {
        plan: "FREE" | "PRO" | "ENTERPRISE";
        status: "ACTIVE" | "INACTIVE" | "PAST_DUE" | "CANCELED" | "TRIALING";
        stripeCurrentPeriodEnd: Date | null;
        statusChangedAt: Date | null;
      };

      return session;
    },
  },
  providers: [
    Google({
      clientId: process.env["AUTH_GOOGLE_ID"],
      clientSecret: process.env["AUTH_GOOGLE_SECRET"],
    }),
    GitHub({
      clientId: process.env["AUTH_GITHUB_ID"],
      clientSecret: process.env["AUTH_GITHUB_SECRET"],
    }),
    Credentials({
      id: "credentials",
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const validatedFields = loginSchema.safeParse(credentials);

        if (!validatedFields.success) {
          return null;
        }

        const { email, password } = validatedFields.data;

        const user = await db.user.findUnique({
          where: { email },
        });

        if (!user || !user.password) {
          return null;
        }

        const passwordsMatch = await bcrypt.compare(password, user.password);

        if (!passwordsMatch) {
          return null;
        }

        // Check if email is verified
        if (!user.emailVerified) {
          throw new Error("EmailNotVerified");
        }

        // Check if account is disabled
        if (user.disabled) {
          throw new Error("AccountDisabled");
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
    // 2FA verification provider - used after TOTP/backup code verification
    Credentials({
      id: "two-factor",
      name: "two-factor",
      credentials: {
        userId: { label: "User ID", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.userId || typeof credentials.userId !== "string") {
          return null;
        }

        // Get user by ID (2FA was already verified in the action)
        const user = await db.user.findUnique({
          where: { id: credentials.userId },
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            emailVerified: true,
            disabled: true,
            twoFactorEnabled: true,
            password: true, // Check if user is OAuth-only
          },
        });

        if (!user) {
          return null;
        }

        // Block disabled users
        if (user.disabled) {
          return null;
        }

        // OAuth users (no password) don't need email verification - OAuth provider verified it
        // Credentials users must have verified their email
        const isOAuthUser = !user.password;
        if (!isOAuthUser && !user.emailVerified) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],
};
