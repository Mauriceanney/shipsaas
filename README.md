# SaaS Boilerplate

Production-ready SaaS boilerplate with Next.js 15, TypeScript, Prisma, and more.

## Features

- **Authentication**: Email/password and OAuth (Google, GitHub) with Auth.js v5
- **Payments**: Stripe integration with subscriptions and customer portal
- **Database**: PostgreSQL with Prisma ORM
- **Email**: Transactional emails with Resend and React Email
- **UI**: TailwindCSS with shadcn/ui components
- **Testing**: Unit tests (Vitest) and E2E tests (Playwright)
- **Docker**: Development and production Docker configurations
- **CI/CD**: GitHub Actions workflows

## Quick Start

### Prerequisites

- Node.js 20+
- pnpm 9+
- Docker and Docker Compose

### Setup

1. Clone the repository and install dependencies:

```bash
git clone <repo-url>
cd saas-boilerplate
pnpm install
```

2. Copy environment variables:

```bash
cp .env.example .env
```

3. Start Docker services:

```bash
./scripts/dev.sh up
```

4. Push database schema and seed data:

```bash
pnpm db:push
pnpm db:seed:demo
```

5. Start the development server:

```bash
pnpm dev
```

6. Open http://localhost:3000

### Demo Accounts

- **Demo User**: demo@example.com / demo123
- **Admin User**: admin@example.com / admin123

## Available Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start development server |
| `pnpm build` | Build for production |
| `pnpm start` | Start production server |
| `pnpm lint` | Run ESLint |
| `pnpm typecheck` | Run TypeScript check |
| `pnpm test` | Run unit tests |
| `pnpm test:e2e` | Run E2E tests |
| `pnpm db:push` | Push Prisma schema |
| `pnpm db:studio` | Open Prisma Studio |

## Docker Commands

| Command | Description |
|---------|-------------|
| `./scripts/dev.sh up` | Start all services |
| `./scripts/dev.sh down` | Stop all services |
| `./scripts/dev.sh reset` | Reset database |
| `./scripts/dev.sh logs` | View logs |

## Project Structure

```
├── src/
│   ├── app/           # Next.js App Router
│   ├── components/    # React components
│   ├── lib/           # Utilities and configs
│   ├── actions/       # Server Actions
│   └── types/         # TypeScript types
├── prisma/            # Database schema and seeds
├── tests/             # Test files
├── scripts/           # Development scripts
└── .github/           # CI/CD workflows
```

## Tech Stack

- [Next.js 15](https://nextjs.org) - React framework
- [TypeScript](https://www.typescriptlang.org) - Type safety
- [Prisma](https://www.prisma.io) - Database ORM
- [PostgreSQL](https://www.postgresql.org) - Database
- [Auth.js](https://authjs.dev) - Authentication
- [Stripe](https://stripe.com) - Payments
- [TailwindCSS](https://tailwindcss.com) - Styling
- [shadcn/ui](https://ui.shadcn.com) - UI components
- [Vitest](https://vitest.dev) - Unit testing
- [Playwright](https://playwright.dev) - E2E testing

## License

MIT
