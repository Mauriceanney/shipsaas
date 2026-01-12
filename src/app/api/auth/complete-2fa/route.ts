import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { user, loginHistory } from "@/lib/schema";
import { verifyTOTP, verifyBackupCode } from "@/lib/two-factor";

const PENDING_2FA_COOKIE = "pending_2fa_user_id";

export async function POST(request: NextRequest) {
  try {
    const { code, type, trustThisDevice } = await request.json();

    // type can be "totp" or "backup"
    if (!code) {
      return NextResponse.json(
        { success: false, error: "Code is required" },
        { status: 400 }
      );
    }

    // Get pending 2FA user
    const cookieStore = await cookies();
    const userId = cookieStore.get(PENDING_2FA_COOKIE)?.value;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Session expired. Please log in again." },
        { status: 401 }
      );
    }

    // Get user data
    const [userData] = await db
      .select({
        id: user.id,
        email: user.email,
        twoFactorSecret: user.twoFactorSecret,
        twoFactorEnabled: user.twoFactorEnabled,
        twoFactorBackupCodes: user.twoFactorBackupCodes,
      })
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);

    if (!userData || !userData.twoFactorEnabled || !userData.twoFactorSecret) {
      cookieStore.delete(PENDING_2FA_COOKIE);
      return NextResponse.json(
        { success: false, error: "2FA is not enabled for this account" },
        { status: 400 }
      );
    }

    let isValid = false;
    let remainingBackupCodes: number | undefined;

    if (type === "backup") {
      // Verify backup code
      const normalizedCode = code.replace(/-/g, "").toUpperCase();
      if (!/^[A-F0-9]{8}$/.test(normalizedCode)) {
        return NextResponse.json(
          { success: false, error: "Invalid backup code format" },
          { status: 400 }
        );
      }

      if (!userData.twoFactorBackupCodes || userData.twoFactorBackupCodes.length === 0) {
        return NextResponse.json(
          { success: false, error: "No backup codes available" },
          { status: 400 }
        );
      }

      const codeIndex = verifyBackupCode(normalizedCode, userData.twoFactorBackupCodes);
      if (codeIndex !== -1) {
        isValid = true;
        // Remove used backup code
        const remainingCodes = userData.twoFactorBackupCodes.filter(
          (_, index) => index !== codeIndex
        );
        await db
          .update(user)
          .set({ twoFactorBackupCodes: remainingCodes })
          .where(eq(user.id, userData.id));
        remainingBackupCodes = remainingCodes.length;
      }
    } else {
      // Verify TOTP
      if (!/^\d{6}$/.test(code)) {
        return NextResponse.json(
          { success: false, error: "Invalid code format" },
          { status: 400 }
        );
      }
      isValid = verifyTOTP(code, userData.twoFactorSecret);
    }

    if (!isValid) {
      // Log failed attempt
      await db.insert(loginHistory).values({
        id: randomUUID(),
        userId: userData.id,
        success: false,
        failReason: type === "backup" ? "Invalid backup code" : "Invalid 2FA code",
        provider: "credential",
      });

      return NextResponse.json(
        { success: false, error: "Invalid verification code" },
        { status: 401 }
      );
    }

    // Clear pending 2FA cookie
    cookieStore.delete(PENDING_2FA_COOKIE);

    // Log successful login
    await db.insert(loginHistory).values({
      id: randomUUID(),
      userId: userData.id,
      success: true,
      provider: "credential",
    });

    // Trust device if requested - will be handled client-side after redirect
    // The trustDevice action requires an authenticated session, so it will be
    // called from the client after the redirect to dashboard
    void trustThisDevice; // Acknowledge the variable

    return NextResponse.json({
      success: true,
      redirectTo: "/dashboard",
      remainingBackupCodes,
    });
  } catch (error) {
    console.error("Error completing 2FA:", error);
    return NextResponse.json(
      { success: false, error: "An error occurred" },
      { status: 500 }
    );
  }
}
