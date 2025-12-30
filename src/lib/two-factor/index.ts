/**
 * Two-Factor Authentication Library
 * Re-exports from totp.ts
 */
export {
  generateTOTPSecret,
  generateTOTPUri,
  generateQRCode,
  verifyTOTP,
  generateBackupCodes,
  verifyBackupCode,
  formatBackupCodes,
  TRUSTED_DEVICE_DURATION_DAYS,
  TRUSTED_DEVICE_COOKIE,
  generateDeviceToken,
  hashDeviceToken,
  getTrustedDeviceExpiry,
  parseDeviceName,
} from "./totp";
