# Security Rules

Security requirements for all code.

## Authentication

- Always check session on protected routes
- Use `auth()` from `@/lib/auth`
- Return early with error if not authenticated

```tsx
const session = await auth();
if (!session?.user) {
  return { error: "Unauthorized" };
}
```

## Authorization

- Verify resource ownership
- Check user roles for admin operations
- Use `requireAdmin()` for admin-only actions

```tsx
// Resource ownership
const resource = await db.resource.findUnique({
  where: { id, userId: session.user.id },
});

// Admin check
await requireAdmin();
```

## Input Validation

- Always validate on server side
- Use Zod schemas
- Never trust client input

```tsx
const schema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(100),
});

const parsed = schema.safeParse(input);
if (!parsed.success) {
  return { error: parsed.error.message };
}
```

## OWASP Top 10

1. **Injection** - Use Prisma (parameterized queries)
2. **Broken Auth** - Proper session management
3. **Sensitive Data** - Never log passwords/tokens
4. **XSS** - React auto-escapes, use CSP headers
5. **Broken Access Control** - Check ownership and roles
6. **Security Misconfiguration** - Use env variables
7. **Vulnerable Components** - Keep dependencies updated

## Never Do

- Log sensitive data (passwords, tokens, keys)
- Return passwords in responses
- Use `dangerouslySetInnerHTML` without sanitization
- Trust client-side validation alone
- Store secrets in code
