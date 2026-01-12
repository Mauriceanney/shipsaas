import { NextRequest, NextResponse } from "next/server";
import { getUserByEmail } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ has2FA: false });
    }

    const user = await getUserByEmail(email);

    if (!user) {
      // Don't reveal if user exists
      return NextResponse.json({ has2FA: false });
    }

    return NextResponse.json({ has2FA: user.twoFactorEnabled });
  } catch (error) {
    console.error("Error checking 2FA:", error);
    return NextResponse.json({ has2FA: false });
  }
}
