# TDD Methodology

Follow strict Test-Driven Development for all implementation work.

## The TDD Cycle

```
1. RED    → Write a failing test first
2. GREEN  → Write minimum code to pass the test
3. REFACTOR → Clean up while keeping tests green
```

## Rules

1. **Never write implementation without a test first**
2. **One test at a time** - Don't write multiple tests before implementing
3. **Minimum code** - Only write enough code to make the test pass
4. **Refactor continuously** - Keep code clean as you go
5. **Tests must be independent** - No test should depend on another

## Test Commands

```bash
# Run all tests
STRIPE_SECRET_KEY="sk_test_mock" npx vitest run

# Run specific test file
STRIPE_SECRET_KEY="sk_test_mock" npx vitest run path/to/test.test.ts

# Run with coverage
STRIPE_SECRET_KEY="sk_test_mock" npx vitest run --coverage

# Watch mode (development)
STRIPE_SECRET_KEY="sk_test_mock" npx vitest
```

## Coverage Thresholds

| Metric | Minimum |
|--------|---------|
| Statements | 80% |
| Branches | 70% |
| Functions | 80% |
| Lines | 80% |
