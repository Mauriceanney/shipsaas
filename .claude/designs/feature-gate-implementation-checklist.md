# Feature Gating Implementation Checklist

Quick reference for Full-Stack Engineer and UI Engineer implementing feature gating.

## Files to Create

### New Files

- [ ] `/Users/maney/Projects/Codes/shipsaas/src/lib/auth/feature-gate.ts`
  - `hasAccess()` - Pure function for access checks
  - `requirePlan()` - Server-side enforcement
  - `getPlanHierarchy()` - Plan tier comparison
  - `canAccessFeature()` - Detailed access check with reason

- [ ] `/Users/maney/Projects/Codes/shipsaas/src/components/feature-gate/feature-gate.tsx`
  - Client component for conditional rendering
  - Uses `useSession()` hook
  - Renders children or UpgradeCard based on access

- [ ] `/Users/maney/Projects/Codes/shipsaas/src/components/feature-gate/upgrade-card.tsx`
  - Client component showing upgrade CTA
  - Displays required plan name
  - Link to /pricing page

- [ ] `/Users/maney/Projects/Codes/shipsaas/src/components/feature-gate/index.ts`
  - Re-exports FeatureGate and UpgradeCard

- [ ] `/Users/maney/Projects/Codes/shipsaas/tests/unit/auth/feature-gate.test.ts`
  - Unit tests for all utility functions
  - Edge cases for grace period
  - Plan hierarchy tests

- [ ] `/Users/maney/Projects/Codes/shipsaas/tests/unit/components/feature-gate.test.tsx`
  - Component tests for FeatureGate
  - Component tests for UpgradeCard

## Files to Modify

### Type Definitions

- [ ] `/Users/maney/Projects/Codes/shipsaas/src/types/next-auth.d.ts`
  - Add `subscription` to `Session.user`
  - Add `subscription` to `User` interface
  - Add `subscription` to `JWT` interface

### Auth Configuration

- [ ] `/Users/maney/Projects/Codes/shipsaas/src/lib/auth/config.ts`
  - Modify `jwt()` callback to include subscription
  - Modify `session()` callback to add subscription to session
  - Update `credentials` provider to query subscription
  - Update `two-factor` provider to query subscription

## Implementation Order (TDD)

### Phase 1: Types & Utilities (Backend)

1. **Extend NextAuth types**
   ```typescript
   // src/types/next-auth.d.ts
   subscription: {
     plan: Plan;
     status: SubscriptionStatus;
     stripeCurrentPeriodEnd: Date | null;
   }
   ```

2. **Write tests for utilities** (RED)
   ```bash
   STRIPE_SECRET_KEY="sk_test_mock" npx vitest tests/unit/auth/feature-gate.test.ts
   ```

3. **Implement utilities** (GREEN)
   - `getPlanHierarchy()`
   - `hasAccess()`
   - `canAccessFeature()`
   - `requirePlan()`

4. **Refactor for clarity** (REFACTOR)

### Phase 2: Session Enhancement

5. **Modify Auth.js config**
   - Update JWT callback
   - Update session callback
   - Update all providers to include subscription in query

6. **Manual test login**
   ```bash
   pnpm dev
   # Login and inspect session in browser DevTools
   # Should see session.user.subscription
   ```

### Phase 3: Client Components (Frontend)

7. **Write component tests** (RED)
   ```bash
   STRIPE_SECRET_KEY="sk_test_mock" npx vitest tests/unit/components/feature-gate.test.tsx
   ```

8. **Implement UpgradeCard** (GREEN)

9. **Implement FeatureGate** (GREEN)

10. **Refactor components** (REFACTOR)

### Phase 4: Integration Testing

11. **Create example page**
    ```typescript
    // Test page with gated features
    app/(dashboard)/test-feature-gate/page.tsx
    ```

12. **Manual QA**
    - FREE user sees upgrade prompt
    - PRO user sees feature
    - TRIALING user sees feature
    - PAST_DUE user (within 7 days) sees feature

## Key Constants

```typescript
// Plan hierarchy (higher = more access)
PLAN_HIERARCHY = { FREE: 0, PLUS: 1, PRO: 2 }

// Grace period for PAST_DUE
PAST_DUE_GRACE_PERIOD = 7 * 24 * 60 * 60 * 1000 // 7 days in ms

// Active statuses
ACTIVE_STATUSES = ["ACTIVE", "TRIALING"]
```

