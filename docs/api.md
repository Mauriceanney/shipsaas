# API Documentation

This document describes all API endpoints available in the ShipSaaS application.

## Table of Contents

- [Health Check](#health-check)
- [Session Validation](#session-validation)
- [Stripe Endpoints](#stripe-endpoints)
  - [Checkout](#checkout)
  - [Customer Portal](#customer-portal)
  - [Subscription Management](#subscription-management)
  - [Webhooks](#webhooks)
- [Cron Jobs](#cron-jobs)
  - [Dunning Emails](#dunning-emails)
  - [Subscription Suspension](#subscription-suspension)
  - [Account Cleanup](#account-cleanup)

---

## Health Check

Check the health status of the application and its dependencies.

### Endpoint

```
GET /api/health
```

### Authentication

None required (public endpoint).

### Response

```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "services": {
    "database": {
      "status": "connected",
      "latency_ms": 5
    },
    "redis": {
      "status": "connected",
      "latency_ms": 2
    }
  }
}
```

### Status Codes

| Status | Meaning |
|--------|---------|
| 200 | Healthy or Degraded (partial functionality) |
| 503 | Unhealthy (all services down) |

### Health States

| State | Description |
|-------|-------------|
| `healthy` | All services connected |
| `degraded` | One service disconnected |
| `unhealthy` | All services disconnected |

### Integration Examples

**Docker Health Check:**
```dockerfile
HEALTHCHECK --interval=30s --timeout=3s \
  CMD curl -f http://localhost:3000/api/health || exit 1
```

**Kubernetes Probe:**
```yaml
livenessProbe:
  httpGet:
    path: /api/health
    port: 3000
  initialDelaySeconds: 15
  periodSeconds: 20
```

---

## Session Validation

Validate if the current user session is still active and not revoked.

### Endpoint

```
GET /api/session/validate
```

### Authentication

Requires valid session cookie (automatic via browser).

### Response

```json
{
  "valid": true
}
```

### Usage

This endpoint is used by the client to check if a session is still valid, particularly useful for:
- Detecting session revocation
- Handling multi-device logout
- Session timeout checks

---

## Stripe Endpoints

### Checkout

Create a Stripe Checkout session for subscription purchase.

#### Endpoint

```
POST /api/stripe/checkout
```

#### Authentication

Requires authenticated session.

#### Request Body

```json
{
  "priceId": "price_xxx",
  "successUrl": "/dashboard?success=true",
  "cancelUrl": "/pricing?canceled=true"
}
```

#### Response

```json
{
  "sessionId": "cs_xxx",
  "url": "https://checkout.stripe.com/..."
}
```

---

### Customer Portal

Create a Stripe Customer Portal session for subscription management.

#### Endpoint

```
POST /api/stripe/portal
```

#### Authentication

Requires authenticated session with active subscription.

#### Response

```json
{
  "url": "https://billing.stripe.com/..."
}
```

---

### Subscription Management

Get or cancel the current user's subscription.

#### Get Subscription

```
GET /api/stripe/subscription
```

#### Cancel Subscription

```
DELETE /api/stripe/subscription
```

Both require authenticated session.

---

### Webhooks

Handle Stripe webhook events for payment and subscription lifecycle.

#### Endpoint

```
POST /api/webhooks/stripe
```

#### Required Headers

| Header | Description |
|--------|-------------|
| `stripe-signature` | Stripe webhook signature for verification |

#### Setup Instructions

**1. Configure Webhook Secret:**

Add to your `.env` file:
```bash
STRIPE_WEBHOOK_SECRET=whsec_xxx
```

**2. Local Development with Stripe CLI:**

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login to Stripe
stripe login

# Forward webhooks to local server
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

**3. Production Setup:**

1. Go to [Stripe Dashboard > Webhooks](https://dashboard.stripe.com/webhooks)
2. Click "Add endpoint"
3. Set URL to: `https://yourdomain.com/api/webhooks/stripe`
4. Select events to listen:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.paid`
   - `invoice.payment_failed`
5. Copy the signing secret to `STRIPE_WEBHOOK_SECRET`

#### Handled Events

| Event | Action |
|-------|--------|
| `checkout.session.completed` | Creates subscription record, tracks promo code usage |
| `customer.subscription.created` | Creates/updates subscription |
| `customer.subscription.updated` | Updates subscription status and plan |
| `customer.subscription.deleted` | Marks subscription as cancelled |
| `invoice.paid` | Sends receipt email |
| `invoice.payment_failed` | Sends payment failed email |

---

## Cron Jobs

All cron jobs require the `x-cron-secret` header for authentication.

### Configuration

Add to your `.env` file:
```bash
CRON_SECRET=your-secret-here
```

### Dunning Emails

Send reminder emails for past-due subscriptions.

#### Endpoint

```
GET /api/cron/send-dunning-emails
```

#### Required Headers

| Header | Value |
|--------|-------|
| `x-cron-secret` | Your CRON_SECRET |

#### Schedule

Recommended: Daily at 9:00 AM

**Vercel Cron:**
```json
{
  "crons": [{
    "path": "/api/cron/send-dunning-emails",
    "schedule": "0 9 * * *"
  }]
}
```

**External Cron Service:**
```bash
curl -X GET https://yourdomain.com/api/cron/send-dunning-emails \
  -H "x-cron-secret: your-secret-here"
```

#### Dunning Schedule

| Day | Action |
|-----|--------|
| Day 3 | Friendly reminder email |
| Day 7 | Final warning email |
| Day 10 | Subscription suspended (separate cron) |

#### Response

```json
{
  "success": true,
  "message": "Processed 5 dunning candidates",
  "day3Sent": 3,
  "day7Sent": 2
}
```

---

### Subscription Suspension

Suspend subscriptions that have been past due for 10+ days.

#### Endpoint

```
GET /api/cron/suspend-subscriptions
```

#### Required Headers

| Header | Value |
|--------|-------|
| `x-cron-secret` | Your CRON_SECRET |

#### Schedule

Recommended: Daily at 10:00 AM (after dunning emails)

```json
{
  "crons": [{
    "path": "/api/cron/suspend-subscriptions",
    "schedule": "0 10 * * *"
  }]
}
```

#### Response

```json
{
  "success": true,
  "message": "Suspended 2 subscriptions",
  "suspended": 2
}
```

---

### Account Cleanup

Remove soft-deleted user accounts after grace period (30 days).

#### Endpoint

```
GET /api/cron/cleanup-deleted-accounts
```

#### Required Headers

| Header | Value |
|--------|-------|
| `x-cron-secret` | Your CRON_SECRET |

#### Schedule

Recommended: Weekly on Sunday at 2:00 AM

```json
{
  "crons": [{
    "path": "/api/cron/cleanup-deleted-accounts",
    "schedule": "0 2 * * 0"
  }]
}
```

#### Response

```json
{
  "success": true,
  "message": "Cleaned up 3 deleted accounts",
  "deleted": 3
}
```

---

## Error Handling

All API endpoints follow a consistent error format:

```json
{
  "error": "Error message here"
}
```

### Common HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 400 | Bad Request (invalid input) |
| 401 | Unauthorized (not authenticated) |
| 403 | Forbidden (not authorized) |
| 404 | Not Found |
| 500 | Internal Server Error |

---

## Rate Limiting

API endpoints are protected by rate limiting:

| Endpoint Type | Limit |
|--------------|-------|
| General API | 100 requests/minute |
| Auth endpoints | 10 requests/minute |
| Webhooks | 1000 requests/minute |

Rate limit headers are included in responses:
- `X-RateLimit-Limit`: Maximum requests allowed
- `X-RateLimit-Remaining`: Requests remaining
- `X-RateLimit-Reset`: Timestamp when limit resets
