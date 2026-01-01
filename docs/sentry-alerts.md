# Sentry Alert Configuration

Complete guide for setting up Sentry alerts and monitoring for production environments.

## Overview

This guide covers:
- Alert rule configuration in Sentry dashboard
- Notification channel setup (Slack, Email, PagerDuty)
- Release tracking and deployment monitoring
- Best practices for alert tuning

## Prerequisites

- Sentry account with organization and project created
- `NEXT_PUBLIC_SENTRY_DSN` configured in environment variables
- Sentry Auth Token for release tracking (CI/CD)
- Admin access to Sentry project settings

## Release Tracking

### Environment Variables

Add to your `.env` file:

```env
# Sentry Configuration
NEXT_PUBLIC_SENTRY_DSN="https://xxx@xxx.ingest.sentry.io/xxx"
SENTRY_ORG="your-org-name"
SENTRY_PROJECT="your-project-name"
SENTRY_AUTH_TOKEN="sntrys_xxx" # For release uploads

# Environment (production, staging, development)
NEXT_PUBLIC_SENTRY_ENVIRONMENT="production"

# Optional: Debug mode for testing
NEXT_PUBLIC_SENTRY_DEBUG="false"

# Release identifier (auto-populated in CI/CD)
NEXT_PUBLIC_APP_VERSION="${VERCEL_GIT_COMMIT_SHA:-local}"
```

### CI/CD Integration

Release tracking is automatically configured when deploying via Vercel or Docker:

**Vercel:**
- `VERCEL_GIT_COMMIT_SHA` is automatically available
- Releases are created during build process
- Source maps uploaded automatically

**Docker/Manual Deployment:**
```bash
# Set during build
export NEXT_PUBLIC_APP_VERSION=$(git rev-parse HEAD)
pnpm build

# Sentry CLI will create release and upload source maps
```

### Verify Release Tracking

After deployment, check Sentry:
1. Navigate to **Releases** in Sentry dashboard
2. Verify your latest commit SHA appears
3. Click release to see associated errors and deploys

## Alert Rules Configuration

### 1. Error Rate Spike Alert

**Purpose**: Detect sudden increases in error volume

**Configuration:**
1. Navigate to **Alerts** → **Create Alert Rule**
2. Select "Issues" alert type
3. Configure:

```yaml
Alert Name: "Error Rate Spike"
Environment: production
Conditions:
  - When: Number of events
  - In an issue: is greater than 50
  - Time interval: 1 hour
  - Filter by:
      environment: production
      level: error
Filters (Optional):
  - Exclude: transaction: "/api/health"
  - Exclude: transaction: "/api/metrics"
Actions:
  - Send notification to: #alerts (Slack)
  - Send email to: engineering@yourcompany.com
```

**Why this matters**: Catches unexpected error spikes that could indicate:
- Deployment regressions
- Third-party service outages
- DDoS attacks
- Database issues

### 2. Authentication Failure Alert

**Purpose**: Detect potential brute force attacks or authentication system issues

**Configuration:**

```yaml
Alert Name: "High Authentication Failures"
Environment: production
Conditions:
  - When: Number of events
  - For the issue: is greater than 100
  - Time interval: 5 minutes
  - Filter by:
      message: contains "Invalid credentials"
      environment: production
Actions:
  - Send notification to: #security (Slack)
  - Send email to: security@yourcompany.com
Priority: High
```

**Why this matters**: Indicates:
- Potential brute force attacks
- Credential stuffing attempts
- Auth service degradation
- User experience issues

### 3. Payment Error Alert

**Purpose**: Catch revenue-impacting payment failures

**Configuration:**

```yaml
Alert Name: "Payment Processing Errors"
Environment: production
Conditions:
  - When: Number of events
  - For the issue: is greater than 5
  - Time interval: 10 minutes
  - Filter by:
      tags.component: stripe
      OR message: contains "payment"
      environment: production
Actions:
  - Send notification to: #payments (Slack)
  - Send email to: finance@yourcompany.com
  - Send to: PagerDuty (if configured)
Priority: Critical
```

