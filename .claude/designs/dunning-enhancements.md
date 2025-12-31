# Technical Design: Dunning Flow Enhancements

## Overview

**One-liner**: Add payment recovery email, automatic subscription suspension, and manual payment retry functionality to the existing dunning flow.

**Complexity**: M (Medium)

**Risk Level**: Medium (involves payment processing and subscription state changes)

## Requirements Summary

Three enhancements to the existing dunning flow:

1. **Payment Recovery Email**: Confirmation email sent when subscription transitions from PAST_DUE to ACTIVE
2. **Automatic Subscription Suspension**: Cron job that suspends subscriptions past due for 10+ days
3. **Manual Retry Payment Button**: UI button to retry failed payments immediately via Stripe API

## Architecture Decision

### Approach

**Feature 1: Payment Recovery Email**
- Leverage existing `handleInvoicePaid` webhook handler
- Add payment recovery email template following existing patterns
- Email sent when subscription transitions from PAST_DUE to ACTIVE
- Already tracked in DunningEmail table as "PAYMENT_RECOVERED"

**Feature 2: Automatic Subscription Suspension**
- Add new cron endpoint: `/api/cron/suspend-subscriptions`
- Check for subscriptions PAST_DUE for 10+ days
- **Decision: Use CANCELED status** (not adding new SUSPENDED status)
  - Rationale: Keep enum simple, CANCELED already exists
  - Differentiate via database: `cancelAtPeriodEnd = false` means suspended (immediate)
  - Stripe already handles this as "canceled" status
- Send suspension notification email
- Follow existing cron pattern from `send-dunning-emails`

**Feature 3: Manual Retry Payment Button**
- Add server action: `retryPayment` in `/src/actions/billing/`
- Call Stripe API to retry latest invoice
- Add client component button to `DunningBanner`
- Use `useTransition` for loading state
- Toast notifications for feedback (success/error)

### Alternatives Considered

| Option | Pros | Cons | Verdict |
|--------|------|------|---------|
| Add SUSPENDED status to enum | Clearer intent | Schema migration, more complex state machine | Rejected |
| Use CANCELED for suspension | Simpler, no migration needed | Less explicit, need to differentiate in queries | **Selected** |
| Retry payment via Stripe Portal | No custom code needed | Poor UX, requires navigation away | Rejected |
| Direct retry via server action | Better UX, immediate feedback | Need to handle Stripe API edge cases | **Selected** |
| Recovery email as separate webhook | Dedicated handler | Already handled in invoice.paid | Rejected |
| Recovery email in handleInvoicePaid | Leverage existing code | Need to extend existing handler | **Selected** |

## Data Model

### Schema Changes

**No schema changes required!**

The existing schema already supports all three features:
- `SubscriptionStatus.CANCELED` for suspended subscriptions
- `DunningEmailType.PAYMENT_RECOVERED` already exists
- `statusChangedAt` for tracking suspension timing

### Migration Strategy

- No migrations needed
- Backward compatible with existing data

## API Design

### Server Actions

| Action | Location | Input | Output | Auth |
|--------|----------|-------|--------|------|
| `retryPayment` | `src/actions/billing/retry-payment.ts` | `void` | `ActionResult<{ success: boolean }>` | Required (Owner) |

### Email Functions

| Function | Location | Input | Output |
|----------|----------|-------|--------|
| `sendPaymentRecoveryEmail` | `src/lib/email/index.ts` | `email, { name, planName, amount, nextBillingDate }` | `SendEmailResult` |
| `sendSubscriptionSuspendedEmail` | `src/lib/email/index.ts` | `email, { name, planName, daysSinceFailed }` | `SendEmailResult` |

### Cron Endpoints

| Endpoint | Method | Purpose | Schedule |
|----------|--------|---------|----------|
| `/api/cron/suspend-subscriptions` | GET | Suspend subscriptions past due 10+ days | Daily |

### Input Validation

```typescript
// No input validation needed for retryPayment (no user input)
// Action validates authentication and subscription ownership
```

## Component Architecture

### File Structure

