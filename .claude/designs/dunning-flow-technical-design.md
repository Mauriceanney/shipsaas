# Technical Design: Dunning Flow (#57)

## Overview

**One-liner**: Automated payment failure recovery system with email reminders and in-app notifications to reduce involuntary churn.

**Complexity**: M

**Risk Level**: Medium (email timing must be precise, banner must not annoy active users)

## Requirements Summary

From Issue #57:
- Send "Payment Failed" email immediately on failure (DONE via existing webhook)
- Show in-app banner when subscription status is PAST_DUE
- Day 3: Send reminder email with update payment CTA
- Day 7: Send final warning email about service suspension
- Link to Stripe Customer Portal for payment method update
- Send "Payment successful" email on recovery (DONE via invoice.paid webhook)

## Architecture Decision

### Approach

**Hybrid Cron + Webhook Architecture**:
1. **Webhooks handle immediate actions**: Day 0 payment failed email (DONE), payment recovery email (DONE)
2. **Cron job handles scheduled reminders**: Day 3 and Day 7 dunning emails
3. **Server Component handles in-app banner**: Check subscription status on page load

This approach follows the existing pattern used for account deletion cleanup (`src/app/api/cron/cleanup-deleted-accounts/route.ts`).

## Data Model

### Schema Changes

```prisma
model DunningEmail {
  id             String   @id @default(cuid())

  subscriptionId String
  subscription   Subscription @relation(fields: [subscriptionId], references: [id], onDelete: Cascade)

  emailType      DunningEmailType
  sentAt         DateTime         @default(now())

  recipientEmail String
  emailStatus    EmailSendStatus  @default(PENDING)
  errorMessage   String?

  createdAt      DateTime         @default(now())

  @@index([subscriptionId])
  @@index([subscriptionId, emailType])
  @@index([sentAt])
  @@unique([subscriptionId, emailType])
}

enum DunningEmailType {
  DAY_0_PAYMENT_FAILED
  DAY_3_REMINDER
  DAY_7_FINAL_WARNING
  PAYMENT_RECOVERED
}

enum EmailSendStatus {
  PENDING
  SENT
  FAILED
}
```

## Component Architecture

```
src/
├── actions/billing/
│   └── get-dunning-status.ts       # Get banner status
│
├── components/billing/
│   └── dunning-banner.tsx          # In-app warning banner
│
├── app/api/cron/
│   └── send-dunning-emails/
│       └── route.ts                # Cron job for Day 3/7 emails
│
├── lib/email/
│   └── templates/
│       ├── dunning-reminder.tsx    # Day 3 email template
│       └── dunning-final-warning.tsx # Day 7 email template
```

## Implementation Plan

### Phase 1: Foundation (Database)
- [ ] Create Prisma migration for DunningEmail model
- [ ] Run migration

### Phase 2: Email Templates
- [ ] Create `dunning-reminder.tsx` template
- [ ] Create `dunning-final-warning.tsx` template
- [ ] Add send functions to `lib/email/index.ts`

### Phase 3: Cron Job (TDD)
- [ ] Implement `src/app/api/cron/send-dunning-emails/route.ts`
- [ ] Add CRON_SECRET verification
- [ ] Implement Day 3/7 logic with duplicate prevention

### Phase 4: Webhook Updates
- [ ] Update `handleInvoicePaymentFailed` to track Day 0 email
- [ ] Update `handleInvoicePaid` to track recovery email

### Phase 5: In-App Banner
- [ ] Create `DunningBanner` Server Component
- [ ] Add to dashboard layout

## Email Templates

### Day 3 Reminder
- Subject: "Reminder: Update Your Payment Method - [App Name]"
- Friendly tone, emphasize service continues temporarily
- Prominent CTA to Stripe portal

### Day 7 Final Warning
- Subject: "URGENT: Update Payment to Avoid Service Suspension - [App Name]"
- Urgent tone, mention suspension risk
- Prominent CTA to Stripe portal

## Security Considerations

- Cron endpoint protected by CRON_SECRET header
- Banner checks auth() session
- Dunning emails are transactional (always sent, ignore marketing prefs)
