# Development Standards

Unified coding, testing, security, and git standards for SaaS development.

## Code Standards

### TypeScript

- `strict: true` required - no `any` types, use `unknown`
- Prefer `type` for objects, `interface` for extensible contracts
- Use `const` over `let`, never `var`

```typescript
// Action results - always use discriminated unions
export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };
```

### Server Components vs Client Components

**Server Components (default)** - No directive needed:
- Database queries, auth checks, data fetching

**Client Components** - Add `"use client"` only when you need:
- Event handlers (onClick, onChange)
- React hooks (useState, useEffect)
- Browser APIs

### Server Actions Pattern

```typescript
"use server";

export async function createFeature(input: unknown) {
  // 1. Auth check (ALWAYS first)
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" } as const;
  }

  // 2. Validation
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? "Invalid input" } as const;
  }

  // 3. Business logic
  try {
    const result = await db.insert(table).values({...}).returning();
    revalidatePath("/path");
    return { success: true, data: result } as const;
  } catch (error) {
    console.error("[createFeature]", error);
    return { success: false, error: "Operation failed" } as const;
  }
}
```

### Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `FeatureList` |
| Files | kebab-case | `feature-list.tsx` |
| Actions | camelCase | `createFeature` |
| Types | PascalCase | `FeatureInput` |

### Import Order

1. React/Next.js
2. Third-party
3. Internal - lib (`@/lib/`)
4. Internal - components (`@/components/`)
5. Internal - types
6. Relative imports

---

## TDD Requirements

### The Cycle

1. **RED** - Write failing test (must fail for right reason)
2. **GREEN** - Write minimum code to pass
3. **REFACTOR** - Clean up, keep tests green

### Test Commands

```bash
# Run all tests
STRIPE_SECRET_KEY="sk_test_mock" npx vitest run

# Run specific file
STRIPE_SECRET_KEY="sk_test_mock" npx vitest run tests/unit/actions/feature/create.test.ts

# With coverage
STRIPE_SECRET_KEY="sk_test_mock" npx vitest run --coverage
```

### Coverage Thresholds

| Metric | Minimum |
|--------|---------|
| Statements | 80% |
| Branches | 70% |
| Functions | 80% |
| Lines | 80% |

### Test File Structure

```
tests/
├── unit/
│   ├── actions/[domain]/*.test.ts
│   └── components/[feature]/*.test.tsx
└── e2e/flows/*.spec.ts
```

### Server Action Test Pattern

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/auth");
vi.mock("@/lib/db");

import { createFeature } from "@/actions/feature/create";
import { auth } from "@/lib/auth";

describe("createFeature", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns error when not authenticated", async () => {
    vi.mocked(auth).mockResolvedValue(null);
    const result = await createFeature({ name: "Test" });
    expect(result.success).toBe(false);
  });
});
```

### Test Checklist

**Server Actions:**
- [ ] Auth required
- [ ] Authorization (ownership)
- [ ] Input validation
- [ ] Success case
- [ ] Error handling

**Components:**
- [ ] Renders correctly
- [ ] User interactions
- [ ] Loading/error states
- [ ] Accessibility

---

## Security

### Core Principles

1. **Defense in Depth** - Multiple security layers
2. **Least Privilege** - Minimum required access
3. **Fail Secure** - On error, deny access
4. **Never Trust Input** - Validate server-side

### Auth Check (Required)

```typescript
const session = await auth();
if (!session?.user?.id) {
  return { success: false, error: "Unauthorized" };
}
```

### Resource Ownership (Required)

```typescript
const resource = await db.query.resource.findFirst({
  where: and(
    eq(resource.id, input.id),
    eq(resource.userId, session.user.id), // CRITICAL
  ),
});
if (!resource) {
  return { success: false, error: "Not found" };
}
```

### Input Validation

```typescript
const schema = z.object({
  email: z.string().email().max(255),
  name: z.string().min(1).max(100),
});
```

### OWASP Top 10 Quick Reference

| Vulnerability | Prevention |
|--------------|------------|
| Injection | Drizzle ORM (parameterized) |
| Broken Auth | Better Auth, rate limiting |
| Data Exposure | Select only needed columns |
| Access Control | userId in all queries |
| XSS | React escapes by default |
| Misconfiguration | Env vars for secrets |

### Error Messages (User-Facing)

| Scenario | Message |
|----------|---------|
| Wrong password | "Invalid credentials" |
| Not found | "Not found" |
| Rate limited | "Too many attempts" |
| Server error | "Something went wrong" |

### Security Checklist

- [ ] All actions check `auth()`
- [ ] Resource ownership verified
- [ ] Inputs validated with Zod
- [ ] No sensitive data in logs/responses
- [ ] Secrets in env vars only

---

## Git Workflow

### Branch Naming

```
feature/<issue>-<description>
fix/<issue>-<description>
hotfix/<description>
```

### Commit Messages

```
feat: add user profile photo upload
fix: resolve login redirect issue
docs: update API documentation
test: add unit tests for auth
chore: update dependencies
refactor: simplify validation
```

### PR Requirements

- [ ] Link to issue
- [ ] Description of changes
- [ ] Tests pass
- [ ] Coverage met
