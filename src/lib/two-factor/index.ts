/**
 * Two-Factor Authentication Library
 *
 * Provides TOTP (Time-based One-Time Password) functionality
 * using the RFC 6238 standard.
 */

import { authenticator } from "otplib";
import * as QRCode from "qrcode";
import bcrypt from "bcryptjs";
import crypto from "crypto";

import { siteConfig } from "@/config/site";

// Configure authenticator options
authenticator.options = {
  digits: 6,
  step: 30, // 30-second window
  window: 1, // Allow 1 step before/after for clock drift
};

/**
 * Generate a new TOTP secret for 2FA setup
 */
export function generateTOTPSecret(): string {
  return authenticator.generateSecret();
}

/**
 * Generate the otpauth URI for authenticator apps
 */
export function generateTOTPUri(email: string, secret: string): string {
  return authenticator.keyuri(email, siteConfig.name, secret);
}

/**
 * Generate a QR code data URL for the TOTP URI
 */
export async function generateQRCode(otpauthUri: string): Promise<string> {
  return QRCode.toDataURL(otpauthUri, {
    errorCorrectionLevel: "M",
    type: "image/png",
    margin: 2,
    width: 256,
  });
}

/**
 * Verify a TOTP code against a secret
 */
export function verifyTOTP(token: string, secret: string): boolean {
  try {
    return authenticator.verify({ token, secret });
  } catch {
    return false;
  }
}

/**
 * Generate backup codes for 2FA recovery
 * Returns both plain codes (to show user) and hashed codes (to store)
 */
export async function generateBackupCodes(count: number = 10): Promise<{
  plainCodes: string[];
  hashedCodes: string[];
}> {
  const plainCodes: string[] = [];
  const hashedCodes: string[] = [];

  for (let i = 0; i < count; i++) {
    // Generate 8-character alphanumeric code
    const code = crypto.randomBytes(4).toString("hex").toUpperCase();
    plainCodes.push(code);

    // Hash for storage (use lower cost for backup codes as they're single-use)
    const hash = await bcrypt.hash(code, 10);
    hashedCodes.push(hash);
  }

  return { plainCodes, hashedCodes };
}

/**
 * Verify a backup code against stored hashed codes
 * Returns the index of the matched code, or -1 if not found
 */
export async function verifyBackupCode(
  code: string,
  hashedCodes: string[]
): Promise<number> {
  const normalizedCode = code.toUpperCase().replace(/\s/g, "");

  for (let i = 0; i < hashedCodes.length; i++) {
    const hashedCode = hashedCodes[i];
    if (!hashedCode) continue;

    const isMatch = await bcrypt.compare(normalizedCode, hashedCode);
    if (isMatch) {
      return i;
    }
  }

  return -1;
}

/**
 * Format backup codes for display (grouped pairs)
 */
export function formatBackupCodes(codes: string[]): string[] {
  return codes.map((code) => `${code.slice(0, 4)}-${code.slice(4)}`);
}

// ============================================
// TRUSTED DEVICE FUNCTIONS
// ============================================

/** Default trust duration: 30 days */
export const TRUSTED_DEVICE_DURATION_DAYS = 30;

/**
 * Generate a secure device token for trusted device cookie
 */
export function generateDeviceToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * Hash a device token for storage
 */
export async function hashDeviceToken(token: string): Promise<string> {
  // Use SHA-256 for device tokens (faster than bcrypt, still secure for random tokens)
  return crypto.createHash("sha256").update(token).digest("hex");
}

/**
 * Calculate expiry date for trusted device
 */
export function getTrustedDeviceExpiry(days: number = TRUSTED_DEVICE_DURATION_DAYS): Date {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + days);
  return expiresAt;
}

/**
 * Parse user agent string to get device name
 */
export function parseDeviceName(userAgent: string | null): string {
  if (!userAgent) return "Unknown Device";

  // Simple browser detection
  let browser = "Unknown Browser";
  let os = "Unknown OS";

  // Detect browser
  if (userAgent.includes("Chrome") && !userAgent.includes("Edg")) {
    browser = "Chrome";
  } else if (userAgent.includes("Firefox")) {
    browser = "Firefox";
  } else if (userAgent.includes("Safari") && !userAgent.includes("Chrome")) {
    browser = "Safari";
  } else if (userAgent.includes("Edg")) {
    browser = "Edge";
  }

  // Detect OS
  if (userAgent.includes("Windows")) {
    os = "Windows";
  } else if (userAgent.includes("Mac OS")) {
    os = "macOS";
  } else if (userAgent.includes("Linux")) {
    os = "Linux";
  } else if (userAgent.includes("iPhone") || userAgent.includes("iPad")) {
    os = "iOS";
  } else if (userAgent.includes("Android")) {
    os = "Android";
  }

  return `${browser} on ${os}`;
}
