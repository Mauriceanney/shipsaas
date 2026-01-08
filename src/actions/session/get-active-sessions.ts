"use server";

import { cookies } from "next/headers";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";
export type UserSessionData = {
  id: string;
  ipAddress: string | null;
  userAgent: string | null;
  deviceName: string | null;
  lastActiveAt: Date;
  expiresAt: Date;
  createdAt: Date;
  isCurrent: boolean;
};

type Result =
  | { success: true; data: UserSessionData[] }
  | { success: false; error: string };

export async function getActiveSessions(): Promise<Result> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    // Get the current session token from cookie
    const cookieStore = await cookies();
    const currentSessionToken = cookieStore.get("user-session-token")?.value;

    const sessions = await db.userSession.findMany({
      where: {
        userId: session.user.id,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { lastActiveAt: "desc" },
      select: {
        id: true,
        sessionToken: true,
        ipAddress: true,
        userAgent: true,
        deviceName: true,
        lastActiveAt: true,
        expiresAt: true,
        createdAt: true,
      },
    });

    // Map sessions and mark the current one
    const sessionsWithCurrent = sessions.map((s) => ({
      id: s.id,
      ipAddress: s.ipAddress,
      userAgent: s.userAgent,
      deviceName: s.deviceName,
      lastActiveAt: s.lastActiveAt,
      expiresAt: s.expiresAt,
      createdAt: s.createdAt,
      isCurrent: s.sessionToken === currentSessionToken,
    }));

    return { success: true, data: sessionsWithCurrent };
  } catch (error) {
    logger.error(
      { err: error },
      "Failed to fetch active sessions"
    );
    return { success: false, error: "Failed to fetch sessions" };
  }
}
