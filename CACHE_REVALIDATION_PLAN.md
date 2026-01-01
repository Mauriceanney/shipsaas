# Cache Revalidation Implementation Plan

## Issue #173: Add cache revalidation to mutation server actions

### Current State
- **14/43 files** already have `revalidatePath()` (33% complete)
- **29 files** need revalidation added

### Files Already Complete ✓
1. src/actions/admin/bulk-actions.ts
2. src/actions/admin/config.ts
3. src/actions/admin/coupon.ts
4. src/actions/admin/users.ts
5. src/actions/auth/two-factor/disable.ts
6. src/actions/auth/two-factor/enable.ts
7. src/actions/auth/two-factor/regenerate-backup-codes.ts
8. src/actions/auth/two-factor/setup.ts
9. src/actions/billing/retry-payment.ts
10. src/actions/onboarding/index.ts
11. src/actions/session/revoke-all-other-sessions.ts
12. src/actions/session/revoke-session.ts
13. src/actions/settings/update-notification-preferences.ts
14. src/actions/settings/update-profile.ts

### Files Requiring Updates

#### HIGH Priority (User-facing mutations)
1. **src/actions/admin/impersonation.ts**
   - `startImpersonation()` → revalidate `/admin/users`, `/dashboard`
   - `endImpersonation()` → revalidate `/admin/users`, `/dashboard`

2. **src/actions/auth/register.ts**
   - `registerAction()` → revalidate `/login`

3. **src/actions/auth/reset-password.ts**
   - `resetPasswordAction()` → revalidate `/login`

4. **src/actions/auth/verify-email.ts**
   - `verifyEmailAction()` → revalidate `/dashboard`

5. **src/actions/gdpr/delete-account.ts**
   - `requestAccountDeletion()` → revalidate `/settings/account`
   - `cancelAccountDeletion()` → revalidate `/settings/account`

6. **src/actions/email/unsubscribe.ts**
   - `updateEmailPreferences()` → revalidate `/settings/notifications`
   - `unsubscribeFromAll()` → revalidate `/settings/notifications`

7. **src/actions/admin/send-email.ts**
   - `sendEmailToUser()` → revalidate `/admin/users/[id]`

#### MEDIUM Priority (Secondary mutations)
8. **src/actions/auth/force-logout.ts**
   - `forceLogoutUser()` → revalidate `/admin/users/[id]`

9. **src/actions/auth/logout.ts**
   - `logoutAction()` → revalidate `/login`

10. **src/actions/auth/two-factor/verify.ts**
    - `verifyTwoFactor()` → revalidate `/dashboard`

#### LOW Priority (Read-only or no cache impact)
- src/actions/admin/analytics.ts (read-only)
- src/actions/auth/forgot-password.ts (sends email, no DB mutation visible to user)
- src/actions/auth/login.ts (Auth.js handles session)
- src/actions/billing/get-dunning-status.ts (read-only)
- src/actions/coupon/validate.ts (read-only)
- src/actions/dashboard/metrics.ts (read-only)
- src/actions/gdpr/export-data.ts (async job, no immediate cache)
- src/actions/session/get-active-sessions.ts (read-only)
- src/actions/session/get-login-history.ts (read-only)
- src/actions/stripe/create-checkout.ts (redirects to Stripe)
- src/actions/stripe/create-portal.ts (redirects to Stripe)
- src/actions/usage/index.ts (read-only)

### Implementation Pattern

```typescript
import { revalidatePath } from "next/cache";

export async function mutationAction(input: unknown) {
  // ... existing logic
  
  // Add before return statement (success case only)
  revalidatePath("/affected/path");
  revalidatePath(`/dynamic/[id]`);
  
  return { success: true, data };
}
```

### Total Work
- **10 files** need updates (HIGH + MEDIUM priority)
- Estimated time: 30-45 minutes
