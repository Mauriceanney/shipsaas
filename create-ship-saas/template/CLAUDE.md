# ShipSaaS Boilerplate

Production-ready SaaS boilerplate with Next.js 15, TypeScript, and Drizzle ORM.

## Tech Stack

- **Framework**: Next.js 15, React 19, TypeScript
- **Auth**: Better Auth with 2FA
- **Database**: PostgreSQL + Drizzle ORM
- **Payments**: Stripe
- **UI**: shadcn/ui + Tailwind CSS
- **Testing**: Vitest
- **AI**: Vercel AI SDK + OpenRouter

## Agent System

See `.claude/AGENTS.md` for the multi-agent orchestration system.

| Agent | Responsibilities |
|-------|------------------|
| Orchestrator | Coordinates agents, manages phases |
| Architect | Requirements, technical design, API contracts |
| Engineer | Backend + frontend with TDD |
| Quality Engineer | Testing, security audit, QA |
| Platform Engineer | PR creation, deployments |

## Project Structure

```
src/
├── app/
│   ├── (auth)/          # Login, register, 2FA
│   ├── (dashboard)/     # Protected routes
│   ├── (marketing)/     # Public pages
│   └── api/             # API routes
├── actions/             # Server actions
├── components/          # UI components
└── lib/
    ├── auth.ts          # Better Auth config
    ├── db.ts            # Database client
    ├── schema.ts        # Drizzle schema
    ├── stripe/          # Stripe integration
    └── validations/     # Zod schemas
```

## Scripts

```bash
pnpm dev          # Dev server (ask user to run)
pnpm lint         # ESLint (ALWAYS run after changes)
pnpm typecheck    # TypeScript (ALWAYS run after changes)
pnpm db:push      # Push schema to database
pnpm db:generate  # Generate migrations
pnpm db:migrate   # Run migrations
```

## Critical Rules

1. **ALWAYS run** `pnpm lint && pnpm typecheck` after changes
2. **NEVER** start the dev server yourself
3. **Use OpenRouter** for AI, not direct OpenAI
   - Import: `import { openrouter } from "@openrouter/ai-sdk-provider"`

## Key Patterns

### Authentication

```typescript
// Server-side
import { auth } from "@/lib/auth";
const session = await auth();

// Client-side
import { useSession } from "@/lib/auth-client";
```

### Server Actions

```typescript
"use server";
import { auth } from "@/lib/auth";

export async function myAction(input: unknown) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }
  // ... business logic
}
```

### Database

```typescript
import { db } from "@/lib/db";
import { eq } from "drizzle-orm";

// Always include userId for ownership
const items = await db.query.item.findMany({
  where: eq(item.userId, session.user.id),
});
```

## Integration Points

| Feature | Location |
|---------|----------|
| Auth config | `src/lib/auth.ts` |
| Auth client | `src/lib/auth-client.ts` |
| Stripe actions | `src/actions/stripe/` |
| Stripe webhook | `src/app/api/webhooks/stripe/route.ts` |
| Email | `src/lib/email/` |
| Rate limiting | `src/lib/rate-limit/` |

## Package Manager

This project uses **pnpm**.