**Why this matters**: Direct revenue impact:
- Stripe webhook failures
- Payment processing errors
- Subscription renewal issues
- Checkout failures

### 4. Performance Degradation Alert

**Purpose**: Detect slow page loads and API responses

**Configuration:**

```yaml
Alert Name: "Performance Degradation"
Type: Metric Alert
Environment: production
Conditions:
  - When: Average of measurements.lcp
  - Is above: 2500ms (Poor LCP threshold)
  - Time interval: 10 minutes
  - Filter by:
      transaction: /dashboard/*
      environment: production
Actions:
  - Send notification to: #engineering (Slack)
  - Send email to: performance-team@yourcompany.com
```

**Additional Performance Alerts:**

**Slow API Responses:**
```yaml
Alert Name: "Slow API Response Time"
Metric: avg(transaction.duration)
Threshold: > 3000ms
Transaction: /api/*
Interval: 5 minutes
```

**High Error Rate (Percentage):**
```yaml
Alert Name: "High Error Rate"
Metric: failure_rate()
Threshold: > 5%
Interval: 10 minutes
```

### 5. Release Health Alert

**Purpose**: Catch regressions immediately after deployment

**Configuration:**

```yaml
Alert Name: "Release Regression Detected"
Type: Release Health Alert
Environment: production
Conditions:
  - When: Crash Free Session Rate
  - For the release: drops below 99.5%
  - Time interval: 1 hour
Actions:
  - Send notification to: #deployments (Slack)
  - Send email to: oncall@yourcompany.com
  - Create PagerDuty incident
Auto-resolve: When crash rate returns above threshold
```

**Why this matters**:
- Immediate notification of deployment issues
- Enables quick rollback decisions
- Tracks session stability over time

### 6. High Memory Usage Alert (Optional)

**Purpose**: Detect memory leaks or resource exhaustion

```yaml
Alert Name: "High Memory Usage"
Type: Metric Alert
Metric: avg(measurements.memory)
Threshold: > 90%
Environment: production
Interval: 15 minutes
```

## Notification Channels

### 1. Slack Integration

**Setup:**
1. In Sentry: **Settings** → **Integrations** → **Slack**
2. Click "Add Workspace"
3. Authorize Sentry app in your Slack workspace
4. Configure channels:
   - `#alerts` - General error alerts
   - `#security` - Security-related alerts
   - `#payments` - Payment/revenue alerts
   - `#deployments` - Release and deployment alerts

**Recommended Channel Structure:**
```
#alerts          → All error rate spikes, general issues
#security        → Auth failures, suspicious activity
#payments        → Payment errors, Stripe webhooks
#deployments     → Release health, deploy notifications
#performance     → Slow queries, high latency
```

### 2. Email Notifications

**Setup:**
1. **Settings** → **Notifications** → **Email**
2. Add email addresses:
   - `engineering@yourcompany.com` - General alerts
   - `security@yourcompany.com` - Security alerts
   - `finance@yourcompany.com` - Payment alerts
   - `oncall@yourcompany.com` - Critical alerts

**Best Practice**: Use team aliases instead of individual emails

### 3. PagerDuty Integration (Optional)

**For Critical Alerts Only:**
1. **Settings** → **Integrations** → **PagerDuty**
2. Connect your PagerDuty account
3. Map Sentry projects to PagerDuty services
4. Configure only P0/Critical alerts to page on-call

**Recommended PagerDuty Rules:**
- Payment errors (revenue impact)
- Release crash rate > 1%
- Database connection failures
- Complete service outages

## Alert Tuning Best Practices

### 1. Start Conservative

Begin with higher thresholds and gradually tighten:
- Week 1: 100 errors/hour → Observe baseline
- Week 2: 75 errors/hour → Adjust based on patterns
- Week 3: 50 errors/hour → Final threshold

### 2. Use Alert Filtering

**Ignore Known Issues:**
```yaml
Filters:
  - Exclude: error.type: "NEXT_REDIRECT"
  - Exclude: error.type: "NEXT_NOT_FOUND"
  - Exclude: message: contains "chrome-extension://"
```

