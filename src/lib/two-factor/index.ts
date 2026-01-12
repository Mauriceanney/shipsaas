// TOTP utilities
export {
  generateSecret,
  generateTOTP,
  verifyTOTP,
  generateOTPAuthURL,
  configureTOTP,
} from "./totp";

// Backup codes utilities
export {
  generateBackupCodes,
  hashBackupCode,
  hashBackupCodes,
  verifyBackupCode,
  formatBackupCode,
  formatBackupCodes,
} from "./backup-codes";

// QR code utilities (lazy loaded)
export { generateQRCodeDataURL, generateQRCodeSVG } from "./lazy-qrcode";
