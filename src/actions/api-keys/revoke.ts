"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";
import { revokeApiKeySchema } from "@/lib/validations/api-key";

export async function revokeApiKey(input: unknown) {
  // 1. Authentication
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false as const, error: "Unauthorized" };
  }

  // 2. Validation
  const parsed = revokeApiKeySchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false as const,
      error: parsed.error.errors[0]?.message ?? "Invalid input",
    };
  }

  try {
    // 3. Verify ownership and revoke
    const apiKey = await db.apiKey.findFirst({
      where: {
        id: parsed.data.id,
        userId: session.user.id,
      },
    });

    if (!apiKey) {
      return { success: false as const, error: "API key not found" };
    }

    if (apiKey.revokedAt) {
      return { success: false as const, error: "API key already revoked" };
    }

    // 4. Soft delete (set revokedAt)
    await db.apiKey.update({
      where: { id: parsed.data.id },
      data: { revokedAt: new Date() },
    });

    logger.info(
      {
        component: "api-keys",
        action: "revoke",
        userId: session.user.id,
        keyId: apiKey.id,
      },
      "API key revoked"
    );

    return { success: true as const };
  } catch (error) {
    logger.error(
      {
        component: "api-keys",
        action: "revoke",
        userId: session.user.id,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      "Failed to revoke API key"
    );
    return { success: false as const, error: "Failed to revoke API key" };
  }
}
