# Cache Revalidation Implementation Plan

## Actions Requiring Updates

Based on thorough analysis, the following 7 actions need cache revalidation added:

### 1. Two-Factor Authentication Actions (4 files)
- **File**: `/src/actions/auth/two-factor/enable.ts`
  - **Revalidate**: `/dashboard/security`
  - **Reason**: Enables 2FA, security settings page should reflect change

- **File**: `/src/actions/auth/two-factor/disable.ts`
  - **Revalidate**: `/dashboard/security`
  - **Reason**: Disables 2FA, security settings page should reflect change

- **File**: `/src/actions/auth/two-factor/setup.ts`
  - **Revalidate**: `/dashboard/security`
  - **Reason**: Initiates 2FA setup, security page should show setup state

- **File**: `/src/actions/auth/two-factor/regenerate-backup-codes.ts`
  - **Revalidate**: `/dashboard/security`
  - **Reason**: Updates backup codes, security page should reflect count

### 2. Admin Bulk Actions (1 file)
- **File**: `/src/actions/admin/bulk-actions.ts`
  - **Functions**: `bulkDisableUsers`, `bulkEnableUsers`, `bulkChangeUserRole`
  - **Revalidate**: `/admin/users`
  - **Reason**: User list page should reflect bulk changes
  - **Note**: `bulkSendEmail` doesn't need revalidation (no data mutation)

### 3. Billing Actions (1 file)
- **File**: `/src/actions/billing/retry-payment.ts`
  - **Revalidate**: `/dashboard/billing`
  - **Reason**: Payment status should update on billing page

### 4. Email Preferences (1 file)
- **File**: `/src/actions/email/unsubscribe.ts`
  - **Functions**: `updateEmailPreferences`, `unsubscribeFromAll`
  - **Revalidate**: `/dashboard/settings` (optional - accessed via token, not auth)
  - **Decision**: Skip revalidation (unauthenticated public endpoint)

## Actions That DON'T Need Revalidation

### Authentication Actions
- `auth/login.ts` - Redirects to dashboard
- `auth/register.ts` - User not authenticated yet
- `auth/logout.ts` - Redirects away
- `auth/force-logout.ts` - Redirects away
- `auth/forgot-password.ts` - Sends email only
- `auth/reset-password.ts` - User not authenticated, then logs in
- `auth/verify-email.ts` - User not authenticated, then logs in
- `auth/send-welcome-email.ts` - Email sending only, no UI impact

### Read-Only Actions
- `admin/analytics.ts` - Read only
- `coupon/validate.ts` - Read only
- `dashboard/metrics.ts` - Read only
- `stripe/create-checkout.ts` - Creates external session
- `stripe/create-portal.ts` - Creates external session
- `billing/get-dunning-status.ts` - Read only
- `session/get-active-sessions.ts` - Read only
- `session/get-login-history.ts` - Read only
- `gdpr/export-data.ts` - Generates file, no UI state
- `gdpr/delete-account.ts` - Deletes account and redirects

### Actions Already Having Revalidation
- `admin/users.ts` - Already has revalidation
- `admin/coupon.ts` - Already has revalidation
- `admin/config.ts` - Already has revalidation
- `settings/update-profile.ts` - Already has revalidation
- `settings/update-notification-preferences.ts` - Already has revalidation
- `session/revoke-session.ts` - Already has revalidation
- `session/revoke-all-other-sessions.ts` - Already has revalidation
- `onboarding/index.ts` - Already has revalidation

## Implementation Steps

### Step 1: Update Tests (TDD Approach)
For each action that needs revalidation, update the test to verify revalidatePath is called.

### Step 2: Update Implementation
Add `revalidatePath()` call to each action after successful mutation.

### Step 3: Run Tests
Verify all tests pass with new revalidation logic.

### Step 4: Manual Verification
Test affected pages to ensure cache invalidation works.

## Summary

- **Total Actions to Update**: 6 files (7 if counting email/unsubscribe)
- **Estimated Lines Changed**: ~42 lines (7 actions × 6 lines per action)
- **Test Files to Update**: 6 test files
- **Risk Level**: Low (additive change, no breaking changes)

---
Generated: 2026-01-01
Issue: #173
