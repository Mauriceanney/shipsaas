---
name: status
description: Project Status Report (project). Get comprehensive status of the project including issues, PRs, tests, coverage, and CI.
---

# /status - Project Status Report

Get comprehensive status of the project and current development work.

## Usage

```
/status [area]
```

## Arguments

- `$ARGUMENTS` - Optional focus area: `all`, `issues`, `prs`, `tests`, `coverage`, `ci`, `branch`, `health`

## Quick Commands

### Full Status (Default)

```bash
# Git status
git branch --show-current
git status --short

# Issues
gh issue list --state open --limit 10

# PRs
gh pr list --state open

# CI
gh run list --limit 3

# Tests
STRIPE_SECRET_KEY="sk_test_mock" npx vitest run --reporter=basic 2>&1 | tail -20
```

### Issues Focus

```bash
# Open issues by label
gh issue list --state open --label "feature" --limit 10
gh issue list --state open --label "bug" --limit 10
gh issue list --state open --label "enhancement" --limit 10

# Recently closed
gh issue list --state closed --limit 5
```

### PRs Focus

```bash
# Open PRs
gh pr list --state open

# PR details
gh pr view [number] --json title,state,checks,reviews

# PR checks
gh pr checks [number]
```

### Tests Focus

```bash
# Run tests
STRIPE_SECRET_KEY="sk_test_mock" npx vitest run

# Run with verbose output
STRIPE_SECRET_KEY="sk_test_mock" npx vitest run --reporter=verbose
```

### Coverage Focus

```bash
# Generate coverage
STRIPE_SECRET_KEY="sk_test_mock" npx vitest run --coverage

# View summary
cat coverage/coverage-summary.json 2>/dev/null || echo "Run tests with --coverage first"
```

### CI Focus

```bash
# Recent runs
gh run list --limit 5

# View specific run
gh run view [run-id]

# Failed job logs
gh run view [run-id] --log-failed
```

### Branch Focus

```bash
# Current branch
git branch --show-current

# Status
git status

# Recent commits
git log --oneline -10

# Ahead/behind main
git rev-list --left-right --count main...HEAD
```

### Health Focus

```bash
# Type check
pnpm typecheck

# Lint
pnpm lint

# Build
pnpm build
```

## Status Report Format

```markdown
# Project Status Report

Generated: [timestamp]

## Git Status

- **Branch**: `feature/xxx`
- **Status**: [Clean / X files changed]
- **Position**: X commits ahead of main

## Issues Summary

| Label | Open | In Progress |
|-------|------|-------------|
| feature | X | X |
| bug | X | X |
| enhancement | X | X |

### Active Issues
| # | Title | Assignee | Labels |
|---|-------|----------|--------|
| #X | [Title] | @user | feature |

## Pull Requests

| # | Title | Status | Checks | Reviews |
|---|-------|--------|--------|---------|
| #X | [Title] | Open | Pass/Fail | 0/1 |

### PR Details
- **Current PR**: #X or None
- **CI Status**: Passing / Failing
- **Review Status**: Approved / Pending / Changes Requested

## Test Results

### Unit Tests
| Suite | Total | Passed | Failed | Skipped |
|-------|-------|--------|--------|---------|
| Actions | X | X | 0 | 0 |
| Components | X | X | 0 | 0 |
| Utils | X | X | 0 | 0 |

**Total Runtime**: X.XXs

### Coverage

| Metric | Current | Threshold | Status |
|--------|---------|-----------|--------|
| Statements | XX% | 80% | Pass/Fail |
| Branches | XX% | 70% | Pass/Fail |
| Functions | XX% | 80% | Pass/Fail |
| Lines | XX% | 80% | Pass/Fail |

## CI/CD Status

### Recent Runs
| # | Workflow | Status | Duration | Triggered |
|---|----------|--------|----------|-----------|
| X | CI | Pass | Xm | 1h ago |
| X | CI | Fail | Xm | 2h ago |

### Current Pipeline
- **Status**: Running / Passed / Failed
- **Duration**: Xm Xs
- **Jobs**: lint ✓ typecheck ✓ test ✓ build ✓

## Health Checks

| Check | Status | Notes |
|-------|--------|-------|
| TypeScript | Pass/Fail | X errors |
| ESLint | Pass/Fail | X warnings |
| Build | Pass/Fail | Xm build time |

## Recent Activity

### Commits (Last 5)
| SHA | Message | Author | Time |
|-----|---------|--------|------|
| abc1234 | feat: ... | user | 1h ago |

### Merged PRs (Last 3)
| # | Title | Merged |
|---|-------|--------|
| #X | [Title] | 1d ago |

## Blockers & Warnings

### Blockers
- [None / List blocking issues]

### Warnings
- [Coverage dropping]
- [Flaky test detected]

## Next Steps

1. [Recommended action based on status]
2. [Second recommendation]
```

## Examples

```
/status           # Full status report
/status tests     # Just test results
/status prs       # Just PR status
/status ci        # Just CI status
/status coverage  # Just coverage report
/status branch    # Just git branch status
/status health    # Just health checks
```
