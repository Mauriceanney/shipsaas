# Technical Design: PostHog Feature Flags Integration

## Overview

**One-liner**: Integrate PostHog feature flags for runtime feature toggling with per-user overrides and graceful fallbacks.

**Complexity**: M (Medium)

**Risk Level**: Low - Additive feature with fallback mechanisms; won't break existing functionality.

## Requirements Summary

From Issue #124:
- US-1: Create `<FeatureFlag>` wrapper component for client-side conditional rendering
- US-2: Server-side feature flag checking with `isFeatureFlagEnabled()` helper
- US-3: Client-side feature flag checking with PostHog SDK
- US-4: Per-user flag overrides in admin panel (via PostHog dashboard)
- US-5: Fallback to database-based flags when PostHog unavailable
- US-6: Integration with existing PostHog analytics setup

## Architecture Decision

### Approach

**Hybrid Feature Flag System**: Combine PostHog's powerful feature flags with fallback to existing database-based flags.

1. **PostHog as Primary Source**:
   - Use PostHog's feature flag SDK for remote flag evaluation
   - Support boolean flags, multivariate flags, and percentage rollouts
   - Per-user overrides via PostHog dashboard (person properties)
   - Real-time flag updates without deployments

2. **Database as Fallback**:
   - Existing `AppConfig` table with `category="features"`
   - Used when PostHog is unavailable or not configured
   - Admin can toggle via existing UI (`/admin/settings`)

3. **Implementation Layers**:
   - **Server-side**: `posthog-node` for SSR and server actions
   - **Client-side**: `posthog-js/react` hooks for client components
   - **Wrapper Components**: `<FeatureFlag>` for declarative usage

### Alternatives Considered

| Option | Pros | Cons | Verdict |
|--------|------|------|---------|
| **Option A: PostHog + DB Fallback (Selected)** | Reliable, uses existing infra, gradual rollout | Dual system complexity | **Selected** - Best of both worlds |
| Option B: PostHog Only | Simple, powerful features | Single point of failure, no offline dev | Rejected - Too risky |
| Option C: Database Only | Simple, no external deps | No A/B testing, manual rollouts | Rejected - Limited features |
| Option D: LaunchDarkly/Split.io | Enterprise features | Additional cost, vendor lock-in | Rejected - PostHog already integrated |

## Data Model

### Schema Changes

**No new tables required.** We leverage existing `AppConfig` model for fallback.

```prisma
// prisma/schema.prisma - NO CHANGES NEEDED
// Existing AppConfig model already supports feature flags:
model AppConfig {
  id          String  @id @default(cuid())
  key         String  @unique
  value       Json
  description String?
  category    String  // "features" for flags
  // ...
}
```

### Feature Flag Naming Convention

```typescript
// PostHog flag naming (matches database convention)
// Database: "feature_dark_mode" -> PostHog: "dark_mode"
// Remove "feature_" prefix when syncing to PostHog

// Example flags:
// - "new_dashboard"        -> boolean (on/off)
// - "checkout_redesign"    -> boolean with percentage rollout
// - "pricing_tier"         -> multivariate (A/B/C testing)
// - "ai_features"          -> boolean with per-user overrides
```

## API Design

### Server-Side API

