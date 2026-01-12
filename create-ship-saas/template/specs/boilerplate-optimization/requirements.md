# Boilerplate Optimization Requirements

## Overview

This specification defines the requirements for optimizing the production-ready SaaS boilerplate to address identified gaps and ensure it serves as a reliable, reusable foundation for multiple projects.

**Current Assessment: 7.6/10** - Strong foundation requiring targeted improvements in testing, email integration, security, and DevOps.

---

## Initial Requirements

Based on the comprehensive audit, the following critical issues must be addressed:

| Issue | Severity | Current State |
|-------|----------|---------------|
| No testing infrastructure | CRITICAL | Vitest documented but not installed; zero test coverage |
| Email handlers log to console | HIGH | Auth emails (verification, reset) won't work in production |
| Docker Compose incomplete | MEDIUM | Missing Redis, Mailpit, no data persistence |
| No CSP header | MEDIUM | XSS attack surface not fully mitigated |
| Dependency pinning issues | MEDIUM | `@tailwindcss/postcss: "latest"` causes non-reproducible builds |
| Redundant PostgreSQL drivers | LOW | Both `pg` and `postgres` installed; only `postgres` is used |

---

## Functional Requirements

### FR-1: Testing Infrastructure

**Description**: Install and configure a complete testing framework that enables TDD workflow.

**Requirements**:
- FR-1.1: Install Vitest as the test runner
- FR-1.2: Configure jsdom environment for React component testing
- FR-1.3: Set up path aliases matching tsconfig.json (`@/*` → `./src/*`)
- FR-1.4: Configure coverage thresholds (80% statements, 70% branches, 80% functions, 80% lines)
- FR-1.5: Create standardized test directory structure (`tests/unit/`, `tests/e2e/`)
- FR-1.6: Add test scripts to package.json (`test`, `test:ui`, `test:coverage`)
- FR-1.7: Integrate test job into CI/CD pipeline

### FR-2: Email Integration

**Description**: Replace placeholder email handlers with production-ready email sending.

**Requirements**:
- FR-2.1: Integrate `sendVerificationEmail()` in Better Auth email verification flow
- FR-2.2: Integrate `sendPasswordResetEmail()` in Better Auth password reset flow
- FR-2.3: Ensure email templates render correctly with React Email
- FR-2.4: Support both Resend (production) and SMTP/Nodemailer (development)

### FR-3: Security Hardening

**Description**: Address remaining security gaps to meet production requirements.

**Requirements**:
- FR-3.1: Add Content-Security-Policy header to Next.js configuration
- FR-3.2: Verify rate limiting coverage on all authentication endpoints
- FR-3.3: Verify rate limiting on 2FA verification endpoints
- FR-3.4: Document webhook secret rotation strategy

### FR-4: DevOps Enhancement

**Description**: Complete the local development environment and CI/CD pipeline.

**Requirements**:
- FR-4.1: Add Redis service to docker-compose.yml
- FR-4.2: Add Mailpit service for local email testing
- FR-4.3: Add PostgreSQL volume for data persistence
- FR-4.4: Create `.env.test` with mock values for testing
- FR-4.5: Update CI/CD to run tests before build
- FR-4.6: Block builds on test failures

### FR-5: Dependency Cleanup

**Description**: Remove redundant dependencies and fix configuration issues.

**Requirements**:
- FR-5.1: Remove `pg` from dependencies (only `postgres` driver is used)
- FR-5.2: Pin `@tailwindcss/postcss` to specific version instead of `"latest"`

---

## Non-Functional Requirements

### NFR-1: Build Reproducibility

**Description**: Ensure consistent builds across environments and time.

**Requirements**:
- NFR-1.1: All dependencies pinned to specific versions (no `"latest"`)
- NFR-1.2: Lock file (`pnpm-lock.yaml`) always committed and up-to-date
- NFR-1.3: CI uses `--frozen-lockfile` for reproducible installs

### NFR-2: Developer Experience

**Description**: Maintain excellent developer experience for boilerplate users.

**Requirements**:
- NFR-2.1: Single command to start all local services (`docker-compose up`)
- NFR-2.2: Test commands work without additional configuration
- NFR-2.3: Clear error messages for missing environment variables
- NFR-2.4: Hot reload works for all development scenarios

### NFR-3: Performance

**Description**: Ensure the boilerplate performs well in production.

**Requirements**:
- NFR-3.1: No development-only packages in production bundle
- NFR-3.2: Test suite runs in under 60 seconds for unit tests
- NFR-3.3: CI pipeline completes in under 5 minutes

### NFR-4: Maintainability

**Description**: Ensure the codebase remains maintainable over time.

**Requirements**:
- NFR-4.1: All code passes ESLint with zero warnings
- NFR-4.2: All code passes TypeScript strict mode checks
- NFR-4.3: Test coverage maintained at or above thresholds
- NFR-4.4: Dependencies updated regularly with security patches

---

## Acceptance Criteria

### AC-1: Testing Infrastructure Complete

- [ ] `pnpm test` executes Vitest and passes with at least one test
- [ ] `pnpm test:coverage` generates coverage report
- [ ] Coverage thresholds enforced (build fails if below threshold)
- [ ] CI pipeline includes test job that blocks on failure
- [ ] `tests/` directory structure matches documented pattern

### AC-2: Email Integration Working

- [ ] New user registration triggers verification email
- [ ] Password reset flow sends email with reset link
- [ ] Emails sent via Resend when API key configured
- [ ] Emails sent via SMTP when Resend not configured
- [ ] Email templates render without errors

### AC-3: Security Hardening Verified

- [ ] `Content-Security-Policy` header present in HTTP responses
- [ ] Rate limiting active on login endpoint (5 req/min)
- [ ] Rate limiting active on password reset endpoint (3 req/15 min)
- [ ] Rate limiting active on 2FA verification endpoint (5 req/5 min)

### AC-4: DevOps Environment Complete

- [ ] `docker-compose up` starts PostgreSQL, Redis, and Mailpit
- [ ] PostgreSQL data persists across container restarts
- [ ] Mailpit accessible at `http://localhost:8025`
- [ ] Redis accessible at `localhost:6379`
- [ ] `.env.test` file exists with mock values

### AC-5: Dependencies Cleaned Up

- [ ] `pg` package removed from package.json
- [ ] `@tailwindcss/postcss` pinned to specific version (not `"latest"`)
- [ ] `pnpm lint` passes without errors
- [ ] `pnpm typecheck` passes without errors
- [ ] `pnpm build` succeeds

---

## Out of Scope

The following items are explicitly out of scope for this optimization:

- Unit test implementation (infrastructure only)
- E2E test implementation
- New feature development
- Dashboard enhancements
- Marketing page creation
- Admin panel implementation
- Multi-tenancy features
- Kubernetes/complex orchestration

---

## Dependencies

| Requirement | Depends On |
|-------------|------------|
| FR-1.7 (CI test job) | FR-1.1 through FR-1.6 |
| FR-2.1, FR-2.2 | Existing email templates in `src/lib/email/templates/` |
| FR-4.5 (CI tests) | FR-1 (Testing Infrastructure) |
| AC-1 | FR-1 complete |
| AC-2 | FR-2 complete |
| AC-3 | FR-3 complete |
| AC-4 | FR-4 complete |
| AC-5 | FR-5 complete |
