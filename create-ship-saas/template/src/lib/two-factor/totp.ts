import {
  generateSecret as genSecret,
  generateSync,
  verifySync,
} from "otplib";

const ISSUER = process.env.NEXT_PUBLIC_APP_NAME || "App";

/**
 * Generate a new TOTP secret for 2FA setup
 */
export function generateSecret(): string {
  return genSecret();
}

/**
 * Generate a TOTP code from a secret (for testing purposes)
 */
export function generateTOTP(secret: string): string {
  return generateSync({ secret });
}

/**
 * Verify a TOTP code against a secret
 * @param token - The 6-digit code from the authenticator app
 * @param secret - The user's stored TOTP secret
 * @returns true if the token is valid
 */
export function verifyTOTP(token: string, secret: string): boolean {
  try {
    const result = verifySync({ token, secret });
    return result.valid;
  } catch {
    return false;
  }
}

/**
 * Generate the otpauth URI for QR code generation
 * @param email - The user's email
 * @param secret - The TOTP secret
 * @returns The otpauth URI string
 */
export function generateOTPAuthURL(email: string, secret: string): string {
  // otpauth://totp/Issuer:email?secret=xxx&issuer=Issuer&algorithm=SHA1&digits=6&period=30
  const encodedIssuer = encodeURIComponent(ISSUER);
  const encodedEmail = encodeURIComponent(email);
  const encodedSecret = encodeURIComponent(secret);

  return `otpauth://totp/${encodedIssuer}:${encodedEmail}?secret=${encodedSecret}&issuer=${encodedIssuer}&algorithm=SHA1&digits=6&period=30`;
}

/**
 * Configure TOTP options (optional, uses sensible defaults)
 * Note: This is a no-op in the current implementation as we use
 * the default otplib settings. If custom options are needed,
 * they should be passed to generate/verify calls directly.
 */
export function configureTOTP(_options?: {
  step?: number;
  window?: number;
}): void {
  // Currently using default otplib options
  // Custom options would need to be passed to generate/verify calls
}
