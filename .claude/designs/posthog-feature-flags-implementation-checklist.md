# PostHog Feature Flags Implementation Checklist

## Overview
Issue: #124
Design: `posthog-feature-flags-technical-design.md`
Approach: Strict TDD with 5 phases

---

## Phase 1: Core Server-Side Infrastructure (TDD)

### 1.1 Create Type Definitions
- [ ] Create `src/lib/feature-flags/types.ts`
  - [ ] Define `FeatureFlagOptions` type
  - [ ] Define `UserProperties` type
  - [ ] Define `FeatureFlagValue` type (boolean | string)
  - [ ] Export shared types

### 1.2 Write Server-Side Tests (RED)
- [ ] Create `tests/unit/lib/feature-flags/server.test.ts`

**Test Suite: `isFeatureFlagEnabled()`**
- [ ] PostHog Integration Tests:
  - [ ] Returns `true` when PostHog flag is enabled
  - [ ] Returns `false` when PostHog flag is disabled
  - [ ] Passes user properties to PostHog correctly
  - [ ] Uses 'anonymous' for unauthenticated users
  - [ ] Handles PostHog returning `null` (uses default)

- [ ] Database Fallback Tests:
  - [ ] Falls back to database when PostHog unavailable
  - [ ] Returns database value when PostHog client is null
  - [ ] Prepends "feature_" prefix for database lookup
  - [ ] Returns `false` when database flag is disabled
  - [ ] Returns default value when database flag not found

- [ ] Error Handling Tests:
  - [ ] Returns default value when PostHog throws error
  - [ ] Returns default value when database throws error
  - [ ] Logs errors to console
  - [ ] Never throws, always returns boolean

- [ ] Edge Cases:
  - [ ] Handles empty flag key gracefully
  - [ ] Handles undefined user ID
  - [ ] Handles null user properties
  - [ ] Default value defaults to `false`

**Test Suite: `getFeatureFlags()`**
- [ ] Returns all PostHog flags when available
- [ ] Falls back to database flags when PostHog unavailable
- [ ] Returns empty object on error
- [ ] Passes user properties correctly

**Test Suite: `isFeatureEnabledForSession()`**
- [ ] Returns default value when session is null
- [ ] Extracts user ID from session
- [ ] Passes email and role as user properties
- [ ] Calls `isFeatureFlagEnabled` with correct params

### 1.3 Implement Server-Side Functions (GREEN)
- [ ] Create `src/lib/feature-flags/server.ts`
  - [ ] Implement `isFeatureFlagEnabled()`
  - [ ] Implement `getFeatureFlags()`
  - [ ] Implement `isFeatureEnabledForSession()`
  - [ ] Add JSDoc comments for all functions
  - [ ] Export all functions

### 1.4 Refactor & Optimize
- [ ] Extract PostHog client check to helper
- [ ] Add logging for debugging (console.log)
- [ ] Verify all tests pass
- [ ] Check test coverage (target: 100%)

### 1.5 Integration with Existing Code
- [ ] Update `src/lib/analytics/server.ts` if needed
- [ ] Ensure PostHog client is properly initialized
- [ ] Test with real PostHog instance (optional)

---

## Phase 2: Client-Side Hooks (TDD)

### 2.1 Write Client-Side Tests (RED)
- [ ] Create `tests/unit/lib/feature-flags/client.test.ts`

**Test Suite: `useFeatureFlag()`**
- [ ] PostHog Integration:
  - [ ] Returns flag value from PostHog
  - [ ] Identifies user when session exists
  - [ ] Passes email and role to identify()
  - [ ] Calls `useFeatureFlagEnabled` with flag key

- [ ] Session Handling:
  - [ ] Works with authenticated user
  - [ ] Works with anonymous user (no session)
  - [ ] Updates when session changes
  - [ ] Skips identify when no user ID

- [ ] Default Values:
  - [ ] Returns default when flag is undefined
  - [ ] Default value defaults to `false`
  - [ ] Returns PostHog value over default

- [ ] Edge Cases:
  - [ ] Handles PostHog not initialized
  - [ ] Handles session loading state
  - [ ] Returns stable reference (no flicker)

