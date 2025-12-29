---
name: approve
description: Approve and Merge Feature (project)
---

# /approve - Approve and Merge Feature

Review, approve, and merge a feature PR.

## Usage

```
/approve [pr-number]
```

## Arguments

- `$ARGUMENTS` - PR number (optional, uses current branch PR if not provided)

## Workflow

### Step 1: Fetch PR Details

```bash
# Get PR info (use $ARGUMENTS or current branch)
gh pr view [pr-number] --json title,body,commits,files,reviews,checks

# Get linked issues
gh pr view [pr-number] --json body | grep -oE '#[0-9]+'
```

### Step 2: Quality Checks

```bash
# Check CI status
gh pr checks [pr-number]

# Run local tests
STRIPE_SECRET_KEY="sk_test_mock" npx vitest run

# Check coverage
STRIPE_SECRET_KEY="sk_test_mock" npx vitest run --coverage

# Type check
pnpm typecheck

# Lint
pnpm lint
```

### Step 3: Code Review Checklist

- [ ] All CI checks pass
- [ ] Test coverage >= 80%
- [ ] No type errors
- [ ] No lint errors
- [ ] Code follows project standards
- [ ] Security considerations addressed
- [ ] Acceptance criteria met

### Step 4: Merge

```bash
# Squash and merge
gh pr merge [pr-number] --squash --delete-branch

# Close linked issues
gh issue close [issue-number]
```

## Approval Report

### PR Summary
- PR: #[number]
- Title: [title]
- Author: [author]
- Files changed: [count]

### Quality Checks
| Check | Status |
|-------|--------|
| CI Pipeline | Pass/Fail |
| Unit Tests | Pass/Fail |
| Coverage (80%) | Pass/Fail |
| Type Check | Pass/Fail |
| Lint | Pass/Fail |

### Acceptance Criteria
| # | Criterion | Status |
|---|-----------|--------|
| AC1 | [criterion] | Verified |
| AC2 | [criterion] | Verified |

### Decision: APPROVED / REJECTED

## Example

```
/approve 42
/approve        # Uses current branch PR
```
