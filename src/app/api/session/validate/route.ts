import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ valid: false });
    }

    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("user-session-token")?.value;

    if (!sessionToken) {
      return NextResponse.json({ valid: false });
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

    return NextResponse.json({ valid: !!userSession });
  } catch (error) {
    console.error("[session/validate]", error);
    return NextResponse.json({ valid: false });
  }
}
