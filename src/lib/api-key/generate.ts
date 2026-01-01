import { randomBytes } from "crypto";

import bcrypt from "bcryptjs";

/**
 * Generate a cryptographically secure API key
 *
 * Format: sk_{env}_{base62(random32bytes)}
 * - sk_live_... for production
 * - sk_test_... for testing
 *
 * @param environment - "live" or "test"
 * @returns API key string (51 characters)
 */
export function generateApiKey(environment: "live" | "test"): string {
  // Generate 32 random bytes
  const randomBuffer = randomBytes(32);

  // Convert to base62 (alphanumeric: 0-9, A-Z, a-z)
  const base62 = bufferToBase62(randomBuffer);

  // Format: sk_{env}_{base62}
  return `sk_${environment}_${base62}`;
}

/**
 * Convert buffer to base62 string
 */
function bufferToBase62(buffer: Buffer): string {
  const chars =
    "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
  let num = BigInt("0x" + buffer.toString("hex"));
  let result = "";

  while (num > 0) {
    const remainder = Number(num % 62n);
    result = chars[remainder] + result;
    num = num / 62n;
  }

  // Pad to 43 characters for consistent length
  return result.padStart(43, "0");
}

/**
 * Hash API key with bcrypt for secure storage
 *
 * @param key - Plain API key
 * @returns bcrypt hash (cost 12)
 */
export async function hashApiKey(key: string): Promise<string> {
  return bcrypt.hash(key, 12);
}

/**
 * Verify API key against stored hash
 *
 * @param key - Plain API key
 * @param hash - Stored bcrypt hash
 * @returns true if key matches hash
 */
export async function verifyApiKey(
  key: string,
  hash: string
): Promise<boolean> {
  if (!key || !hash) {
    return false;
  }

  try {
    return await bcrypt.compare(key, hash);
  } catch {
    return false;
  }
}

/**
 * Extract key prefix for display (first 12 characters)
 *
 * @param key - Full API key
 * @returns Prefix (e.g., "sk_live_abc1")
 */
export function getKeyPrefix(key: string): string {
  return key.slice(0, 12);
}