**Test Suite: `useFeatureFlags()`**
- [ ] Returns all flags from PostHog
- [ ] Returns empty object when PostHog unavailable
- [ ] Updates when flags change

### 2.2 Implement Client-Side Hooks (GREEN)
- [ ] Create `src/lib/feature-flags/client.ts`
  - [ ] Mark file as `"use client"`
  - [ ] Implement `useFeatureFlag()`
  - [ ] Implement `useFeatureFlags()`
  - [ ] Add JSDoc comments
  - [ ] Export all hooks

### 2.3 Refactor & Optimize
- [ ] Memoize user identification
- [ ] Prevent identify() spam
- [ ] Verify all tests pass
- [ ] Check test coverage (target: 100%)

### 2.4 Create Index File
- [ ] Create `src/lib/feature-flags/index.ts`
  - [ ] Re-export server functions
  - [ ] Re-export client hooks
  - [ ] Add usage examples in comments

---

## Phase 3: React Components (TDD)

### 3.1 Write Component Tests (RED)
- [ ] Create `tests/unit/components/feature-flag/feature-flag.test.tsx`

**Test Suite: `<FeatureFlag>` (Client Component)**
- [ ] Rendering Logic:
  - [ ] Renders children when flag is enabled
  - [ ] Renders fallback when flag is disabled
  - [ ] Renders nothing when disabled and no fallback
  - [ ] Passes flag key to `useFeatureFlag`

- [ ] Props:
  - [ ] Accepts `flag` prop
  - [ ] Accepts `children` prop
  - [ ] Accepts optional `fallback` prop
  - [ ] Accepts optional `defaultValue` prop
  - [ ] Default value defaults to `false`

- [ ] User Context:
  - [ ] Works with authenticated user
  - [ ] Works with anonymous user
  - [ ] Re-renders when flag changes

- [ ] Edge Cases:
  - [ ] Handles empty flag key
  - [ ] Handles React fragment as children
  - [ ] Handles null fallback
  - [ ] Handles React element as fallback

**Test Suite: `<FeatureFlagServer>` (Server Component)**
- [ ] Rendering Logic:
  - [ ] Renders children when flag is enabled
  - [ ] Renders fallback when flag is disabled
  - [ ] Renders nothing when disabled and no fallback
  - [ ] Calls `isFeatureFlagEnabled` on server

- [ ] Session Integration:
  - [ ] Passes user ID to flag check
  - [ ] Passes user properties (email, role)
  - [ ] Works with anonymous users
  - [ ] Fetches session with `auth()`

- [ ] Props:
  - [ ] Accepts same props as client component
  - [ ] Async component (returns Promise)

### 3.2 Implement Components (GREEN)
- [ ] Create `src/components/feature-flag/feature-flag.tsx`
  - [ ] Mark as `"use client"`
  - [ ] Implement `FeatureFlag` component
  - [ ] Add TypeScript types
  - [ ] Add JSDoc with examples

- [ ] Create `src/components/feature-flag/feature-flag-server.tsx`
  - [ ] Implement `FeatureFlagServer` async component
  - [ ] Fetch auth session
  - [ ] Call server-side flag check
  - [ ] Add TypeScript types
  - [ ] Add JSDoc with examples

### 3.3 Create Index & Exports
- [ ] Create `src/components/feature-flag/index.ts`
  - [ ] Export `FeatureFlag` (client)
  - [ ] Export `FeatureFlagServer` (server)
  - [ ] Add usage guide in comments

### 3.4 Refactor & Optimize
- [ ] Extract shared types
- [ ] Verify all tests pass
- [ ] Check test coverage (target: 100%)
- [ ] Validate with TypeScript strict mode

---

## Phase 4: Admin Integration (Enhancement)

### 4.1 Update Feature Flags Form
- [ ] Modify `src/app/(admin)/admin/settings/feature-flags-form.tsx`
  - [ ] Add "PostHog Status" column (Synced / Local Only)
  - [ ] Add "View in PostHog" link per flag
  - [ ] Show sync icon for PostHog-enabled flags
  - [ ] Add tooltip explaining PostHog vs DB

