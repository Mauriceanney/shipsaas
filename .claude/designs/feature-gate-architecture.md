# Feature Gating Architecture

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          USER AUTHENTICATION                             │
│                                                                          │
│  User Login → Auth.js → Prisma Query (with subscription join)           │
│                            ↓                                             │
│                       JWT Token Created                                  │
│                    (includes subscription)                               │
└─────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────┐
│                          SESSION MANAGEMENT                              │
│                                                                          │
│  Session Object (in memory + JWT):                                      │
│  {                                                                       │
│    user: {                                                               │
│      id: "user-123",                                                     │
│      role: "USER",                                                       │
│      subscription: {                                                     │
│        plan: "PLUS",                                                      │
│        status: "ACTIVE",                                                 │
│        stripeCurrentPeriodEnd: Date                                      │
│      }                                                                   │
│    }                                                                     │
│  }                                                                       │
└─────────────────────────────────────────────────────────────────────────┘
                    ↓                                  ↓
        ┌───────────────────┐              ┌──────────────────────┐
        │  CLIENT-SIDE      │              │   SERVER-SIDE        │
        │  (UX Layer)       │              │   (Security Layer)   │
        └───────────────────┘              └──────────────────────┘
                    ↓                                  ↓
        ┌───────────────────┐              ┌──────────────────────┐
        │  FeatureGate      │              │   requirePlan()      │
        │  Component        │              │   Helper             │
        │                   │              │                      │
        │  - useSession()   │              │   - auth()           │
        │  - hasAccess()    │              │   - hasAccess()      │
        │  - Conditional    │              │   - Return Result<>  │
        │    Rendering      │              │                      │
        └───────────────────┘              └──────────────────────┘
                    ↓                                  ↓
        ┌───────────────────┐              ┌──────────────────────┐
        │  If Access:       │              │  If Access:          │
        │  Render children  │              │  Execute action      │
        │                   │              │  Return data         │
        │  If Denied:       │              │                      │
        │  Show UpgradeCard │              │  If Denied:          │
        │                   │              │  Return error        │
        └───────────────────┘              └──────────────────────┘
```

## Data Flow Diagram

### Login Flow (One-time)

```
┌─────────────┐
│   Browser   │
└──────┬──────┘
       │ POST /api/auth/signin
       ↓
┌─────────────────────────────────────────┐
│  Auth.js Credentials Provider           │
│                                          │
│  1. Validate credentials                │
│  2. Query database:                     │
│     SELECT user, subscription           │
│  3. Create JWT with subscription data   │
└──────────────┬──────────────────────────┘
               │ Set session cookie
               ↓
┌─────────────────────────────────────────┐
│  Session Cookie (HTTP-only)             │
│  Contains JWT with:                     │
│  - userId                                │
│  - role                                  │
│  - subscription { plan, status, end }   │
└──────────────┬──────────────────────────┘
               │ Every request includes cookie
               ↓
┌─────────────────────────────────────────┐
│  Session Available in:                  │
│  - Server Components (auth())           │
│  - Server Actions (auth())              │
│  - Client Components (useSession())     │
│                                          │
│  NO additional DB queries needed!       │
└─────────────────────────────────────────┘
```

### Feature Access Check Flow

```
CLIENT-SIDE CHECK (UX):              SERVER-SIDE CHECK (Security):
┌────────────────────┐              ┌──────────────────────┐
│ <FeatureGate       │              │ Server Action        │
│   plan="PLUS">      │              │                      │
└─────────┬──────────┘              └──────────┬───────────┘
          │                                    │
          ↓                                    ↓
┌────────────────────┐              ┌──────────────────────┐
│ useSession()       │              │ const result =       │
│ → session.user     │              │   await requirePlan  │
│   .subscription    │              │   ("PLUS");           │
└─────────┬──────────┘              └──────────┬───────────┘
          │                                    │
          ↓                                    ↓
