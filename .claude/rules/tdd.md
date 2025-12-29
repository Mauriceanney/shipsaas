# TDD Methodology

Strict Test-Driven Development is mandatory for all implementation work. No exceptions.

## The TDD Cycle

```
┌─────────────────────────────────────────────────────────────────┐
│                        TDD CYCLE                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. RED     │ Write a failing test                              │
│             │ - Test must fail for the RIGHT reason             │
│             │ - Compile errors don't count as failing           │
│             │                                                   │
│  2. GREEN   │ Write minimum code to pass                        │
│             │ - Only enough code to make test pass              │
│             │ - Resist the urge to add extra functionality      │
│             │                                                   │
│  3. REFACTOR│ Clean up while tests stay green                   │
│             │ - Improve code structure                          │
│             │ - Remove duplication                              │
│             │ - Run tests after every change                    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Core Rules

1. **Never write implementation without a test first**
2. **One test at a time** - Don't write multiple tests before implementing
3. **Minimum code** - Only write enough code to make the test pass
4. **Refactor continuously** - Keep code clean as you go
5. **Tests must be independent** - No test should depend on another
6. **Tests must be deterministic** - Same input = same output, always

## Test Commands

```bash
# Run all tests
STRIPE_SECRET_KEY="sk_test_mock" npx vitest run

# Run specific test file
STRIPE_SECRET_KEY="sk_test_mock" npx vitest run tests/unit/actions/feature/create.test.ts

# Run tests matching a pattern
STRIPE_SECRET_KEY="sk_test_mock" npx vitest run -t "creates feature"

# Run with coverage
STRIPE_SECRET_KEY="sk_test_mock" npx vitest run --coverage

# Watch mode (development)
STRIPE_SECRET_KEY="sk_test_mock" npx vitest

# Run with verbose output
STRIPE_SECRET_KEY="sk_test_mock" npx vitest run --reporter=verbose
```

## Coverage Thresholds

| Metric | Minimum | Target |
|--------|---------|--------|
| Statements | 80% | 90% |
| Branches | 70% | 85% |
| Functions | 80% | 90% |
| Lines | 80% | 90% |

## Test File Structure

```
tests/
├── unit/
│   ├── actions/
│   │   └── [domain]/
│   │       ├── create.test.ts
│   │       ├── update.test.ts
│   │       └── delete.test.ts
│   ├── components/
│   │   └── [feature]/
│   │       ├── feature-form.test.tsx
│   │       └── feature-list.test.tsx
│   └── lib/
│       └── validations/
│           └── feature.test.ts
└── e2e/
    └── flows/
        └── feature-crud.spec.ts
```

## Server Action Test Pattern

```typescript
// tests/unit/actions/feature/create.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock dependencies BEFORE imports
vi.mock("@/lib/auth");
vi.mock("@/lib/db");
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

import { createFeature } from "@/actions/feature/create";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

describe("createFeature", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // AUTHENTICATION TESTS
  describe("authentication", () => {
    it("returns error when not authenticated", async () => {
      vi.mocked(auth).mockResolvedValue(null);

      const result = await createFeature({ name: "Test" });

      expect(result.success).toBe(false);
      expect(result.error).toBe("Unauthorized");
    });

    it("returns error when session has no user", async () => {
      vi.mocked(auth).mockResolvedValue({ user: null });

      const result = await createFeature({ name: "Test" });

      expect(result.success).toBe(false);
    });
  });

  // VALIDATION TESTS
  describe("validation", () => {
    it("returns error for empty name", async () => {
      vi.mocked(auth).mockResolvedValue({ user: { id: "1" } });

      const result = await createFeature({ name: "" });

      expect(result.success).toBe(false);
    });

    it("returns error for name exceeding max length", async () => {
      vi.mocked(auth).mockResolvedValue({ user: { id: "1" } });

      const result = await createFeature({ name: "a".repeat(256) });

      expect(result.success).toBe(false);
    });
  });

  // SUCCESS TESTS
  describe("success cases", () => {
    it("creates feature with valid input", async () => {
      vi.mocked(auth).mockResolvedValue({ user: { id: "user-1" } });
      vi.mocked(db.feature.create).mockResolvedValue({
        id: "feature-1",
        name: "Test Feature",
        userId: "user-1",
      });

      const result = await createFeature({ name: "Test Feature" });

      expect(result.success).toBe(true);
      expect(db.feature.create).toHaveBeenCalledWith({
        data: {
          name: "Test Feature",
          userId: "user-1",
        },
      });
    });
  });

  // ERROR HANDLING TESTS
  describe("error handling", () => {
    it("handles database errors gracefully", async () => {
      vi.mocked(auth).mockResolvedValue({ user: { id: "1" } });
      vi.mocked(db.feature.create).mockRejectedValue(new Error("DB Error"));

      const result = await createFeature({ name: "Test" });

      expect(result.success).toBe(false);
      expect(result.error).toBe("Failed to create feature");
    });
  });
});
```

## Component Test Pattern

```typescript
// tests/unit/components/feature/feature-form.test.tsx
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/actions/feature/create");

