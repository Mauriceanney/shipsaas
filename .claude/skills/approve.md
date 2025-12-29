---
name: approve
description: Approve and Merge Feature (project). Review, verify quality gates, approve, and merge a feature PR.
---

# /approve - Approve and Merge Feature

Review, verify all quality gates, approve, and merge a feature PR.

## Usage

```
/approve [pr-number]
```

## Arguments

- `$ARGUMENTS` - PR number (optional, uses current branch PR if not provided)

## Approval Protocol

### Step 1: Identify PR

```bash
# If PR number provided
gh pr view $ARGUMENTS --json number,title,body,state,checks,reviews,files

# If no PR number, use current branch
gh pr view --json number,title,body,state,checks,reviews,files

# Get linked issue
gh pr view [pr-number] --json body | grep -oE '#[0-9]+'
```

### Step 2: CI Verification

```bash
# Check CI status
gh pr checks [pr-number]

# All checks must pass:
# - lint
# - typecheck
# - test
# - build
# - security (if applicable)
```

**Gate**: All CI checks green

### Step 3: Local Verification

```bash
# Checkout PR branch
gh pr checkout [pr-number]

# Run full test suite
STRIPE_SECRET_KEY="sk_test_mock" npx vitest run

# Check coverage
STRIPE_SECRET_KEY="sk_test_mock" npx vitest run --coverage

# Type check
pnpm typecheck

# Lint check
pnpm lint

# Build verification
pnpm build
```

**Gate**: All local checks pass

### Step 4: Code Review Checklist

#### Architecture
- [ ] Follows established patterns
- [ ] No unnecessary complexity
- [ ] Proper separation of concerns
- [ ] Consistent with existing codebase

#### Backend
- [ ] Auth checked in all server actions
- [ ] Authorization verified (ownership)
- [ ] Input validated with Zod
- [ ] Errors handled gracefully
- [ ] Cache revalidated appropriately

#### Frontend
- [ ] Server Components where possible
- [ ] Client Components only when necessary
- [ ] Accessibility (WCAG 2.1 AA)
- [ ] Responsive design
- [ ] Loading/error/empty states

#### Testing
- [ ] TDD methodology followed
- [ ] Coverage >= 80%
- [ ] All AC have corresponding tests
- [ ] Edge cases covered

#### Security
- [ ] No sensitive data exposed
- [ ] OWASP Top 10 considered
- [ ] No hardcoded secrets
- [ ] Proper error messages (no info leakage)

### Step 5: Acceptance Criteria Verification

```bash
# View the linked issue
gh issue view [issue-number]

# For each AC, verify:
# - Implementation matches requirement
# - Test exists that validates the AC
```

| # | Acceptance Criterion | Implementation | Test | Status |
|---|---------------------|----------------|------|--------|
| AC1 | [Criterion] | [File:Line] | [Test file] | Verified |
| AC2 | [Criterion] | [File:Line] | [Test file] | Verified |
| AC3 | [Criterion] | [File:Line] | [Test file] | Verified |

### Step 6: Approval Decision

#### If All Gates Pass

```bash
# Approve the PR
gh pr review [pr-number] --approve --body "Approved.

## Verification Complete

### CI Status
All checks passing.

### Local Verification
- Unit Tests: Pass
- Coverage: XX%
- Type Check: Pass
- Lint: Pass
- Build: Pass

### Code Review
All checklist items verified.

### Acceptance Criteria
All AC verified with tests.

**Status: APPROVED**"
```

#### If Issues Found

```bash
# Request changes
gh pr review [pr-number] --request-changes --body "Changes requested.

## Issues Found

### [Issue 1]
- **Location**: `file.ts:line`
- **Issue**: [Description]
- **Suggestion**: [How to fix]

### [Issue 2]
...

**Status: BLOCKED**

Please address these issues and re-request review."
```

### Step 7: Merge (If Approved)

```bash
# Squash and merge
gh pr merge [pr-number] --squash --delete-branch

# Close linked issue
gh issue close [issue-number]
```

## Approval Report

```markdown
# Approval Report

## PR Summary
- **PR**: #[number]
- **Title**: [title]
- **Author**: [author]
- **Files Changed**: [count]
- **Issue**: #[issue-number]

## CI Status

| Check | Status | Duration |
|-------|--------|----------|
| lint | Pass | Xs |
| typecheck | Pass | Xs |
| test | Pass | Xm |
| build | Pass | Xm |
| security | Pass | Xs |

## Quality Metrics

| Metric | Value | Threshold | Status |
|--------|-------|-----------|--------|
| Test Coverage | XX% | 80% | Pass |
| Type Errors | 0 | 0 | Pass |
| Lint Errors | 0 | 0 | Pass |

## Code Review

### Architecture
- [x] Follows patterns
- [x] No unnecessary complexity

### Backend
- [x] Auth checked
- [x] Input validated
- [x] Errors handled

### Frontend
- [x] Accessibility verified
- [x] Responsive design
- [x] States handled

### Security
- [x] No vulnerabilities
- [x] No exposed secrets

## Acceptance Criteria

| # | Criterion | Status |
|---|-----------|--------|
| AC1 | [Criterion] | Verified |
| AC2 | [Criterion] | Verified |

## Decision

**Status**: APPROVED / BLOCKED

### If Approved
- PR merged via squash
- Branch deleted
- Issue closed

### If Blocked
- Issues documented in PR comments
- Awaiting fixes
```

## Examples

```
/approve 42          # Approve PR #42
/approve             # Approve current branch's PR
```
