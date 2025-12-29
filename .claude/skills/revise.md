---
name: revise
description: Revise Feature Based on Feedback (project)
---

# /revise - Revise Feature Based on Feedback

Apply feedback and revisions to an in-progress feature.

## Usage

```
/revise <feedback>
```

## Arguments

- `$ARGUMENTS` - Feedback description or requested changes

## Workflow

### Step 1: Analyze Feedback

Parse the feedback and identify:
- Affected components/files
- Type of changes needed (fix, enhancement, refactor)
- Priority and scope

### Step 2: Verify Current State

```bash
# Check current branch
git branch --show-current

# Check PR status
gh pr view --json state,checks

# Check for uncommitted changes
git status
```

### Step 3: Implement Changes

Apply changes following TDD methodology:

1. **Update Tests** (if behavior changes)
   - Modify existing tests
   - Add new test cases

2. **Modify Implementation**
   - Apply requested changes
   - Ensure no regressions

3. **Verify**
   ```bash
   # Run tests
   STRIPE_SECRET_KEY="sk_test_mock" npx vitest run

   # Type check
   pnpm typecheck

   # Lint
   pnpm lint
   ```

### Step 4: Commit and Push

```bash
# Stage changes
git add .

# Commit with descriptive message
git commit -m "fix: [description of changes]"

# Push to feature branch
git push

# Comment on PR with summary
gh pr comment --body "Applied revisions:
- [change 1]
- [change 2]
"
```

## Revision Report

### Feedback Summary
[Original feedback]

### Changes Made
| File | Change Type | Description |
|------|-------------|-------------|
| file.tsx | Modified | [description] |

### Test Results
| Suite | Status |
|-------|--------|
| Unit Tests | Pass/Fail |
| Type Check | Pass/Fail |
| Lint | Pass/Fail |

### Commits
- `abc123` - fix: [message]

## Example

```
/revise Add loading state to submit button
/revise Handle network errors gracefully
/revise Fix the validation on email field
```