```
src/
├── actions/billing/
│   ├── index.ts                    # Re-exports
│   ├── get-dunning-status.ts       # [Existing]
│   └── retry-payment.ts            # [NEW] Retry failed payment
│
├── components/billing/
│   ├── dunning-banner.tsx          # [UPDATED] Add retry button
│   └── retry-payment-button.tsx    # [NEW] Client component
│
├── lib/email/
│   ├── index.ts                    # [UPDATED] Add new email exports
│   └── templates/
│       ├── payment-recovery.tsx    # [NEW] Recovery email template
│       └── subscription-suspended.tsx  # [NEW] Suspension email template
│
├── lib/stripe/
│   └── webhooks.ts                 # [UPDATED] Add recovery email
│
└── app/api/cron/
    ├── send-dunning-emails/        # [Existing]
    └── suspend-subscriptions/      # [NEW] Suspension cron job
        └── route.ts
```

### Component Breakdown

| Component | Type | Responsibility |
|-----------|------|----------------|
| `DunningBanner` | Server | Display dunning banner with retry button |
| `RetryPaymentButton` | Client | Handle payment retry with loading state |
| `PaymentRecoveryEmail` | Template | Email template for successful recovery |
| `SubscriptionSuspendedEmail` | Template | Email template for suspension |

## Email Template Specifications

### 1. Payment Recovery Email

**File**: `/src/lib/email/templates/payment-recovery.tsx`

**Props**:
```typescript
export interface PaymentRecoveryEmailProps {
  name?: string;
  planName: string;
  amount: string;           // Formatted: "USD 29.99"
  nextBillingDate: string;  // Formatted: "January 15, 2025"
  appName?: string;
  appUrl?: string;
}
```

**Content**:
- Heading: "Payment Successful!" (green color: `#16a34a`)
- Message: Thank you for updating your payment method
- Details box (green background `#f0fdf4`):
  - Plan: {planName}
  - Amount Paid: {amount}
  - Next Billing Date: {nextBillingDate}
  - Status: Active
- CTA: "View Billing" → `/settings/billing`
- Tone: Positive, welcoming back

**Email Subject**: `Payment Successful - Your {plan} subscription is active`

### 2. Subscription Suspended Email

**File**: `/src/lib/email/templates/subscription-suspended.tsx`

**Props**:
```typescript
export interface SubscriptionSuspendedEmailProps {
  name?: string;
  planName: string;
  daysSinceFailed: number;  // Should be 10+
  reactivateUrl: string;    // Link to pricing/billing
  appName?: string;
  appUrl?: string;
}
```

**Content**:
- Heading: "Subscription Suspended" (red color: `#dc2626`)
- Message: After {daysSinceFailed} days, we've had to suspend your subscription
- Details box (red background `#fef2f2`):
  - Previous Plan: {planName}
  - Status: Suspended
  - Action Required: Update payment method to reactivate
- CTA: "Reactivate Subscription" → `/pricing`
- Additional info: Contact support if you have questions
- Tone: Professional but empathetic

**Email Subject**: `Subscription Suspended - Action Required`

## API Implementation Details

### 1. Payment Recovery Email (Webhook Enhancement)

**File**: `/src/lib/stripe/webhooks.ts` (existing)

**Changes to `handleInvoicePaid` function**:

```typescript
// After updating subscription from PAST_DUE to ACTIVE
if (pastDueSubscription) {
  await db.subscription.update({
    where: { id: pastDueSubscription.id },
    data: { status: "ACTIVE" },
  });

  // [EXISTING] Track recovery in dunning emails
  await db.dunningEmail.create({ ... });

  // [NEW] Send payment recovery email
  try {
    const user = await db.user.findUnique({
      where: { id: pastDueSubscription.userId },
      select: { email: true, name: true },
    });

    if (user?.email) {
      // Get subscription details for next billing date
      const stripeSubscription = await stripe.subscriptions.retrieve(subscriptionId);
      const nextBillingDate = unixToDate(stripeSubscription.current_period_end).toLocaleDateString(...);
      const amount = `${currency} ${(amountPaid / 100).toFixed(2)}`;

      await sendPaymentRecoveryEmail(user.email, {
        name: user.name ?? undefined,
        planName: pastDueSubscription.plan,
        amount,
        nextBillingDate,
      });

      console.log(`Payment recovery email sent: ${pastDueSubscription.id}`);
    }
  } catch (emailError) {
    console.error("Failed to send payment recovery email:", emailError);
    // Don't throw - payment was successful
  }
}
```

