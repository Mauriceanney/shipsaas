"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function listApiKeys() {
  // 1. Authentication
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false as const, error: "Unauthorized" };
  }

  try {
    // 2. Fetch user's API keys
    const apiKeys = await db.apiKey.findMany({
      where: {
        userId: session.user.id,
      },
      select: {
        id: true,
        name: true,
        keyPrefix: true,
        environment: true,
        scopes: true,
        lastUsedAt: true,
        usageCount: true,
        createdAt: true,
        revokedAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return { success: true as const, data: apiKeys };
  } catch {
    return { success: false as const, error: "Failed to fetch API keys" };
  }
}
