import { randomBytes, createHash } from "crypto";

const BACKUP_CODE_COUNT = 10;
const BACKUP_CODE_LENGTH = 8;

/**
 * Generate a set of backup codes for 2FA recovery
 * @param count - Number of codes to generate (default: 10)
 * @returns Array of plaintext backup codes
 */
export function generateBackupCodes(count: number = BACKUP_CODE_COUNT): string[] {
  return Array.from({ length: count }, () =>
    randomBytes(BACKUP_CODE_LENGTH / 2)
      .toString("hex")
      .toUpperCase()
  );
}

/**
 * Hash a backup code for secure storage
 * Uses SHA-256 for fast comparison (backup codes are single-use)
 */
export function hashBackupCode(code: string): string {
  return createHash("sha256").update(code.toUpperCase()).digest("hex");
}

/**
 * Hash all backup codes for storage
 * @param codes - Array of plaintext backup codes
 * @returns Array of hashed backup codes
 */
export function hashBackupCodes(codes: string[]): string[] {
  return codes.map(hashBackupCode);
}

/**
 * Verify a backup code against stored hashes
 * @param inputCode - The code the user entered
 * @param storedHashes - Array of hashed backup codes from database
 * @returns The index of the matched code, or -1 if not found
 */
export function verifyBackupCode(
  inputCode: string,
  storedHashes: string[]
): number {
  const inputHash = hashBackupCode(inputCode);
  return storedHashes.findIndex((hash) => hash === inputHash);
}

/**
 * Format backup codes for display (add dash in middle)
 * e.g., "ABCD1234" -> "ABCD-1234"
 */
export function formatBackupCode(code: string): string {
  const middle = Math.floor(code.length / 2);
  return `${code.slice(0, middle)}-${code.slice(middle)}`;
}

/**
 * Format all backup codes for display
 */
export function formatBackupCodes(codes: string[]): string[] {
  return codes.map(formatBackupCode);
}
