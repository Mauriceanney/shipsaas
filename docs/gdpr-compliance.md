# GDPR Compliance Guide

Implementation guide for GDPR compliance features in the application.

## Overview

This application includes GDPR compliance features:
- **Data Export** - Users can download all their personal data
- **Account Deletion** - Users can request account deletion with 30-day grace period
- **Email Preferences** - Granular control over email communications
- **Unsubscribe** - One-click email unsubscribe

## Features

### 1. Data Export

Users can export all their personal data in JSON format.

**Location:** `/settings/privacy`

**What's Included:**
- Profile information (name, email, created date)
- Session history
- Subscription details
- Login history
- Email preferences

**Implementation:**
```typescript
import { requestDataExport, generateDataExport } from "@/actions/gdpr";

// Request export (creates pending request)
const result = await requestDataExport();

// Generate export (creates downloadable JSON)
const exportResult = await generateDataExport(requestId);
```

**Export expires** after 48 hours for security.

### 2. Account Deletion

Users can request account deletion with a 30-day grace period.

**Process:**
1. User requests deletion from `/settings/privacy`
2. Account is immediately disabled
3. Active Stripe subscriptions are canceled
4. User receives confirmation email
5. After 30 days, account is permanently deleted

**Cancel Deletion:**
Users can cancel the deletion request within the grace period by contacting support or using the cancellation link in their email.

**Implementation:**
```typescript
import { requestAccountDeletion, cancelAccountDeletion } from "@/actions/gdpr";

// Request deletion
const result = await requestAccountDeletion("I no longer need the service");

// Cancel deletion (within grace period)
const cancelResult = await cancelAccountDeletion();
```

### 3. Email Preferences

Users control what emails they receive:

| Preference | Description | Default |
|------------|-------------|---------|
| Marketing | Promotional emails, newsletters | Off |
| Product Updates | New features, updates | On |
| Security Alerts | Login alerts, security notices | On |

**Location:** `/settings/privacy`

**Implementation:**
```typescript
import { updateEmailPreferences } from "@/actions/gdpr";

await updateEmailPreferences({
  emailMarketingOptIn: false,
  emailProductUpdates: true,
  emailSecurityAlerts: true,
});
```

### 4. One-Click Unsubscribe

All marketing emails include an unsubscribe link.

**URL Format:** `/unsubscribe/[token]`

**Implementation:**
Each user has a unique unsubscribe token stored in the database. When clicked:
1. Token is verified
2. Marketing emails are disabled
3. Confirmation page is shown

## Setup

### 1. Configure Cron Jobs

Set up a cron job to permanently delete accounts after the grace period:

```bash
# Run daily
POST /api/cron/cleanup-deleted-accounts
```

Add the CRON_SECRET to your environment:
```env
CRON_SECRET=your-secure-cron-secret
```

### 2. Email Templates

The following email templates are included:

| Template | Trigger |
|----------|---------|
| `data-export-ready` | Export is ready for download |
| `account-deletion-scheduled` | Deletion request confirmed |
| `account-deletion-canceled` | Deletion canceled |

### 3. Database Schema

Required tables (already included in schema):
- `dataExportRequest` - Tracks export requests
- `accountDeletionRequest` - Tracks deletion requests
- User fields: `emailMarketingOptIn`, `emailProductUpdates`, `emailSecurityAlerts`, `unsubscribeToken`

## User Interface

### Privacy Settings Page

The privacy settings page (`/settings/privacy`) includes:

1. **Email Preferences** - Toggles for each email type
2. **Export Data** - Button to request data export
3. **Delete Account** - Danger zone for account deletion

### Components

- `EmailPreferences` - Email preference toggles
- `DataExport` - Data export request UI
- `DeleteAccount` - Account deletion with confirmation dialog

## API Reference

### Request Data Export

```typescript
POST /actions/gdpr/request-data-export
Response: { success: true, data: { requestId: string } }
```

### Generate Data Export

```typescript
POST /actions/gdpr/generate-export
Body: { requestId: string }
Response: { success: true, data: { downloadUrl: string } }
```

### Request Account Deletion

```typescript
POST /actions/gdpr/request-account-deletion
Body: { reason?: string }
Response: { success: true, data: { scheduledFor: Date } }
```

### Cancel Account Deletion

```typescript
POST /actions/gdpr/cancel-deletion
Response: { success: true }
```

### Update Email Preferences

```typescript
POST /actions/gdpr/update-email-preferences
Body: { emailMarketingOptIn?: boolean, emailProductUpdates?: boolean, emailSecurityAlerts?: boolean }
Response: { success: true }
```

## Best Practices

### Data Minimization
- Only collect data you need
- Delete data when no longer needed
- Don't retain data beyond legal requirements

### Transparency
- Clear privacy policy
- Explain what data you collect
- Show users their data in settings

### Security
- Encrypt sensitive data
- Use secure tokens for unsubscribe links
- Rate limit export requests

### Audit Trail
- Log GDPR-related actions
- Record consent timestamps
- Maintain deletion request history

## Legal Considerations

This implementation provides technical compliance features. You should also:

1. **Privacy Policy** - Create a comprehensive privacy policy
2. **Cookie Consent** - Implement cookie consent banner
3. **DPO** - Consider appointing a Data Protection Officer
4. **Legal Review** - Have a lawyer review your compliance

## Testing

### Test Data Export

1. Go to `/settings/privacy`
2. Click "Export My Data"
3. Verify email is sent
4. Download and verify JSON contains user data

### Test Account Deletion

1. Go to `/settings/privacy`
2. Click "Delete Account"
3. Confirm deletion
4. Verify account is disabled
5. Verify cancellation works within grace period

### Test Email Preferences

1. Update preferences in settings
2. Verify changes are saved
3. Test unsubscribe link in email
4. Verify marketing emails are blocked
