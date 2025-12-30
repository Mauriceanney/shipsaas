import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      // Not authenticated via Auth.js - invalid
      return NextResponse.json({ valid: false });
    }

    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("user-session-token")?.value;

    if (!sessionToken) {
      // No session token cookie means this is a legacy session
      // (logged in before session tracking was implemented)
      // Treat as valid - don't force logout for existing users
      return NextResponse.json({ valid: true });
    }

    // Check if the session is still valid (not revoked, not expired)
    const userSession = await db.userSession.findFirst({
      where: {
        sessionToken,
        userId: session.user.id,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      select: { id: true },
    });

    // If session token exists but no matching valid session found,
    // it means the session was revoked
    return NextResponse.json({ valid: !!userSession });
  } catch (error) {
    console.error("[session/validate]", error);
    // On error, don't invalidate the session - fail safe
    return NextResponse.json({ valid: true });
  }
}
