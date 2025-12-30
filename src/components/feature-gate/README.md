# FeatureGate Component

Client-side feature gating based on subscription plans. Automatically shows upgrade CTAs for users without access.

## Usage

### Basic Usage

```tsx
import { FeatureGate } from "@/components/feature-gate";

export function AnalyticsPage() {
  return (
    <div>
      <h1>Analytics Dashboard</h1>

      {/* Free tier content - always visible */}
      <BasicAnalytics />

      {/* PRO tier feature - gated */}
      <FeatureGate plan="PRO">
        <AdvancedAnalytics />
      </FeatureGate>

      {/* ENTERPRISE tier feature - gated */}
      <FeatureGate plan="ENTERPRISE">
        <CustomReports />
      </FeatureGate>
    </div>
  );
}
```

### Custom Fallback

Provide a custom upgrade message instead of the default UpgradeCard:

```tsx
<FeatureGate
  plan="PRO"
  fallback={
    <Alert>
      <AlertTitle>Premium Feature</AlertTitle>
      <AlertDescription>
        This feature requires a Pro subscription.
        <Link href="/pricing">View plans</Link>
      </AlertDescription>
    </Alert>
  }
>
  <PremiumFeature />
</FeatureGate>
```

### Inline Feature Toggle

Use for small UI elements:

```tsx
<div>
  <FeatureGate plan="PRO" fallback={<Button disabled>Export (Pro)</Button>}>
    <Button onClick={handleExport}>Export to CSV</Button>
  </FeatureGate>
</div>
```

## Plan Hierarchy

Plans follow a hierarchy where higher tiers have access to lower tier features:

```
FREE < PRO < ENTERPRISE
```

- **FREE users**: No access to PRO or ENTERPRISE features
- **PRO users**: Access to PRO features, but not ENTERPRISE
- **ENTERPRISE users**: Access to all features

## Valid Subscription States

The component grants access only when the subscription status is:
- `ACTIVE` - Actively subscribed and paid
- `TRIALING` - In trial period

Denied for:
- `INACTIVE` - No active subscription
- `CANCELED` - Subscription canceled
- `PAST_DUE` - Payment failed (grace period handled server-side)

## Component Props

### FeatureGate

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `plan` | `"PRO" \| "ENTERPRISE"` | Yes | Minimum plan required |
| `children` | `ReactNode` | Yes | Content to show if user has access |
| `fallback` | `ReactNode` | No | Custom fallback UI (default: UpgradeCard) |

### UpgradeCard

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `requiredPlan` | `"PRO" \| "ENTERPRISE"` | Yes | Plan to upgrade to |
| `title` | `string` | No | Custom card title |
| `description` | `string` | No | Custom card description |

## Helper Function

For programmatic access checks:

```tsx
import { hasClientAccess } from "@/components/feature-gate";

function MyComponent() {
  const { data: session } = useSession();

  const canExport = hasClientAccess(
    session?.subscription,
    "PRO"
  );

  return (
    <Button disabled={!canExport} onClick={handleExport}>
      {canExport ? "Export" : "Export (Pro only)"}
    </Button>
  );
}
```

## Server-Side Alternative

For server components, use the server-side access check:

```tsx
// app/analytics/page.tsx
import { auth } from "@/lib/auth";
import { hasServerAccess } from "@/lib/subscription/access";
import { UpgradeCard } from "@/components/feature-gate";

export default async function AnalyticsPage() {
  const session = await auth();
  const hasAccess = await hasServerAccess(session?.user?.id, "PRO");

  if (!hasAccess) {
    return <UpgradeCard requiredPlan="PRO" />;
  }

  return <PremiumAnalytics />;
}
```

## Session Requirements

The FeatureGate component requires the session to include subscription data. This is already configured in `src/lib/auth/config.ts`:

```ts
// Session callback includes subscription
session({ session, token }) {
  session.subscription = token["subscription"];
  return session;
}
```

## Accessibility

- Upgrade CTAs are keyboard navigable
- Proper ARIA labels on interactive elements
- Icon decorations marked with `aria-hidden="true"`
- Links have descriptive text
- Focus indicators visible on all interactive elements

## Testing

Example test:

```tsx
import { render, screen } from "@testing-library/react";
import { useSession } from "next-auth/react";
import { FeatureGate } from "@/components/feature-gate";

vi.mock("next-auth/react");

it("shows content for PRO users", () => {
  vi.mocked(useSession).mockReturnValue({
    data: {
      user: { id: "1", role: "USER" },
      subscription: { plan: "PRO", status: "ACTIVE" },
    },
    status: "authenticated",
  });

  render(
    <FeatureGate plan="PRO">
      <div>Premium Content</div>
    </FeatureGate>
  );

  expect(screen.getByText("Premium Content")).toBeInTheDocument();
});
```

## UTM Tracking

Upgrade links include UTM parameters for analytics:

```
/pricing?source=feature_gate&plan=PRO
```

This allows tracking which features drive upgrade conversions.
