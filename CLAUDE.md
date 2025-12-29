# CLAUDE.md - Project Context

## Project Overview

Production-ready SaaS boilerplate with Next.js 15, TypeScript, and Prisma.
Uses autonomous agentic development workflow with multi-agent orchestration.

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript (strict mode)
- **Database**: PostgreSQL + Prisma ORM
- **Cache**: Redis
- **Auth**: Auth.js v5
- **Payments**: Stripe
- **Email**: Resend + React Email
- **UI**: TailwindCSS + shadcn/ui
- **Testing**: Vitest + Playwright
- **Deploy**: Docker + Digital Ocean

## Autonomous Development Commands

### /ship - Full Feature Development
```
/ship <feature-description>
```
Orchestrates the complete development lifecycle with all agents.

### /approve - Review and Merge
```
/approve [pr-number]
```
Review, approve, and merge a feature PR.

### /revise - Apply Feedback
```
/revise <feedback>
```
Apply feedback and revisions to current feature.

### /status - Project Status
```
/status [area]
```
Get comprehensive project status report.

### /deploy - Trigger Deployment
```
/deploy [preview|production|rollback]
```
Manually trigger deployment operations.

## Agent Orchestration

### Development Agents
| Agent | Role |
|-------|------|
| Product Manager | User stories, acceptance criteria |
| Architect | Technical design, API contracts |
| Frontend Developer | React components, UI implementation |
| Backend Developer | Server actions, database operations |
| UI/UX Designer | Accessibility, design consistency |
| Security | Security audits, vulnerability checks |
| QA Engineer | Testing, coverage verification |
| DevOps | CI/CD, deployments, infrastructure |

### Agent Workflow
```
Feature Request
    │
    ├── Product Manager → User Stories
    │
    ├── Architect → Technical Design
    │
    ├── Backend Developer → Server Logic (TDD)
    │
    ├── Frontend Developer → UI Components (TDD)
    │
    ├── UI/UX Designer → Design Review
    │
    ├── Security → Security Audit
    │
    ├── QA Engineer → Testing & Verification
    │
    └── DevOps → PR & Deployment
```

## Development Skills

### TDD Methodology
1. **RED**: Write failing test first
2. **GREEN**: Implement minimum code to pass
3. **REFACTOR**: Clean up while keeping tests green

### Next.js App Router
- Server Components by default
- Client Components with `"use client"` only when needed
- Route groups: `(auth)`, `(dashboard)`, `(marketing)`, `(admin)`
- Server Actions for data mutations

### Prisma Database
- Schema in `prisma/schema.prisma`
- Migrations: `pnpm db:migrate`
- Push: `pnpm db:push`
- Studio: `pnpm db:studio`

### Testing
- Unit tests: `STRIPE_SECRET_KEY="sk_test_mock" npx vitest run`
- Coverage: `STRIPE_SECRET_KEY="sk_test_mock" npx vitest run --coverage`
- E2E: `pnpm test:e2e`
- Coverage threshold: 80%

### Git Workflow
- Branches: `feature/*`, `fix/*`, `hotfix/*`
- Commits: Conventional commits (`feat:`, `fix:`, `docs:`, `test:`)
- PRs: Link to issue, include description and test plan

## Key Commands

```bash
# Development
pnpm dev              # Start dev server
./scripts/dev.sh up   # Start Docker services
./scripts/dev.sh down # Stop Docker services

# Database
pnpm db:push          # Push Prisma schema
pnpm db:migrate       # Create migration
pnpm db:seed          # Seed base data
pnpm db:seed:demo     # Seed demo data
pnpm db:studio        # Open Prisma Studio

# Testing
pnpm test             # Run unit tests
pnpm test:coverage    # Run tests with coverage
pnpm test:e2e         # Run E2E tests

# Build & Deploy
pnpm build            # Build for production
pnpm lint             # Run ESLint
pnpm typecheck        # Run TypeScript check
```

## Project Structure

```
src/
├── app/              # Next.js App Router
│   ├── (auth)/       # Auth routes (login, signup)
│   ├── (dashboard)/  # Protected user routes
│   ├── (admin)/      # Admin-only routes
│   ├── (marketing)/  # Public marketing pages
│   └── api/          # API routes
├── components/
│   ├── ui/           # shadcn/ui components
│   ├── admin/        # Admin components
│   ├── auth/         # Auth components
│   ├── billing/      # Billing components
│   ├── dashboard/    # Dashboard components
│   ├── landing/      # Landing page components
│   └── pricing/      # Pricing components
├── lib/
│   ├── auth/         # Auth.js configuration
│   ├── db/           # Database client
│   ├── email/        # Email service
│   ├── stripe/       # Stripe integration
│   └── validations/  # Zod schemas
├── actions/          # Server Actions
│   ├── auth/         # Auth actions
│   ├── admin/        # Admin actions
│   └── stripe/       # Stripe actions
├── hooks/            # Custom React hooks
├── types/            # TypeScript types
└── config/           # App configuration

tests/
├── unit/             # Unit tests (Vitest)
│   ├── actions/      # Server action tests
│   ├── auth/         # Auth component tests
│   ├── billing/      # Billing component tests
│   ├── lib/          # Lib utility tests
│   └── pricing/      # Pricing component tests
└── e2e/              # E2E tests (Playwright)
```

## Coding Standards

- TypeScript strict mode, no `any` types
- Functional React components with hooks
- TailwindCSS for styling, use shadcn/ui components
- Server Actions for data mutations
- Server Components by default, Client Components only when needed
- TDD approach: write tests before implementation
- All tests must pass before PR merge
- Coverage must meet 80% threshold

## Git Conventions

- **Branches**: `feature/*`, `fix/*`, `hotfix/*`
- **Commits**: Conventional commits with emoji-free messages
  - `feat:` - New feature
  - `fix:` - Bug fix
  - `docs:` - Documentation
  - `test:` - Tests
  - `chore:` - Maintenance
- **PRs**:
  - Link to issue
  - Include description and test plan
  - All checks must pass

## Demo Accounts

- **Demo User**: demo@example.com / demo123
- **Admin**: admin@example.com / admin123

## Environment Variables

Copy `.env.example` to `.env` and configure:

- `DATABASE_URL`: PostgreSQL connection string
- `AUTH_SECRET`: Auth.js secret (generate with `openssl rand -base64 32`)
- `STRIPE_*`: Stripe API keys
- `RESEND_API_KEY`: Resend email API key

## CI/CD

### CI Pipeline (on PR)
- Lint check
- Type check
- Unit tests with coverage
- E2E tests
- Build verification

### CD Pipeline (on merge to main)
- Docker build
- Push to GitHub Container Registry
- Deploy via SSH
- Database migrations
- Health check
- Automatic rollback on failure