```typescript
// src/lib/feature-flags/server.ts

import { PostHog } from "posthog-node";
import { getPostHogClient } from "@/lib/analytics/server";
import { getAppConfig } from "@/lib/config";

/**
 * Check if feature flag is enabled for a user (server-side)
 * 
 * Priority: PostHog > Database fallback
 * 
 * @param flagKey - Feature flag name (without "feature_" prefix)
 * @param userId - User ID for personalized flags (optional for anonymous)
 * @param options - Additional context
 * @returns Promise<boolean>
 */
export async function isFeatureFlagEnabled(
  flagKey: string,
  userId?: string,
  options?: {
    defaultValue?: boolean;
    userProperties?: Record<string, unknown>;
  }
): Promise<boolean> {
  const defaultValue = options?.defaultValue ?? false;

  try {
    // Try PostHog first
    const client = getPostHogClient();
    if (client && process.env.NEXT_PUBLIC_POSTHOG_KEY) {
      const isEnabled = await client.isFeatureEnabled(
        flagKey,
        userId || "anonymous",
        {
          personProperties: options?.userProperties,
        }
      );
      
      return isEnabled ?? defaultValue;
    }

    // Fallback to database
    const dbValue = await getAppConfig<boolean>(`feature_${flagKey}`);
    return dbValue ?? defaultValue;
  } catch (error) {
    console.error(`[FeatureFlag] Error checking "${flagKey}":`, error);
    return defaultValue; // Fail open or closed based on defaultValue
  }
}

/**
 * Get all feature flags for a user (server-side)
 */
export async function getFeatureFlags(
  userId?: string,
  options?: {
    userProperties?: Record<string, unknown>;
  }
): Promise<Record<string, boolean | string>> {
  try {
    const client = getPostHogClient();
    if (client && process.env.NEXT_PUBLIC_POSTHOG_KEY) {
      const flags = await client.getAllFlags(
        userId || "anonymous",
        {
          personProperties: options?.userProperties,
        }
      );
      
      return flags || {};
    }

    // Fallback: Get all DB flags
    const dbFlags = await import("@/lib/config").then(m => m.getFeatureFlags());
    return dbFlags;
  } catch (error) {
    console.error("[FeatureFlag] Error fetching flags:", error);
    return {};
  }
}

/**
 * Wrapper for server actions - includes user from session
 */
export async function isFeatureEnabledForSession(
  flagKey: string,
  session: { user: { id: string; email?: string | null; role?: string } } | null,
  options?: { defaultValue?: boolean }
): Promise<boolean> {
  if (!session?.user?.id) {
    return options?.defaultValue ?? false;
  }

  return isFeatureFlagEnabled(flagKey, session.user.id, {
    defaultValue: options?.defaultValue,
    userProperties: {
      email: session.user.email,
      role: session.user.role,
    },
  });
}
```

### Client-Side API

```typescript
// src/lib/feature-flags/client.ts
"use client";

import { useFeatureFlagEnabled, usePostHog } from "posthog-js/react";
import { useSession } from "next-auth/react";

/**
 * Hook to check feature flag in client components
 * Uses PostHog React SDK with automatic user identification
 * 
 * @param flagKey - Feature flag name
 * @param defaultValue - Fallback value
 * @returns boolean
 */
export function useFeatureFlag(
  flagKey: string,
  defaultValue: boolean = false
): boolean {
  const { data: session } = useSession();
  const posthog = usePostHog();

  // Identify user if session exists
  if (session?.user?.id && posthog) {
    posthog.identify(session.user.id, {
      email: session.user.email,
      role: session.user.role,
    });
  }

  // Use PostHog's hook
  const isEnabled = useFeatureFlagEnabled(flagKey);

  // Return flag value or default
  return isEnabled ?? defaultValue;
}

/**
 * Get all flags for current user
 */
export function useFeatureFlags(): Record<string, boolean | string> {
  const posthog = usePostHog();
  return posthog?.getAllFlags() || {};
}
```

### Component API

```typescript
// src/components/feature-flag/feature-flag.tsx
"use client";

import { useFeatureFlag } from "@/lib/feature-flags/client";
import type { ReactNode } from "react";

type FeatureFlagProps = {
  /**
   * Feature flag key (without "feature_" prefix)
   */
  flag: string;
  
  /**
   * Content to show when flag is enabled
   */
  children: ReactNode;
  
  /**
   * Content to show when flag is disabled
   * @default null (render nothing)
   */
  fallback?: ReactNode;
  
  /**
   * Default value if flag evaluation fails
   * @default false
   */
  defaultValue?: boolean;
};

/**
 * Client-side feature flag wrapper component
 * 
 * @example
 * ```tsx
 * <FeatureFlag flag="new_dashboard">
 *   <NewDashboard />
 * </FeatureFlag>
 * 
 * <FeatureFlag flag="beta_feature" fallback={<ComingSoonBanner />}>
 *   <BetaFeature />
 * </FeatureFlag>
 * ```
 */
export function FeatureFlag({
  flag,
  children,
  fallback = null,
  defaultValue = false,
}: FeatureFlagProps) {
  const isEnabled = useFeatureFlag(flag, defaultValue);

  return <>{isEnabled ? children : fallback}</>;
}
```

### Server Component API

