# Observability Setup Guide

Configure analytics, error monitoring, and logging for production monitoring.

## Overview

This project includes:
- **PostHog** - Product analytics, feature flags, and session recordings
- **Sentry** - Error tracking and performance monitoring
- **Pino** - Structured logging

## PostHog Setup

### 1. Create PostHog Account

1. Go to [PostHog](https://posthog.com) and sign up
2. Create a new project
3. Copy your **Project API Key**

### 2. Configure Environment Variables

```env
NEXT_PUBLIC_POSTHOG_KEY=phc_your_project_api_key
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
```

Use `https://eu.i.posthog.com` for EU hosting.

### 3. Add PostHog Provider

The PostHog provider is already configured. Add it to your root layout:

```tsx
// src/app/layout.tsx
import { PostHogProvider } from "@/components/providers/posthog-provider";

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <PostHogProvider>
          {children}
        </PostHogProvider>
      </body>
    </html>
  );
}
```

### 4. Track Custom Events

**Client-side:**
```tsx
"use client";
import posthog from "posthog-js";

function UpgradeButton() {
  const handleClick = () => {
    posthog.capture("upgrade_clicked", {
      plan: "pro",
      source: "pricing_page",
    });
  };

  return <button onClick={handleClick}>Upgrade</button>;
}
```

**Server-side:**
```typescript
import { getServerAnalytics } from "@/lib/analytics/server";

export async function createSubscription(userId: string) {
  const analytics = getServerAnalytics();

  analytics.capture({
    distinctId: userId,
    event: "subscription_created",
    properties: { plan: "pro" },
  });
}
```

### 5. Feature Flags

**Server-side:**
```typescript
import { isFeatureEnabled } from "@/lib/feature-flags/server";

const showNewFeature = await isFeatureEnabled("new-checkout-flow", userId);
```

**Client-side:**
```tsx
import { useFeatureFlag } from "@/lib/feature-flags/client";

function Component() {
  const showBeta = useFeatureFlag("beta-feature");

  if (showBeta) {
    return <BetaFeature />;
  }
  return <CurrentFeature />;
}
```

## Sentry Setup

### 1. Create Sentry Project

1. Go to [Sentry](https://sentry.io) and sign up
2. Create a new Next.js project
3. Copy your **DSN**

### 2. Configure Environment Variables

```env
# Required
NEXT_PUBLIC_SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx

# Optional - for source maps
SENTRY_ORG=your-org
SENTRY_PROJECT=your-project
SENTRY_AUTH_TOKEN=sntrys_xxx

# Environment
NEXT_PUBLIC_SENTRY_ENVIRONMENT=production

# Sample rates (optional - defaults shown)
NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE=0.1
NEXT_PUBLIC_SENTRY_REPLAYS_SESSION_SAMPLE_RATE=0.1
```

### 3. Initialization

Sentry is automatically initialized via Next.js instrumentation. The configuration is in:
- `src/instrumentation.ts` - Server-side initialization
- `src/lib/sentry/config.ts` - Shared configuration

### 4. Manual Error Capture

```typescript
import * as Sentry from "@sentry/nextjs";

try {
  await riskyOperation();
} catch (error) {
  Sentry.captureException(error, {
    tags: { component: "checkout" },
    extra: { userId: user.id },
  });
}
```

### 5. Set User Context

```typescript
import { setSentryUser } from "@/lib/sentry/server";

// After login
setSentryUser({
  id: user.id,
  email: user.email,
  plan: user.subscription?.plan,
});
```

## Pino Logging

### 1. Basic Usage

```typescript
import { logger } from "@/lib/logger";

// Log levels
logger.info("User logged in", { userId: "123" });
logger.warn("Rate limit approaching", { remaining: 5 });
logger.error("Payment failed", { error: err.message });
```

### 2. Child Loggers

```typescript
import { logger } from "@/lib/logger";

const stripeLogger = logger.child({ service: "stripe" });
stripeLogger.info("Webhook received", { event: "checkout.session.completed" });
```

### 3. Request Logging

```typescript
import { createRequestLogger } from "@/lib/logger";

export async function POST(req: Request) {
  const log = createRequestLogger(req);

  log.info("Processing request");
  // ... handle request
  log.info("Request completed", { duration: 123 });
}
```

## Web Vitals

Web Vitals are automatically tracked and sent to PostHog:
- LCP (Largest Contentful Paint)
- FID (First Input Delay)
- CLS (Cumulative Layout Shift)
- FCP (First Contentful Paint)
- TTFB (Time to First Byte)

View in PostHog under **Web Analytics** > **Web Vitals**.

## Best Practices

### Event Naming

Use consistent event naming:
```typescript
// Good - verb_noun format
"subscription_created"
"checkout_started"
"feature_enabled"

// Bad - inconsistent formats
"userClickedButton"
"PAYMENT_MADE"
"login"
```

### Error Grouping

Add context to help Sentry group errors:
```typescript
Sentry.captureException(error, {
  tags: {
    component: "checkout",
    plan: "pro",
  },
  fingerprint: ["checkout-error", plan],
});
```

### Sensitive Data

Never log sensitive data:
```typescript
// Bad
logger.info("User created", { password: user.password });

// Good
logger.info("User created", { userId: user.id, email: user.email });
```

## Dashboards

### PostHog

Create dashboards for:
- User signups and activations
- Subscription metrics (upgrades, downgrades, churn)
- Feature usage
- Funnel analysis (signup → checkout → subscription)

### Sentry

Monitor:
- Error rates by route
- Performance issues
- Release health
- User impact

## Production Checklist

- [ ] PostHog API key configured
- [ ] Sentry DSN configured
- [ ] Sample rates tuned for your traffic
- [ ] Sensitive data redacted from logs
- [ ] Error alerts configured in Sentry
- [ ] Key metrics dashboards created in PostHog
- [ ] Source maps uploaded (optional but recommended)
