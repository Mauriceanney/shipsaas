---
name: test
description: Test Runner (project). Run tests with detailed analysis, coverage reports, and recommendations.
---

# /test - Test Runner

Run tests with detailed analysis, coverage reports, and actionable recommendations.

## Usage

```
/test [scope]
```

## Arguments

- `$ARGUMENTS` - Optional scope: `all`, `unit`, `e2e`, `coverage`, `watch`, or specific path

## Test Commands

### Run All Tests

```bash
STRIPE_SECRET_KEY="sk_test_mock" npx vitest run
```

### Run with Coverage

```bash
STRIPE_SECRET_KEY="sk_test_mock" npx vitest run --coverage
```

### Run Specific Tests

```bash
# By path
STRIPE_SECRET_KEY="sk_test_mock" npx vitest run tests/unit/actions/

# By pattern
STRIPE_SECRET_KEY="sk_test_mock" npx vitest run -t "creates user"

# Single file
STRIPE_SECRET_KEY="sk_test_mock" npx vitest run tests/unit/actions/auth/login.test.ts
```

### Watch Mode

```bash
STRIPE_SECRET_KEY="sk_test_mock" npx vitest
```

### E2E Tests

```bash
pnpm test:e2e
```

## Analysis Protocol

```
@agent:quality-engineer

TASK: Run tests and analyze results

EXECUTE:
1. Run requested test scope
2. Analyze results
3. Identify issues
4. Provide recommendations
```

### Step 1: Execute Tests

```bash
# Run tests with timing
time STRIPE_SECRET_KEY="sk_test_mock" npx vitest run

# Generate coverage
STRIPE_SECRET_KEY="sk_test_mock" npx vitest run --coverage
```

### Step 2: Analyze Results

Check for:
- Failed tests
- Slow tests (> 1s)
- Flaky tests (inconsistent results)
- Coverage gaps

### Step 3: Coverage Analysis

```bash
# View coverage summary
cat coverage/coverage-summary.json

# Check thresholds
# Statements: 80%
# Branches: 70%
# Functions: 80%
# Lines: 80%
```

## Test Report

```markdown
# Test Report

## Summary
- **Date**: [timestamp]
- **Scope**: [all/unit/e2e/path]
- **Duration**: [time]
- **Status**: PASS / FAIL

## Results

### Unit Tests
| Suite | Total | Passed | Failed | Skipped | Duration |
|-------|-------|--------|--------|---------|----------|
| Actions | X | X | 0 | 0 | Xs |
| Components | X | X | 0 | 0 | Xs |
| Utils | X | X | 0 | 0 | Xs |
| **Total** | X | X | 0 | 0 | Xs |

### Failed Tests
None / List:
- `test-file.test.ts` > "test name" - [error message]

### Slow Tests (> 1s)
None / List:
- `test-file.test.ts` > "test name" - Xs

## Coverage

| Metric | Current | Threshold | Status |
|--------|---------|-----------|--------|
| Statements | XX.X% | 80% | Pass/Fail |
| Branches | XX.X% | 70% | Pass/Fail |
| Functions | XX.X% | 80% | Pass/Fail |
| Lines | XX.X% | 80% | Pass/Fail |

### Files Below Threshold
| File | Statements | Branches | Action Needed |
|------|------------|----------|---------------|
| `file.ts` | XX% | XX% | Add tests for [specific area] |

### Uncovered Code
- `src/actions/feature/delete.ts:45-60` - Error handling branch
- `src/components/feature/form.tsx:120-135` - Validation error state

## Recommendations

### High Priority
1. [Fix failing tests]
2. [Add tests for uncovered critical paths]

### Medium Priority
1. [Improve coverage in specific areas]
2. [Optimize slow tests]

### Low Priority
1. [Nice-to-have improvements]

## Quality Score

| Aspect | Score | Notes |
|--------|-------|-------|
| All Tests Pass | X/10 | [Notes] |
| Coverage | X/10 | [Notes] |
| No Flaky Tests | X/10 | [Notes] |
| Performance | X/10 | [Notes] |
| **Overall** | X/10 | |
```

## Scope Options

| Scope | Command | Description |
|-------|---------|-------------|
| `all` | `npx vitest run` | All unit tests |
| `unit` | `npx vitest run tests/unit/` | Unit tests only |
| `e2e` | `pnpm test:e2e` | E2E tests only |
| `coverage` | `npx vitest run --coverage` | With coverage report |
| `watch` | `npx vitest` | Watch mode |
| `actions` | `npx vitest run tests/unit/actions/` | Action tests |
| `components` | `npx vitest run tests/unit/components/` | Component tests |
| `[path]` | `npx vitest run [path]` | Specific path |

## Examples

```
/test                    # Run all tests
/test coverage           # Run with coverage
/test actions            # Run action tests only
/test components/auth    # Run auth component tests
/test watch              # Watch mode
/test e2e                # Run E2E tests
```
