# CLAUDE.md - Project Context

## Project Overview

Production-ready SaaS boilerplate with Next.js 15, TypeScript, and Prisma.
Uses autonomous agentic development workflow.

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
│   ├── (dashboard)/  # Protected routes
│   ├── (marketing)/  # Public marketing pages
│   └── api/          # API routes
├── components/
│   ├── ui/           # shadcn/ui components
│   ├── forms/        # Form components
│   ├── layout/       # Layout components
│   └── dashboard/    # Dashboard components
├── lib/
│   ├── auth/         # Auth.js configuration
│   ├── db/           # Database client
│   ├── payments/     # Stripe integration
│   └── utils/        # Utility functions
├── actions/          # Server Actions
├── hooks/            # Custom React hooks
├── types/            # TypeScript types
└── config/           # App configuration
```

## Coding Standards

- TypeScript strict mode, no `any` types
- Functional React components with hooks
- TailwindCSS for styling, use shadcn/ui components
- Server Actions for data mutations
- Server Components by default, Client Components only when needed
- TDD approach: write tests before implementation

## Git Conventions

- **Branches**: `feature/*`, `fix/*`, `hotfix/*`
- **Commits**: Conventional commits (`feat:`, `fix:`, `docs:`, `test:`, `chore:`)
- **PRs**: Link to issue, include description and test plan

## Development Workflow

1. Start Docker services: `./scripts/dev.sh up`
2. Install dependencies: `pnpm install`
3. Push database schema: `pnpm db:push`
4. Seed demo data: `pnpm db:seed:demo`
5. Start dev server: `pnpm dev`
6. Access at http://localhost:3000

## Demo Accounts

- **Demo**: demo@example.com / demo123
- **Admin**: admin@example.com / admin123

## Environment Variables

Copy `.env.example` to `.env` and configure:

- `DATABASE_URL`: PostgreSQL connection string
- `AUTH_SECRET`: Auth.js secret (generate with `openssl rand -base64 32`)
- `STRIPE_*`: Stripe API keys
- `RESEND_API_KEY`: Resend email API key
