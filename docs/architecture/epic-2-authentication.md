# Epic 2: Authentication - Technical Architecture Document

**Version**: 1.0
**Last Updated**: 2025-12-28
**Status**: Ready for Implementation

## Table of Contents

1. [Overview](#1-overview)
2. [File Structure](#2-file-structure)
3. [Database Schema](#3-database-schema)
4. [Auth.js v5 Configuration](#4-authjs-v5-configuration)
5. [API Routes](#5-api-routes)
6. [Server Actions](#6-server-actions)
7. [Middleware](#7-middleware)
8. [Component Architecture](#8-component-architecture)
9. [Security Patterns](#9-security-patterns)
10. [Type Definitions](#10-type-definitions)
11. [Testing Strategy](#11-testing-strategy)
12. [Environment Variables](#12-environment-variables)
13. [Implementation Checklist](#13-implementation-checklist)

---

## 1. Overview

### 1.1 Technology Stack

| Component | Technology | Version |
|-----------|------------|---------|
| Framework | Next.js | 15.x (App Router) |
| Authentication | Auth.js (next-auth) | 5.x (beta.25+) |
| Database Adapter | @auth/prisma-adapter | 2.x |
| ORM | Prisma | 5.x |
| Password Hashing | bcryptjs | 2.x |
| Validation | Zod | 3.x |
| Forms | react-hook-form | 7.x |
| Rate Limiting | ioredis | 5.x |

### 1.2 Authentication Flows

1. **Credentials Authentication**: Email/password login with bcrypt
2. **OAuth Authentication**: Google, GitHub providers
3. **Magic Link Authentication**: Email-based passwordless login
4. **Session Management**: JWT strategy with database sessions

### 1.3 Key Design Decisions

- **Session Strategy**: JWT for stateless auth with database session backup
- **Password Requirements**: Minimum 8 characters, complexity validation
- **Rate Limiting**: Redis-based with sliding window algorithm
- **CSRF Protection**: Built-in Auth.js CSRF tokens
- **Email Verification**: Required for credentials signup

---

## 2. File Structure

```
src/
├── app/
│   ├── (auth)/                          # Auth route group (no layout inheritance)
│   │   ├── layout.tsx                   # Minimal auth layout
│   │   ├── login/
│   │   │   └── page.tsx                 # Login page
│   │   ├── register/
│   │   │   └── page.tsx                 # Registration page
│   │   ├── verify-email/
│   │   │   └── page.tsx                 # Email verification page
│   │   ├── forgot-password/
│   │   │   └── page.tsx                 # Forgot password page
│   │   ├── reset-password/
│   │   │   └── page.tsx                 # Reset password page
│   │   └── error/
│   │       └── page.tsx                 # Auth error page
│   │
│   ├── api/
│   │   └── auth/
│   │       └── [...nextauth]/
│   │           └── route.ts             # Auth.js route handler
│   │
│   └── (protected)/                     # Protected route group
│       ├── layout.tsx                   # Protected layout with auth check
│       ├── dashboard/
│       │   └── page.tsx
│       └── settings/
│           ├── page.tsx
│           └── security/
│               └── page.tsx             # Password change, sessions
│
├── lib/
│   ├── auth/
│   │   ├── index.ts                     # Main auth export (auth, signIn, signOut, handlers)
│   │   ├── config.ts                    # Auth.js configuration
│   │   ├── providers.ts                 # OAuth + Credentials providers
│   │   ├── callbacks.ts                 # JWT, session, signIn callbacks
│   │   ├── adapter.ts                   # Prisma adapter customization
│   │   └── constants.ts                 # Auth-related constants
│   │
│   ├── auth.ts                          # Re-export for convenience
│   │
│   ├── validations/
│   │   └── auth.ts                      # Zod schemas for auth forms
│   │
│   └── services/
│       ├── auth.service.ts              # Auth business logic
│       ├── user.service.ts              # User CRUD operations
│       ├── token.service.ts             # Token generation/verification
│       ├── email.service.ts             # Email sending (existing Resend)
│       └── rate-limit.service.ts        # Rate limiting logic
│
├── actions/
│   └── auth/
│       ├── login.ts                     # Login server action
│       ├── register.ts                  # Register server action
│       ├── logout.ts                    # Logout server action
│       ├── forgot-password.ts           # Forgot password action
│       ├── reset-password.ts            # Reset password action
│       ├── verify-email.ts              # Email verification action
│       └── change-password.ts           # Change password action
│
├── components/
│   ├── auth/
│   │   ├── login-form.tsx               # Login form component
│   │   ├── register-form.tsx            # Register form component
│   │   ├── forgot-password-form.tsx     # Forgot password form
│   │   ├── reset-password-form.tsx      # Reset password form
│   │   ├── social-login-buttons.tsx     # OAuth provider buttons
│   │   ├── auth-card.tsx                # Wrapper card for auth forms
│   │   ├── password-input.tsx           # Password field with visibility toggle
│   │   ├── password-strength.tsx        # Password strength indicator
│   │   └── email-verification-status.tsx
│   │
│   └── providers/
│       ├── session-provider.tsx         # Client-side session provider
│       └── auth-provider.tsx            # Combined auth context
│
├── hooks/
│   ├── use-auth.ts                      # Client-side auth hook
│   └── use-session.ts                   # Session management hook
│
├── middleware.ts                        # Auth middleware for route protection
│
└── types/
    ├── auth.ts                          # Auth-specific types
    └── next-auth.d.ts                   # Auth.js type augmentation

tests/
├── unit/
│   ├── lib/
│   │   ├── auth/
│   │   │   ├── config.test.ts
│   │   │   ├── callbacks.test.ts
│   │   │   └── providers.test.ts
│   │   ├── validations/
│   │   │   └── auth.test.ts
│   │   └── services/
│   │       ├── auth.service.test.ts
│   │       ├── user.service.test.ts
│   │       ├── token.service.test.ts
│   │       └── rate-limit.service.test.ts
│   │
│   ├── actions/
│   │   └── auth/
│   │       ├── login.test.ts
│   │       ├── register.test.ts
│   │       └── reset-password.test.ts
│   │
│   └── components/
│       └── auth/
│           ├── login-form.test.tsx
│           ├── register-form.test.tsx
│           └── password-strength.test.tsx
│
└── e2e/
    └── auth/
        ├── login.spec.ts
        ├── register.spec.ts
        ├── forgot-password.spec.ts
        └── oauth.spec.ts
```

---

## 3. Database Schema

### 3.1 Existing Models (No Changes Required)

The current Prisma schema already includes the necessary Auth.js models:

```prisma
// Already exists in prisma/schema.prisma
model User {
  id            String    @id @default(cuid())
  name          String?
  email         String    @unique
  emailVerified DateTime?
  image         String?
  password      String?   // For credentials auth
  role          Role      @default(USER)

  accounts     Account[]
  sessions     Session[]
  subscription Subscription?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([email])
}

model Account { ... }   // OAuth accounts
model Session { ... }   // Database sessions
model VerificationToken { ... }  // Email verification
```

### 3.2 New Model: PasswordResetToken

```prisma
// Add to prisma/schema.prisma

model PasswordResetToken {
  id        String   @id @default(cuid())
  email     String
  token     String   @unique
  expires   DateTime
  createdAt DateTime @default(now())

  @@unique([email, token])
  @@index([email])
  @@index([token])
}
```

### 3.3 Migration Commands

```bash
# Generate migration
pnpm db:migrate --name add_password_reset_token

# Apply migration
pnpm db:migrate:deploy

# Regenerate Prisma client
pnpm db:generate
```

---

## 4. Auth.js v5 Configuration

### 4.1 Main Auth Export (`src/lib/auth/index.ts`)

```typescript
import NextAuth from "next-auth";
import { authConfig } from "./config";

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth(authConfig);
```

### 4.2 Configuration (`src/lib/auth/config.ts`)

```typescript
import type { NextAuthConfig } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { db } from "@/lib/db";
import { providers } from "./providers";
import { callbacks } from "./callbacks";
import { AUTH_ROUTES } from "./constants";

export const authConfig: NextAuthConfig = {
  adapter: PrismaAdapter(db),

  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60,   // 24 hours
  },

  pages: {
    signIn: AUTH_ROUTES.LOGIN,
    signOut: AUTH_ROUTES.LOGOUT,
    error: AUTH_ROUTES.ERROR,
    verifyRequest: AUTH_ROUTES.VERIFY_EMAIL,
    newUser: AUTH_ROUTES.REGISTER,
  },

  providers,
  callbacks,

  events: {
    async signIn({ user, account, isNewUser }) {
      // Log sign-in events for security auditing
      console.log(`User signed in: ${user.email}, provider: ${account?.provider}`);
    },
    async signOut({ token }) {
      // Clean up any session-related data
      console.log(`User signed out: ${token?.email}`);
    },
  },

  debug: process.env.NODE_ENV === "development",

  // Security options
  trustHost: true,
  useSecureCookies: process.env.NODE_ENV === "production",
};
```

### 4.3 Providers (`src/lib/auth/providers.ts`)

```typescript
import type { Provider } from "next-auth/providers";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import GitHub from "next-auth/providers/github";
import { compare } from "bcryptjs";
import { db } from "@/lib/db";
import { loginSchema } from "@/lib/validations/auth";

export const providers: Provider[] = [
  // Credentials Provider
  Credentials({
    id: "credentials",
    name: "Email & Password",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" },
    },
    async authorize(credentials) {
      // Validate input
      const validated = loginSchema.safeParse(credentials);
      if (!validated.success) {
        return null;
      }

      const { email, password } = validated.data;

      // Find user
      const user = await db.user.findUnique({
        where: { email: email.toLowerCase() },
        select: {
          id: true,
          email: true,
          name: true,
          password: true,
          emailVerified: true,
          role: true,
          image: true,
        },
      });

      if (!user || !user.password) {
        // User doesn't exist or uses OAuth
        return null;
      }

      // Verify password
      const isValidPassword = await compare(password, user.password);
      if (!isValidPassword) {
        return null;
      }

      // Check email verification
      if (!user.emailVerified) {
        throw new Error("EMAIL_NOT_VERIFIED");
      }

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.image,
        role: user.role,
      };
    },
  }),

  // Google OAuth
  Google({
    clientId: process.env.GOOGLE_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    allowDangerousEmailAccountLinking: true,
  }),

  // GitHub OAuth
  GitHub({
    clientId: process.env.GITHUB_CLIENT_ID!,
    clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    allowDangerousEmailAccountLinking: true,
  }),
];
```

### 4.4 Callbacks (`src/lib/auth/callbacks.ts`)

```typescript
import type { NextAuthConfig } from "next-auth";
import type { JWT } from "next-auth/jwt";
import { db } from "@/lib/db";

export const callbacks: NextAuthConfig["callbacks"] = {
  async signIn({ user, account, profile }) {
    // Allow OAuth sign-in
    if (account?.provider !== "credentials") {
      return true;
    }

    // For credentials, additional checks can be performed here
    // Email verification is checked in the authorize function
    return true;
  },

  async jwt({ token, user, account, trigger, session }) {
    // Initial sign-in
    if (user) {
      token.id = user.id;
      token.role = user.role;
      token.email = user.email;
    }

    // Handle session update trigger
    if (trigger === "update" && session) {
      token.name = session.name;
      token.email = session.email;
    }

    // Refresh user data periodically (every hour)
    if (token.id && Date.now() - (token.iat as number) * 1000 > 3600000) {
      const freshUser = await db.user.findUnique({
        where: { id: token.id as string },
        select: { role: true, name: true, email: true, image: true },
      });

      if (freshUser) {
        token.role = freshUser.role;
        token.name = freshUser.name;
        token.email = freshUser.email;
        token.picture = freshUser.image;
      }
    }

    return token;
  },

  async session({ session, token }) {
    if (token) {
      session.user.id = token.id as string;
      session.user.role = token.role as string;
      session.user.email = token.email as string;
    }
    return session;
  },

  async redirect({ url, baseUrl }) {
    // Handle relative URLs
    if (url.startsWith("/")) {
      return `${baseUrl}${url}`;
    }

    // Handle same-origin URLs
    if (new URL(url).origin === baseUrl) {
      return url;
    }

    // Default redirect
    return baseUrl;
  },
};
```

### 4.5 Constants (`src/lib/auth/constants.ts`)

```typescript
export const AUTH_ROUTES = {
  LOGIN: "/login",
  REGISTER: "/register",
  LOGOUT: "/api/auth/signout",
  ERROR: "/error",
  VERIFY_EMAIL: "/verify-email",
  FORGOT_PASSWORD: "/forgot-password",
  RESET_PASSWORD: "/reset-password",
} as const;

export const PUBLIC_ROUTES = [
  "/",
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
  "/error",
  "/api/auth",
  "/pricing",
  "/blog",
] as const;

export const PROTECTED_ROUTES = [
  "/dashboard",
  "/settings",
  "/api/user",
] as const;

export const AUTH_ERRORS = {
  INVALID_CREDENTIALS: "Invalid email or password",
  EMAIL_NOT_VERIFIED: "Please verify your email before signing in",
  ACCOUNT_DISABLED: "Your account has been disabled",
  TOO_MANY_ATTEMPTS: "Too many login attempts. Please try again later",
  EMAIL_IN_USE: "An account with this email already exists",
  WEAK_PASSWORD: "Password does not meet security requirements",
  INVALID_TOKEN: "Invalid or expired token",
  SESSION_EXPIRED: "Your session has expired. Please sign in again",
} as const;

export const PASSWORD_REQUIREMENTS = {
  MIN_LENGTH: 8,
  REQUIRE_UPPERCASE: true,
  REQUIRE_LOWERCASE: true,
  REQUIRE_NUMBER: true,
  REQUIRE_SPECIAL: false,
} as const;
```

---

## 5. API Routes

### 5.1 Auth.js Route Handler (`src/app/api/auth/[...nextauth]/route.ts`)

```typescript
import { handlers } from "@/lib/auth";

export const { GET, POST } = handlers;
```

### 5.2 Additional API Routes (Optional - for external integrations)

```typescript
// src/app/api/auth/me/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({ user: session.user });
}
```

---

## 6. Server Actions

### 6.1 Login Action (`src/actions/auth/login.ts`)

```typescript
"use server";

import { AuthError } from "next-auth";
import { signIn } from "@/lib/auth";
import { loginSchema } from "@/lib/validations/auth";
import { rateLimitByIp } from "@/lib/services/rate-limit.service";
import { AUTH_ERRORS } from "@/lib/auth/constants";
import type { ActionResult } from "@/types/auth";

export async function loginAction(
  prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  try {
    // Rate limiting
    const rateLimitResult = await rateLimitByIp("login", 5, 60); // 5 attempts per minute
    if (!rateLimitResult.success) {
      return {
        success: false,
        error: AUTH_ERRORS.TOO_MANY_ATTEMPTS,
      };
    }

    // Validate input
    const validatedFields = loginSchema.safeParse({
      email: formData.get("email"),
      password: formData.get("password"),
    });

    if (!validatedFields.success) {
      return {
        success: false,
        error: "Invalid input",
        fieldErrors: validatedFields.error.flatten().fieldErrors,
      };
    }

    const { email, password } = validatedFields.data;

    // Attempt sign in
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
          return { success: false, error: AUTH_ERRORS.INVALID_CREDENTIALS };
        case "AccessDenied":
          return { success: false, error: AUTH_ERRORS.ACCOUNT_DISABLED };
        default:
          return { success: false, error: "Authentication failed" };
      }
    }

    // Handle custom errors from authorize
    if (error instanceof Error) {
      if (error.message === "EMAIL_NOT_VERIFIED") {
        return { success: false, error: AUTH_ERRORS.EMAIL_NOT_VERIFIED };
      }
    }

    throw error;
  }
}
```

### 6.2 Register Action (`src/actions/auth/register.ts`)

```typescript
"use server";

import { hash } from "bcryptjs";
import { db } from "@/lib/db";
import { registerSchema } from "@/lib/validations/auth";
import { createEmailVerificationToken } from "@/lib/services/token.service";
import { sendVerificationEmail } from "@/lib/services/email.service";
import { rateLimitByIp } from "@/lib/services/rate-limit.service";
import { AUTH_ERRORS } from "@/lib/auth/constants";
import type { ActionResult } from "@/types/auth";

export async function registerAction(
  prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  try {
    // Rate limiting
    const rateLimitResult = await rateLimitByIp("register", 3, 60);
    if (!rateLimitResult.success) {
      return {
        success: false,
        error: AUTH_ERRORS.TOO_MANY_ATTEMPTS,
      };
    }

    // Validate input
    const validatedFields = registerSchema.safeParse({
      name: formData.get("name"),
      email: formData.get("email"),
      password: formData.get("password"),
      confirmPassword: formData.get("confirmPassword"),
    });

    if (!validatedFields.success) {
      return {
        success: false,
        error: "Invalid input",
        fieldErrors: validatedFields.error.flatten().fieldErrors,
      };
    }

    const { name, email, password } = validatedFields.data;

    // Check if user exists
    const existingUser = await db.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      return { success: false, error: AUTH_ERRORS.EMAIL_IN_USE };
    }

    // Hash password
    const hashedPassword = await hash(password, 12);

    // Create user
    const user = await db.user.create({
      data: {
        name,
        email: email.toLowerCase(),
        password: hashedPassword,
      },
    });

    // Create verification token
    const verificationToken = await createEmailVerificationToken(user.email);

    // Send verification email
    await sendVerificationEmail(user.email, verificationToken.token);

    return {
      success: true,
      message: "Account created. Please check your email to verify your account.",
    };
  } catch (error) {
    console.error("Registration error:", error);
    return {
      success: false,
      error: "Failed to create account. Please try again.",
    };
  }
}
```

### 6.3 Forgot Password Action (`src/actions/auth/forgot-password.ts`)

```typescript
"use server";

import { db } from "@/lib/db";
import { forgotPasswordSchema } from "@/lib/validations/auth";
import { createPasswordResetToken } from "@/lib/services/token.service";
import { sendPasswordResetEmail } from "@/lib/services/email.service";
import { rateLimitByIp } from "@/lib/services/rate-limit.service";
import type { ActionResult } from "@/types/auth";

export async function forgotPasswordAction(
  prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  try {
    // Rate limiting - stricter for password reset
    const rateLimitResult = await rateLimitByIp("forgot-password", 3, 300);
    if (!rateLimitResult.success) {
      return {
        success: false,
        error: "Too many requests. Please try again in 5 minutes.",
      };
    }

    const validatedFields = forgotPasswordSchema.safeParse({
      email: formData.get("email"),
    });

    if (!validatedFields.success) {
      return {
        success: false,
        error: "Invalid email address",
      };
    }

    const { email } = validatedFields.data;

    // Always return success to prevent email enumeration
    const successMessage = "If an account exists, a password reset link has been sent.";

    const user = await db.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user || !user.password) {
      // User doesn't exist or uses OAuth - don't reveal this
      return { success: true, message: successMessage };
    }

    // Create reset token
    const resetToken = await createPasswordResetToken(email);

    // Send email
    await sendPasswordResetEmail(email, resetToken.token);

    return { success: true, message: successMessage };
  } catch (error) {
    console.error("Forgot password error:", error);
    return { success: true, message: "If an account exists, a password reset link has been sent." };
  }
}
```

### 6.4 Reset Password Action (`src/actions/auth/reset-password.ts`)

```typescript
"use server";

import { hash } from "bcryptjs";
import { db } from "@/lib/db";
import { resetPasswordSchema } from "@/lib/validations/auth";
import { verifyPasswordResetToken, deletePasswordResetToken } from "@/lib/services/token.service";
import { AUTH_ERRORS } from "@/lib/auth/constants";
import type { ActionResult } from "@/types/auth";

export async function resetPasswordAction(
  prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  try {
    const validatedFields = resetPasswordSchema.safeParse({
      token: formData.get("token"),
      password: formData.get("password"),
      confirmPassword: formData.get("confirmPassword"),
    });

    if (!validatedFields.success) {
      return {
        success: false,
        error: "Invalid input",
        fieldErrors: validatedFields.error.flatten().fieldErrors,
      };
    }

    const { token, password } = validatedFields.data;

    // Verify token
    const tokenRecord = await verifyPasswordResetToken(token);
    if (!tokenRecord) {
      return { success: false, error: AUTH_ERRORS.INVALID_TOKEN };
    }

    // Hash new password
    const hashedPassword = await hash(password, 12);

    // Update user password
    await db.user.update({
      where: { email: tokenRecord.email },
      data: { password: hashedPassword },
    });

    // Delete used token
    await deletePasswordResetToken(token);

    return {
      success: true,
      message: "Password reset successfully. You can now sign in.",
    };
  } catch (error) {
    console.error("Reset password error:", error);
    return {
      success: false,
      error: "Failed to reset password. Please try again.",
    };
  }
}
```

### 6.5 Verify Email Action (`src/actions/auth/verify-email.ts`)

```typescript
"use server";

import { db } from "@/lib/db";
import { verifyEmailToken, deleteVerificationToken } from "@/lib/services/token.service";
import { AUTH_ERRORS } from "@/lib/auth/constants";
import type { ActionResult } from "@/types/auth";

export async function verifyEmailAction(token: string): Promise<ActionResult> {
  try {
    // Verify token
    const tokenRecord = await verifyEmailToken(token);
    if (!tokenRecord) {
      return { success: false, error: AUTH_ERRORS.INVALID_TOKEN };
    }

    // Update user
    await db.user.update({
      where: { email: tokenRecord.identifier },
      data: { emailVerified: new Date() },
    });

    // Delete used token
    await deleteVerificationToken(tokenRecord.identifier, token);

    return {
      success: true,
      message: "Email verified successfully. You can now sign in.",
    };
  } catch (error) {
    console.error("Email verification error:", error);
    return {
      success: false,
      error: "Failed to verify email. Please try again.",
    };
  }
}
```

---

## 7. Middleware

### 7.1 Main Middleware (`src/middleware.ts`)

```typescript
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { PUBLIC_ROUTES, AUTH_ROUTES } from "@/lib/auth/constants";

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;
  const pathname = nextUrl.pathname;

  // Check if path matches public routes
  const isPublicRoute = PUBLIC_ROUTES.some((route) => {
    if (route === "/") return pathname === "/";
    return pathname.startsWith(route);
  });

  // Check if it's an API route
  const isApiRoute = pathname.startsWith("/api");

  // Check if it's an auth API route (always public)
  const isAuthApiRoute = pathname.startsWith("/api/auth");

  // Check if it's a static file
  const isStaticFile = pathname.includes(".");

  // Allow static files and auth API routes
  if (isStaticFile || isAuthApiRoute) {
    return NextResponse.next();
  }

  // Redirect logged-in users away from auth pages
  if (isLoggedIn && (pathname === AUTH_ROUTES.LOGIN || pathname === AUTH_ROUTES.REGISTER)) {
    return NextResponse.redirect(new URL("/dashboard", nextUrl));
  }

  // Protect non-public routes
  if (!isPublicRoute && !isLoggedIn) {
    const callbackUrl = encodeURIComponent(pathname + nextUrl.search);
    return NextResponse.redirect(
      new URL(`${AUTH_ROUTES.LOGIN}?callbackUrl=${callbackUrl}`, nextUrl)
    );
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|public/).*)",
  ],
};
```

---

## 8. Component Architecture

### 8.1 Auth Card Wrapper (`src/components/auth/auth-card.tsx`)

```typescript
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface AuthCardProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export function AuthCard({ title, description, children, footer }: AuthCardProps) {
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-2xl font-bold">{title}</CardTitle>
        {description && (
          <CardDescription>{description}</CardDescription>
        )}
      </CardHeader>
      <CardContent>{children}</CardContent>
      {footer && <CardFooter>{footer}</CardFooter>}
    </Card>
  );
}
```

### 8.2 Login Form (`src/components/auth/login-form.tsx`)

```typescript
"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

import { loginAction } from "@/actions/auth/login";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "./password-input";
import { SocialLoginButtons } from "./social-login-buttons";
import { Separator } from "@/components/ui/separator";

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? "Signing in..." : "Sign in"}
    </Button>
  );
}

export function LoginForm() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
  const error = searchParams.get("error");

  const [state, formAction] = useActionState(loginAction, null);

  return (
    <div className="space-y-6">
      {/* OAuth Providers */}
      <SocialLoginButtons callbackUrl={callbackUrl} />

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <Separator className="w-full" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            Or continue with
          </span>
        </div>
      </div>

      {/* Credentials Form */}
      <form action={formAction} className="space-y-4">
        <input type="hidden" name="callbackUrl" value={callbackUrl} />

        {(state?.error || error) && (
          <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
            {state?.error || "Authentication failed. Please try again."}
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="name@example.com"
            autoComplete="email"
            required
          />
          {state?.fieldErrors?.email && (
            <p className="text-sm text-destructive">{state.fieldErrors.email[0]}</p>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link
              href="/forgot-password"
              className="text-sm text-muted-foreground hover:text-primary"
            >
              Forgot password?
            </Link>
          </div>
          <PasswordInput
            id="password"
            name="password"
            autoComplete="current-password"
            required
          />
          {state?.fieldErrors?.password && (
            <p className="text-sm text-destructive">{state.fieldErrors.password[0]}</p>
          )}
        </div>

        <SubmitButton />
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Don't have an account?{" "}
        <Link href="/register" className="text-primary hover:underline">
          Sign up
        </Link>
      </p>
    </div>
  );
}
```

### 8.3 Social Login Buttons (`src/components/auth/social-login-buttons.tsx`)

```typescript
"use client";

import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/icons";

interface SocialLoginButtonsProps {
  callbackUrl?: string;
}

export function SocialLoginButtons({ callbackUrl = "/dashboard" }: SocialLoginButtonsProps) {
  const handleOAuthSignIn = async (provider: "google" | "github") => {
    await signIn(provider, { callbackUrl });
  };

  return (
    <div className="grid grid-cols-2 gap-4">
      <Button
        variant="outline"
        type="button"
        onClick={() => handleOAuthSignIn("google")}
      >
        <Icons.google className="mr-2 h-4 w-4" />
        Google
      </Button>
      <Button
        variant="outline"
        type="button"
        onClick={() => handleOAuthSignIn("github")}
      >
        <Icons.gitHub className="mr-2 h-4 w-4" />
        GitHub
      </Button>
    </div>
  );
}
```

### 8.4 Password Input with Toggle (`src/components/auth/password-input.tsx`)

```typescript
"use client";

import { forwardRef, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PasswordInputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);

    return (
      <div className="relative">
        <Input
          type={showPassword ? "text" : "password"}
          className={cn("pr-10", className)}
          ref={ref}
          {...props}
        />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
          onClick={() => setShowPassword((prev) => !prev)}
          aria-label={showPassword ? "Hide password" : "Show password"}
        >
          {showPassword ? (
            <EyeOff className="h-4 w-4 text-muted-foreground" />
          ) : (
            <Eye className="h-4 w-4 text-muted-foreground" />
          )}
        </Button>
      </div>
    );
  }
);

PasswordInput.displayName = "PasswordInput";
```

### 8.5 Password Strength Indicator (`src/components/auth/password-strength.tsx`)

```typescript
"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { PASSWORD_REQUIREMENTS } from "@/lib/auth/constants";

interface PasswordStrengthProps {
  password: string;
}

export function PasswordStrength({ password }: PasswordStrengthProps) {
  const strength = useMemo(() => {
    let score = 0;
    const checks = {
      length: password.length >= PASSWORD_REQUIREMENTS.MIN_LENGTH,
      lowercase: /[a-z]/.test(password),
      uppercase: /[A-Z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[^a-zA-Z0-9]/.test(password),
    };

    if (checks.length) score++;
    if (checks.lowercase) score++;
    if (checks.uppercase) score++;
    if (checks.number) score++;
    if (checks.special) score++;

    return {
      score,
      checks,
      label: score < 2 ? "Weak" : score < 4 ? "Medium" : "Strong",
    };
  }, [password]);

  if (!password) return null;

  return (
    <div className="space-y-2 mt-2">
      {/* Strength bar */}
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((level) => (
          <div
            key={level}
            className={cn(
              "h-1 flex-1 rounded-full transition-colors",
              level <= strength.score
                ? strength.score < 2
                  ? "bg-red-500"
                  : strength.score < 4
                    ? "bg-yellow-500"
                    : "bg-green-500"
                : "bg-muted"
            )}
          />
        ))}
      </div>

      {/* Strength label */}
      <p className={cn(
        "text-xs",
        strength.score < 2 ? "text-red-500" :
        strength.score < 4 ? "text-yellow-500" : "text-green-500"
      )}>
        {strength.label}
      </p>

      {/* Requirements checklist */}
      <ul className="text-xs text-muted-foreground space-y-1">
        <li className={cn(strength.checks.length && "text-green-500")}>
          {strength.checks.length ? "✓" : "○"} At least {PASSWORD_REQUIREMENTS.MIN_LENGTH} characters
        </li>
        <li className={cn(strength.checks.lowercase && "text-green-500")}>
          {strength.checks.lowercase ? "✓" : "○"} Lowercase letter
        </li>
        <li className={cn(strength.checks.uppercase && "text-green-500")}>
          {strength.checks.uppercase ? "✓" : "○"} Uppercase letter
        </li>
        <li className={cn(strength.checks.number && "text-green-500")}>
          {strength.checks.number ? "✓" : "○"} Number
        </li>
      </ul>
    </div>
  );
}
```

### 8.6 Session Provider (`src/components/providers/session-provider.tsx`)

```typescript
"use client";

import { SessionProvider as NextAuthSessionProvider } from "next-auth/react";

interface SessionProviderProps {
  children: React.ReactNode;
}

export function SessionProvider({ children }: SessionProviderProps) {
  return (
    <NextAuthSessionProvider refetchInterval={5 * 60} refetchOnWindowFocus>
      {children}
    </NextAuthSessionProvider>
  );
}
```

---

## 9. Security Patterns

### 9.1 Rate Limiting Service (`src/lib/services/rate-limit.service.ts`)

```typescript
import Redis from "ioredis";
import { headers } from "next/headers";

// Redis client singleton
let redis: Redis | null = null;

function getRedis(): Redis {
  if (!redis) {
    redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379");
  }
  return redis;
}

interface RateLimitResult {
  success: boolean;
  remaining: number;
  reset: number;
}

export async function rateLimitByIp(
  action: string,
  limit: number,
  windowSeconds: number
): Promise<RateLimitResult> {
  const headersList = await headers();
  const ip = headersList.get("x-forwarded-for")?.split(",")[0] ??
             headersList.get("x-real-ip") ??
             "unknown";

  return rateLimit(`${action}:${ip}`, limit, windowSeconds);
}

export async function rateLimitByEmail(
  action: string,
  email: string,
  limit: number,
  windowSeconds: number
): Promise<RateLimitResult> {
  return rateLimit(`${action}:${email.toLowerCase()}`, limit, windowSeconds);
}

async function rateLimit(
  key: string,
  limit: number,
  windowSeconds: number
): Promise<RateLimitResult> {
  const client = getRedis();
  const now = Date.now();
  const windowStart = now - windowSeconds * 1000;
  const redisKey = `ratelimit:${key}`;

  // Use Redis sorted set for sliding window
  const pipeline = client.pipeline();

  // Remove old entries
  pipeline.zremrangebyscore(redisKey, 0, windowStart);

  // Add current request
  pipeline.zadd(redisKey, now, `${now}`);

  // Count requests in window
  pipeline.zcard(redisKey);

  // Set expiry
  pipeline.expire(redisKey, windowSeconds);

  const results = await pipeline.exec();

  const count = results?.[2]?.[1] as number ?? 0;
  const remaining = Math.max(0, limit - count);
  const reset = Math.ceil((windowStart + windowSeconds * 1000) / 1000);

  return {
    success: count <= limit,
    remaining,
    reset,
  };
}

// Fallback for environments without Redis
export async function rateLimitMemory(
  key: string,
  limit: number,
  windowSeconds: number
): Promise<RateLimitResult> {
  // Simple in-memory rate limiting (for development only)
  const memoryStore = new Map<string, { count: number; resetAt: number }>();

  const now = Date.now();
  const record = memoryStore.get(key);

  if (!record || record.resetAt < now) {
    memoryStore.set(key, { count: 1, resetAt: now + windowSeconds * 1000 });
    return { success: true, remaining: limit - 1, reset: Math.ceil((now + windowSeconds * 1000) / 1000) };
  }

  record.count++;

  return {
    success: record.count <= limit,
    remaining: Math.max(0, limit - record.count),
    reset: Math.ceil(record.resetAt / 1000),
  };
}
```

### 9.2 Token Service (`src/lib/services/token.service.ts`)

```typescript
import { randomBytes } from "crypto";
import { db } from "@/lib/db";

const TOKEN_EXPIRY = {
  EMAIL_VERIFICATION: 24 * 60 * 60 * 1000, // 24 hours
  PASSWORD_RESET: 60 * 60 * 1000, // 1 hour
};

// Email Verification Token
export async function createEmailVerificationToken(email: string) {
  const token = randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + TOKEN_EXPIRY.EMAIL_VERIFICATION);

  // Delete existing tokens for this email
  await db.verificationToken.deleteMany({
    where: { identifier: email },
  });

  return db.verificationToken.create({
    data: {
      identifier: email,
      token,
      expires,
    },
  });
}

export async function verifyEmailToken(token: string) {
  const tokenRecord = await db.verificationToken.findFirst({
    where: {
      token,
      expires: { gt: new Date() },
    },
  });

  return tokenRecord;
}

export async function deleteVerificationToken(identifier: string, token: string) {
  await db.verificationToken.delete({
    where: {
      identifier_token: { identifier, token },
    },
  });
}

// Password Reset Token
export async function createPasswordResetToken(email: string) {
  const token = randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + TOKEN_EXPIRY.PASSWORD_RESET);

  // Delete existing tokens for this email
  await db.passwordResetToken.deleteMany({
    where: { email },
  });

  return db.passwordResetToken.create({
    data: {
      email,
      token,
      expires,
    },
  });
}

export async function verifyPasswordResetToken(token: string) {
  const tokenRecord = await db.passwordResetToken.findFirst({
    where: {
      token,
      expires: { gt: new Date() },
    },
  });

  return tokenRecord;
}

export async function deletePasswordResetToken(token: string) {
  await db.passwordResetToken.delete({
    where: { token },
  });
}
```

### 9.3 Password Hashing Guidelines

```typescript
// Password hashing is handled by bcryptjs with cost factor 12
// This provides good security while maintaining reasonable performance

import { hash, compare } from "bcryptjs";

const SALT_ROUNDS = 12;

export async function hashPassword(password: string): Promise<string> {
  return hash(password, SALT_ROUNDS);
}

export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return compare(password, hashedPassword);
}
```

### 9.4 CSRF Protection

Auth.js v5 provides built-in CSRF protection through:
- Double-submit cookie pattern
- Automatic CSRF token validation on form submissions
- Origin header verification

No additional configuration needed - handled by Auth.js internally.

---

## 10. Type Definitions

### 10.1 Auth Types (`src/types/auth.ts`)

```typescript
import type { Role } from "@prisma/client";

export interface ActionResult {
  success: boolean;
  error?: string;
  message?: string;
  fieldErrors?: Record<string, string[]>;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  role: Role;
}

export interface SessionUser extends AuthUser {}

export type AuthProvider = "credentials" | "google" | "github";
```

### 10.2 Auth.js Type Augmentation (`src/types/next-auth.d.ts`)

```typescript
import type { Role } from "@prisma/client";
import type { DefaultSession, DefaultUser } from "next-auth";
import type { DefaultJWT } from "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: Role;
    } & DefaultSession["user"];
  }

  interface User extends DefaultUser {
    role: Role;
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    id: string;
    role: Role;
  }
}
```

---

## 11. Testing Strategy

### 11.1 Unit Tests Structure

```typescript
// tests/unit/lib/validations/auth.test.ts
import { describe, it, expect } from "vitest";
import { loginSchema, registerSchema, passwordSchema } from "@/lib/validations/auth";

describe("Auth Validation Schemas", () => {
  describe("loginSchema", () => {
    it("should accept valid credentials", () => {
      const result = loginSchema.safeParse({
        email: "test@example.com",
        password: "ValidPass123",
      });
      expect(result.success).toBe(true);
    });

    it("should reject invalid email", () => {
      const result = loginSchema.safeParse({
        email: "invalid-email",
        password: "ValidPass123",
      });
      expect(result.success).toBe(false);
    });

    it("should reject short password", () => {
      const result = loginSchema.safeParse({
        email: "test@example.com",
        password: "short",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("registerSchema", () => {
    it("should accept valid registration data", () => {
      const result = registerSchema.safeParse({
        name: "Test User",
        email: "test@example.com",
        password: "ValidPass123",
        confirmPassword: "ValidPass123",
      });
      expect(result.success).toBe(true);
    });

    it("should reject mismatched passwords", () => {
      const result = registerSchema.safeParse({
        name: "Test User",
        email: "test@example.com",
        password: "ValidPass123",
        confirmPassword: "DifferentPass123",
      });
      expect(result.success).toBe(false);
    });
  });
});
```

### 11.2 Server Action Tests

```typescript
// tests/unit/actions/auth/register.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { registerAction } from "@/actions/auth/register";

// Mock dependencies
vi.mock("@/lib/db", () => ({
  db: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
  },
}));

vi.mock("@/lib/services/rate-limit.service", () => ({
  rateLimitByIp: vi.fn().mockResolvedValue({ success: true }),
}));

vi.mock("@/lib/services/token.service", () => ({
  createEmailVerificationToken: vi.fn().mockResolvedValue({ token: "test-token" }),
}));

vi.mock("@/lib/services/email.service", () => ({
  sendVerificationEmail: vi.fn().mockResolvedValue(undefined),
}));

describe("registerAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return error for invalid input", async () => {
    const formData = new FormData();
    formData.set("email", "invalid");
    formData.set("password", "short");

    const result = await registerAction(null, formData);

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  // Additional test cases...
});
```

### 11.3 E2E Tests

```typescript
// tests/e2e/auth/login.spec.ts
import { test, expect } from "@playwright/test";

test.describe("Login Flow", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
  });

  test("should display login form", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /sign in/i })).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /sign in/i })).toBeVisible();
  });

  test("should show error for invalid credentials", async ({ page }) => {
    await page.getByLabel(/email/i).fill("test@example.com");
    await page.getByLabel(/password/i).fill("wrongpassword");
    await page.getByRole("button", { name: /sign in/i }).click();

    await expect(page.getByText(/invalid email or password/i)).toBeVisible();
  });

  test("should redirect to dashboard on successful login", async ({ page }) => {
    // Assumes a test user exists
    await page.getByLabel(/email/i).fill("testuser@example.com");
    await page.getByLabel(/password/i).fill("TestPassword123");
    await page.getByRole("button", { name: /sign in/i }).click();

    await expect(page).toHaveURL("/dashboard");
  });

  test("should display OAuth provider buttons", async ({ page }) => {
    await expect(page.getByRole("button", { name: /google/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /github/i })).toBeVisible();
  });
});
```

---

## 12. Environment Variables

### 12.1 Required Variables

```env
# .env.example

# Auth.js
AUTH_SECRET=your-auth-secret-min-32-chars
AUTH_URL=http://localhost:3000

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/saas_db

# Redis (for rate limiting)
REDIS_URL=redis://localhost:6379

# OAuth Providers
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret

# Email (Resend)
RESEND_API_KEY=your-resend-api-key
EMAIL_FROM=noreply@yourdomain.com

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 12.2 Generate AUTH_SECRET

```bash
# Generate secure secret
openssl rand -base64 32
```

---

## 13. Implementation Checklist

### Phase 1: Core Setup (Priority: High)
- [ ] Add PasswordResetToken model to Prisma schema
- [ ] Run database migration
- [ ] Create auth configuration files
- [ ] Set up Auth.js route handler
- [ ] Implement middleware for route protection

### Phase 2: Server Actions (Priority: High)
- [ ] Implement login action with validation
- [ ] Implement register action with email verification
- [ ] Implement forgot password action
- [ ] Implement reset password action
- [ ] Implement verify email action
- [ ] Add rate limiting to all actions

### Phase 3: Services (Priority: High)
- [ ] Create token service (email verification, password reset)
- [ ] Create rate limit service (Redis-based)
- [ ] Update email service for auth emails

### Phase 4: Components (Priority: Medium)
- [ ] Create auth card wrapper
- [ ] Create login form component
- [ ] Create register form component
- [ ] Create forgot password form
- [ ] Create reset password form
- [ ] Create password input with toggle
- [ ] Create password strength indicator
- [ ] Create social login buttons
- [ ] Create session provider

### Phase 5: Pages (Priority: Medium)
- [ ] Create auth layout
- [ ] Create login page
- [ ] Create register page
- [ ] Create forgot password page
- [ ] Create reset password page
- [ ] Create verify email page
- [ ] Create auth error page

### Phase 6: Testing (Priority: High)
- [ ] Write unit tests for validation schemas
- [ ] Write unit tests for server actions
- [ ] Write unit tests for services
- [ ] Write component tests for forms
- [ ] Write E2E tests for auth flows

### Phase 7: Security Audit (Priority: Critical)
- [ ] Verify CSRF protection
- [ ] Test rate limiting
- [ ] Verify password hashing
- [ ] Test token expiration
- [ ] Check for auth bypass vulnerabilities
- [ ] Review error messages for information leakage

---

## Appendix A: Validation Schemas

```typescript
// src/lib/validations/auth.ts
import { z } from "zod";
import { PASSWORD_REQUIREMENTS } from "@/lib/auth/constants";

export const emailSchema = z
  .string()
  .email("Invalid email address")
  .min(1, "Email is required")
  .max(255, "Email is too long")
  .transform((v) => v.toLowerCase().trim());

export const passwordSchema = z
  .string()
  .min(PASSWORD_REQUIREMENTS.MIN_LENGTH, `Password must be at least ${PASSWORD_REQUIREMENTS.MIN_LENGTH} characters`)
  .max(100, "Password is too long")
  .refine(
    (v) => !PASSWORD_REQUIREMENTS.REQUIRE_UPPERCASE || /[A-Z]/.test(v),
    "Password must contain an uppercase letter"
  )
  .refine(
    (v) => !PASSWORD_REQUIREMENTS.REQUIRE_LOWERCASE || /[a-z]/.test(v),
    "Password must contain a lowercase letter"
  )
  .refine(
    (v) => !PASSWORD_REQUIREMENTS.REQUIRE_NUMBER || /[0-9]/.test(v),
    "Password must contain a number"
  );

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required"),
});

export const registerSchema = z
  .object({
    name: z
      .string()
      .min(2, "Name must be at least 2 characters")
      .max(100, "Name is too long")
      .trim(),
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const resetPasswordSchema = z
  .object({
    token: z.string().min(1, "Token is required"),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: "New password must be different from current password",
    path: ["newPassword"],
  });

// Type exports
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
```

---

## Appendix B: Email Templates

```typescript
// src/lib/emails/verification-email.tsx
import {
  Body,
  Button,
  Container,
  Head,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";

interface VerificationEmailProps {
  verificationUrl: string;
}

export function VerificationEmail({ verificationUrl }: VerificationEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Verify your email address</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section>
            <Text style={heading}>Verify your email</Text>
            <Text style={paragraph}>
              Click the button below to verify your email address and complete your registration.
            </Text>
            <Button style={button} href={verificationUrl}>
              Verify Email
            </Button>
            <Text style={paragraph}>
              This link will expire in 24 hours.
            </Text>
            <Text style={paragraph}>
              If you didn't create an account, you can safely ignore this email.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

const main = { backgroundColor: "#f6f9fc", padding: "40px 0" };
const container = { backgroundColor: "#ffffff", padding: "40px", borderRadius: "8px" };
const heading = { fontSize: "24px", fontWeight: "bold", marginBottom: "20px" };
const paragraph = { fontSize: "14px", lineHeight: "24px", marginBottom: "16px" };
const button = {
  backgroundColor: "#000",
  color: "#fff",
  padding: "12px 24px",
  borderRadius: "6px",
  textDecoration: "none",
  display: "inline-block",
  marginBottom: "16px",
};
```

---

**Document End**

This technical architecture document provides a complete blueprint for implementing Epic 2 Authentication. Frontend and Backend agents can use this as a definitive reference for TDD implementation.
