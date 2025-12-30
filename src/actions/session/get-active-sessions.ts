"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export type UserSessionData = {
  id: string;
  ipAddress: string | null;
  userAgent: string | null;
  deviceName: string | null;
  lastActiveAt: Date;
  expiresAt: Date;
  createdAt: Date;
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

    const sessions = await db.userSession.findMany({
      where: {
        userId: session.user.id,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { lastActiveAt: "desc" },
      select: {
        id: true,
        ipAddress: true,
        userAgent: true,
        deviceName: true,
        lastActiveAt: true,
        expiresAt: true,
        createdAt: true,
      },
    });

    return { success: true, data: sessions };
  } catch (error) {
    console.error("[getActiveSessions]", error);
    return { success: false, error: "Failed to fetch sessions" };
  }
}