### 4.2 Update Settings Page
- [ ] Modify `src/app/(admin)/admin/settings/page.tsx`
  - [ ] Add PostHog connection status card
  - [ ] Show "PostHog Enabled" or "Database Fallback"
  - [ ] Link to PostHog dashboard
  - [ ] Add info about per-user overrides

### 4.3 Optional: Sync Action
- [ ] Create `src/actions/admin/feature-flags.ts` (optional)
  - [ ] Action to sync DB flags to PostHog
  - [ ] Bulk enable/disable in PostHog
  - [ ] Requires admin auth

### 4.4 Update UI Components
- [ ] Add PostHog icon/badge component
- [ ] Update admin layout if needed
- [ ] Test admin UI manually

---

## Phase 5: Documentation & Examples

### 5.1 Create Usage Guide
- [ ] Create `.claude/designs/posthog-feature-flags-usage.md`
  - [ ] Quick start guide
  - [ ] Client component examples
  - [ ] Server component examples
  - [ ] Server action examples
  - [ ] PostHog dashboard setup
  - [ ] Per-user override examples
  - [ ] A/B testing examples
  - [ ] Percentage rollout examples
  - [ ] Testing strategies
  - [ ] Troubleshooting guide

### 5.2 Update Project Documentation
- [ ] Update `CLAUDE.md`
  - [ ] Add feature flag section
  - [ ] Document naming conventions
  - [ ] Add to "Key Commands" (if applicable)
  - [ ] Link to usage guide

- [ ] Update `.env.example`
  - [ ] Document PostHog env vars (already exists)
  - [ ] Add optional `DISABLE_POSTHOG_FLAGS` var

### 5.3 Create Example Implementation
- [ ] Create example feature flag in dashboard
  - [ ] Flag: "example_new_feature"
  - [ ] Type: Boolean
  - [ ] Rollout: 50%
  - [ ] Per-user override for demo@example.com

- [ ] Create example usage in code
  - [ ] Add to dashboard page (optional)
  - [ ] Show both client and server usage
  - [ ] Commit as reference

### 5.4 Update Architecture Docs
- [ ] Add to `docs/architecture/` (if exists)
  - [ ] Feature flag architecture diagram
  - [ ] Decision log
  - [ ] Fallback flow diagram

---

## Phase 6: Testing & Validation

### 6.1 Unit Test Coverage
- [ ] Run tests: `STRIPE_SECRET_KEY="sk_test_mock" npx vitest run`
- [ ] Verify 100% coverage for:
  - [ ] `src/lib/feature-flags/server.ts`
  - [ ] `src/lib/feature-flags/client.ts`
  - [ ] `src/components/feature-flag/feature-flag.tsx`
  - [ ] `src/components/feature-flag/feature-flag-server.tsx`

### 6.2 Integration Testing
- [ ] Test PostHog integration manually
  - [ ] Create test flag in PostHog dashboard
  - [ ] Enable flag for specific user
  - [ ] Verify flag shows correctly in app
  - [ ] Toggle flag and verify real-time update

- [ ] Test database fallback
  - [ ] Disable PostHog (remove env var)
  - [ ] Create flag in `/admin/settings`
  - [ ] Verify flag works via database
  - [ ] Re-enable PostHog and verify precedence

### 6.3 E2E Testing (Optional)
- [ ] Create `tests/e2e/feature-flags.spec.ts`
  - [ ] Test flag-gated feature
  - [ ] Mock PostHog responses
  - [ ] Test fallback behavior

### 6.4 Performance Testing
- [ ] Measure flag check latency
  - [ ] Target: <50ms for PostHog
  - [ ] Target: <10ms for database
- [ ] Verify no N+1 queries
- [ ] Check for memory leaks

---

## Phase 7: Deployment & Rollout

### 7.1 Pre-Deployment Checklist
- [ ] All tests passing
- [ ] Coverage meets threshold (80%+)
- [ ] TypeScript strict mode passes
- [ ] Linter passes (no errors)
- [ ] No console.error in production code
- [ ] Environment variables documented

### 7.2 Create Pull Request
- [ ] Link to Issue #124
- [ ] Include before/after screenshots (admin UI)
- [ ] Add test plan to PR description
- [ ] Request review from team

