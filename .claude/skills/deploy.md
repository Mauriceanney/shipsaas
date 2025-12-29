---
name: deploy
description: Trigger Deployment (project)
---

# /deploy - Trigger Deployment

Manually trigger deployment operations.

## Usage

```
/deploy [action]
```

## Arguments

- `$ARGUMENTS` - Action: `preview`, `production`, `rollback` (default: production)

## Pre-deployment Checklist

Execute these checks BEFORE any deployment:

```bash
# Verify branch
git branch --show-current

# Check for uncommitted changes
git status --porcelain

# Run tests
STRIPE_SECRET_KEY="sk_test_mock" npx vitest run

# Build verification
pnpm build

# Type check
pnpm typecheck

# Lint check
pnpm lint
```

## Actions

### Production Deployment
```bash
# Trigger deploy workflow
gh workflow run deploy.yml -f environment=production

# Monitor deployment
gh run list --workflow=deploy.yml --limit 1
gh run watch
```

### Preview Deployment
```bash
# Trigger preview deploy
gh workflow run deploy.yml -f environment=preprod

# Monitor
gh run watch
```

### Rollback
```bash
# Trigger rollback
gh workflow run deploy.yml -f action=rollback

# Monitor rollback
gh run watch
```

## Post-deployment Verification

After deployment completes:

```bash
# Check workflow status
gh run list --workflow=deploy.yml --limit 1

# View deployment logs
gh run view --log
```

## Deployment Report

### Summary
- Environment: production/preview
- Version: [commit SHA]
- Deployed at: [timestamp]

### Pre-deployment Checks
- [x] All tests passing
- [x] Build successful
- [x] Type check passed
- [x] Lint check passed

### Deployment Steps
1. [x] Docker image built
2. [x] Image pushed to registry
3. [x] Container deployed
4. [x] Migrations executed
5. [x] Health check passed

### Status: SUCCESS / FAILED

## Example

```
/deploy production
/deploy preview
/deploy rollback
```