### 2. Automatic Subscription Suspension (Cron Job)

**File**: `/src/app/api/cron/suspend-subscriptions/route.ts` (new)

**Logic**:

```typescript
export async function GET() {
  // 1. Verify cron secret (same as send-dunning-emails)
  // 2. Find all PAST_DUE subscriptions where statusChangedAt >= 10 days ago
  const suspensionThreshold = 10; // days

  const pastDueSubscriptions = await db.subscription.findMany({
    where: {
      status: "PAST_DUE",
      statusChangedAt: {
        not: null,
        lte: new Date(Date.now() - suspensionThreshold * 24 * 60 * 60 * 1000),
      },
    },
    include: {
      user: { select: { email: true, name: true } },
    },
  });

  // 3. For each subscription:
  for (const subscription of pastDueSubscriptions) {
    try {
      // 3a. Cancel Stripe subscription (immediate, no grace period)
      if (subscription.stripeSubscriptionId) {
        await stripe.subscriptions.cancel(subscription.stripeSubscriptionId);
      }

      // 3b. Update database
      await db.subscription.update({
        where: { id: subscription.id },
        data: {
          status: "CANCELED",
          plan: "FREE",
          cancelAtPeriodEnd: false, // Immediate suspension
          stripeSubscriptionId: null,
        },
      });

      // 3c. Send suspension email
      const daysSinceFailed = Math.floor(
        (Date.now() - subscription.statusChangedAt!.getTime()) / (1000 * 60 * 60 * 24)
      );

      await sendSubscriptionSuspendedEmail(subscription.user.email, {
        name: subscription.user.name ?? undefined,
        planName: subscription.plan,
        daysSinceFailed,
      });

      // 3d. Track suspension email
      await db.dunningEmail.create({
        data: {
          subscriptionId: subscription.id,
          emailType: "DAY_10_SUSPENDED", // NEW enum value needed!
          recipientEmail: subscription.user.email,
          emailStatus: "SENT",
        },
      });

      suspended++;
    } catch (error) {
      errors.push({ subscriptionId: subscription.id, error });
    }
  }

  // 4. Return summary
  return NextResponse.json({
    success: true,
    message: `Processed ${pastDueSubscriptions.length} subscriptions`,
    suspended,
    errors: errors.length > 0 ? errors : undefined,
  });
}
```

**CORRECTION**: Need to add `DAY_10_SUSPENDED` to `DunningEmailType` enum!

### 3. Manual Retry Payment (Server Action)

**File**: `/src/actions/billing/retry-payment.ts` (new)

```typescript
"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { stripe } from "@/lib/stripe";

export type RetryPaymentResult =
  | { success: true; data: { message: string } }
  | { success: false; error: string };

/**
 * Retry the latest failed invoice for the current user's subscription
 * Calls Stripe API to immediately attempt payment with the default payment method
 */
export async function retryPayment(): Promise<RetryPaymentResult> {
  try {
    // 1. Authentication
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    // 2. Get user's subscription
    const subscription = await db.subscription.findUnique({
      where: { userId: session.user.id },
      select: {
        id: true,
        status: true,
        stripeSubscriptionId: true,
        stripeCustomerId: true,
      },
    });

    // 3. Validate subscription state
    if (!subscription) {
      return { success: false, error: "No subscription found" };
    }

    if (subscription.status !== "PAST_DUE") {
      return { success: false, error: "No failed payment to retry" };
    }

    if (!subscription.stripeSubscriptionId) {
      return { success: false, error: "Invalid subscription" };
    }

    // 4. Get the latest invoice from Stripe
    const stripeSubscription = await stripe.subscriptions.retrieve(
      subscription.stripeSubscriptionId,
      { expand: ["latest_invoice"] }
    );

    const latestInvoice = stripeSubscription.latest_invoice;
    if (!latestInvoice || typeof latestInvoice === "string") {
      return { success: false, error: "No invoice found" };
    }

    // 5. Check if invoice is already paid
    if (latestInvoice.status === "paid") {
      return { success: false, error: "Invoice is already paid" };
    }

    // 6. Retry the invoice payment
    // This will attempt to charge the default payment method
    const retriedInvoice = await stripe.invoices.pay(latestInvoice.id, {
      paid_out_of_band: false, // Actually charge the payment method
    });

    // 7. Revalidate billing page
    revalidatePath("/settings/billing");

    // 8. Return result based on invoice status
    if (retriedInvoice.status === "paid") {
      return {
        success: true,
        data: { message: "Payment successful!" },
      };
    } else {
      return {
        success: false,
        error: "Payment failed. Please update your payment method.",
      };
    }
  } catch (error) {
    console.error("[retryPayment]", error);

    // Parse Stripe errors for user-friendly messages
    if (error && typeof error === "object" && "type" in error) {
      const stripeError = error as { type: string; message?: string };
      if (stripeError.type === "StripeCardError") {
        return {
          success: false,
          error: stripeError.message ?? "Card declined. Please update your payment method.",
        };
      }
    }

    return { success: false, error: "Failed to retry payment" };
  }
}
```

