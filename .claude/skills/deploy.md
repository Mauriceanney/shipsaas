---
name: deploy
description: Trigger Deployment (project). Manually trigger deployment operations to preprod or production environments.
---

# /deploy - Trigger Deployment

Manually trigger deployment operations to pre-production or production environments.

## Usage

```
/deploy [environment]
```

## Arguments

- `$ARGUMENTS` - Environment: `preprod`, `production`, `rollback` (default: production)

## Deployment Protocol

### Pre-Deployment Checklist

**MANDATORY** - Run before any deployment:

```bash
# Verify branch
BRANCH=$(git branch --show-current)
echo "Current branch: $BRANCH"

# Must be on main for production, develop for preprod
if [[ "$1" == "production" && "$BRANCH" != "main" ]]; then
  echo "ERROR: Production deploys must be from main"
  exit 1
fi

# Check for uncommitted changes
if [[ -n $(git status --porcelain) ]]; then
  echo "ERROR: Uncommitted changes detected"
  exit 1
fi

# Run tests
STRIPE_SECRET_KEY="sk_test_mock" npx vitest run

# Type check
pnpm typecheck

# Lint
pnpm lint

# Build
pnpm build
```

**Gate**: All checks pass, correct branch

### Environment Matrix

| Environment | Branch | Stack | URL |
|-------------|--------|-------|-----|
| Pre-Production | develop | preprod | preprod.example.com |
| Production | main | saas | app.example.com |

## Deployment Actions

### Pre-Production Deployment

```bash
# Trigger preprod deploy
gh workflow run deploy.yml -f environment=preprod

# Monitor
gh run list --workflow=deploy.yml --limit 1
gh run watch
```

### Production Deployment

```bash
# Trigger production deploy
gh workflow run deploy.yml -f environment=production

# Monitor
gh run list --workflow=deploy.yml --limit 1
gh run watch
```

### Rollback

```bash
# Trigger rollback
gh workflow run deploy.yml -f action=rollback

# Monitor
gh run watch

# Verify rollback
curl -f https://app.example.com/api/health
```

## Deployment Workflow

```
┌─────────────────────────────────────────────────────────────────────┐
│                     DEPLOYMENT PIPELINE                             │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  1. PRE-DEPLOY CHECKS                                               │
│     ├── Branch verification                                         │
│     ├── Test suite                                                  │
│     ├── Type check                                                  │
│     └── Build verification                                          │
│                                                                     │
│  2. BUILD                                                           │
│     ├── Docker image build                                          │
│     └── Push to registry                                            │
│                                                                     │
│  3. DEPLOY                                                          │
│     ├── Pull new image on server                                    │
│     ├── Rolling update (zero downtime)                              │
│     └── Database migrations                                         │
│                                                                     │
│  4. VERIFY                                                          │
│     ├── Health check                                                │
│     ├── Smoke tests                                                 │
│     └── Monitor error rates                                         │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

## Post-Deployment Verification

```bash
# Check workflow status
gh run list --workflow=deploy.yml --limit 1

# View deployment logs
gh run view --log

# Health check (replace with actual URL)
curl -f https://app.example.com/api/health

# Expected response:
# {
#   "status": "ok",
#   "database": "connected",
#   "version": "abc1234"
# }
```

## Deployment Report

```markdown
# Deployment Report

## Summary
- **Environment**: [preprod/production]
- **Version**: [git sha]
- **Deployed at**: [timestamp]
- **Duration**: [total time]
- **Status**: SUCCESS / FAILED

## Pre-Deployment Verification

| Check | Status | Notes |
|-------|--------|-------|
| Branch | Pass | main |
| Clean | Pass | No uncommitted changes |
| Tests | Pass | XX tests, X.Xs |
| Types | Pass | 0 errors |
| Lint | Pass | 0 warnings |
| Build | Pass | Xm Xs |

## Deployment Steps

| Step | Status | Duration |
|------|--------|----------|
| Docker build | Pass | Xm |
| Push to registry | Pass | Xs |
| Pull on server | Pass | Xs |
| Rolling update | Pass | Xm |
| Migrations | Pass | Xs |
| Health check | Pass | Xs |

## Post-Deployment Verification

### Health Check
```json
{
  "status": "ok",
  "database": "connected",
  "version": "[sha]"
}
```

### Key Metrics
| Metric | Before | After | Status |
|--------|--------|-------|--------|
| Response time (p95) | XXms | XXms | OK |
| Error rate | X% | X% | OK |
| Memory | XX% | XX% | OK |

## Rollback Information

- **Previous version**: [previous sha]
- **Rollback command**: `gh workflow run deploy.yml -f action=rollback`
- **Estimated time**: ~2 minutes

## Issues Encountered

None / [List issues and resolutions]

## Monitoring Links

- [Application Dashboard]
- [Error Tracking]
- [Log Aggregation]
```

## Rollback Procedure

If issues detected post-deployment:

```bash
# 1. Confirm rollback needed
gh run list --workflow=deploy.yml --limit 3

# 2. Trigger rollback
gh workflow run deploy.yml -f action=rollback

# 3. Monitor rollback
gh run watch

# 4. Verify rollback success
curl -f https://app.example.com/api/health

# 5. Investigate root cause
gh run view [failed-run-id] --log-failed
```

## Emergency Procedures

### Complete Service Down

```bash
# Check Docker service status
ssh deploy@server "docker service ls"

# Check app logs
ssh deploy@server "docker service logs saas_app --tail 100"

# Force restart
ssh deploy@server "docker service update --force saas_app"
```

### Database Connection Issues

```bash
# Check database container
ssh deploy@server "docker service logs saas_postgres --tail 50"

# Check connection from app
ssh deploy@server "docker exec \$(docker ps -q -f name=saas_app) pg_isready -h postgres"
```

## Safety Rules

1. **Never force-push to main or develop**
2. **Always run pre-deployment checks**
3. **Monitor for 15 minutes post-deploy**
4. **Have rollback plan ready**
5. **Deploy during low-traffic hours for major changes**

## Examples

```
/deploy preprod      # Deploy to pre-production
/deploy production   # Deploy to production
/deploy rollback     # Rollback last deployment
```
