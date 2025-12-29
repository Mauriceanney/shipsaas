# Security Rules

Comprehensive security requirements for SaaS application development. Security is non-negotiable.

## Core Principles

1. **Defense in Depth** - Multiple layers of security
2. **Least Privilege** - Minimum required access
3. **Fail Secure** - On error, deny access
4. **Never Trust Input** - Validate everything server-side

## Authentication

### Session Validation

Every server action and protected route MUST check authentication:

```typescript
// REQUIRED: First line of every server action
const session = await auth();
if (!session?.user?.id) {
  return { success: false, error: "Unauthorized" };
}
```

### Auth Patterns

```typescript
// Import auth function
import { auth } from "@/lib/auth";

// Check session in server action
export async function protectedAction() {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  // Now safe to use session.user.id
  const userId = session.user.id;
}

// Check session in page
export default async function ProtectedPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  return <div>Protected Content</div>;
}
```

## Authorization

### Resource Ownership

ALWAYS verify the user owns the resource they're accessing:

```typescript
// REQUIRED: Include userId in query
const resource = await db.resource.findFirst({
  where: {
    id: input.id,
    userId: session.user.id, // CRITICAL: Never omit this
  },
});

if (!resource) {
  // Don't reveal if resource exists for other users
  return { success: false, error: "Not found" };
}
```

### Role-Based Access Control

```typescript
// Admin-only operations
import { requireAdmin } from "@/lib/auth/admin";

export async function adminOnlyAction() {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  // Verify admin role
  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (user?.role !== "ADMIN") {
    return { success: false, error: "Forbidden" };
  }

  // Admin logic here
}
```

### Plan-Based Feature Gating

```typescript
// Premium feature check
export async function premiumAction() {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  const subscription = await db.subscription.findFirst({
    where: {
      userId: session.user.id,
      status: "ACTIVE",
      plan: { in: ["PRO", "ENTERPRISE"] },
    },
  });

  if (!subscription) {
    return { success: false, error: "Upgrade to Pro required" };
  }

  // Premium logic here
}
```

## Input Validation

### Server-Side Validation (Required)

```typescript
import { z } from "zod";

// Define schema with strict validation
const createUserSchema = z.object({
  email: z.string().email("Invalid email format").max(255),
  name: z.string().min(1, "Name required").max(100, "Name too long"),
  password: z.string().min(8, "Password must be 8+ characters"),
});

export async function createUser(input: unknown) {
  // Validate input
  const parsed = createUserSchema.safeParse(input);
  if (!parsed.success) {
    // Return first error message only
    return {
      success: false,
      error: parsed.error.errors[0]?.message ?? "Invalid input",
    };
  }

  // Use parsed.data (typed and validated)
  const { email, name, password } = parsed.data;
}
```

### Common Validation Patterns

```typescript
// String limits (prevent DoS)
z.string().min(1).max(255)

// Email validation
z.string().email()

// URL validation (prevent SSRF)
z.string().url().startsWith("https://")

// Numeric ranges
z.number().int().min(0).max(100)

// Enum values
z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"])

// Optional with default
z.string().optional().default("")

// File upload (type and size)
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_TYPES = ["image/jpeg", "image/png"];
```

## OWASP Top 10 Compliance

### 1. Injection

**Prevention**: Use Prisma ORM (parameterized queries)

```typescript
// SAFE: Prisma parameterizes queries
await db.user.findMany({
  where: { email: userInput }, // Automatically escaped
});

// NEVER: Raw SQL with user input
// await db.$queryRaw`SELECT * FROM users WHERE email = ${userInput}` // UNSAFE
```

### 2. Broken Authentication

**Prevention**: Proper session management

- Use Auth.js (NextAuth) for session handling
- Secure cookie settings (HttpOnly, Secure, SameSite)
- Session expiration configured
- Rate limit login attempts

### 3. Sensitive Data Exposure

**Prevention**: Encrypt and minimize exposure

```typescript
// NEVER return sensitive data
const user = await db.user.findUnique({
  where: { id },
  select: {
    id: true,
    email: true,
    name: true,
    // NEVER: password, stripeCustomerId, etc.
  },
});
```

