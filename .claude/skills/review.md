---
name: review
description: Code Review (project). Review code changes for quality, patterns, security, and best practices.
---

# /review - Code Review

Review code changes for quality, adherence to patterns, security, and best practices.

## Usage

```
/review [target]
```

## Arguments

- `$ARGUMENTS` - Optional target: PR number, branch name, file path, or `staged` for staged changes

## Review Protocol

### Reviewers

```
@agent:quality-engineer - Code quality, tests, coverage
@agent:security-engineer - Security concerns
@agent:solution-architect - Architecture patterns
```

### Step 1: Identify Changes

```bash
# If PR number
gh pr view $ARGUMENTS --json files,additions,deletions
gh pr diff $ARGUMENTS

# If branch
git diff main...$ARGUMENTS

# If staged
git diff --cached

# If file path
git diff HEAD -- $ARGUMENTS
```

### Step 2: Quality Review

```
@agent:quality-engineer

CHECKLIST:
- [ ] Code follows project patterns
- [ ] TypeScript strict (no `any`)
- [ ] Tests exist for new code
- [ ] Coverage maintained
- [ ] No console.log
- [ ] Error handling correct
```

### Step 3: Security Review

```
@agent:security-engineer

CHECKLIST:
- [ ] Auth checked
- [ ] Authorization verified
- [ ] Input validated
- [ ] No sensitive data exposed
- [ ] Error messages safe
```

### Step 4: Architecture Review

```
@agent:solution-architect

CHECKLIST:
- [ ] Follows existing patterns
- [ ] No unnecessary complexity
- [ ] Proper separation of concerns
- [ ] Performance considered
```

## Review Checklist

### TypeScript / Code Quality
- [ ] No `any` types
- [ ] Proper error handling (no throws in actions)
- [ ] No unused variables/imports
- [ ] Consistent naming conventions
- [ ] No magic numbers/strings

### React / Next.js
- [ ] Server Components where possible
- [ ] "use client" only when needed
- [ ] Proper use of hooks
- [ ] No prop drilling (use context if needed)
- [ ] Keys on list items

### Server Actions
- [ ] Auth check first
- [ ] Zod validation
- [ ] Ownership verification
- [ ] Error returns (not throws)
- [ ] revalidatePath called

### Testing
- [ ] Tests written (TDD)
- [ ] Tests are meaningful
- [ ] Edge cases covered
- [ ] Mocks properly cleaned up

### Security
- [ ] No hardcoded secrets
- [ ] Input sanitized
- [ ] Output escaped
- [ ] No SQL injection risk
- [ ] No XSS risk

### Accessibility
- [ ] Semantic HTML
- [ ] ARIA labels where needed
- [ ] Keyboard navigation
- [ ] Color contrast

### Performance
- [ ] No N+1 queries
- [ ] Proper pagination
- [ ] Images optimized
- [ ] No memory leaks

## Review Report

```markdown
# Code Review Report

## Summary
- **Target**: [PR #X / branch / files]
- **Date**: [timestamp]
- **Status**: APPROVED / CHANGES REQUESTED

## Changes Overview
- **Files Changed**: X
- **Additions**: +X lines
- **Deletions**: -X lines

### Files Reviewed
| File | Type | Changes |
|------|------|---------|
| `src/actions/...` | Server Action | +50/-10 |
| `src/components/...` | Component | +100/-20 |

## Findings

### Must Fix (Blocking)
None / List:

#### Issue: [Title]
- **File**: `file.ts:line`
- **Issue**: [What's wrong]
- **Fix**: [How to fix]
```typescript
// Current
[problematic code]

// Suggested
[fixed code]
```

### Should Fix (Non-blocking)
None / List

### Consider (Suggestions)
None / List

## Quality Assessment

| Aspect | Score | Notes |
|--------|-------|-------|
| Code Quality | X/10 | [Notes] |
| Test Coverage | X/10 | [Notes] |
| Security | X/10 | [Notes] |
| Architecture | X/10 | [Notes] |
| Accessibility | X/10 | [Notes] |
| **Overall** | X/10 | |

## Checklist Summary

### Passed
- [x] TypeScript strict
- [x] Tests exist
- [x] Auth checked
- [x] Follows patterns

### Failed
- [ ] [Failed check] - [Reason]

### Not Applicable
- [-] [Check not relevant to these changes]

## Verdict

**APPROVED** - Ready to merge
OR
**CHANGES REQUESTED** - See findings above

### If Approved
Ready for `/approve` to merge.

### If Changes Requested
Address the findings and re-request review.
```

## Quick Reviews

### Review Staged Changes
```
/review staged
```
Reviews `git diff --cached`

### Review Against Main
```
/review feature/my-branch
```
Reviews `git diff main...feature/my-branch`

### Review Specific File
```
/review src/actions/user/update.ts
```
Reviews single file

## Examples

```
/review 42                      # Review PR #42
/review staged                  # Review staged changes
/review feature/add-billing     # Review branch vs main
/review src/actions/            # Review directory
```