┌────────────────────┐              ┌──────────────────────┐
│ hasAccess(         │              │ hasAccess(           │
│   session,         │              │   session,           │
│   "PLUS"            │              │   "PLUS"              │
│ )                  │              │ )                    │
└─────────┬──────────┘              └──────────┬───────────┘
          │                                    │
    ┌─────┴─────┐                        ┌─────┴─────┐
    │ TRUE      │ FALSE                  │ TRUE      │ FALSE
    ↓           ↓                        ↓           ↓
┌────────┐ ┌────────────┐        ┌──────────┐ ┌───────────┐
│ Render │ │ Render     │        │ Execute  │ │ Return    │
│ Feature│ │ UpgradeCard│        │ Logic    │ │ Error     │
└────────┘ └────────────┘        └──────────┘ └───────────┘
```

## Plan Hierarchy & Access Matrix

```
PLAN HIERARCHY (PLAN_HIERARCHY constant):
┌──────────────┐
│ ENTERPRISE=2 │ ◄──── Highest tier
├──────────────┤
│    PRO=1     │
├──────────────┤
│   FREE=0     │ ◄──── Lowest tier
└──────────────┘

ACCESS RULES:
User Plan │ Can Access FREE? │ Can Access PRO? │ Can Access ENTERPRISE?
──────────┼──────────────────┼─────────────────┼────────────────────────
FREE      │       ✓          │       ✗         │          ✗
PRO       │       ✓          │       ✓         │          ✗
ENTERPRISE│       ✓          │       ✓         │          ✓

SUBSCRIPTION STATUS RULES:
Status    │ Description              │ Access Granted?
──────────┼──────────────────────────┼─────────────────
ACTIVE    │ Paid and current         │       ✓
TRIALING  │ In trial period          │       ✓
PAST_DUE  │ Payment failed           │  ✓ (7-day grace)
INACTIVE  │ No subscription          │       ✗
CANCELED  │ User canceled            │       ✗
```

## Component Integration Pattern

```
┌────────────────────────────────────────────────────────────────┐
│                      Page Component (Server)                    │
│  app/(dashboard)/analytics/page.tsx                             │
│                                                                 │
│  export default async function AnalyticsPage() {                │
│    const session = await auth();                                │
│                                                                 │
│    return (                                                     │
│      <>                                                         │
│        <BasicStats />  ◄── Available to all users              │
│                                                                 │
│        <FeatureGate plan="PLUS">                                 │
│          <AdvancedAnalytics />  ◄── PRO+ only (UX gate)        │
│        </FeatureGate>                                           │
│      </>                                                        │
│    );                                                           │
│  }                                                              │
└────────────────────────────────────────────────────────────────┘
                               ↓
┌────────────────────────────────────────────────────────────────┐
│                  AdvancedAnalytics Component                    │
│  components/analytics/advanced.tsx                              │
│                                                                 │
│  "use client";                                                  │
│                                                                 │
│  function AdvancedAnalytics() {                                 │
│    const [data, setData] = useState(null);                      │
│                                                                 │
│    async function loadData() {                                  │
│      const result = await exportAnalyticsAction();              │
│      // Server action has requirePlan() check                   │
│      if (result.success) setData(result.data);                  │
│    }                                                            │
│                                                                 │
│    return <Chart data={data} />;                                │
│  }                                                              │
└────────────────────────────────────────────────────────────────┘
                               ↓
┌────────────────────────────────────────────────────────────────┐
│                    Server Action (Security Gate)                │
│  actions/analytics/export.ts                                    │
│                                                                 │
│  "use server";                                                  │
│                                                                 │
│  export async function exportAnalyticsAction() {                │
│    const result = await requirePlan("PLUS");  ◄── Security!     │
│                                                                 │
│    if (!result.success) {                                       │
│      return { success: false, error: result.error };            │
│    }                                                            │
│                                                                 │
│    // User is authenticated AND has PRO access                  │
│    const data = await db.analytics.findMany({                   │
│      where: { userId: result.data.user.id }                     │
│    });                                                          │
│                                                                 │
│    return { success: true, data };                              │
│  }                                                              │
└────────────────────────────────────────────────────────────────┘
```

## Grace Period Logic

```
PAST_DUE Grace Period Calculation:

