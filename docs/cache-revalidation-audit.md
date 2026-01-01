# Cache Revalidation Audit Report

## Executive Summary

**Status**: 8 out of 35 server actions (23%) have proper cache revalidation
**Gap**: 27 actions need cache revalidation added
**Impact**: Stale data in UI after mutations

## Methodology

1. Categorize actions as READ (query) vs WRITE (mutation)
2. WRITE actions require revalidation
3. READ actions do not require revalidation
4. Identify affected paths for each mutation

## Current State - Actions WITH Revalidation

| Action File | Revalidation | Paths |
|-------------|--------------|-------|
| `/src/actions/admin/users.ts` | YES | `/admin/users` |
| `/src/actions/admin/coupon.ts` | YES | `/admin/coupons` |
| `/src/actions/admin/config.ts` | YES | `/admin/plans`, `/admin/settings` |
| `/src/actions/settings/update-profile.ts` | YES | `/dashboard` |
| `/src/actions/settings/update-notification-preferences.ts` | YES | `/dashboard/settings` |
| `/src/actions/session/revoke-session.ts` | YES | `/dashboard/security` |
| `/src/actions/session/revoke-all-other-sessions.ts` | YES | `/dashboard/security` |
| `/src/actions/onboarding/index.ts` | YES | `/dashboard` |

## Actions Requiring Audit

### Authentication Actions (7 files)

| File | Type | Needs Revalidation? | Affected Paths |
|------|------|---------------------|----------------|
| `auth/login.ts` | WRITE | TBD | TBD |
| `auth/register.ts` | WRITE | TBD | TBD |
| `auth/logout.ts` | WRITE | NO (redirects) | N/A |
| `auth/force-logout.ts` | WRITE | NO (redirects) | N/A |
| `auth/forgot-password.ts` | WRITE | TBD | TBD |
| `auth/reset-password.ts` | WRITE | TBD | TBD |
| `auth/verify-email.ts` | WRITE | TBD | TBD |
| `auth/send-welcome-email.ts` | WRITE | TBD | TBD |

### Two-Factor Actions (5 files)

| File | Type | Needs Revalidation? | Affected Paths |
|------|------|---------------------|----------------|
| `auth/two-factor/setup.ts` | WRITE | TBD | TBD |
| `auth/two-factor/enable.ts` | WRITE | TBD | TBD |
| `auth/two-factor/disable.ts` | WRITE | TBD | TBD |
| `auth/two-factor/verify.ts` | READ | NO | N/A |
| `auth/two-factor/regenerate-backup-codes.ts` | WRITE | TBD | TBD |

### Admin Actions (7 files)

| File | Type | Needs Revalidation? | Affected Paths |
|------|------|---------------------|----------------|
| `admin/users.ts` | WRITE | YES (has it) | `/admin/users` |
| `admin/coupon.ts` | WRITE | YES (has it) | `/admin/coupons` |
| `admin/config.ts` | WRITE | YES (has it) | `/admin/plans`, `/admin/settings` |
| `admin/analytics.ts` | READ | NO | N/A |
| `admin/impersonation.ts` | WRITE | TBD | TBD |
| `admin/send-email.ts` | WRITE | NO (external op) | N/A |
| `admin/bulk-actions.ts` | WRITE | TBD | TBD |

### Billing/Stripe Actions (5 files)

| File | Type | Needs Revalidation? | Affected Paths |
|------|------|---------------------|----------------|
| `stripe/create-checkout.ts` | READ | NO (creates session) | N/A |
| `stripe/create-portal.ts` | READ | NO (creates session) | N/A |
| `billing/get-dunning-status.ts` | READ | NO | N/A |
| `billing/retry-payment.ts` | WRITE | TBD | TBD |

### Session Actions (4 files)

| File | Type | Needs Revalidation? | Affected Paths |
|------|------|---------------------|----------------|
| `session/get-active-sessions.ts` | READ | NO | N/A |
| `session/get-login-history.ts` | READ | NO | N/A |
| `session/revoke-session.ts` | WRITE | YES (has it) | `/dashboard/security` |
| `session/revoke-all-other-sessions.ts` | WRITE | YES (has it) | `/dashboard/security` |

### Settings Actions (2 files)

| File | Type | Needs Revalidation? | Affected Paths |
|------|------|---------------------|----------------|
| `settings/update-profile.ts` | WRITE | YES (has it) | `/dashboard` |
| `settings/update-notification-preferences.ts` | WRITE | YES (has it) | `/dashboard/settings` |

### GDPR Actions (2 files)

| File | Type | Needs Revalidation? | Affected Paths |
|------|------|---------------------|----------------|
| `gdpr/export-data.ts` | READ | NO (generates file) | N/A |
| `gdpr/delete-account.ts` | WRITE | NO (redirects) | N/A |

### Other Actions (3 files)

| File | Type | Needs Revalidation? | Affected Paths |
|------|------|---------------------|----------------|
| `coupon/validate.ts` | READ | NO | N/A |
| `dashboard/metrics.ts` | READ | NO | N/A |
| `email/unsubscribe.ts` | WRITE | TBD | TBD |
| `onboarding/index.ts` | WRITE | YES (has it) | `/dashboard` |

## Summary Statistics

- Total Actions: 35
- READ Operations: ~15
- WRITE Operations: ~20
- Has Revalidation: 8
- Missing Revalidation: ~12 (estimated)

## Next Steps

1. Review each WRITE action to determine exact revalidation needs
2. Add revalidation to identified actions
3. Update tests to verify revalidation calls
4. Document revalidation strategy

---
Generated: 2026-01-01
Issue: #173