### 4. XML External Entities (XXE)

**Prevention**: N/A - We use JSON APIs only

### 5. Broken Access Control

**Prevention**: Verify ownership and roles

```typescript
// ALWAYS include ownership check
const item = await db.item.findFirst({
  where: {
    id: itemId,
    userId: session.user.id, // REQUIRED
  },
});
```

### 6. Security Misconfiguration

**Prevention**: Environment variables and secure defaults

```typescript
// ALWAYS use environment variables for secrets
const apiKey = process.env.STRIPE_SECRET_KEY;

// NEVER hardcode secrets
// const apiKey = "sk_live_xxx" // NEVER DO THIS
```

### 7. Cross-Site Scripting (XSS)

**Prevention**: React escapes by default + CSP headers

```typescript
// React auto-escapes (safe)
<div>{userInput}</div>

// DANGEROUS - avoid unless absolutely necessary
<div dangerouslySetInnerHTML={{ __html: sanitizedHtml }} />

// If you must use dangerouslySetInnerHTML:
import DOMPurify from "dompurify";
const sanitized = DOMPurify.sanitize(userHtml);
```

### 8. Insecure Deserialization

**Prevention**: Validate all input with Zod

### 9. Components with Known Vulnerabilities

**Prevention**: Keep dependencies updated

```bash
# Check for vulnerabilities
npm audit

# Update dependencies
npm update

# Check for outdated packages
npm outdated
```

### 10. Insufficient Logging

**Prevention**: Log security events

```typescript
// Log authentication events
console.log("[AUTH] Login attempt:", { email, success: true, ip });
console.log("[AUTH] Login failed:", { email, reason, ip });

// Log authorization failures
console.warn("[AUTHZ] Unauthorized access attempt:", {
  userId: session?.user?.id,
  resource: "admin/users",
  action: "READ",
});
```

## Sensitive Data Handling

### Never Log

```typescript
// NEVER log these
const SENSITIVE_FIELDS = [
  "password",
  "token",
  "secret",
  "key",
  "creditCard",
  "ssn",
  "apiKey",
];

// WRONG
console.log("User created:", user);

// CORRECT
console.log("User created:", { id: user.id, email: user.email });
```

### Never Return in Responses

```typescript
// WRONG
return { success: true, data: user }; // Might include password hash!

// CORRECT
return {
  success: true,
  data: {
    id: user.id,
    email: user.email,
    name: user.name,
  },
};
```

### Environment Variables

```env
# .env.example (safe to commit)
DATABASE_URL=postgresql://...
AUTH_SECRET=generate-with-openssl
STRIPE_SECRET_KEY=sk_test_...

# .env (NEVER commit)
# Add to .gitignore
```

## Error Messages

### User-Facing Errors

| Scenario | Message | Don't Say |
|----------|---------|-----------|
| Wrong password | "Invalid credentials" | "Password incorrect" |
| User not found | "Invalid credentials" | "User not found" |
| Rate limited | "Too many attempts" | "Blocked for X seconds" |
| Server error | "Something went wrong" | Stack trace |
| Authorization | "Not found" | "Access denied to resource X" |

### Internal Logging

```typescript
// Log detailed errors internally
console.error("[createUser] Database error:", {
  error: error.message,
  userId: session.user.id,
  input: { ...input, password: "[REDACTED]" },
});

// Return generic error to user
return { success: false, error: "Failed to create user" };
```

## Security Checklist

Before merging any PR:

### Authentication
- [ ] All server actions check `auth()`
- [ ] Protected pages redirect unauthenticated users
- [ ] Session expiration configured

### Authorization
- [ ] Resource ownership verified with `userId`
- [ ] Admin operations check role
- [ ] Plan-gated features check subscription

### Input Validation
- [ ] All inputs validated with Zod
- [ ] String lengths limited
- [ ] Numbers have min/max
- [ ] File uploads restricted

### Data Protection
- [ ] No sensitive data logged
- [ ] No passwords in responses
- [ ] Secrets in environment variables

### Error Handling
- [ ] Generic error messages to users
- [ ] Detailed logging internally
- [ ] No stack traces exposed
