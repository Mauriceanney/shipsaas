---
name: audit
description: Security Audit (project). Run security audit on code, checking for vulnerabilities and OWASP compliance.
---

# /audit - Security Audit

Run comprehensive security audit on code. Checks authentication, authorization, input validation, and OWASP Top 10 compliance.

## Usage

```
/audit [scope]
```

## Arguments

- `$ARGUMENTS` - Optional scope: `all`, `auth`, `actions`, `[feature-name]`, `[file-path]`, or PR number

## Audit Protocol

```
@agent:security-engineer

TASK: Perform security audit

SCOPE: $ARGUMENTS (default: all recent changes)

CHECKLIST:
- [ ] Authentication in all server actions
- [ ] Authorization (ownership verification)
- [ ] Input validation (Zod schemas)
- [ ] OWASP Top 10 compliance
- [ ] Sensitive data handling
- [ ] Error message safety
```

## Audit Scopes

### Full Audit (`all`)

```bash
# Audit all server actions
grep -r "use server" src/actions/ -l

# Check for auth patterns
grep -rn "const session = await auth()" src/actions/
grep -rn "session?.user" src/actions/

# Check for ownership patterns
grep -rn "userId: session.user.id" src/actions/

# Check for validation
grep -rn "safeParse" src/actions/

# Check for sensitive data
grep -rn "password\|secret\|token\|apiKey" src/ --include="*.ts" --include="*.tsx"
```

### Auth Audit (`auth`)

Focus on authentication flows:
- Login/logout actions
- Session management
- Password handling
- OAuth callbacks

### Actions Audit (`actions`)

Audit all server actions:
- Auth check present
- Input validation
- Error handling
- Data exposure

### Feature Audit (`[feature-name]`)

Audit specific feature:

```bash
# Audit feature actions
ls src/actions/[feature]/
grep -rn "auth()" src/actions/[feature]/

# Audit feature components
ls src/components/[feature]/
```

## Security Checklist

### Authentication

```bash
# Every server action must have this pattern:
const session = await auth();
if (!session?.user?.id) {
  return { success: false, error: "Unauthorized" };
}
```

Verify:
- [ ] `auth()` called at start of every action
- [ ] Early return on missing session
- [ ] No action bypasses auth check

### Authorization

```bash
# Resource ownership must be verified:
const resource = await db.resource.findFirst({
  where: {
    id: input.id,
    userId: session.user.id,  # REQUIRED
  },
});
```

Verify:
- [ ] `userId` in all resource queries
- [ ] Admin checks for admin operations
- [ ] Plan checks for premium features

### Input Validation

```bash
# All inputs validated with Zod:
const parsed = schema.safeParse(input);
if (!parsed.success) {
  return { success: false, error: "Invalid input" };
}
```

Verify:
- [ ] Zod schema for all inputs
- [ ] String length limits
- [ ] Number ranges
- [ ] Email/URL validation

### OWASP Top 10

| # | Vulnerability | Check |
|---|---------------|-------|
| A01 | Broken Access Control | Ownership verified |
| A02 | Cryptographic Failures | bcrypt for passwords, env for secrets |
| A03 | Injection | Prisma ORM (parameterized) |
| A04 | Insecure Design | Threat model exists |
| A05 | Security Misconfiguration | No debug in prod |
| A06 | Vulnerable Components | Dependencies updated |
| A07 | Auth Failures | Rate limiting, secure sessions |
| A08 | Data Integrity | CI/CD secure |
| A09 | Logging Failures | Security events logged |
| A10 | SSRF | External URLs validated |

## Audit Report

```markdown
# Security Audit Report

## Summary
- **Scope**: [all/auth/actions/feature]
- **Date**: [timestamp]
- **Auditor**: security-engineer
- **Risk Level**: Low / Medium / High / Critical
- **Status**: PASS / NEEDS REMEDIATION

## Findings

### Critical (Block merge)
None / List:

#### [CRITICAL] Finding Title
- **Location**: `file.ts:line`
- **Issue**: [Description]
- **Impact**: [What could happen]
- **Fix**: [How to fix]

### High (Fix within 24h)
None / List

### Medium (Fix within 1 week)
None / List

### Low (Track for future)
None / List

## Passed Checks

### Authentication
- [x] All actions check `auth()`
- [x] Session validation correct
- [x] No auth bypass

### Authorization
- [x] Resource ownership verified
- [x] Admin operations protected
- [x] Plan-gating correct

### Input Validation
- [x] All inputs use Zod
- [x] String limits enforced
- [x] No raw SQL

### Data Protection
- [x] No secrets in code
- [x] No sensitive data logged
- [x] Error messages safe

### OWASP Top 10
- [x] A01: Access Control - Pass
- [x] A02: Cryptography - Pass
- [x] A03: Injection - Pass
- [x] A04: Design - Pass
- [x] A05: Config - Pass
- [x] A06: Components - Pass
- [x] A07: Auth - Pass
- [x] A08: Integrity - Pass
- [x] A09: Logging - Pass
- [x] A10: SSRF - Pass

## Recommendations

1. [Recommendation if any]

## Sign-Off

- [ ] All critical/high findings resolved
- [ ] Code safe for production

**Status**: APPROVED / BLOCKED
```

## Examples

```
/audit                   # Audit recent changes
/audit all               # Full codebase audit
/audit auth              # Auth flows only
/audit actions           # All server actions
/audit billing           # Billing feature
/audit src/actions/user/ # Specific path
/audit #42               # Audit PR #42
```