import { FeatureForm } from "@/components/feature/feature-form";
import { createFeature } from "@/actions/feature/create";

describe("FeatureForm", () => {
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders form fields", () => {
    render(<FeatureForm />);

    expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /create/i })).toBeInTheDocument();
  });

  it("submits form with valid data", async () => {
    vi.mocked(createFeature).mockResolvedValue({
      success: true,
      data: { id: "1" },
    });

    render(<FeatureForm />);

    await user.type(screen.getByLabelText(/name/i), "Test Feature");
    await user.click(screen.getByRole("button", { name: /create/i }));

    await waitFor(() => {
      expect(createFeature).toHaveBeenCalledWith({ name: "Test Feature" });
    });
  });

  it("shows loading state during submission", async () => {
    vi.mocked(createFeature).mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 100))
    );

    render(<FeatureForm />);

    await user.type(screen.getByLabelText(/name/i), "Test");
    await user.click(screen.getByRole("button", { name: /create/i }));

    expect(screen.getByRole("button")).toBeDisabled();
  });
});
```

## Test Categories Checklist

### Every Server Action Must Test:

- [ ] Authentication required
- [ ] Authorization (ownership/roles)
- [ ] Input validation (all fields)
- [ ] Success case
- [ ] Error handling (database, external services)
- [ ] Cache revalidation

### Every Component Must Test:

- [ ] Renders correctly
- [ ] Handles user interactions
- [ ] Shows loading states
- [ ] Shows error states
- [ ] Accessibility (labels, keyboard navigation)

## Common Mistakes to Avoid

### 1. Writing Tests After Implementation

```typescript
// WRONG: Implementation first
export function add(a: number, b: number) {
  return a + b;
}
// Then write tests...

// CORRECT: Test first
it("adds two numbers", () => {
  expect(add(2, 3)).toBe(5);
});
// Then implement...
```

### 2. Testing Implementation Details

```typescript
// WRONG: Testing how it works
it("calls useState with initial value", () => {
  expect(useState).toHaveBeenCalledWith(0);
});

// CORRECT: Testing what it does
it("displays the count", () => {
  render(<Counter />);
  expect(screen.getByText("0")).toBeInTheDocument();
});
```

### 3. Flaky Tests

```typescript
// WRONG: Time-dependent
expect(result.createdAt).toBe(new Date());

// CORRECT: Range check
const now = Date.now();
expect(result.createdAt.getTime()).toBeGreaterThan(now - 1000);
expect(result.createdAt.getTime()).toBeLessThan(now + 1000);
```

### 4. Shared State Between Tests

```typescript
// WRONG: Shared state
let counter = 0;
it("test 1", () => { counter++; expect(counter).toBe(1); });
it("test 2", () => { counter++; expect(counter).toBe(2); }); // Depends on test 1!

// CORRECT: Fresh state
beforeEach(() => { counter = 0; });
it("test 1", () => { counter++; expect(counter).toBe(1); });
it("test 2", () => { counter++; expect(counter).toBe(1); }); // Independent
```

## When to Skip TDD

Never. But here are situations where you might think you should (and why you shouldn't):

| Excuse | Reality |
|--------|---------|
| "It's just a quick fix" | Quick fixes become permanent. Test it. |
| "It's too simple to test" | Simple code needs simple tests. |
| "I'll add tests later" | You won't. Test it now. |
| "The deadline is tight" | Bugs from untested code cost more time. |