```typescript
// src/components/feature-flag/feature-flag-server.tsx

import { auth } from "@/lib/auth";
import { isFeatureFlagEnabled } from "@/lib/feature-flags/server";
import type { ReactNode } from "react";

type FeatureFlagServerProps = {
  flag: string;
  children: ReactNode;
  fallback?: ReactNode;
  defaultValue?: boolean;
};

/**
 * Server-side feature flag wrapper component
 * 
 * @example
 * ```tsx
 * // In a Server Component
 * <FeatureFlagServer flag="new_analytics">
 *   <AnalyticsDashboard />
 * </FeatureFlagServer>
 * ```
 */
export async function FeatureFlagServer({
  flag,
  children,
  fallback = null,
  defaultValue = false,
}: FeatureFlagServerProps) {
  const session = await auth();
  const isEnabled = await isFeatureFlagEnabled(
    flag,
    session?.user?.id,
    {
      defaultValue,
      userProperties: session?.user ? {
        email: session.user.email,
        role: session.user.role,
      } : undefined,
    }
  );

  return <>{isEnabled ? children : fallback}</>;
}
```

## Implementation Plan

### Phase 1: Core Server-Side Infrastructure (TDD)

**Files to create:**
1. `src/lib/feature-flags/server.ts` - Server-side flag checking
2. `src/lib/feature-flags/types.ts` - Shared types
3. `tests/unit/lib/feature-flags/server.test.ts` - Server tests

**TDD Steps:**
1. Write tests for `isFeatureFlagEnabled()` with PostHog mock
2. Write tests for fallback to database
3. Write tests for error handling
4. Implement functions to pass tests

**Test Cases:**
- ✅ Returns PostHog flag value when available
- ✅ Falls back to database when PostHog unavailable
- ✅ Returns default value when both fail
- ✅ Passes user properties to PostHog
- ✅ Handles PostHog API errors gracefully
- ✅ Works with anonymous users

### Phase 2: Client-Side Hooks (TDD)

**Files to create:**
1. `src/lib/feature-flags/client.ts` - Client hooks
2. `tests/unit/lib/feature-flags/client.test.ts` - Client tests

**TDD Steps:**
1. Write tests for `useFeatureFlag()` hook
2. Write tests for session integration
3. Implement hook to pass tests

**Test Cases:**
- ✅ Returns flag value from PostHog
- ✅ Identifies user when session exists
- ✅ Returns default value when PostHog unavailable
- ✅ Handles anonymous users

### Phase 3: React Components (TDD)

**Files to create:**
1. `src/components/feature-flag/feature-flag.tsx` - Client component
2. `src/components/feature-flag/feature-flag-server.tsx` - Server component
3. `src/components/feature-flag/index.ts` - Re-exports
4. `tests/unit/components/feature-flag/feature-flag.test.tsx` - Component tests

**TDD Steps:**
1. Write tests for `<FeatureFlag>` client component
2. Write tests for `<FeatureFlagServer>` server component
3. Implement components to pass tests

**Test Cases:**
- ✅ Renders children when flag enabled
- ✅ Renders fallback when flag disabled
- ✅ Renders nothing when flag disabled and no fallback
- ✅ Passes default value correctly
- ✅ Works with authenticated users
- ✅ Works with anonymous users

### Phase 4: Admin Integration (Enhancement)

**Files to modify:**
1. `src/app/(admin)/admin/settings/page.tsx` - Add PostHog sync status
2. `src/app/(admin)/admin/settings/feature-flags-form.tsx` - Add PostHog link

**Changes:**
- Show which flags are synced to PostHog
- Add "View in PostHog" link for each flag
- Display override count per flag (if available)

### Phase 5: Documentation & Examples

**Files to create:**
1. `.claude/designs/posthog-feature-flags-usage.md` - Usage guide
2. Update `CLAUDE.md` with feature flag conventions

**Documentation:**
- Feature flag naming conventions
- When to use client vs server components
- How to create flags in PostHog dashboard
- Per-user override examples
- Testing strategies

## Testing Strategy

### Unit Tests (Vitest)

