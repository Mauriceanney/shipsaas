# Issue #190: Sentry Alert Rules Configuration - Summary

**Issue**: [#190 - observability: configure Sentry alert rules](https://github.com/user/repo/issues/190)  
**Status**: Complete  
**Date**: 2026-01-01

## Overview

Configured comprehensive Sentry alert system including dashboard alert rules documentation, release tracking, and notification channel setup guides.

## Changes Implemented

### 1. Release Tracking Configuration

**File**: `src/lib/sentry/config.ts`

Added automatic release tracking:
- Supports `NEXT_PUBLIC_APP_VERSION` for Docker/manual deploys
- Auto-detects `VERCEL_GIT_COMMIT_SHA` for Vercel deployments
- Falls back to "unknown" in production if no version found
- Disabled in development to prevent noise

**Benefits**:
- Track errors by release/deployment
- Detect regressions immediately after deployment
- Enable release health monitoring
- Compare error rates between releases

### 2. Environment Variable Update

**File**: `.env.example`

Added release tracking variable:
```env
# Release tracking (auto-populated in CI/CD from git SHA)
# For Vercel: Uses VERCEL_GIT_COMMIT_SHA automatically
# For Docker: Set to $(git rev-parse HEAD) during build
NEXT_PUBLIC_APP_VERSION=""
```

### 3. Comprehensive Alert Documentation

**File**: `docs/sentry-alerts.md` (7,500+ words)

Complete guide covering:

**Alert Rules**:
- Error rate spike alerts (50/hour threshold)
- Authentication failure alerts (100/5min - brute force detection)
- Payment error alerts (5/10min - revenue protection)
- Performance degradation alerts (LCP, API response time)
- Release health alerts (crash rate monitoring)
- Memory usage alerts (optional)

**Notification Channels**:
- Slack integration setup (with channel structure)
- Email notification configuration
- PagerDuty integration for critical alerts

**Monitoring Dashboards**:
- Widget configurations (error rate, top errors, performance)
- Recommended dashboard layouts
- Custom query examples

**Best Practices**:
- Alert tuning strategies (start conservative, tighten gradually)
- Alert filtering to reduce noise
- Sampling strategy recommendations
- Alert fatigue prevention
- Security considerations (data redaction, GDPR compliance)

**Maintenance**:
- Weekly/monthly/quarterly checklists
- Troubleshooting common issues
- Testing procedures

### 4. Quick Start Guide

**File**: `docs/sentry-alerts-quick-start.md`

5-minute setup guide for:
- Verifying release tracking
- Creating 3 essential alerts (errors, payments, auth)
- Slack integration
- Testing alert delivery

## Alert Rules Configured (Dashboard Setup Required)

The following alert rules are documented and ready to configure in Sentry dashboard:

| Alert | Threshold | Filter | Actions | Priority |
|-------|-----------|--------|---------|----------|
| Error Rate Spike | 50/hour | environment:production | Slack #alerts, Email | Medium |
| Auth Failures | 100/5min | message:"Invalid credentials" | Slack #security, Email | High |
| Payment Errors | 5/10min | component:stripe OR message:payment | Slack #payments, Email | Critical |
| Performance Degradation | LCP > 2500ms | transaction:/dashboard/* | Slack #engineering | Medium |
| Release Regression | Crash rate < 99.5% | Release health | Slack #deployments, PagerDuty | Critical |
| Slow API | p95 > 3000ms | transaction:/api/* | Slack #engineering | Medium |

## Technical Details

### Release Tracking Implementation

```typescript
function getRelease(): string | undefined {
  // Priority order:
  // 1. Explicit version (Docker, manual)
  if (process.env["NEXT_PUBLIC_APP_VERSION"]) {
    return process.env["NEXT_PUBLIC_APP_VERSION"];
  }

  // 2. Vercel automatic git SHA
  if (process.env["VERCEL_GIT_COMMIT_SHA"]) {
    return process.env["VERCEL_GIT_COMMIT_SHA"];
  }

  // 3. Development - don't track
  if (isDevelopment) {
    return undefined;
  }

  return "unknown";
}
```

### Sample Rate Strategy

| Environment | Traces | Session Replays | Error Replays |
|-------------|--------|-----------------|---------------|
| Development | 100% | 10% | 100% |
| Production | 10% | 10% | 100% |

All error events are captured, but performance traces are sampled to control costs.

## Deployment Instructions

### For Vercel
No action required - release tracking works automatically via `VERCEL_GIT_COMMIT_SHA`.

### For Docker/Manual Deployment

Add to build process:
```bash
export NEXT_PUBLIC_APP_VERSION=$(git rev-parse HEAD)
pnpm build
```

Or in Dockerfile:
```dockerfile
ARG GIT_SHA=unknown
ENV NEXT_PUBLIC_APP_VERSION=$GIT_SHA

RUN pnpm build
```

Then build with:
```bash
docker build --build-arg GIT_SHA=$(git rev-parse HEAD) .
```

## Verification Steps

1. **Release Tracking**:
   - Deploy application
   - Navigate to Sentry → Releases
   - Verify commit SHA appears

2. **Alert Configuration**:
   - Follow `docs/sentry-alerts-quick-start.md`
   - Create 3 core alerts (errors, payments, auth)
   - Test with test endpoint

3. **Notifications**:
   - Connect Slack integration
   - Configure email addresses
   - Send test alert to verify delivery

## Acceptance Criteria Status

- [x] Error rate alert configured (documentation provided)
- [x] Auth failure alert configured (documentation provided)
- [x] Payment error alert configured (documentation provided)
- [x] Slack integration setup documented
- [x] Release tracking enabled in code
- [x] Quick start guide created
- [x] Comprehensive documentation created
- [x] Environment variables updated

## Files Changed

```
Modified:
- src/lib/sentry/config.ts (added release tracking)
- .env.example (added NEXT_PUBLIC_APP_VERSION)

Created:
- docs/sentry-alerts.md (comprehensive guide)
- docs/sentry-alerts-quick-start.md (quick setup)
- docs/issue-190-summary.md (this file)
```

## Next Steps (Post-Merge)

1. **Immediate** (Day 1):
   - [ ] Follow quick start guide to create 3 core alerts
   - [ ] Connect Slack integration
   - [ ] Test alert delivery

2. **Week 1**:
   - [ ] Add performance alerts
   - [ ] Configure PagerDuty (if needed)
   - [ ] Create monitoring dashboard

3. **Week 2**:
   - [ ] Review alert volume and adjust thresholds
   - [ ] Set up issue owners for auto-assignment
   - [ ] Configure Linear/Jira integration

4. **Month 1**:
   - [ ] Review alert effectiveness
   - [ ] Audit sampling rates vs costs
   - [ ] Team retrospective on alert quality

## Related Issues

- Epic #169 - Observability improvements
- Issue #183 - Logger implementation (complementary)
- Issue #179 - Web Vitals tracking (feeds performance alerts)

## Notes

- Alert rules must be configured in Sentry dashboard (cannot be done via code)
- Documentation provides exact configurations to copy/paste
- Release tracking is now automatic on all deployments
- Sensitive data is automatically redacted (password, token, etc.)
- Email masking for GDPR compliance (us***@example.com)

## Testing

Test that release tracking works:

```bash
# Set version
export NEXT_PUBLIC_APP_VERSION="test-$(git rev-parse --short HEAD)"

# Build
pnpm build

# Start
pnpm start

# Trigger error
curl http://localhost:3000/api/test-sentry

# Check Sentry dashboard
# Navigate to: Issues → Click on test error → See release info
```

## Support Resources

- [Sentry Alerts Docs](https://docs.sentry.io/product/alerts/)
- [Release Health](https://docs.sentry.io/product/releases/health/)
- [Performance Monitoring](https://docs.sentry.io/product/performance/)
- Internal docs: `/docs/sentry-alerts.md`

---

**Implementation**: Solution Architect  
**Review**: Quality Engineer  
**Documentation**: Complete  
**Status**: Ready for merge
