# Logging Migration Guide

## Status

- **Infrastructure**: ✅ Complete (pino logger with 100% test coverage)
- **ESLint Rule**: ✅ Added (`no-console` warning)
- **Documentation**: ✅ Complete
- **Migration Progress**: 🚧 In Progress (~152 console.* calls remaining)

## Migration Strategy

Rather than migrate all 152 calls at once, we're using an incremental approach:

### Phase 1: Infrastructure & Prevention ✅ (THIS PR)
- [x] Logger implementation with tests
- [x] ESLint rule to prevent new console usage
- [x] Comprehensive documentation
- [x] Code examples

### Phase 2: Critical Production Code (NEXT PR)
- [ ] Stripe webhook handlers (`src/lib/stripe/webhooks.ts`) - 44 calls
- [ ] Stripe webhook route (`src/app/api/webhooks/stripe/route.ts`) - 13 calls
- **Impact**: Ensures payment processing has proper observability

### Phase 3: API Routes (FOLLOW-UP PR)
- [ ] Cron jobs (dunning emails, suspensions, cleanup) - ~20 calls
- [ ] Other API routes - ~5 calls
- **Impact**: Better monitoring of scheduled tasks

### Phase 4: Server Actions (FOLLOW-UP PR)
- [ ] Auth actions - ~12 calls
- [ ] Admin actions - ~8 calls
- [ ] Billing/session/other actions - ~30 calls
- **Impact**: Improved debugging of user actions

### Phase 5: Utilities & Cleanup (FINAL PR)
- [ ] Email providers - ~5 calls
- [ ] Feature flags - ~2 calls
- [ ] Other libraries - ~10 calls
- **Impact**: Complete migration

## Quick Reference

### Find Remaining console.* Calls

```bash
# Count remaining
grep -rn "console\.\(log\|warn\|error\|info\)" src \
  --include="*.ts" --include="*.tsx" | \
  grep -v ".test." | \
  wc -l

# List files and locations
grep -rn "console\.\(log\|warn\|error\|info\)" src \
  --include="*.ts" --include="*.tsx" | \
  grep -v ".test." | \
  head -20
```

### Migration Pattern

**Before**:
```typescript
console.log("User logged in:", userId);
console.error("Payment failed:", error);
```

**After**:
```typescript
import { logger } from "@/lib/logger";

logger.info({ userId }, "User logged in");
logger.error({ err: error, userId, subscriptionId }, "Payment failed");
```

### Common Transformations

| Before | After |
|--------|-------|
| `console.log("msg", data)` | `logger.info({ data }, "msg")` |
| `console.error("msg", err)` | `logger.error({ err }, "msg")` |
| `console.warn("msg")` | `logger.warn({}, "msg")` |
| `console.log(\`${var}: ${val}\`)` | `logger.info({ var, val }, "Description")` |

## Benefits of Incremental Migration

1. **Reduced Risk**: Smaller PRs are easier to review and test
2. **Continuous Value**: ESLint rule prevents new violations immediately
3. **Prioritized Impact**: Critical code (payments) migrated first
4. **Better Reviews**: Reviewers can focus on contextual logging quality
5. **Rollback Safety**: Issues in one PR don't block others

## How to Migrate a File

### Step 1: Add Import

```typescript
import { logger } from "@/lib/logger";
```

### Step 2: Replace console.* Calls

Think about what context is important:

```typescript
// BAD: Just replacing syntax
console.log("Subscription created");
logger.info({}, "Subscription created"); // No context!

// GOOD: Adding meaningful context
logger.info({
  userId,
  subscriptionId,
  plan,
  amount,
  status: "active"
}, "Subscription created");
```

### Step 3: Run Tests

```bash
pnpm typecheck
pnpm lint
pnpm test
```

### Step 4: Verify Output

```bash
pnpm dev
# Trigger the code path
# Check logs in terminal
```

## Examples by File Type

### Stripe Webhooks

```typescript
// Before
console.log(`Subscription created for user: ${userId}`);
console.error("Missing userId in checkout metadata:", session.id);

// After
logger.info({ userId, subscriptionId, plan }, "Subscription created");
logger.error({ sessionId: session.id }, "Missing userId in checkout metadata");
```

### API Routes

```typescript
// Before
console.log(`[cron/dunning-emails] Processing ${count} subscriptions`);
console.error("[cron/dunning-emails] Critical error:", error);

// After
logger.info({ count }, "Processing past due subscriptions");
logger.error({ err: error }, "Dunning email cron job failed");
```

### Server Actions

```typescript
// Before
console.error("[updateProfile] Database error:", error);
console.log(`Profile updated for user ${userId}`);

// After
logger.error({ err: error, userId }, "Failed to update profile");
logger.info({ userId, fields: Object.keys(data) }, "Profile updated successfully");
```

## Testing Migration

### Unit Tests

No changes needed - logger is already tested at 100% coverage.

### Integration Tests

Verify logs appear in expected format:

```bash
# Development (pretty)
pnpm dev
# Should see colorized, formatted logs

# Production (JSON)
NODE_ENV=production pnpm build && pnpm start
# Should see JSON-formatted logs
```

## Troubleshooting

### ESLint Warnings After Migration

If you see ESLint warnings for `console.*`:

```typescript
// If this is an approved exception (error.tsx, env.ts), ignore
// Otherwise, replace with logger
```

### Import Errors

```typescript
// Error: Cannot find module '@/lib/logger'
// Solution: Ensure you're importing from the correct path
import { logger } from "@/lib/logger"; // ✅ Correct
import { logger } from "lib/logger";   // ❌ Wrong (missing @/)
```

### TypeScript Errors

```typescript
// Error: Type 'unknown' is not assignable to type 'Error'
// Solution: Use 'err' key for error objects
logger.error({ err: error }, "Message"); // ✅ Correct
logger.error({ error }, "Message");      // ❌ Wrong (should be 'err')
```

## Success Criteria

For each migration PR:

- [ ] All console.* calls in scope replaced with logger
- [ ] Contextual data added to all log calls
- [ ] No sensitive data logged (verified by redaction tests)
- [ ] All tests pass
- [ ] No TypeScript errors
- [ ] No ESLint warnings
- [ ] Logs verified in dev environment

## Related Documentation

- [Logging Standards](./logging-standards.md) - Comprehensive logging guide
- [Logger Implementation](../src/lib/logger/index.ts) - Source code
- [Logger Tests](../tests/unit/lib/logger/index.test.ts) - Test coverage
- Issue #174 - Original tracking issue

---

**Current Status**: Phase 1 Complete ✅
**Next Phase**: Stripe webhooks migration
**Total Progress**: ~5% (8/152 calls migrated - logger infrastructure examples)
