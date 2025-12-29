import bcrypt from "bcryptjs";
import Credentials from "next-auth/providers/credentials";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";

import { db } from "@/lib/db";
import { loginSchema } from "@/lib/validations/auth";

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
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const { pathname } = nextUrl;

      // Define public routes that don't require authentication
      const publicRoutes = [
        "/",
        "/pricing",
        "/blog",
        "/login",
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
    jwt({ token, user }) {
      if (user) {
        token["id"] = user.id;
        token["role"] = user.role;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token["id"] as string;
        session.user.role = token["role"] as Role;
      }
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
