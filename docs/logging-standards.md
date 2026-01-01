# Logging Standards

## Overview

This project uses structured JSON logging with [pino](https://getpino.io/) for production-grade observability, security, and debugging.

## Quick Start

```typescript
import { logger } from "@/lib/logger";

// Info logging
logger.info({ userId, action: "profile_updated" }, "User profile updated successfully");

// Error logging with error object
try {
  await riskyOperation();
} catch (error) {
  logger.error({ err: error, userId }, "Failed to update user profile");
}

// Warning
logger.warn({ subscriptionId, status: "past_due" }, "Payment failed for subscription");

// Debug (only in development)
logger.debug({ requestId, duration: 150 }, "API request completed");
```

## Why Structured Logging?

### Problems with `console.log`

```typescript
// ❌ BAD: Unstructured, no context, hard to query
console.log("User logged in");
console.error("Failed to send email:", error);

// Issues:
// - No user ID or timestamp
// - No correlation ID for request tracking
// - String concatenation loses type information
// - Can't query logs by field (e.g., "all login failures")
// - May leak sensitive data (passwords, tokens)
```

### Benefits of Structured Logger

```typescript
// ✅ GOOD: Structured, contextual, queryable
logger.info({ userId: "user-123", method: "email" }, "User logged in");
logger.error({ err: error, userId: "user-123" }, "Failed to send email");

// Benefits:
// - Automatic timestamp, level, hostname
// - Contextual data as JSON fields (queryable!)
// - Automatic sensitive data redaction
// - Request correlation with requestId
// - Pretty output in dev, JSON in prod
// - Ready for log aggregation (Datadog, New Relic, etc.)
```

## Core Principles

### 1. Context First, Message Second

```typescript
// Pattern: logger.level({ context }, "message")
logger.info(
  { 
    userId: "user-123",
    plan: "PRO",
    amount: 2999,
    subscriptionId: "sub_xyz"
  },
  "Subscription created"
);
```

### 2. Use Appropriate Log Levels

| Level | When to Use | Example |
|-------|-------------|---------|
| `debug` | Development debugging, verbose details | Request/response bodies, internal state |
| `info` | Normal operations, state changes | User actions, cron jobs completed |
| `warn` | Recoverable errors, degraded state | Retry logic triggered, fallback used |
| `error` | Failures requiring attention | Payment failed, email not sent, DB error |

### 3. Always Include Context

```typescript
// ❌ BAD: No context
logger.info({}, "Payment processed");

// ✅ GOOD: Rich context
logger.info({
  userId: "user-123",
  subscriptionId: "sub_xyz",
  amount: 2999,
  currency: "USD",
  paymentMethod: "card"
}, "Payment processed successfully");
```

### 4. Use `err` for Error Objects

```typescript
// ✅ Always use `err` key for Error objects (pino serializes them)
try {
  await db.user.create({ data });
} catch (error) {
  logger.error(
    { 
      err: error,  // ← IMPORTANT: use `err` key
      userId,
      operation: "create_user"
    },
    "Failed to create user"
  );
}
```

### 5. Never Log Sensitive Data

The logger automatically redacts these fields:
- `password`
- `token`
- `secret`
- `apiKey`
- `accessToken`
- `refreshToken`
- `privateKey`
- `creditCard`
- `ssn`

```typescript
// Safe - password auto-redacted
logger.info({ email, password: "secret123" }, "Login attempt");
// Output: { email: "user@example.com", password: "[REDACTED]" }

// But better to just not log it
logger.info({ email }, "Login attempt");
```

## Common Patterns

### Server Actions

```typescript
"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";

export async function updateProfile(input: unknown) {
  // 1. Auth check
  const session = await auth();
  if (!session?.user?.id) {
    logger.warn({ input }, "Unauthorized profile update attempt");
    return { success: false, error: "Unauthorized" };
  }

  const userId = session.user.id;

  // 2. Validation
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    logger.warn({ userId, errors: parsed.error.errors }, "Invalid input for profile update");
    return { success: false, error: "Invalid input" };
  }

  // 3. Operation
  try {
    const user = await db.user.update({
      where: { id: userId },
      data: parsed.data,
    });

    logger.info({ userId, fields: Object.keys(parsed.data) }, "Profile updated successfully");
    return { success: true, data: user };
  } catch (error) {
    logger.error({ err: error, userId }, "Failed to update profile");
    return { success: false, error: "Update failed" };
  }
}
```

### API Routes (Webhooks, Cron Jobs)

```typescript
import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { createRequestLogger } from "@/lib/logger";

export async function POST(req: NextRequest) {
  // Create request-scoped logger with correlation ID
  const requestLogger = createRequestLogger(req.headers.get("x-request-id") ?? undefined);

  try {
    const body = await req.json();

    requestLogger.info({ eventType: body.type }, "Webhook received");

    // Process webhook...
    const result = await processWebhook(body);

    requestLogger.info({ eventId: body.id, result }, "Webhook processed successfully");

    return NextResponse.json({ success: true });
  } catch (error) {
    requestLogger.error({ err: error }, "Webhook processing failed");
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
```

### Stripe Webhooks

```typescript
import { logger } from "@/lib/logger";
import type Stripe from "stripe";

export async function handleSubscriptionCreated(sub: Stripe.Subscription) {
  const userId = sub.metadata?.userId;

  if (!userId) {
    logger.warn({ subscriptionId: sub.id }, "No userId in subscription metadata");
    return;
  }

  try {
    // Create subscription in DB...

    logger.info({
      userId,
      subscriptionId: sub.id,
      plan,
      status: sub.status,
      trialEnd: sub.trial_end,
    }, "Subscription created");
  } catch (error) {
    logger.error({
      err: error,
      userId,
      subscriptionId: sub.id,
    }, "Failed to create subscription in database");
    throw error;
  }
}
```

### Email Operations

```typescript
import { logger } from "@/lib/logger";

export async function sendWelcomeEmail(userId: string, email: string) {
  try {
    await emailClient.send({
      to: email,
      template: "welcome",
    });

    logger.info({ userId, email }, "Welcome email sent");
  } catch (error) {
    logger.error({
      err: error,
      userId,
      email,
      template: "welcome",
    }, "Failed to send welcome email");
    // Don't throw - email failures should be graceful
  }
}
```

### Cron Jobs

```typescript
import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const token = authHeader?.replace("Bearer ", "");

  if (token !== process.env.CRON_SECRET) {
    logger.warn({ path: req.nextUrl.pathname }, "Unauthorized cron job access attempt");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  logger.info({}, "Starting dunning email cron job");

  try {
    const subscriptions = await findPastDueSubscriptions();

    logger.info({ count: subscriptions.length }, "Found past due subscriptions");

    for (const sub of subscriptions) {
      try {
        await sendDunningEmail(sub);
        logger.info({ subscriptionId: sub.id, userId: sub.userId }, "Dunning email sent");
      } catch (error) {
        logger.error({ err: error, subscriptionId: sub.id }, "Failed to send dunning email");
        // Continue with next subscription
      }
    }

    logger.info({ processed: subscriptions.length }, "Dunning email cron job completed");

    return NextResponse.json({ success: true, processed: subscriptions.length });
  } catch (error) {
    logger.error({ err: error }, "Dunning email cron job failed");
    return NextResponse.json({ error: "Job failed" }, { status: 500 });
  }
}
```

## Approved Exceptions

### Client-Side Error Boundaries

```typescript
// src/app/error.tsx
"use client";

export default function Error({ error }: { error: Error }) {
  // ✅ OK: Client-side console for browser DevTools
  console.error(error);

  return <div>Something went wrong</div>;
}
```

### Environment Validation (Startup)

```typescript
// src/lib/env.ts

// ✅ OK: Startup validation before logger is initialized
if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not set");
  process.exit(1);
}
```

## Log Output

### Development (Pretty)

```
[14:23:45] INFO: User logged in
    userId: "user-123"
    method: "email"
    ip: "192.168.1.1"
```

### Production (JSON)

```json
{
  "level": 30,
  "time": 1704123825000,
  "msg": "User logged in",
  "userId": "user-123",
  "method": "email",
  "ip": "192.168.1.1",
  "hostname": "app-server-1",
  "pid": 12345
}
```

## Querying Logs

With structured logs, you can query by any field:

```bash
# Find all errors for a specific user
cat logs.json | jq 'select(.userId == "user-123" and .level == 50)'

# Find all payment failures
cat logs.json | jq 'select(.msg | contains("Payment failed"))'

# Find all slow requests (>1s)
cat logs.json | jq 'select(.duration > 1000)'
```

## Migration from console.*

### Before

```typescript
console.log("User logged in:", userId);
console.error("Payment failed:", error);
console.warn("Retrying request");
```

### After

```typescript
import { logger } from "@/lib/logger";

logger.info({ userId }, "User logged in");
logger.error({ err: error, userId, subscriptionId }, "Payment failed");
logger.warn({ attempt: 2, maxAttempts: 3 }, "Retrying request");
```

## ESLint Rule

The `no-console` ESLint rule is enabled to prevent accidental `console.*` usage:

```json
{
  "rules": {
    "no-console": ["warn", { "allow": [] }]
  },
  "overrides": [
    {
      "files": ["*.test.ts", "*.test.tsx", "src/app/**/error.tsx", "src/lib/env.ts"],
      "rules": {
        "no-console": "off"
      }
    }
  ]
}
```

## Resources

- [Pino Documentation](https://getpino.io/)
- [12-Factor App: Logs](https://12factor.net/logs)
- [Structured Logging Best Practices](https://www.honeycomb.io/blog/structured-logging-best-practices)

---

**Status**: ✅ Infrastructure Complete
**Next Steps**: Migrate existing `console.*` calls to structured logger
**Related**: Issue #174