┌─────────────────────────────────────────────────────────────┐
│  Grace Period: 7 days after billing period ends             │
│                                                              │
│  Timeline:                                                   │
│                                                              │
│  ├─────────────┬────────────┬──────────────────────┤        │
│  │   ACTIVE    │   PAST_DUE │      PAST_DUE        │        │
│  │             │  (Day 1-7) │      (Day 8+)        │        │
│  │             │            │                      │        │
│  │  Full       │   Full     │   No Access          │        │
│  │  Access     │   Access   │   (blocked)          │        │
│  │             │            │                      │        │
│  └─────────────┴────────────┴──────────────────────┘        │
│       ↑              ↑              ↑                        │
│   periodEnd    gracePeriodEnd  (present)                    │
│                                                              │
│  Code:                                                       │
│  if (status === "PAST_DUE" && periodEnd) {                  │
│    const gracePeriodEnd = new Date(                         │
│      periodEnd.getTime() + PAST_DUE_GRACE_PERIOD            │
│    );                                                        │
│    if (new Date() <= gracePeriodEnd) {                      │
│      return true; // Still has access                       │
│    }                                                         │
│  }                                                           │
└─────────────────────────────────────────────────────────────┘
```

## File Dependencies

```
src/types/next-auth.d.ts
  ↓ (type definitions)
src/lib/auth/feature-gate.ts
  ├─ hasAccess()
  ├─ requirePlan()
  └─ getPlanHierarchy()
  ↓                    ↓
  ↓                    ↓
CLIENT                 SERVER
  ↓                    ↓
src/components/        src/actions/
feature-gate/          [any]/
  ├─ feature-gate.tsx  [action].ts
  └─ upgrade-card.tsx     │
                          └─ requirePlan("PLUS")
```

## Testing Architecture

```
┌────────────────────────────────────────────────────────────┐
│                    UNIT TESTS                               │
│  tests/unit/auth/feature-gate.test.ts                       │
│                                                             │
│  Test: hasAccess()                                          │
│  ├─ Plan hierarchy (FREE < PRO < ENTERPRISE)               │
│  ├─ Status checks (ACTIVE, TRIALING, PAST_DUE)             │
│  └─ Grace period edge cases                                 │
│                                                             │
│  Test: requirePlan()                                        │
│  ├─ Authentication checks                                   │
│  ├─ Authorization checks                                    │
│  └─ Error messages                                          │
└────────────────────────────────────────────────────────────┘
┌────────────────────────────────────────────────────────────┐
│                  COMPONENT TESTS                            │
│  tests/unit/components/feature-gate.test.tsx                │
│                                                             │
│  Test: FeatureGate                                          │
│  ├─ Renders children when authorized                       │
│  ├─ Shows UpgradeCard when denied                           │
│  ├─ Handles loading states                                  │
│  └─ Custom fallback rendering                               │
└────────────────────────────────────────────────────────────┘
┌────────────────────────────────────────────────────────────┐
│                  E2E TESTS (Optional)                       │
│  tests/e2e/feature-gating.spec.ts                           │
│                                                             │
│  Test: Complete flow                                        │
│  ├─ FREE user blocked from PRO feature                     │
│  ├─ User upgrades → gains access                            │
│  └─ PAST_DUE user within grace → has access                │
└────────────────────────────────────────────────────────────┘
```

---

**Legend**:
- `→` Data flow / transformation
- `↓` Sequential steps
- `├─` Branching logic
- `◄─` Annotation / note
- `✓` Allowed / granted
- `✗` Denied / blocked
