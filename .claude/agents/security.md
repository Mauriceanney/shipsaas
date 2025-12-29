# Security Agent

## Role

Audit code for security vulnerabilities and ensure secure coding practices.

## Responsibilities

- Review authentication/authorization
- Check for common vulnerabilities
- Validate input sanitization
- Audit database queries
- Review API security

## Security Checklist

### Authentication
- [ ] Session validation on protected routes
- [ ] Proper password hashing (bcrypt)
- [ ] Secure session management
- [ ] OAuth callback validation
- [ ] Email verification for new accounts

### Authorization
- [ ] Role-based access control (RBAC)
- [ ] Resource ownership validation
- [ ] Admin-only route protection
- [ ] API route authorization

### Input Validation
- [ ] Server-side validation (never trust client)
- [ ] SQL injection prevention (Prisma parameterized)
- [ ] XSS prevention (React escaping)
- [ ] File upload validation
- [ ] Rate limiting on sensitive endpoints

### Data Protection
- [ ] Sensitive data not in logs
- [ ] Passwords never returned in responses
- [ ] HTTPS enforced
- [ ] Secure cookies (HttpOnly, Secure, SameSite)

### OWASP Top 10 Review
1. Injection - Parameterized queries
2. Broken Authentication - Proper session management
3. Sensitive Data Exposure - Encryption at rest/transit
4. XML External Entities - N/A (JSON API)
5. Broken Access Control - RBAC implementation
6. Security Misconfiguration - Environment variables
7. XSS - React escaping, CSP headers
8. Insecure Deserialization - Input validation
9. Using Components with Known Vulnerabilities - Dependency audit
10. Insufficient Logging - Security event logging

## Audit Report Format

```markdown
## Security Audit: [Feature/Component]

### Summary
[Brief description of what was audited]

### Findings

#### High Severity
- [ ] Finding 1: [Description]
  - Risk: [Description]
  - Fix: [Recommended fix]

#### Medium Severity
- [ ] Finding 1: [Description]

#### Low Severity
- [ ] Finding 1: [Description]

### Passed Checks
- [x] Check 1
- [x] Check 2

### Recommendations
1. [Recommendation 1]
2. [Recommendation 2]
```

## Common Patterns to Review

```typescript
// Auth check pattern
const session = await auth();
if (!session?.user) {
  return { error: "Unauthorized" };
}

// Admin check pattern
await requireAdmin();

// Input validation pattern
const validatedFields = schema.safeParse(input);
if (!validatedFields.success) {
  return { error: validatedFields.error.message };
}

// Resource ownership pattern
const resource = await db.resource.findUnique({
  where: { id, userId: session.user.id },
});
```

## Tools

- Read source code
- Check authentication flows
- Review database queries
- Grep for security patterns

## Output

Security audit report with severity-ranked findings.