### 4. Retry Payment Button (Client Component)

**File**: `/src/components/billing/retry-payment-button.tsx` (new)

```typescript
"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { RefreshCw } from "lucide-react";

import { retryPayment } from "@/actions/billing/retry-payment";
import { Button } from "@/components/ui/button";

export function RetryPaymentButton() {
  const [isPending, startTransition] = useTransition();

  function handleRetry() {
    startTransition(async () => {
      const result = await retryPayment();

      if (result.success) {
        toast.success(result.data.message);
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <Button
      onClick={handleRetry}
      disabled={isPending}
      variant="outline"
      size="sm"
      className="whitespace-nowrap"
    >
      <RefreshCw className={isPending ? "mr-2 h-4 w-4 animate-spin" : "mr-2 h-4 w-4"} />
      {isPending ? "Retrying..." : "Retry Payment"}
    </Button>
  );
}
```

### 5. Updated Dunning Banner

**File**: `/src/components/billing/dunning-banner.tsx` (update)

```typescript
import { AlertCircle } from "lucide-react";

import { getDunningStatus } from "@/actions/billing/get-dunning-status";
import { redirectToPortal } from "@/actions/stripe/create-portal";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { RetryPaymentButton } from "./retry-payment-button"; // NEW IMPORT

export async function DunningBanner() {
  const result = await getDunningStatus();

  if (!result.success || !result.data.showBanner) {
    return null;
  }

  const { daysSinceFailed } = result.data;

  return (
    <Alert variant="destructive" className="mb-4">
      <AlertCircle className="h-4 w-4" aria-hidden="true" />
      <AlertTitle>Payment Failed</AlertTitle>
      <AlertDescription className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <span>
          Your payment failed {daysSinceFailed}{" "}
          {daysSinceFailed === 1 ? "day" : "days"} ago. Update your payment
          method to avoid service interruption.
        </span>
        <div className="flex gap-2">
          {/* NEW: Retry payment button */}
          <RetryPaymentButton />

          {/* EXISTING: Update payment method via portal */}
          <form
            action={async () => {
              "use server";
              await redirectToPortal();
            }}
          >
            <Button
              type="submit"
              variant="outline"
              size="sm"
              className="whitespace-nowrap"
            >
              Update Payment Method
            </Button>
          </form>
        </div>
      </AlertDescription>
    </Alert>
  );
}
```

## State Management

### Server State
- Prisma queries with `revalidatePath('/settings/billing')` after payment retry
- No client-side caching needed
- Webhook updates handled by Stripe → database → revalidation

### Client State
- `useTransition` for retry button loading state
- Toast notifications for immediate feedback
- No form state needed (button-only interaction)

## Security Considerations

### Authentication
- [x] `retryPayment` action checks `auth()` session
- [x] Returns early with "Unauthorized" if not authenticated

