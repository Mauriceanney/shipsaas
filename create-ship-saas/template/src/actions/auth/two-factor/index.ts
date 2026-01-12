// 2FA Setup and Management
export { setupTwoFactor, type TwoFactorSetupResult } from "./setup";
export { enableTwoFactor, type EnableTwoFactorResult } from "./enable";
export { disableTwoFactor, type DisableTwoFactorResult } from "./disable";

// 2FA Verification
export {
  verifyTwoFactor,
  setPending2FA,
  getPending2FAUserId,
  clearPending2FA,
  type VerifyTwoFactorResult,
} from "./verify";

// Backup Codes
export {
  regenerateBackupCodes,
  type RegenerateBackupCodesResult,
} from "./regenerate-backup-codes";
export { verifyBackupCode, type VerifyBackupCodeResult } from "./verify-backup-code";

// Trusted Devices
export {
  trustDevice,
  isDeviceTrusted,
  getTrustedDevices,
  removeTrustedDevice,
  removeAllTrustedDevices,
  type TrustDeviceResult,
  type GetTrustedDevicesResult,
  type RemoveTrustedDeviceResult,
  type TrustedDeviceInfo,
} from "./trust-device";
