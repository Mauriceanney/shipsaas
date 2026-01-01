# Sentry Alerts - Quick Start Guide

Fast-track setup guide for essential Sentry alerts. For comprehensive documentation, see [sentry-alerts.md](./sentry-alerts.md).

## Prerequisites

- [ ] Sentry account with project created
- [ ] `NEXT_PUBLIC_SENTRY_DSN` configured
- [ ] Application deployed and sending events to Sentry

## 5-Minute Setup

### Step 1: Verify Release Tracking (2 min)

Check that releases are being tracked:

1. Deploy your application
2. Go to Sentry → **Releases**
3. Verify your latest commit SHA appears

**If releases are missing:**
- Check `NEXT_PUBLIC_APP_VERSION` is set in environment
- For Vercel: Verify `VERCEL_GIT_COMMIT_SHA` is available
- For Docker: Set `NEXT_PUBLIC_APP_VERSION=$(git rev-parse HEAD)` during build

### Step 2: Create Core Alerts (3 min)

**Alert 1: Error Rate Spike**
```
Navigate: Alerts → Create Alert Rule → Issues Alert
Name: Error Rate Spike
Condition: Number of events > 50 in 1 hour
Environment: production
Action: Slack #alerts + Email engineering@yourcompany.com
```

**Alert 2: Payment Errors**
```
Navigate: Alerts → Create Alert Rule → Issues Alert
Name: Payment Errors
Condition: Number of events > 5 in 10 minutes
Filter: tags.component equals "stripe" OR message contains "payment"
Environment: production
Action: Slack #payments + Email finance@yourcompany.com
Priority: High
```

**Alert 3: Authentication Failures**
```
Navigate: Alerts → Create Alert Rule → Issues Alert
Name: High Auth Failures
Condition: Number of events > 100 in 5 minutes
Filter: message contains "Invalid credentials"
Environment: production
Action: Slack #security + Email security@yourcompany.com
```

### Step 3: Connect Slack (Optional)

1. **Settings** → **Integrations** → **Slack**
2. Click "Add Workspace"
3. Authorize Sentry app
4. Map channels:
   - `#alerts` - General errors
   - `#security` - Auth failures
   - `#payments` - Payment issues

Done! You now have basic alerting coverage.

## Alert Summary

| Alert | Threshold | Purpose | Priority |
|-------|-----------|---------|----------|
| Error Rate Spike | 50/hour | Catch deployment regressions | Medium |
| Payment Errors | 5/10min | Revenue impact | High |
| Auth Failures | 100/5min | Potential attacks | High |

## Next Steps

- [ ] Add performance alerts (optional)
- [ ] Configure PagerDuty for critical alerts
- [ ] Create custom dashboard
- [ ] Set up weekly review process

For detailed configuration and best practices, see [sentry-alerts.md](./sentry-alerts.md).

## Testing

Test that alerts work:

1. Create test endpoint:
```typescript
// src/app/api/test-sentry/route.ts
import { captureException } from "@/lib/sentry";
import { NextResponse } from "next/server";

export async function GET() {
  captureException(new Error("Test alert"));
  return NextResponse.json({ ok: true });
}
```

2. Call endpoint: `curl https://yourapp.com/api/test-sentry`
3. Wait 2 minutes
4. Verify Slack/email notification received
5. Delete test endpoint

## Troubleshooting

**No alerts triggering?**
- Check alert rule is enabled (not muted)
- Verify environment filter matches deployed environment
- Confirm Slack/email integration is connected

**Too many alerts?**
- Increase thresholds (50 → 100 errors)
- Add filters to exclude known issues
- Use alert grouping by `transaction` or `error.type`

**Missing releases?**
- Set `NEXT_PUBLIC_APP_VERSION` in environment
- Check Sentry auth token is configured (CI/CD)
- Verify build process uploads source maps

## Support

- Full documentation: [sentry-alerts.md](./sentry-alerts.md)
- Sentry docs: https://docs.sentry.io/product/alerts/
- Sentry status: https://status.sentry.io/

---

Last updated: 2026-01-01
