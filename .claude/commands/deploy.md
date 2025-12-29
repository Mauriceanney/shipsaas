# /deploy - Trigger Deployment

Manually trigger deployment to production.

## Usage

```
/deploy [action]
```

Actions: `preview`, `production`, `rollback`

## Workflow

### Preview Deployment
```
/deploy preview
```
- Deploy current branch to preview environment
- Generate preview URL
- Run smoke tests

### Production Deployment
```
/deploy production
```
- Verify on main branch
- Run full test suite
- Trigger GitHub Actions deploy workflow
- Monitor deployment status
- Verify health check

### Rollback
```
/deploy rollback
```
- Trigger rollback workflow
- Restore previous version
- Verify health check

## Pre-deployment Checklist

- [ ] All tests passing
- [ ] Build succeeds
- [ ] No uncommitted changes
- [ ] On correct branch

## Example

```
/deploy production
/deploy rollback
```