### Authorization
- [x] Resource ownership verified: subscription must belong to authenticated user
- [x] Cron endpoint protected by `CRON_SECRET` header
- [x] Cannot retry payment for other users' subscriptions

### Input Validation
- [x] No user input to validate (retry payment has no parameters)
- [x] Server-side checks for subscription state (must be PAST_DUE)
- [x] Stripe API validates invoice state

### Data Protection
- [x] No sensitive data logged
- [x] Error messages sanitized for users
- [x] Stripe errors parsed to user-friendly messages

### Rate Limiting
- [ ] Consider: Add rate limiting to retry payment action (max 5 retries per hour)
- [ ] Stripe has built-in rate limiting on invoice.pay API

## Performance Considerations

### Database
- [x] Existing indexes support queries:
  - `@@index([status])` on Subscription
  - `@@index([userId, status])` on Subscription
  - Query for PAST_DUE + statusChangedAt uses existing indexes

### Stripe API
- [ ] Retry payment is synchronous (waits for Stripe response)
- [ ] Typical response time: 2-5 seconds
- [ ] Stripe handles payment processing asynchronously
- [ ] Webhook updates will follow if payment succeeds

### Caching
- [x] `revalidatePath('/settings/billing')` after retry
- [x] Webhook handlers already revalidate billing page

### Cron Job Performance
- Expected volume: <100 subscriptions per day needing suspension
- Sequential processing acceptable at this scale
- Consider parallelization if volume exceeds 1000/day

## Testing Strategy

### Unit Tests (Vitest)

| Test File | Coverage Target |
|-----------|-----------------|
| `actions/billing/retry-payment.test.ts` | All retry payment logic |
| `lib/email/templates/payment-recovery.test.tsx` | Email template rendering |
| `lib/email/templates/subscription-suspended.test.tsx` | Email template rendering |

### Integration Tests

| Test | Scope |
|------|-------|
| Retry payment flow | Auth → Get subscription → Call Stripe → Update DB |
| Payment recovery webhook | PAST_DUE → invoice.paid → ACTIVE + email |
| Suspension cron | Find subscriptions → Cancel → Send email |

### E2E Tests (Playwright)

| Flow | Priority |
|------|----------|
| Click retry payment button | P0 |
| Successful payment retry | P1 |
| Failed payment retry | P1 |
| Suspension email sent | P2 |

## Implementation Plan

### Phase 1: Schema Updates
- [ ] Add `DAY_10_SUSPENDED` to `DunningEmailType` enum
- [ ] Create Prisma migration
- [ ] Apply to database

### Phase 2: Email Templates
- [ ] Create `payment-recovery.tsx` template
- [ ] Create `subscription-suspended.tsx` template
- [ ] Add render functions to `templates/index.ts`
- [ ] Add send functions to `lib/email/index.ts`
- [ ] Write template tests

### Phase 3: Payment Recovery Email (Webhook)
- [ ] Update `handleInvoicePaid` in webhooks.ts
- [ ] Add payment recovery email logic
- [ ] Write unit tests for webhook handler
- [ ] Test with Stripe webhook locally

### Phase 4: Retry Payment Action
- [ ] Create `retry-payment.ts` server action
- [ ] Write unit tests (TDD)
- [ ] Test Stripe API integration
- [ ] Handle error cases

### Phase 5: Retry Payment UI
- [ ] Create `retry-payment-button.tsx` client component
- [ ] Update `dunning-banner.tsx` to include button
- [ ] Write component tests
- [ ] Test loading states and toast notifications

### Phase 6: Suspension Cron Job
- [ ] Create `/api/cron/suspend-subscriptions/route.ts`
- [ ] Write unit tests for cron logic
- [ ] Test locally with past_due subscriptions
- [ ] Configure cron schedule

### Phase 7: Integration Testing
- [ ] Test full retry payment flow
- [ ] Test payment recovery webhook flow
- [ ] Test suspension cron flow
- [ ] Verify all emails sent correctly