**Focus on Critical Paths:**
```yaml
Filter:
  - Include: transaction: /api/checkout
  - Include: transaction: /api/webhooks/stripe
  - Include: transaction: /dashboard/*
```

### 3. Alert Grouping

Group related alerts to prevent notification fatigue:
- Group by: `transaction`, `error.type`, `release`
- Use: "Issue Owners" for automatic assignment
- Set: Auto-resolve after 24 hours of no activity

### 4. Sampling Strategy

For high-traffic apps, use sampling to control volume:

```env
# Production - 10% of traces, 100% of errors
NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE=0.1
NEXT_PUBLIC_SENTRY_REPLAYS_SESSION_SAMPLE_RATE=0.1
NEXT_PUBLIC_SENTRY_REPLAYS_ON_ERROR_SAMPLE_RATE=1.0
```

**Sampling Recommendations:**

| Metric | Development | Staging | Production |
|--------|-------------|---------|------------|
| Traces | 100% | 50% | 10% |
| Session Replays | 10% | 10% | 5-10% |
| Error Replays | 100% | 100% | 100% |

## Monitoring Dashboards

### Create Custom Dashboard

1. Navigate to **Dashboards** → **Create Dashboard**
2. Add widgets:

**Error Rate Widget:**
```
Type: Line Chart
Query: count() by release
Group by: release
Display: Last 24 hours
```

**Top Errors Widget:**
```
Type: Table
Query: count() by error.type
Order by: count desc
Limit: 10
```

**Performance Widget:**
```
Type: Line Chart
Metric: p95(transaction.duration)
Group by: transaction
Filter: transaction.op:http.server
```

**Release Health Widget:**
```
Type: Release Health
Display: Crash Free Sessions
Period: Last 7 days
```

### Recommended Dashboard Layout

```
┌─────────────────────────────────────────────────┐
│ Release Health (7 days)                         │
├─────────────────────┬───────────────────────────┤
│ Error Rate Trend    │ Top 10 Errors             │
│ (24h)               │ (by count)                │
├─────────────────────┼───────────────────────────┤
│ P95 Response Time   │ Active Issues             │
│ (by endpoint)       │ (unresolved)              │
├─────────────────────┴───────────────────────────┤
│ Recent Deployments & Release Comparison         │
└─────────────────────────────────────────────────┘
```

## Issue Workflow Integration

### Issue Owners

Auto-assign issues to the right team:

1. Create `.github/CODEOWNERS` file
2. In Sentry: **Settings** → **Issue Owners**
3. Configure ownership rules:

```
# Authentication issues → Security team
path:src/actions/auth/* security-team@yourcompany.com
path:src/lib/auth/* security-team@yourcompany.com

# Payment issues → Finance team
path:src/actions/stripe/* finance-team@yourcompany.com
path:src/lib/stripe/* finance-team@yourcompany.com

# Admin features → Admin team
path:src/app/(admin)/* admin-team@yourcompany.com
```

### Linear/Jira Integration

Automatically create tickets for recurring issues:

1. **Settings** → **Integrations** → **Linear** (or Jira)
2. Connect your workspace
3. Configure auto-create rules:
   - Issue seen > 50 times
   - Issue affects > 100 users
   - Critical errors (payment, auth)

## Testing Alerts

### Test Error Capture

Add a test endpoint (remove after verification):

```typescript
// src/app/api/test-sentry/route.ts
import { captureException } from "@/lib/sentry";
import { NextResponse } from "next/server";

export async function GET() {
  // Test error capture
  captureException(new Error("Test error from Sentry alert setup"));
  
  return NextResponse.json({ 
    message: "Test error sent to Sentry. Check dashboard in 1-2 minutes." 
  });
}
```

**Verification Steps:**
1. Call the test endpoint: `curl https://yourapp.com/api/test-sentry`
2. Wait 1-2 minutes
3. Check Sentry dashboard for the error
4. Verify Slack/email notification received
5. Delete the test endpoint

### Test Alert Rules

**Method 1: Lower Threshold Temporarily**
1. Edit alert rule
2. Set threshold to 1 event in 1 minute
3. Trigger test error
4. Verify notification
5. Restore original threshold