```typescript
// tests/unit/lib/feature-flags/server.test.ts

import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock PostHog
vi.mock("@/lib/analytics/server", () => ({
  getPostHogClient: vi.fn(),
}));

// Mock database config
vi.mock("@/lib/config", () => ({
  getAppConfig: vi.fn(),
  getFeatureFlags: vi.fn(),
}));

import { isFeatureFlagEnabled } from "@/lib/feature-flags/server";
import { getPostHogClient } from "@/lib/analytics/server";
import { getAppConfig } from "@/lib/config";

describe("isFeatureFlagEnabled", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("PostHog integration", () => {
    it("returns true when PostHog flag is enabled", async () => {
      const mockClient = {
        isFeatureEnabled: vi.fn().mockResolvedValue(true),
      };
      vi.mocked(getPostHogClient).mockReturnValue(mockClient as any);

      const result = await isFeatureFlagEnabled("new_dashboard", "user-1");

      expect(result).toBe(true);
      expect(mockClient.isFeatureEnabled).toHaveBeenCalledWith(
        "new_dashboard",
        "user-1",
        expect.any(Object)
      );
    });

    it("returns false when PostHog flag is disabled", async () => {
      const mockClient = {
        isFeatureEnabled: vi.fn().mockResolvedValue(false),
      };
      vi.mocked(getPostHogClient).mockReturnValue(mockClient as any);

      const result = await isFeatureFlagEnabled("new_dashboard", "user-1");

      expect(result).toBe(false);
    });

    it("passes user properties to PostHog", async () => {
      const mockClient = {
        isFeatureEnabled: vi.fn().mockResolvedValue(true),
      };
      vi.mocked(getPostHogClient).mockReturnValue(mockClient as any);

      await isFeatureFlagEnabled("new_dashboard", "user-1", {
        userProperties: { email: "test@example.com", role: "ADMIN" },
      });

      expect(mockClient.isFeatureEnabled).toHaveBeenCalledWith(
        "new_dashboard",
        "user-1",
        { personProperties: { email: "test@example.com", role: "ADMIN" } }
      );
    });
  });

  describe("Database fallback", () => {
    it("falls back to database when PostHog unavailable", async () => {
      vi.mocked(getPostHogClient).mockReturnValue(null);
      vi.mocked(getAppConfig).mockResolvedValue(true);

      const result = await isFeatureFlagEnabled("new_dashboard");

      expect(result).toBe(true);
      expect(getAppConfig).toHaveBeenCalledWith("feature_new_dashboard");
    });

    it("returns false when database flag is disabled", async () => {
      vi.mocked(getPostHogClient).mockReturnValue(null);
      vi.mocked(getAppConfig).mockResolvedValue(false);

      const result = await isFeatureFlagEnabled("new_dashboard");

      expect(result).toBe(false);
    });

    it("returns default value when database flag not found", async () => {
      vi.mocked(getPostHogClient).mockReturnValue(null);
      vi.mocked(getAppConfig).mockResolvedValue(null);

      const result = await isFeatureFlagEnabled("new_dashboard", undefined, {
        defaultValue: true,
      });

      expect(result).toBe(true);
    });
  });

  describe("Error handling", () => {
    it("returns default value when PostHog throws error", async () => {
      const mockClient = {
        isFeatureEnabled: vi.fn().mockRejectedValue(new Error("API Error")),
      };
      vi.mocked(getPostHogClient).mockReturnValue(mockClient as any);

      const result = await isFeatureFlagEnabled("new_dashboard", "user-1", {
        defaultValue: true,
      });

      expect(result).toBe(true);
    });

    it("returns default value when database throws error", async () => {
      vi.mocked(getPostHogClient).mockReturnValue(null);
      vi.mocked(getAppConfig).mockRejectedValue(new Error("DB Error"));

      const result = await isFeatureFlagEnabled("new_dashboard", undefined, {
        defaultValue: false,
      });

      expect(result).toBe(false);
    });
  });

  describe("Anonymous users", () => {
    it("uses 'anonymous' as distinct ID when no user ID", async () => {
      const mockClient = {
        isFeatureEnabled: vi.fn().mockResolvedValue(true),
      };
      vi.mocked(getPostHogClient).mockReturnValue(mockClient as any);

      await isFeatureFlagEnabled("new_dashboard");

      expect(mockClient.isFeatureEnabled).toHaveBeenCalledWith(
        "new_dashboard",
        "anonymous",
        expect.any(Object)
      );
    });
  });
});
```

### Integration Tests (E2E with Playwright)

```typescript
// tests/e2e/feature-flags.spec.ts

test.describe("Feature Flags", () => {
  test("shows new dashboard when flag enabled", async ({ page }) => {
    // Mock PostHog response
    await page.route("**/decide/*", (route) =>
      route.fulfill({
        json: { featureFlags: { new_dashboard: true } },
      })
    );

    await page.goto("/dashboard");
    await expect(page.getByTestId("new-dashboard")).toBeVisible();
  });

  test("shows old dashboard when flag disabled", async ({ page }) => {
    await page.route("**/decide/*", (route) =>
      route.fulfill({
        json: { featureFlags: { new_dashboard: false } },
      })
    );

    await page.goto("/dashboard");
    await expect(page.getByTestId("old-dashboard")).toBeVisible();
  });
});
```

