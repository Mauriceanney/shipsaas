/**
 * GDPR Compliance Actions
 *
 * Server actions for GDPR compliance including:
 * - Data Export (Article 20 - Right to Data Portability)
 * - Account Deletion (Article 17 - Right to Erasure)
 * - Email Preferences Management
 */

// Data Export
export {
  requestDataExport,
  getDataExportStatus,
  getLatestDataExportRequest,
  type RequestDataExportResult,
  type DataExportStatusResult,
} from "./request-data-export";

export {
  generateUserDataExport,
  type UserDataExport,
} from "./generate-export";

// Account Deletion
export {
  requestAccountDeletion,
  getAccountDeletionStatus,
  type RequestAccountDeletionResult,
  type AccountDeletionStatusResult,
} from "./request-account-deletion";

export {
  cancelAccountDeletion,
  type CancelDeletionResult,
} from "./cancel-deletion";

// Email Preferences
export {
  updateEmailPreferences,
  getEmailPreferences,
  getEmailPreferencesByToken,
  updateEmailPreferencesByToken,
  unsubscribeFromAll,
  generateUnsubscribeToken,
  type EmailPreferences,
  type UpdateEmailPreferencesResult,
  type GetEmailPreferencesResult,
} from "./update-email-preferences";
