"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";
export type LoginHistoryData = {
  id: string;
  ipAddress: string | null;
  userAgent: string | null;
  deviceName: string | null;
  success: boolean;
  failReason: string | null;
  provider: string;
  createdAt: Date;
};

type Result =
  | { success: true; data: LoginHistoryData[] }
  | { success: false; error: string };

export async function getLoginHistory(): Promise<Result> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    const history = await db.loginHistory.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 4,
      select: {
        id: true,
        ipAddress: true,
        userAgent: true,
        deviceName: true,
        success: true,
        failReason: true,
        provider: true,
        createdAt: true,
      },
    });

    return { success: true, data: history };
  } catch (error) {
    logger.error(
      { err: error, userId: session?.user?.id },
      "Failed to fetch login history"
    );
    return { success: false, error: "Failed to fetch login history" };
  }
}