**Method 2: Use Sentry's Test Feature**
1. Open alert rule
2. Click "Send Test Alert"
3. Verify notification received

## Security Considerations

### 1. Sensitive Data Redaction

Already configured in `/src/lib/sentry/config.ts`:

```typescript
// Automatically redacted fields
const SENSITIVE_FIELDS = [
  "password", "token", "secret", "apiKey",
  "authorization", "cookie", "creditCard", "ssn", "cvv"
];
```

### 2. GDPR Compliance

User emails are automatically masked:
- `user@example.com` → `us***@example.com`
- User IDs are hashed
- PII is never logged in breadcrumbs

### 3. Rate Limit Alert Context

When creating alerts for rate limit events, avoid logging:
- IP addresses (already masked)
- Email addresses (already masked)
- Request payloads

## Alert Fatigue Prevention

### Signs of Alert Fatigue
- Alerts ignored in Slack
- Email alerts auto-filtered
- Same issues triggering repeatedly
- Team stops investigating alerts

### Solutions

**1. Increase Thresholds**
```yaml
# Before: Too noisy
Threshold: > 10 errors/hour

# After: More actionable
Threshold: > 50 errors/hour
```

**2. Add Severity Levels**
```yaml
Critical: Payment errors, auth system down
High: Error rate > 100/hour
Medium: Error rate > 50/hour
Low: Error rate > 25/hour (monitor only)
```

**3. Auto-Resolve Stale Alerts**
```yaml
Auto-resolve: After 24 hours of inactivity
Re-trigger: If issue recurs within 7 days
```

**4. Scheduled Quiet Hours**
```yaml
# Mute non-critical alerts during off-hours
Mute window: 10pm - 8am (except Critical)
```

## Maintenance Checklist

### Weekly
- [ ] Review triggered alerts
- [ ] Adjust thresholds if too noisy
- [ ] Resolve or archive stale issues
- [ ] Check dashboard for trends

### Monthly
- [ ] Review alert coverage (are we missing critical paths?)
- [ ] Update ownership rules as team changes
- [ ] Verify notification channels still active
- [ ] Archive resolved issues older than 90 days

### Quarterly
- [ ] Audit alert effectiveness (false positive rate)
- [ ] Review sampling rates vs. costs
- [ ] Update documentation with new patterns
- [ ] Team retrospective on alert quality

## Common Issues & Troubleshooting

### Alerts Not Triggering

**Symptoms**: No notifications despite errors in Sentry

**Checklist**:
1. Verify alert rule is enabled (not muted)
2. Check environment filter matches (production vs staging)
3. Verify notification channel is connected
4. Check Sentry quota limits (not exceeded)
5. Review alert rule conditions (threshold too high?)

### Too Many Alerts

**Symptoms**: Constant notifications, team ignoring alerts

**Solutions**:
1. Increase thresholds (50 → 100 errors)
2. Add environment filters (exclude staging)
3. Exclude known errors (NEXT_REDIRECT, etc.)
4. Group similar issues together
5. Use alert digests instead of real-time

### Missing Releases

**Symptoms**: No release information in Sentry

**Checklist**:
1. Verify `NEXT_PUBLIC_APP_VERSION` is set
2. Check `SENTRY_AUTH_TOKEN` is configured (CI/CD)
3. Verify build process uploads source maps
4. Check Sentry CLI output for errors
5. Review `.sentryclirc` configuration (if using)

### Email Notifications Not Received

**Checklist**:
1. Check spam folder
2. Verify email address in Sentry settings
3. Check organization-level notification settings
4. Verify alert action includes "Send email"
5. Check Sentry service status

## Resources

- [Sentry Alerts Documentation](https://docs.sentry.io/product/alerts/)
- [Sentry Best Practices](https://docs.sentry.io/product/best-practices/)
- [Release Health Monitoring](https://docs.sentry.io/product/releases/health/)
- [Performance Monitoring](https://docs.sentry.io/product/performance/)

## Support

For issues with Sentry setup:
1. Check Sentry status: https://status.sentry.io/
2. Review Sentry docs: https://docs.sentry.io/
3. Contact support: https://sentry.io/support/

---

Last updated: 2026-01-01
