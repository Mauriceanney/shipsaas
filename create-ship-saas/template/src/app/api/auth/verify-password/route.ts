import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { rateLimiters, getClientIp, rateLimitHeaders } from "@/lib/rate-limit";
import { user, account } from "@/lib/schema";

const PENDING_2FA_COOKIE = "pending_2fa_user_id";
const PENDING_2FA_MAX_AGE = 5 * 60; // 5 minutes

export async function POST(request: NextRequest) {
  try {
    // Rate limiting - 5 requests per minute per IP
    const clientIp = getClientIp(request);
    const rateLimitResult = await rateLimiters.auth(clientIp);

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { success: false, error: "Too many login attempts. Please try again later." },
        { status: 429, headers: rateLimitHeaders(rateLimitResult) }
      );
    }

    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: "Email and password are required" },
        { status: 400 }
      );
    }

    // Get user
    const [userData] = await db
      .select({
        id: user.id,
        email: user.email,
        disabled: user.disabled,
      })
      .from(user)
      .where(eq(user.email, email))
      .limit(1);

    if (!userData) {
      return NextResponse.json(
        { success: false, error: "Invalid email or password" },
        { status: 401 }
      );
    }

    if (userData.disabled) {
      return NextResponse.json(
        { success: false, error: "Account is disabled" },
        { status: 401 }
      );
    }

    // Get password from credential account
    const [credentialAccount] = await db
      .select({ password: account.password })
      .from(account)
      .where(
        and(
          eq(account.userId, userData.id),
          eq(account.providerId, "credential")
        )
      )
      .limit(1);

    if (!credentialAccount?.password) {
      return NextResponse.json(
        { success: false, error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Verify password
    const isValid = await bcrypt.compare(password, credentialAccount.password);

    if (!isValid) {
      return NextResponse.json(
        { success: false, error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Set pending 2FA cookie
    const cookieStore = await cookies();
    cookieStore.set(PENDING_2FA_COOKIE, userData.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: PENDING_2FA_MAX_AGE,
      path: "/",
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error verifying password:", error);
    return NextResponse.json(
      { success: false, error: "An error occurred" },
      { status: 500 }
    );
  }
}