## Access Logic Summary

```typescript
// User can access if:
// 1. User's plan tier >= required tier (hierarchy check)
// AND
// 2. Subscription status is:
//    - ACTIVE → ✓
//    - TRIALING → ✓
//    - PAST_DUE + within 7 days → ✓
//    - Otherwise → ✗
```

## Common Patterns

### Server Action Pattern

```typescript
export async function myAction() {
  // ALWAYS start with requirePlan()
  const result = await requirePlan("PLUS");
  
  if (!result.success) {
    return { success: false, error: result.error };
  }

  const session = result.data;
  // Now safe to use session.user.id
}
```

### Page Component Pattern

```typescript
export default async function MyPage() {
  return (
    <div>
      {/* Basic feature - all users */}
      <BasicFeature />

      {/* Premium feature - gated */}
      <FeatureGate plan="PLUS">
        <PremiumFeature />
      </FeatureGate>
    </div>
  );
}
```

### Conditional Button Pattern

```typescript
<FeatureGate plan="PLUS" fallback={null}>
  <Button onClick={exportData}>Export</Button>
</FeatureGate>
```

## Testing Checklist

### Unit Tests - hasAccess()

- [ ] FREE cannot access PRO
- [ ] PRO can access PRO
- [ ] PRO cannot access ENTERPRISE
- [ ] ENTERPRISE can access all
- [ ] ACTIVE status grants access
- [ ] TRIALING status grants access
- [ ] PAST_DUE day 1 grants access
- [ ] PAST_DUE day 7 grants access
- [ ] PAST_DUE day 8 denies access
- [ ] INACTIVE denies access
- [ ] CANCELED denies access

### Unit Tests - requirePlan()

- [ ] Returns error when not authenticated
- [ ] Returns session when authorized
- [ ] Returns error when plan too low
- [ ] Handles array of plans
- [ ] Correct error messages

### Component Tests - FeatureGate

- [ ] Shows children when authorized
- [ ] Shows UpgradeCard when denied
- [ ] Shows custom fallback
- [ ] Handles loading state
- [ ] Handles unauthenticated user

## Security Checklist

- [ ] All server actions use `requirePlan()`
- [ ] Client gate is UX only (documented)
- [ ] No sensitive data in client components
- [ ] Error messages are generic (don't leak info)
- [ ] Plan hierarchy cannot be bypassed

## Performance Checklist

- [ ] Zero DB queries per feature check (session-based)
- [ ] JWT size increase < 1KB
- [ ] No N+1 queries during login
- [ ] Pure functions (hasAccess) have no side effects

## Documentation Tasks

- [ ] Add JSDoc comments to all functions
- [ ] Add usage examples in comments
- [ ] Update project README with feature gating
- [ ] Create migration guide for existing features

## Definition of Done

- [ ] All unit tests pass (100% coverage on utilities)
- [ ] All component tests pass (90%+ coverage)
- [ ] TypeScript compiles with no errors
- [ ] Manual QA completed for all scenarios
- [ ] Code review approved
- [ ] Documentation updated
- [ ] Example usage added to codebase

## Rollout Plan

1. **Merge to develop** → Test in pre-production
2. **QA sign-off** → Verify all scenarios work
3. **Merge to main** → Deploy to production
4. **Monitor** → Watch for errors in feature gate checks
5. **Iterate** → Adjust grace period if needed

---

**Quick Command Reference**:

```bash
# Run unit tests
STRIPE_SECRET_KEY="sk_test_mock" npx vitest run tests/unit/auth/feature-gate.test.ts

# Run component tests
STRIPE_SECRET_KEY="sk_test_mock" npx vitest run tests/unit/components/feature-gate.test.tsx

# Run all tests with coverage
STRIPE_SECRET_KEY="sk_test_mock" npx vitest run --coverage

# Start dev server
pnpm dev

# Type check
pnpm typecheck

# Lint
pnpm lint
```

---

**Related Documents**:
- Technical Design: `/Users/maney/Projects/Codes/shipsaas/.claude/designs/feature-gate-technical-design.md`
- Architecture Diagrams: `/Users/maney/Projects/Codes/shipsaas/.claude/designs/feature-gate-architecture.md`
- Issue: #56
