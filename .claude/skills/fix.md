---
name: fix
description: Quick Bug Fix (project). Fast-track workflow for fixing bugs without full feature orchestration.
---

# /fix - Quick Bug Fix

Fast-track workflow for fixing bugs. Simpler than `/ship`, designed for targeted fixes with minimal overhead.

## Usage

```
/fix <bug-description>
/fix #<issue-number>
```

## Arguments

- `$ARGUMENTS` - Bug description or GitHub issue number

## When to Use

Use `/fix` instead of `/ship` when:
- Fixing a specific, isolated bug
- Change affects 1-3 files
- No new features or significant refactoring
- Clear cause and solution

Use `/ship` when:
- Building new features
- Multiple components affected
- Requires design decisions
- Significant scope

## Fix Protocol

### Step 1: Understand the Bug

```bash
# If issue number provided
gh issue view $ARGUMENTS

# Check recent changes that might have caused it
git log --oneline -10 --all

# Search for related code
grep -r "related-keyword" src/
```

### Step 2: Reproduce & Locate

Identify:
- **Symptoms**: What's happening?
- **Expected**: What should happen?
- **Location**: Which file(s)?
- **Cause**: Why is it broken?

### Step 3: TDD Fix

```
@agent:full-stack-engineer OR @agent:ui-engineer

TASK: Fix bug using TDD

1. Write a failing test that reproduces the bug
2. Implement the fix (minimum change)
3. Verify test passes
4. Run full test suite to check for regressions
```

```bash
# Write test first
# tests/unit/[location]/bug-fix.test.ts

# Run to confirm it fails
STRIPE_SECRET_KEY="sk_test_mock" npx vitest run tests/unit/[location]/bug-fix.test.ts

# Implement fix

# Run to confirm it passes
STRIPE_SECRET_KEY="sk_test_mock" npx vitest run tests/unit/[location]/bug-fix.test.ts

# Run full suite
STRIPE_SECRET_KEY="sk_test_mock" npx vitest run
```

### Step 4: Verify

```bash
# Type check
pnpm typecheck

# Lint
pnpm lint

# All tests pass
STRIPE_SECRET_KEY="sk_test_mock" npx vitest run
```

### Step 5: Commit & PR

```bash
# Create fix branch (if not already on one)
git checkout -b fix/[issue-number]-[short-description]

# Commit
git add .
git commit -m "fix: [description]

Fixes #[issue-number]"

# Push
git push -u origin fix/[issue-number]-[short-description]

# Create PR
gh pr create --title "fix: [description]" --body "## Summary
Fixes [brief description of bug]

## Root Cause
[What caused the bug]

## Solution
[How it was fixed]

## Testing
- [x] Added regression test
- [x] All tests pass

Fixes #[issue-number]"
```

## Fix Report

```markdown
## Bug Fix Report

### Bug
- **Issue**: #[number] or [description]
- **Symptoms**: [what was happening]
- **Location**: `[file:line]`

### Root Cause
[Why the bug occurred]

### Solution
[What was changed]

### Files Modified
| File | Change |
|------|--------|
| `[file]` | [description] |

### Testing
- [x] Regression test added: `[test file]`
- [x] All tests pass
- [x] No type errors
- [x] No lint errors

### PR
- PR: #[number]
- Branch: `fix/[description]`
```

## Examples

```
/fix Login button not responding on mobile
/fix #123
/fix Email validation accepts invalid formats
/fix Dashboard crashes when user has no subscription
```
