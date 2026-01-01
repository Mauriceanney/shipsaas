"use server";

import { trackServerEvent, SETTINGS_EVENTS } from "@/lib/analytics";
import { generateApiKey, hashApiKey, getKeyPrefix } from "@/lib/api-key/generate";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";
import { rateLimiters } from "@/lib/rate-limit";
import { createApiKeySchema } from "@/lib/validations/api-key";

const MAX_KEYS_PER_USER = 10;

export async function createApiKey(input: unknown) {
  //  1. Authentication
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false as const, error: "Unauthorized" };
  }

  // 2. Rate limiting (5 keys per hour)
  const rateLimitResult = await rateLimiters.api(`apikey:${session.user.id}`);
  if (!rateLimitResult.success) {
    return {
      success: false as const,
      error: "Too many requests. Please try again later.",
    };
  }

  // 3. Validation
  const parsed = createApiKeySchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false as const,
      error: parsed.error.errors[0]?.message ?? "Invalid input",
    };
  }

  try {
    // 4. Check key limit (max 10 active keys per user)
    const activeKeyCount = await db.apiKey.count({
      where: {
        userId: session.user.id,
        revokedAt: null,
      },
    });

    if (activeKeyCount >= MAX_KEYS_PER_USER) {
      return {
        success: false as const,
        error: "Maximum 10 API keys allowed per user",
      };
    }

    // 5. Generate and hash key
    const key = generateApiKey(parsed.data.environment);
    const keyHash = await hashApiKey(key);
    const keyPrefix = getKeyPrefix(key);

    // 6. Store key
    const apiKey = await db.apiKey.create({
      data: {
        userId: session.user.id,
        name: parsed.data.name,
        keyHash,
        keyPrefix,
        environment: parsed.data.environment,
      },
    });

    logger.info(
      {
        component: "api-keys",
        action: "create",
        userId: session.user.id,
        keyId: apiKey.id,
        environment: parsed.data.environment,
      },
      "API key created"
    );

    // Track analytics event
    trackServerEvent(session.user.id, SETTINGS_EVENTS.API_KEY_CREATED, {
      environment: parsed.data.environment,
    });

    // 7. Return key (only time it's shown) and metadata
    return {
      success: true as const,
      data: {
        key, // Full key shown only once
        apiKey: {
          id: apiKey.id,
          name: apiKey.name,
          keyPrefix: apiKey.keyPrefix,
          environment: apiKey.environment,
          createdAt: apiKey.createdAt,
          lastUsedAt: apiKey.lastUsedAt,
        },
      },
    };
  } catch (error) {
    logger.error(
      {
        component: "api-keys",
        action: "create",
        userId: session.user.id,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      "Failed to create API key"
    );
    return { success: false as const, error: "Failed to create API key" };
  }
}