### 7.3 Deploy to Pre-Production
- [ ] Merge to `develop` branch
- [ ] Auto-deploy to pre-prod
- [ ] Create test flags in PostHog
- [ ] Verify functionality on pre-prod

### 7.4 Production Rollout
- [ ] Create PR from `develop` to `main`
- [ ] Get approval
- [ ] Merge to `main`
- [ ] Auto-deploy to production
- [ ] Monitor error rates (Sentry)
- [ ] Monitor flag check latency (logs)

### 7.5 Post-Deployment
- [ ] Verify flags working in production
- [ ] Check Sentry for errors
- [ ] Create first production flag
- [ ] Document rollout in changelog

---

## Phase 8: Cleanup & Optimization

### 8.1 Code Review & Refactor
- [ ] Remove debug logging (keep error logs)
- [ ] Optimize imports
- [ ] Add comments for complex logic
- [ ] Extract constants

### 8.2 Performance Optimization
- [ ] Add caching if needed
- [ ] Batch flag fetches where possible
- [ ] Optimize re-renders in React

### 8.3 Security Audit
- [ ] Verify no secrets in code
- [ ] Check admin auth on flag actions
- [ ] Validate client-side flags are non-sensitive
- [ ] Review error messages (no info leakage)

### 8.4 Documentation Finalization
- [ ] Proofread all docs
- [ ] Add diagrams if helpful
- [ ] Link related docs together
- [ ] Archive design docs in `.claude/designs/`

---

## Success Criteria

### Functional Requirements
- [ ] ✅ `<FeatureFlag>` component works in client components
- [ ] ✅ `<FeatureFlagServer>` component works in server components
- [ ] ✅ `isFeatureFlagEnabled()` works in server actions
- [ ] ✅ `useFeatureFlag()` hook works in client components
- [ ] ✅ PostHog integration working (primary)
- [ ] ✅ Database fallback working (secondary)
- [ ] ✅ Per-user overrides via PostHog dashboard
- [ ] ✅ Admin UI shows PostHog status

### Quality Requirements
- [ ] ✅ 100% test coverage for core logic
- [ ] ✅ All tests passing (unit + integration)
- [ ] ✅ TypeScript strict mode passing
- [ ] ✅ No linter errors
- [ ] ✅ Documentation complete

### Performance Requirements
- [ ] ✅ Flag check latency <50ms (PostHog)
- [ ] ✅ Flag check latency <10ms (database)
- [ ] ✅ Zero N+1 queries
- [ ] ✅ No memory leaks

### Production Requirements
- [ ] ✅ Deployed to production
- [ ] ✅ Monitoring in place
- [ ] ✅ Error tracking configured
- [ ] ✅ Rollback plan documented
- [ ] ✅ First production flag created

---

## Estimated Timeline

| Phase | Estimated Time | Complexity |
|-------|----------------|------------|
| Phase 1: Server-Side | 4 hours | Medium |
| Phase 2: Client-Side | 3 hours | Medium |
| Phase 3: Components | 3 hours | Medium |
| Phase 4: Admin UI | 2 hours | Low |
| Phase 5: Documentation | 2 hours | Low |
| Phase 6: Testing | 2 hours | Medium |
| Phase 7: Deployment | 1 hour | Low |
| Phase 8: Cleanup | 1 hour | Low |
| **Total** | **18 hours** | **Medium** |

---

## Rollback Plan

If issues arise in production:

1. **Immediate** (5 minutes):
   - Set `DISABLE_POSTHOG_FLAGS=true` in env
   - Restart app (flags fall back to database)

2. **Short-term** (1 hour):
   - Revert PR if major issues
   - Database flags continue working
   - No data loss

3. **Long-term**:
   - Fix issues and redeploy
   - Or remove PostHog integration entirely
   - Database-only flags remain functional

---

## Notes

- Follow TDD strictly: RED → GREEN → REFACTOR
- Write tests BEFORE implementation
- Commit frequently with clear messages
- Run tests after every change
- Keep PRs focused and reviewable
- Document as you go, not at the end
