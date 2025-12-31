# Dunning Flow Enhancements - Implementation Summary

## Quick Reference

**Design Document**: `/Users/maney/Projects/Codes/shipsaas/.claude/designs/dunning-enhancements.md`

**Complexity**: Medium | **Risk**: Medium | **Estimated Effort**: 3-5 days

## Three Features

### 1. Payment Recovery Email ✉️
**What**: Confirmation email when payment recovers (PAST_DUE → ACTIVE)
**Where**: Existing `handleInvoicePaid` webhook handler
**Effort**: 4 hours (template + webhook update + tests)

### 2. Automatic Suspension 🚫
**What**: Cron job suspends subscriptions 10+ days past due
**Where**: New `/api/cron/suspend-subscriptions` endpoint
**Effort**: 8 hours (cron + email template + tests)

### 3. Manual Retry Button 🔄
**What**: Button to retry failed payment immediately
**Where**: DunningBanner component + new server action
**Effort**: 6 hours (action + UI + tests)

## Files to Create (9 new files)

```
src/actions/billing/retry-payment.ts                    # Server action
src/components/billing/retry-payment-button.tsx         # Client component
src/lib/email/templates/payment-recovery.tsx            # Email template
src/lib/email/templates/subscription-suspended.tsx      # Email template
src/app/api/cron/suspend-subscriptions/route.ts         # Cron endpoint
tests/unit/actions/billing/retry-payment.test.ts        # Unit tests
tests/unit/lib/email/templates/payment-recovery.test.tsx    # Template tests
tests/unit/lib/email/templates/subscription-suspended.test.tsx  # Template tests
tests/e2e/flows/retry-payment.spec.ts                   # E2E tests
```

## Files to Update (4 existing files)

```
src/components/billing/dunning-banner.tsx              # Add retry button
src/lib/email/index.ts                                 # Export new functions
src/lib/email/templates/index.ts                       # Export new templates
src/lib/stripe/webhooks.ts                             # Add recovery email
prisma/schema.prisma                                   # Add DAY_10_SUSPENDED enum
```

## Schema Changes (1 migration)

```prisma
enum DunningEmailType {
  DAY_0_PAYMENT_FAILED
  DAY_3_REMINDER
  DAY_7_FINAL_WARNING
  DAY_10_SUSPENDED      // ← NEW
  PAYMENT_RECOVERED     // Already exists
}
```

**Migration**: `pnpm db:push` or `npx prisma migrate dev --name add-suspended-email-type`

## Implementation Order

### Day 1: Foundation
1. Schema migration (DAY_10_SUSPENDED enum)
2. Payment recovery email template + tests
3. Subscription suspended email template + tests
4. Update email exports

### Day 2: Backend
5. Retry payment server action + tests (TDD)
6. Update webhook handler for recovery email + tests
7. Suspension cron endpoint + tests (TDD)

### Day 3: Frontend & Integration
8. Retry payment button component + tests
9. Update dunning banner to include button
10. Integration testing (all flows)

### Day 4-5: QA & Polish
11. E2E tests (Playwright)
12. Manual QA with Stripe test mode
13. Error handling polish
14. Documentation updates

## Key Technical Decisions

### ✅ Use CANCELED status for suspension (not new SUSPENDED status)
- **Why**: Simpler, no complex state machine, matches Stripe behavior
- **How**: Differentiate via `cancelAtPeriodEnd = false` (immediate cancellation)

### ✅ Retry payment via Stripe Invoice API (not portal)
- **Why**: Better UX, immediate feedback, no navigation away
- **How**: `stripe.invoices.pay()` on latest invoice

### ✅ Recovery email in existing webhook handler (not new webhook)
- **Why**: Already tracking PAST_DUE → ACTIVE transition
- **How**: Extend `handleInvoicePaid` with email logic

## Security Checklist

- [x] Authentication required for retry payment
- [x] Subscription ownership verified (user can only retry their own)
- [x] Cron endpoint protected by CRON_SECRET header
- [x] No sensitive data logged
- [x] Stripe errors sanitized for user display
- [x] Rate limiting considered (recommend Redis-based limiting)

## Testing Coverage

| Layer | Files | Coverage Target |
|-------|-------|-----------------|
| Unit | 6 test files | 80%+ |
| Integration | 3 flows | All critical paths |
| E2E | 2 specs | Happy path + error handling |

## Success Metrics (KPIs)

1. **Payment Recovery Rate**: >50% of PAST_DUE recover within 10 days
2. **Retry Button Usage**: >30% use retry vs. portal
3. **Email Engagement**: >40% open rate on recovery/suspension emails
4. **False Suspensions**: <5% suspended then immediately reactivated

## Deployment Checklist

- [ ] Schema migration applied to production
- [ ] Environment variables verified (STRIPE_SECRET_KEY, CRON_SECRET)
- [ ] Cron job scheduled (daily at 2 AM UTC)
- [ ] Stripe webhooks tested with test mode
- [ ] Email templates previewed in production email service
- [ ] Error tracking configured (Sentry/similar)
- [ ] Analytics events added (PostHog)
- [ ] Documentation updated
- [ ] Team trained on new features
- [ ] Rollback plan prepared

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Stripe API timeout | Handle gracefully, show "Processing..." |
| Double-charging | Stripe invoice.pay is idempotent |
| Email failures | Graceful degradation, log errors |
| Cron job misses runs | Daily schedule + 10-day buffer |
| User spam-clicks retry | Disable button during pending state |

## Next Steps

1. Review this design with team
2. Get stakeholder approval on:
   - 10-day suspension threshold
   - Email copy/tone
   - Retry button UX
3. Assign implementation to engineer
4. Set up tracking/monitoring
5. Plan rollout strategy

## Questions for Product/Business

1. Should we offer reactivation discount for suspended users?
2. Should we track retry attempts in analytics?
3. What's the expected volume of suspensions per month?
4. Should support team be notified of suspensions?
5. Do we need a grace period before suspension (currently 3 days after Day 7 warning)?

---

**Ready to implement?** Start with Phase 1 (Schema Updates) in the full design document.
