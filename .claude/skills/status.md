---
name: status
description: Project Status Report (project)
---

# /status - Project Status Report

Get comprehensive status of the project and current work.

## Usage

```
/status [area]
```

## Arguments

- `$ARGUMENTS` - Optional area: `all`, `issues`, `prs`, `tests`, `coverage`, `ci`, `branch`

## Commands to Execute

```bash
# Issues Summary
gh issue list --state open --limit 20

# PRs Summary
gh pr list --state open

# CI Status
gh run list --limit 5

# Test Status
STRIPE_SECRET_KEY="sk_test_mock" npx vitest run --reporter=basic

# Coverage
STRIPE_SECRET_KEY="sk_test_mock" npx vitest run --coverage

# Branch Status
git status
git log --oneline -5
```

## Report Format

### Issues Summary
| Label | Open | Closed (7d) |
|-------|------|-------------|
| feature | X | X |
| bug | X | X |
| epic | X | X |

### PRs Summary
| # | Title | Status | Checks |
|---|-------|--------|--------|
| X | Title | Open/Draft | Pass/Fail |

### Test Status
| Suite | Total | Passed | Failed |
|-------|-------|--------|--------|
| Unit | X | X | X |
| E2E | X | X | X |

### Coverage
| Metric | Current | Threshold | Status |
|--------|---------|-----------|--------|
| Statements | X% | 80% | Pass/Fail |
| Branches | X% | 70% | Pass/Fail |
| Functions | X% | 80% | Pass/Fail |
| Lines | X% | 80% | Pass/Fail |

### CI Status
| Run | Status | Duration |
|-----|--------|----------|
| #X | Success/Failed | Xm Xs |

### Branch Status
- Current: `branch-name`
- Ahead/Behind: X commits ahead, X behind main
- Uncommitted: X files changed

## Example

```
/status           # Full status report
/status tests     # Just test status
/status prs       # Just PR status
/status ci        # Just CI status
```