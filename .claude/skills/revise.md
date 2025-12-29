---
name: revise
description: Revise Feature Based on Feedback (project). Apply changes to an in-progress feature based on review feedback.
---

# /revise - Revise Feature Based on Feedback

Apply feedback and revisions to an in-progress feature, maintaining TDD practices and quality standards.

## Usage

```
/revise <feedback>
```

## Arguments

- `$ARGUMENTS` - Feedback description, requested changes, or specific issues to address

## Revision Protocol

### Step 1: Context Analysis

```bash
# Identify current state
git branch --show-current
git status

# Check PR status
gh pr view --json state,checks,reviews

# Understand the feedback scope
```

### Step 2: Feedback Classification

Classify the feedback:

| Category | Examples | Agent Responsible |
|----------|----------|-------------------|
| **Requirements** | Missing AC, scope change | Product Engineer |
| **Architecture** | Design flaw, performance concern | Solution Architect |
| **Backend** | Action logic, database query | Full-Stack Engineer |
| **Frontend** | Component behavior, styling | UI Engineer |
| **Security** | Vulnerability found | Security Engineer |
| **Testing** | Missing test case, coverage gap | Quality Engineer |
| **Deployment** | CI fix, config change | Platform Engineer |

### Step 3: Implement Changes

Based on feedback category, delegate to appropriate agent:

#### Backend Changes
```
@agent:full-stack-engineer
TASK: Apply backend revisions

FEEDBACK: $ARGUMENTS

WORKFLOW:
1. Update/add tests for changed behavior (RED)
2. Modify implementation (GREEN)
3. Refactor if needed (REFACTOR)
4. Verify all tests pass
```

#### Frontend Changes
```
@agent:ui-engineer
TASK: Apply frontend revisions

FEEDBACK: $ARGUMENTS

WORKFLOW:
1. Update/add tests for changed behavior (RED)
2. Modify components (GREEN)
3. Verify accessibility
4. Verify all tests pass
```

#### Mixed Changes

If feedback affects multiple areas, coordinate:

```
@agent:orchestrator
TASK: Coordinate revision across agents

FEEDBACK: $ARGUMENTS

PARALLEL:
- Full-Stack Engineer: [backend aspects]
- UI Engineer: [frontend aspects]

SEQUENTIAL:
- Security Engineer: Re-verify if auth affected
- Quality Engineer: Final verification
```

### Step 4: Verification

```bash
# Run tests
STRIPE_SECRET_KEY="sk_test_mock" npx vitest run

# Type check
pnpm typecheck

# Lint
pnpm lint

# Build
pnpm build
```

### Step 5: Commit and Push

```bash
# Stage changes
git add .

# Commit with descriptive message
git commit -m "fix: [description of changes]

Addresses feedback:
- [Change 1]
- [Change 2]"

# Push to feature branch
git push

# Comment on PR with summary
gh pr comment --body "Applied revisions:

## Changes Made
- [Change 1]
- [Change 2]

## Verification
- All tests pass
- Coverage maintained
- Type check clean
- Lint clean

Ready for re-review."
```

## Revision Categories

### Bug Fixes

```
/revise Fix the validation on email field - it accepts invalid formats
```

Agent: Full-Stack Engineer (validation) + UI Engineer (form feedback)

### UX Improvements

```
/revise Add loading state to submit button
```

Agent: UI Engineer

### Performance

```
/revise The query is slow with large datasets, add pagination
```

Agent: Solution Architect (design) + Full-Stack Engineer (implementation)

### Security

```
/revise Add rate limiting to the login endpoint
```

Agent: Security Engineer (spec) + Full-Stack Engineer (implementation)

### Test Coverage

```
/revise Add tests for the edge case when user has no subscription
```

Agent: Quality Engineer (identify gaps) + appropriate engineer (write tests)

## Revision Report

After completing revisions:

```markdown
## Revision Report

### Feedback Received
[Original feedback]

### Changes Made

| File | Change | Reason |
|------|--------|--------|
| `src/...` | [Change description] | [Addresses feedback X] |

### Tests Updated
- [New/modified test 1]
- [New/modified test 2]

### Verification Results

| Check | Status |
|-------|--------|
| Unit Tests | Pass |
| Coverage | XX% |
| Type Check | Pass |
| Lint | Pass |
| Build | Pass |

### Commits
- `abc1234` - fix: [message]

### Notes
[Any additional context for reviewers]
```

## Examples

```
/revise Add loading state to submit button and disable during submission
/revise Handle network errors gracefully with retry option
/revise Fix the validation on email field - currently accepts "user@"
/revise Add empty state when no items exist
/revise Improve the error message when payment fails
/revise The delete confirmation should require typing the item name
```