### Phase 8: E2E Testing
- [ ] Playwright test for retry payment
- [ ] Playwright test for dunning banner
- [ ] Manual QA with Stripe test mode

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Stripe API timeout on retry | Medium | Medium | Handle timeout gracefully, show "Processing..." message |
| Double-charging customer | Low | High | Stripe invoice.pay is idempotent, safe to retry |
| Suspension during active retry | Low | Medium | Check invoice status before suspending |
| Email sending failures | Low | Low | Log errors, don't block main flow (graceful degradation) |
| Cron job misses subscriptions | Low | Medium | Run daily, suspension threshold is 10 days (buffer) |
| User clicks retry multiple times | Medium | Low | Disable button during pending state |

## Schema Migration Required

```prisma
// Add to DunningEmailType enum in schema.prisma
enum DunningEmailType {
  DAY_0_PAYMENT_FAILED
  DAY_3_REMINDER
  DAY_7_FINAL_WARNING
  DAY_10_SUSPENDED      // NEW
  PAYMENT_RECOVERED
}
```

**Migration Command**:
```bash
pnpm db:push  # or npx prisma migrate dev --name add-suspended-email-type
```

## Environment Variables

No new environment variables needed. Uses existing:
- `STRIPE_SECRET_KEY` - Stripe API access
- `CRON_SECRET` - Cron endpoint protection
- `NEXT_PUBLIC_APP_URL` - Email links

## Deployment Considerations

### Cron Schedule Setup

Add to your cron service (Vercel Cron, external cron, etc.):

```yaml
# Every day at 2 AM UTC
0 2 * * * curl -H "x-cron-secret: $CRON_SECRET" https://your-app.com/api/cron/suspend-subscriptions
```

### Rollout Plan

1. Deploy code with feature flags disabled
2. Test manually with test Stripe accounts
3. Enable payment recovery email (webhook)
4. Enable retry payment button
5. Enable suspension cron (start with dry-run mode)
6. Monitor for 1 week
7. Announce features to users

## Open Questions

1. **Rate limiting on retry payment**: Should we limit retries per user per hour?
   - Recommendation: Yes, max 5 retries per hour per user
   - Implementation: Add Redis-based rate limiting

2. **Suspension grace period**: Should we add a buffer between Day 7 warning and Day 10 suspension?
   - Current: 3 days between final warning and suspension
   - Recommendation: Keep as-is (industry standard)

3. **Reactivation flow**: Should suspended users get a discount to reactivate?
   - Current: No special handling
   - Recommendation: Product decision, not technical

4. **Analytics tracking**: Should we track retry payment attempts?
   - Recommendation: Yes, add PostHog events
   - Events: `payment_retry_attempted`, `payment_retry_succeeded`, `payment_retry_failed`

## References

- Existing webhook pattern: `/src/lib/stripe/webhooks.ts`
- Existing email pattern: `/src/lib/email/templates/invoice-receipt.tsx`
- Existing cron pattern: `/src/app/api/cron/send-dunning-emails/route.ts`
- Existing server action pattern: `/src/actions/stripe/create-portal.ts`
- Stripe Invoice API: https://stripe.com/docs/api/invoices/pay
- Stripe Subscription Cancellation: https://stripe.com/docs/api/subscriptions/cancel

## Success Metrics

1. **Payment Recovery Rate**: % of PAST_DUE subscriptions that recover within 10 days
   - Target: >50% recovery rate
2. **Retry Button Usage**: % of users who click retry vs. going to portal
   - Target: >30% use retry button
3. **Email Open Rates**: Track recovery and suspension email engagement
   - Target: >40% open rate
4. **False Suspensions**: Subscriptions suspended then immediately reactivated
   - Target: <5% of suspensions

## Acceptance Criteria

- [ ] Payment recovery email sent when subscription transitions from PAST_DUE to ACTIVE
- [ ] Recovery email includes plan name, amount paid, and next billing date
- [ ] Suspension cron runs daily and cancels subscriptions 10+ days past due
- [ ] Suspension email sent to affected users
- [ ] Retry payment button appears in dunning banner
- [ ] Retry payment button shows loading state during processing
- [ ] Success/error feedback via toast notifications
- [ ] All unit tests pass with 80%+ coverage
- [ ] E2E tests verify retry payment flow
- [ ] No security vulnerabilities introduced
- [ ] Documentation updated