## Migration Strategy

### Phase 1: Soft Launch (Week 1)
- Deploy feature flag infrastructure
- No breaking changes (all existing code works)
- Admin can create PostHog flags (optional)

### Phase 2: Gradual Adoption (Week 2-3)
- Create first PostHog flags for new features
- Document usage patterns for team
- Monitor error rates and fallback usage

### Phase 3: Full Adoption (Week 4+)
- Migrate existing database flags to PostHog (optional)
- Use PostHog as primary, database as backup
- Leverage advanced features (A/B tests, rollouts)

## Monitoring & Observability

### Metrics to Track

```typescript
// Log flag checks for debugging
console.log("[FeatureFlag] Checking:", {
  flag: flagKey,
  userId,
  source: "posthog", // or "database" or "default"
  value: result,
  duration: Date.now() - start,
});
```

### Error Tracking (Sentry)

```typescript
// Capture flag check failures
if (error) {
  Sentry.captureException(error, {
    tags: { feature: "feature_flags", flag: flagKey },
    extra: { userId, source },
  });
}
```

### Dashboard Metrics
- Flag check success rate (PostHog vs fallback)
- Average flag evaluation time
- Most frequently checked flags
- Per-flag override count

## Security Considerations

### 1. Flag Visibility
- Client-side flags are public (visible in browser)
- Don't use flags to hide security-sensitive features
- Always enforce permissions server-side

### 2. Flag Tampering
- Users can modify PostHog responses in browser
- Always re-check flags server-side for critical actions
- Use server actions for sensitive operations

### 3. Admin Access
- Only admins can create/modify flags
- Audit log tracks all flag changes
- PostHog dashboard access restricted

### 4. Fallback Security
- Database flags require admin auth to modify
- Flag values stored in `AppConfig` (admin-only table)
- Cache invalidation on flag updates

## Performance Optimization

### 1. Caching Strategy
```typescript
// In-memory cache for flag values (server-side)
const flagCache = new Map<string, { value: boolean; timestamp: number }>();
const CACHE_TTL = 60_000; // 1 minute

// Client-side: PostHog SDK has built-in caching
```

### 2. Batch Flag Fetching
```typescript
// Fetch all flags once per request
const flags = await getFeatureFlags(userId);

// Check multiple flags without additional requests
const hasNewDashboard = flags.new_dashboard;
const hasAIFeatures = flags.ai_features;
```

### 3. Edge Runtime Support
```typescript
// Use lightweight PostHog client for edge
// Fall back to database (Prisma) in Node.js runtime only
```

## Rollback Plan

### If PostHog Integration Fails

1. **Immediate**: All flags fall back to database (existing behavior)
2. **Short-term**: Disable PostHog checks with env var
   ```env
   DISABLE_POSTHOG_FLAGS=true
   ```
3. **Long-term**: Remove PostHog integration, keep database-only flags

### Database as Safety Net

- Existing `/admin/settings` UI continues to work
- Database flags work even if PostHog is down
- No single point of failure

## Success Metrics

### Technical Metrics
- ✅ 99.9% flag check success rate
- ✅ <50ms average flag evaluation time
- ✅ Zero unauthorized feature access
- ✅ 100% test coverage for flag logic

### Product Metrics
- ✅ A/B test results tracked in PostHog
- ✅ Feature rollout completion rate
- ✅ User feedback on gradual rollouts
- ✅ Reduction in "big bang" deployment risks

## Open Questions

1. **Flag Lifecycle**: How long should we keep inactive flags?
   - **Answer**: Archive after 30 days of no usage
   
2. **Flag Naming**: Enforce naming convention?
   - **Answer**: Yes - snake_case, descriptive (e.g., `checkout_redesign_v2`)
   
3. **Multivariate Flags**: Support complex flag types?
   - **Answer**: Phase 2 - Start with boolean, add multivariate later
   
4. **Local Development**: Mock PostHog in dev?
   - **Answer**: Use database fallback in dev (simpler, faster)

## Next Steps

1. ✅ Get approval on technical design
2. ⏳ Create implementation tasks in GitHub Issues
3. ⏳ Set up PostHog feature flags in dashboard
4. ⏳ Phase 1 implementation (TDD)
5. ⏳ Create example usage documentation
6. ⏳ Deploy to pre-production for testing
7. ⏳ Production rollout with monitoring
