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
- **Deploy**: Docker Swarm + Digital Ocean

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

## Specialized Agent System

This project uses a team of specialized AI agents, each with deep expertise in SaaS development, TypeScript, and Next.js. See `.claude/AGENTS.md` for full documentation.

### Agent Team

| Agent | Expertise | Responsibilities |
|-------|-----------|------------------|
| **Orchestrator** | Workflow Coordination | Coordinates agents, manages phases, enforces quality gates |
| **Product Engineer** | SaaS Product Development | User stories, acceptance criteria, success metrics |
| **Solution Architect** | Next.js 15 / TypeScript | Technical design, API contracts, data models |
| **Full-Stack Engineer** | Server Actions / Prisma | Backend implementation with strict TDD |
| **UI Engineer** | React / shadcn/ui / A11y | Frontend components with TDD, WCAG 2.1 AA |
| **Security Engineer** | OWASP / Auth.js | Security audits, vulnerability assessment |
| **Quality Engineer** | Vitest / Playwright | Testing, coverage verification, QA sign-off |
| **Platform Engineer** | Docker / CI/CD | PR creation, deployments, infrastructure |

### Agent Workflow

```
Feature Request
    │
    ├─ DISCOVERY ──────────────────────────────────────────┐
    │   ├── Product Engineer → User Stories + AC           │
    │   └── Solution Architect → Technical Feasibility     │ (parallel)
    │                                                      │
    ├─ DESIGN ─────────────────────────────────────────────┤
    │   └── Solution Architect → Technical Design          │ (gate: design approved)
    │                                                      │
    ├─ IMPLEMENTATION ─────────────────────────────────────┤
    │   ├── Full-Stack Engineer → Backend (TDD)            │ (parallel)
    │   └── UI Engineer → Frontend (TDD)                   │ (gate: tests pass, 80% coverage)
    │                                                      │
    ├─ QUALITY ────────────────────────────────────────────┤
    │   ├── Security Engineer → Security Audit             │ (parallel)
    │   └── Quality Engineer → QA Verification             │ (gate: approved)
    │                                                      │
    └─ DELIVERY ───────────────────────────────────────────┤
        └── Platform Engineer → PR + CI                    │ (gate: user approval)
```

## Key Commands

```bash
# Local Development
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d   # Start services
docker compose -f docker-compose.yml -f docker-compose.dev.yml down    # Stop services
pnpm dev                       # Start Next.js dev server

# Database
pnpm db:push                   # Push Prisma schema
pnpm db:migrate                # Create migration
pnpm db:seed                   # Seed base data
pnpm db:seed:demo              # Seed demo data
pnpm db:studio                 # Open Prisma Studio

# Testing
pnpm test                      # Run unit tests
pnpm test:coverage             # Run tests with coverage
pnpm test:e2e                  # Run E2E tests

# Build
pnpm build                     # Build for production
pnpm lint                      # Run ESLint
pnpm typecheck                 # Run TypeScript check
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
├── types/            # TypeScript types
└── config/           # App configuration

tests/
├── unit/             # Unit tests (Vitest)
└── e2e/              # E2E tests (Playwright)

scripts/
└── setup-server.sh   # Server provisioning script
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
- `REDIS_PASSWORD`: Redis password

## CI/CD Pipeline

### CI (on every PR)
- Lint check
- Type check
- Unit tests with coverage
- Build verification
- Docker vulnerability scanning (Trivy)

### CD (automatic deployment)
- **PR merged to develop** → Pre-production deployment
- **PR merged to main** → Production deployment

Deployments only trigger on PR merges, NOT direct pushes (industry best practice).

### Deployment Flow
```
feature/* branch
    │
    └── Create PR to develop
         │
         └── CI checks pass + Code review
              │
              └── Merge PR → Auto-deploy to Preprod
                   │
                   └── Create PR to main
                        │
                        └── Merge PR → Auto-deploy to Production
```

### Required GitHub Secrets
```
# Docker Hub
DOCKERHUB_USERNAME    # Docker Hub username
DOCKERHUB_TOKEN       # Docker Hub access token

# Pre-Production Server
PREPROD_HOST          # Preprod server hostname
PREPROD_USERNAME      # SSH username (default: deploy)
PREPROD_SSH_KEY       # SSH private key

# Production Server
PROD_HOST             # Production server hostname
PROD_USERNAME         # SSH username (default: deploy)
PROD_SSH_KEY          # SSH private key
```

## Docker Swarm Deployment

### Environments

| Environment | Branch | Stack Name | Data Path |
|-------------|--------|------------|-----------|
| Development | - | Local Docker | - |
| Pre-Production | develop | preprod | /opt/preprod/data/ |
| Production | main | saas | /opt/saas/data/ |

### Server Setup

Use the setup script on a fresh Ubuntu droplet:
```bash
# Copy and run the setup script
scp scripts/setup-server.sh root@your-server:/tmp/
ssh root@your-server "ENVIRONMENT=production bash /tmp/setup-server.sh"
```

The script:
- Creates deploy user with SSH access
- Installs Docker and initializes Swarm
- Configures UFW firewall and fail2ban
- Creates data directories

### Manual Server Administration

SSH directly into servers for administration:
```bash
# SSH into production
ssh deploy@prod.example.com

# View services
docker service ls

# View app logs
docker service logs saas_app --follow

# Scale app
docker service scale saas_app=5

# Rollback (from GitHub Actions or manually)
# Uses workflow_dispatch with rollback action
```

### Docker Compose Files

| File | Purpose |
|------|---------|
| `docker-compose.yml` | Base services (postgres, redis, mailpit) |
| `docker-compose.dev.yml` | Development overrides (exposed ports) |
| `docker-compose.preprod.yml` | Pre-production Swarm stack |
| `docker-compose.prod.yml` | Production Swarm stack |
