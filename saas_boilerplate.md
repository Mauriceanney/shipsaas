# CLAUDE CODE SAAS BOILERPLATE

## Complete Autonomous Development System

> **Version**: 1.0.0  
> **Stack**: Next.js 15 + TypeScript + Prisma + PostgreSQL  
> **Deploy**: Digital Ocean Droplet  
> **Date**: December 2025

---

# TABLE OF CONTENTS

1. [Quick Start Guide](#part-1-quick-start-guide)
2. [Project Structure](#part-2-project-structure)
3. [Docker Infrastructure](#part-3-docker-infrastructure)
4. [Scripts](#part-4-scripts)
5. [Claude Code Configuration](#part-5-claude-code-configuration)
6. [Specialized Agents](#part-6-specialized-agents)
7. [Skills Library](#part-7-skills-library)
8. [Orchestrated Commands](#part-8-orchestrated-commands)
9. [Autonomous Workflow](#part-9-autonomous-workflow)
10. [Environment Configuration](#part-10-environment-configuration)
11. [Database Seeds](#part-11-database-seeds)
12. [CI/CD Pipeline](#part-12-cicd-pipeline)
13. [Construction Epics](#part-13-construction-epics)

---

# PART 1: QUICK START GUIDE

## 🚀 First Time Setup

```bash
# 1. Create a new project
mkdir my-saas && cd my-saas
git init

# 2. Open Claude Code
claude

# 3. Give Claude this instruction:
```

```
Generate the complete SaaS boilerplate according to the CLAUDE_CODE_SAAS_BOILERPLATE.md document.
Create all files, configurations, and structure.
```

```bash
# 4. Once generated, launch the environment
./scripts/dev.sh up
pnpm install
pnpm db:push
pnpm db:seed:demo
pnpm dev

# 5. Access the app
# App: http://localhost:3000
# Mailhog: http://localhost:8025
# MinIO Console: http://localhost:9001
```

## 🎮 Daily Workflow

```bash
# New feature (100% autonomous)
> "Implement an email notification system for new subscriptions"

# Claude does EVERYTHING automatically:
# - Creates GitHub issue
# - Creates feature branch
# - Orchestrates agents
# - Implements with TDD
# - Creates PR
# - Notifies you

# You review the PR, then:
> "Merge"

# Claude merges, closes issue, cleans up branch
```

## 📋 Main Commands

| Command | Description |
|---------|-------------|
| `/ship <description>` | Complete autonomous workflow → PR |
| `/approve` | Merge PR + Close Issue + Cleanup |
| `/revise <feedback>` | Apply requested changes |
| `/status` | Current project state |
| `/deploy` | Deploy to Digital Ocean |

---

# PART 2: PROJECT STRUCTURE

```
saas-boilerplate/
│
├── .claude/                              # 🤖 CLAUDE CODE CONFIGURATION
│   ├── settings.json                     # Permissions, hooks, MCP
│   ├── settings.local.json               # Local overrides (gitignored)
│   │
│   ├── agents/                           # 8 Specialized agents
│   │   ├── product-manager.md
│   │   ├── architect.md
│   │   ├── ui-ux-designer.md
│   │   ├── frontend-dev.md
│   │   ├── backend-dev.md
│   │   ├── security.md
│   │   ├── qa-engineer.md
│   │   └── devops.md
│   │
│   ├── skills/                           # 15+ Specialized skills
│   │   ├── product/
│   │   │   ├── user-stories/SKILL.md
│   │   │   └── prioritization/SKILL.md
│   │   ├── architecture/
│   │   │   ├── system-design/SKILL.md
│   │   │   ├── patterns/SKILL.md
│   │   │   └── adr/SKILL.md
│   │   ├── frontend/
│   │   │   ├── nextjs-app-router/SKILL.md
│   │   │   ├── react-patterns/SKILL.md
│   │   │   └── shadcn-ui/SKILL.md
│   │   ├── backend/
│   │   │   ├── server-actions/SKILL.md
│   │   │   ├── prisma-database/SKILL.md
│   │   │   └── api-design/SKILL.md
│   │   ├── auth/
│   │   │   └── authjs-setup/SKILL.md
│   │   ├── payments/
│   │   │   └── stripe-integration/SKILL.md
│   │   ├── security/
│   │   │   └── owasp-top10/SKILL.md
│   │   ├── testing/
│   │   │   ├── tdd-methodology/SKILL.md
│   │   │   ├── vitest-unit/SKILL.md
│   │   │   └── playwright-e2e/SKILL.md
│   │   ├── devops/
│   │   │   ├── docker-local/SKILL.md
│   │   │   ├── github-actions/SKILL.md
│   │   │   └── digitalocean-deploy/SKILL.md
│   │   └── common/
│   │       ├── git-workflow/SKILL.md
│   │       └── conventional-commits/SKILL.md
│   │
│   └── commands/                         # Orchestrated commands
│       ├── ship.md
│       ├── approve.md
│       └── revise.md
│
├── src/                                  # 📦 APPLICATION SOURCE
│   ├── app/                              # Next.js App Router
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx
│   │   │   ├── signup/page.tsx
│   │   │   ├── forgot-password/page.tsx
│   │   │   └── layout.tsx
│   │   ├── (dashboard)/
│   │   │   ├── dashboard/page.tsx
│   │   │   ├── settings/
│   │   │   │   ├── page.tsx
│   │   │   │   ├── profile/page.tsx
│   │   │   │   └── billing/page.tsx
│   │   │   └── layout.tsx
│   │   ├── (marketing)/
│   │   │   ├── page.tsx
│   │   │   ├── pricing/page.tsx
│   │   │   ├── blog/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [slug]/page.tsx
│   │   │   └── layout.tsx
│   │   ├── api/
│   │   │   ├── webhooks/stripe/route.ts
│   │   │   ├── auth/[...nextauth]/route.ts
│   │   │   └── health/route.ts
│   │   ├── layout.tsx
│   │   ├── error.tsx
│   │   └── globals.css
│   │
│   ├── components/
│   │   ├── ui/                           # shadcn/ui
│   │   ├── forms/
│   │   ├── layout/
│   │   ├── marketing/
│   │   └── dashboard/
│   │
│   ├── lib/
│   │   ├── auth/
│   │   ├── db/
│   │   ├── payments/
│   │   ├── email/
│   │   ├── validations/
│   │   └── utils/
│   │
│   ├── actions/
│   ├── hooks/
│   ├── types/
│   └── config/
│
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seeds/
│
├── emails/                               # React Email templates
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
│
├── public/
├── .github/workflows/
├── scripts/
├── docs/epics/
│
├── docker-compose.yml
├── docker-compose.dev.yml
├── docker-compose.prod.yml
├── Dockerfile
├── .env.example
├── package.json
├── CLAUDE.md
└── README.md
```

---

# PART 3: DOCKER INFRASTRUCTURE

## docker-compose.yml (Base)

```yaml
version: "3.9"

services:
  postgres:
    image: postgres:16-alpine
    container_name: ${PROJECT_NAME:-saas}-postgres
    restart: unless-stopped
    environment:
      POSTGRES_USER: ${POSTGRES_USER:-postgres}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-postgres}
      POSTGRES_DB: ${POSTGRES_DB:-saas}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER:-postgres}"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    container_name: ${PROJECT_NAME:-saas}-redis
    restart: unless-stopped
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  postgres_data:
  redis_data:

networks:
  default:
    name: ${PROJECT_NAME:-saas}-network
```

## docker-compose.dev.yml (Development)

```yaml
version: "3.9"

services:
  postgres:
    ports:
      - "5432:5432"

  redis:
    ports:
      - "6379:6379"

  mailhog:
    image: mailhog/mailhog:latest
    container_name: ${PROJECT_NAME:-saas}-mailhog
    ports:
      - "1025:1025"
      - "8025:8025"
    logging:
      driver: none

  minio:
    image: minio/minio:latest
    container_name: ${PROJECT_NAME:-saas}-minio
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: ${MINIO_ROOT_USER:-minioadmin}
      MINIO_ROOT_PASSWORD: ${MINIO_ROOT_PASSWORD:-minioadmin}
    ports:
      - "9000:9000"
      - "9001:9001"
    volumes:
      - minio_data:/data

volumes:
  minio_data:
```

## docker-compose.prod.yml (Production)

```yaml
version: "3.9"

services:
  traefik:
    image: traefik:v3.0
    container_name: ${PROJECT_NAME:-saas}-traefik
    restart: always
    command:
      - "--api.dashboard=true"
      - "--providers.docker=true"
      - "--providers.docker.exposedbydefault=false"
      - "--entrypoints.web.address=:80"
      - "--entrypoints.websecure.address=:443"
      - "--entrypoints.web.http.redirections.entrypoint.to=websecure"
      - "--entrypoints.web.http.redirections.entrypoint.scheme=https"
      - "--certificatesresolvers.letsencrypt.acme.email=${ACME_EMAIL}"
      - "--certificatesresolvers.letsencrypt.acme.storage=/letsencrypt/acme.json"
      - "--certificatesresolvers.letsencrypt.acme.httpchallenge.entrypoint=web"
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
      - traefik_letsencrypt:/letsencrypt

  app:
    image: ghcr.io/${GITHUB_REPOSITORY}:${IMAGE_TAG:-latest}
    container_name: ${PROJECT_NAME:-saas}-app
    restart: always
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:5432/${POSTGRES_DB}
      - REDIS_URL=redis://redis:6379
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.app.rule=Host(`${DOMAIN}`)"
      - "traefik.http.routers.app.entrypoints=websecure"
      - "traefik.http.routers.app.tls.certresolver=letsencrypt"
      - "traefik.http.services.app.loadbalancer.server.port=3000"

  postgres:
    expose:
      - "5432"

  redis:
    expose:
      - "6379"

  backup:
    image: prodrigestivill/postgres-backup-local:16
    container_name: ${PROJECT_NAME:-saas}-backup
    restart: always
    environment:
      POSTGRES_HOST: postgres
      POSTGRES_DB: ${POSTGRES_DB:-saas}
      POSTGRES_USER: ${POSTGRES_USER:-postgres}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      SCHEDULE: "@daily"
      BACKUP_KEEP_DAYS: 7
      BACKUP_KEEP_WEEKS: 4
      BACKUP_KEEP_MONTHS: 6
    volumes:
      - ./backups:/backups
    depends_on:
      postgres:
        condition: service_healthy

volumes:
  traefik_letsencrypt:
```

## Dockerfile

```dockerfile
# Stage 1: Dependencies
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@latest --activate
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# Stage 2: Builder
FROM node:20-alpine AS builder
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@latest --activate
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm prisma generate
ENV NEXT_TELEMETRY_DISABLED 1
RUN pnpm build

# Stage 3: Runner
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
RUN chown -R nextjs:nodejs /app
USER nextjs
EXPOSE 3000
ENV PORT 3000
ENV HOSTNAME "0.0.0.0"
CMD ["node", "server.js"]
```

---

# PART 4: SCRIPTS

## scripts/dev.sh

```bash
#!/usr/bin/env bash
set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

PROJECT_NAME="${PROJECT_NAME:-saas}"
COMPOSE_FILES="-f docker-compose.yml -f docker-compose.dev.yml"

print_header() { echo -e "\n${BLUE}━━━ $1 ━━━${NC}\n"; }
print_success() { echo -e "${GREEN}✓ $1${NC}"; }
print_warning() { echo -e "${YELLOW}⚠ $1${NC}"; }
print_error() { echo -e "${RED}✗ $1${NC}"; }

check_docker() {
    if ! docker info > /dev/null 2>&1; then
        print_error "Docker is not running"
        exit 1
    fi
}

cmd_up() {
    print_header "Starting Development Services"
    check_docker
    docker compose ${COMPOSE_FILES} up -d
    print_success "Services started!"
    echo ""
    echo "  PostgreSQL:  localhost:5432"
    echo "  Redis:       localhost:6379"
    echo "  Mailhog:     http://localhost:8025"
    echo "  MinIO:       http://localhost:9001"
}

cmd_down() {
    print_header "Stopping Services"
    check_docker
    docker compose ${COMPOSE_FILES} down
    print_success "Services stopped!"
}

cmd_reset() {
    print_header "Resetting Database"
    check_docker
    print_warning "This will delete all data. Continue? (y/N)"
    read -r response
    [[ ! "$response" =~ ^[Yy]$ ]] && exit 0
    docker compose ${COMPOSE_FILES} down -v
    docker compose ${COMPOSE_FILES} up -d
    sleep 5
    pnpm prisma db push
    print_success "Database reset!"
}

cmd_seed() {
    print_header "Seeding Base Data"
    pnpm prisma db seed
    print_success "Base data seeded!"
}

cmd_demo() {
    print_header "Seeding Demo Data"
    pnpm db:seed:demo
    print_success "Demo data seeded!"
    echo "  Demo: demo@example.com / demo123"
    echo "  Admin: admin@example.com / admin123"
}

cmd_logs() {
    docker compose ${COMPOSE_FILES} logs -f ${1:-}
}

cmd_clean() {
    print_header "Cleaning Up"
    check_docker
    print_warning "Remove all containers and volumes? (y/N)"
    read -r response
    [[ ! "$response" =~ ^[Yy]$ ]] && exit 0
    docker compose ${COMPOSE_FILES} down -v --rmi local --remove-orphans
    rm -rf node_modules .next
    print_success "Cleanup complete!"
}

case "${1:-help}" in
    up)     cmd_up ;;
    down)   cmd_down ;;
    reset)  cmd_reset ;;
    seed)   cmd_seed ;;
    demo)   cmd_demo ;;
    logs)   cmd_logs "$2" ;;
    clean)  cmd_clean ;;
    *)      echo "Usage: ./scripts/dev.sh [up|down|reset|seed|demo|logs|clean]" ;;
esac
```

## scripts/deploy.sh

```bash
#!/usr/bin/env bash
set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

PROJECT_NAME="${PROJECT_NAME:-saas}"
DEPLOY_USER="${DEPLOY_USER:-deploy}"
DEPLOY_HOST="${DEPLOY_HOST:-}"
DEPLOY_PATH="${DEPLOY_PATH:-/opt/$PROJECT_NAME}"
COMPOSE_FILES="-f docker-compose.yml -f docker-compose.prod.yml"

print_header() { echo -e "\n${BLUE}━━━ $1 ━━━${NC}\n"; }
print_success() { echo -e "${GREEN}✓ $1${NC}"; }
print_error() { echo -e "${RED}✗ $1${NC}"; }

check_config() {
    if [ -z "$DEPLOY_HOST" ]; then
        print_error "DEPLOY_HOST is not set"
        exit 1
    fi
}

remote_exec() { ssh "${DEPLOY_USER}@${DEPLOY_HOST}" "$@"; }
remote_copy() { scp "$1" "${DEPLOY_USER}@${DEPLOY_HOST}:$2"; }

cmd_setup() {
    print_header "Setting Up Server"
    check_config
    remote_exec "
        if ! command -v docker &> /dev/null; then
            curl -fsSL https://get.docker.com | sh
            sudo usermod -aG docker \$USER
        fi
        sudo mkdir -p ${DEPLOY_PATH}
        sudo chown ${DEPLOY_USER}:${DEPLOY_USER} ${DEPLOY_PATH}
        mkdir -p ${DEPLOY_PATH}/backups
    "
    remote_copy "docker-compose.yml" "${DEPLOY_PATH}/"
    remote_copy "docker-compose.prod.yml" "${DEPLOY_PATH}/"
    print_success "Server setup complete!"
    echo "Next: Create .env file on server at ${DEPLOY_PATH}/.env"
}

cmd_deploy() {
    print_header "Deploying"
    check_config
    IMAGE_TAG="${IMAGE_TAG:-latest}"
    remote_copy "docker-compose.yml" "${DEPLOY_PATH}/"
    remote_copy "docker-compose.prod.yml" "${DEPLOY_PATH}/"
    remote_exec "
        cd ${DEPLOY_PATH}
        docker compose ${COMPOSE_FILES} pull app
        CURRENT=\$(docker compose ${COMPOSE_FILES} images app -q 2>/dev/null || true)
        [ ! -z \"\$CURRENT\" ] && docker tag \$CURRENT ${PROJECT_NAME}-app:rollback 2>/dev/null || true
        docker compose ${COMPOSE_FILES} up -d
        docker compose ${COMPOSE_FILES} exec -T app npx prisma migrate deploy
        sleep 10
        docker compose ${COMPOSE_FILES} exec -T app curl -f http://localhost:3000/api/health
        docker image prune -f
    "
    print_success "Deployment complete!"
}

cmd_rollback() {
    print_header "Rolling Back"
    check_config
    remote_exec "
        cd ${DEPLOY_PATH}
        docker tag ${PROJECT_NAME}-app:rollback ghcr.io/\${GITHUB_REPOSITORY}:latest
        docker compose ${COMPOSE_FILES} up -d
    "
    print_success "Rollback complete!"
}

cmd_logs() {
    check_config
    remote_exec "cd ${DEPLOY_PATH} && docker compose ${COMPOSE_FILES} logs --tail=${2:-100} -f ${1:-app}"
}

cmd_backup() {
    print_header "Creating Backup"
    check_config
    TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    remote_exec "
        cd ${DEPLOY_PATH}
        docker compose ${COMPOSE_FILES} exec -T postgres pg_dump -U \${POSTGRES_USER} \${POSTGRES_DB} | gzip > backups/backup_${TIMESTAMP}.sql.gz
    "
    print_success "Backup created: backup_${TIMESTAMP}.sql.gz"
}

case "${1:-help}" in
    setup)    cmd_setup ;;
    deploy)   cmd_deploy ;;
    rollback) cmd_rollback ;;
    logs)     cmd_logs "$2" "$3" ;;
    backup)   cmd_backup ;;
    ssh)      check_config && ssh "${DEPLOY_USER}@${DEPLOY_HOST}" ;;
    *)        echo "Usage: ./scripts/deploy.sh [setup|deploy|rollback|logs|backup|ssh]" ;;
esac
```

---

# PART 5: CLAUDE CODE CONFIGURATION

## .claude/settings.json

```json
{
  "$schema": "https://claude.ai/schemas/claude-code-settings.json",
  
  "project": {
    "name": "SaaS Boilerplate",
    "description": "Production-ready Next.js SaaS with autonomous development",
    "version": "1.0.0"
  },
  
  "permissions": {
    "allow": [
      "Read", "Write", "Edit", "Glob", "Grep",
      "Bash(npm:*)", "Bash(pnpm:*)", "Bash(npx:*)",
      "Bash(git:*)", "Bash(docker:*)", "Bash(docker-compose:*)",
      "Bash(./scripts/*)", "Bash(gh:*)",
      "Bash(cat:*)", "Bash(ls:*)", "Bash(mkdir:*)", "Bash(cp:*)"
    ],
    "deny": [
      "Bash(rm -rf /)", "Bash(rm -rf ~)",
      "Bash(curl*|bash)", "Bash(wget*|bash)",
      "Read(.env)", "Read(.env.local)", "Read(.env.production)"
    ]
  },
  
  "hooks": {
    "PreToolUse": [{ "matcher": "Bash", "handler": ".claude/hooks/pre-bash.js" }],
    "PostToolUse": [{ "matcher": "Write|Edit", "handler": ".claude/hooks/post-write.js" }]
  },
  
  "mcp": {
    "servers": {
      "filesystem": { "command": "npx", "args": ["-y", "@anthropic-ai/mcp-server-filesystem", "--root", "."] },
      "postgres": { "command": "npx", "args": ["-y", "@anthropic-ai/mcp-server-postgres"], "env": { "POSTGRES_URL": "${DATABASE_URL}" } },
      "github": { "command": "npx", "args": ["-y", "@anthropic-ai/mcp-server-github"], "env": { "GITHUB_TOKEN": "${GITHUB_TOKEN}" } }
    }
  },
  
  "testing": {
    "framework": "vitest",
    "e2e": "playwright",
    "coverage": { "threshold": 80 }
  },
  
  "git": {
    "commitConvention": "conventional",
    "branchPrefix": { "feature": "feature/", "bugfix": "fix/", "hotfix": "hotfix/" },
    "autoCreatePR": true
  }
}
```

## CLAUDE.md (Root Context)

```markdown
# CLAUDE.md - Project Context

## Project Overview
Production-ready SaaS boilerplate with Next.js 15, TypeScript, Prisma.
Uses autonomous agentic development workflow.

## Tech Stack
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript (strict)
- **Database**: PostgreSQL + Prisma
- **Cache**: Redis
- **Auth**: Auth.js v5
- **Payments**: Stripe
- **Email**: Resend + React Email
- **UI**: TailwindCSS + shadcn/ui
- **Testing**: Vitest + Playwright
- **Deploy**: Digital Ocean + Docker

## Key Commands
```bash
pnpm dev              # Start dev server
./scripts/dev.sh up   # Start Docker services
pnpm db:push          # Push Prisma schema
pnpm db:seed:demo     # Seed demo data
pnpm test             # Run unit tests
pnpm test:e2e         # Run E2E tests
```

## Development Workflow
1. Describe feature → Claude orchestrates agents
2. PM → Architect → UI/UX → Frontend/Backend → Security → QA
3. TDD implementation, PR creation
4. You review, Claude merges

## Commands
- `/ship <description>` - Full workflow → PR
- `/approve` - Merge current PR
- `/revise <feedback>` - Apply changes

## Coding Standards
- TypeScript strict, no `any`
- Functional components with hooks
- TailwindCSS only, shadcn/ui components
- Server Actions for mutations
- TDD approach

## Git Conventions
- Branches: `feature/*`, `fix/*`, `hotfix/*`
- Commits: Conventional (`feat:`, `fix:`, `docs:`)
```

---

# PART 6: SPECIALIZED AGENTS

## .claude/agents/product-manager.md

```markdown
# 🎯 Product Manager Agent

## Role
- Understand user requirements
- Write clear user stories
- Define acceptance criteria
- Prioritize features

## User Story Format
```
As a [user type]
I want to [action/feature]
So that [benefit/value]
```

## Acceptance Criteria Format
```
Given [precondition]
When [action]
Then [expected result]
```

## Definition of Done
- [ ] All acceptance criteria met
- [ ] Unit tests written and passing
- [ ] E2E tests for critical paths
- [ ] Code reviewed
- [ ] Documentation updated
- [ ] No security vulnerabilities

## Priority (MoSCoW)
- **Must Have**: Critical for MVP
- **Should Have**: Important but not critical
- **Could Have**: Nice to have
- **Won't Have**: Out of scope

## Handoff
→ Architect (technical design)
→ UI/UX Designer (if UI involved)
```

## .claude/agents/architect.md

```markdown
# 🏛️ Architect Agent

## Role
- System design decisions
- Technical pattern selection
- Code review and validation
- Architecture Decision Records

## Process
1. Analyze scope and complexity
2. Identify affected components
3. Evaluate existing patterns
4. Document decisions (ADR)
5. Final validation before merge

## Patterns
### Frontend
- Server Components by default
- Client Components only for interactivity
- Composition over inheritance

### Backend
- Server Actions for mutations
- Route Handlers for webhooks
- Repository pattern for data access

## Validation Checklist
- [ ] Architecture patterns followed
- [ ] No security anti-patterns
- [ ] Performance considerations
- [ ] Error handling complete
- [ ] Documentation accurate

## Handoff
→ Frontend/Backend Devs (after design)
← Security (review results)
← QA (before final validation)
```

## .claude/agents/ui-ux-designer.md

```markdown
# 🎨 UI/UX Designer Agent

## Role
- Interface design and layouts
- User flow design
- Component specifications
- Accessibility compliance

## Design System
Using shadcn/ui with:
- 4px spacing grid
- Accessible by default
- Dark mode support
- Responsive design

## Component Spec Format
```markdown
### [Component Name]
**Purpose**: [What it does]
**States**: Default, Loading, Error, Success
**Props**: [TypeScript interface]
**Accessibility**: Role, Labels, Keyboard
```

## Accessibility Checklist
- [ ] Keyboard navigable
- [ ] Screen reader friendly
- [ ] Color contrast (WCAG AA)
- [ ] Focus indicators visible
- [ ] Error messages announced

## Handoff
→ Frontend Dev (implementation)
→ QA (visual testing criteria)
```

## .claude/agents/frontend-dev.md

```markdown
# ⚛️ Frontend Developer Agent

## Role
- React component implementation
- Next.js pages/layouts
- Client-side state
- Frontend testing (TDD)

## TDD Process
1. **RED**: Write failing test
2. **GREEN**: Minimum code to pass
3. **REFACTOR**: Improve while green

## Component Standards
```typescript
'use client'; // Only if needed

interface Props {
  className?: string;
}

export function Component({ className }: Props) {
  return <div className={cn('base', className)} />;
}
```

## Server vs Client
**Server (default)**: Data fetching, backend access
**Client ('use client')**: useState, useEffect, onClick

## Testing
```typescript
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

describe('Component', () => {
  it('renders correctly', () => {
    render(<Component />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });
});
```

## Handoff
→ QA (E2E tests)
→ Security (review)
→ Architect (validation)
```

## .claude/agents/backend-dev.md

```markdown
# ⚙️ Backend Developer Agent

## Role
- Server Actions implementation
- API Route Handlers
- Database operations (Prisma)
- Backend testing (TDD)

## Server Action Pattern
```typescript
'use server';

import { z } from 'zod';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { revalidatePath } from 'next/cache';

const schema = z.object({ name: z.string().min(2) });

type Result<T> = { success: true; data: T } | { success: false; error: string };

export async function createItem(input: z.infer<typeof schema>): Promise<Result<Item>> {
  try {
    const session = await auth();
    if (!session?.user) return { success: false, error: 'Unauthorized' };
    
    const data = schema.parse(input);
    const item = await db.item.create({ data });
    
    revalidatePath('/items');
    return { success: true, data: item };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message };
    }
    return { success: false, error: 'An error occurred' };
  }
}
```

## Webhook Handler Pattern
```typescript
export async function POST(request: Request) {
  const body = await request.text();
  const signature = headers().get('stripe-signature')!;
  
  const event = stripe.webhooks.constructEvent(body, signature, secret);
  
  switch (event.type) {
    case 'checkout.session.completed':
      await handleCheckout(event.data.object);
      break;
  }
  
  return NextResponse.json({ received: true });
}
```

## Handoff
→ Security (review)
→ QA (integration tests)
→ Architect (validation)
```

## .claude/agents/security.md

```markdown
# 🔒 Security Agent

## Role
- Security audits
- Vulnerability assessment
- OWASP Top 10 compliance
- Auth/Authz review

## Checklist

### Authentication
- [ ] Password hashing (bcrypt)
- [ ] Session management secure
- [ ] Rate limiting on auth endpoints
- [ ] MFA available

### Authorization
- [ ] RBAC implemented
- [ ] Resource ownership verified
- [ ] No privilege escalation

### Input Validation
- [ ] All inputs validated (Zod)
- [ ] SQL injection prevented (Prisma)
- [ ] XSS prevented (React)
- [ ] CSRF tokens

### Data Protection
- [ ] Sensitive data encrypted
- [ ] No secrets in code/logs
- [ ] Proper error messages

## Common Fixes
```typescript
// ❌ Bad: No auth check
export async function deleteUser(id: string) {
  await db.user.delete({ where: { id } });
}

// ✅ Good: Auth + Authz
export async function deleteUser(id: string) {
  const session = await auth();
  if (!session?.user) throw new Error('Unauthorized');
  if (session.user.role !== 'admin') throw new Error('Forbidden');
  await db.user.delete({ where: { id } });
}
```

## Output
```markdown
## Security Audit: [Feature]

### Findings
🔴 Critical: [None or list]
🟠 High: [None or list]
🟡 Medium: [None or list]

### Sign-off: [Approved/Blocked]
```
```

## .claude/agents/qa-engineer.md

```markdown
# 🧪 QA Engineer Agent

## Role
- E2E test implementation
- Acceptance criteria verification
- Definition of Done validation
- Test coverage analysis

## E2E Test Pattern
```typescript
import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('user can login', async ({ page }) => {
    await page.goto('/login');
    await page.fill('[data-testid="email"]', 'demo@example.com');
    await page.fill('[data-testid="password"]', 'demo123');
    await page.click('[data-testid="login-button"]');
    await expect(page).toHaveURL('/dashboard');
  });
});
```

## AC Verification Format
```markdown
### AC: [Description]
- **Given**: [Precondition]
- **When**: [Action]
- **Then**: [Expected]
- **Test**: `tests/e2e/feature.spec.ts:XX`
- **Status**: ✅ Passing
```

## DoD Checklist
- [ ] All AC have E2E tests
- [ ] All tests passing
- [ ] Unit coverage ≥ 80%
- [ ] No console errors
- [ ] Responsive verified
- [ ] Accessibility passing

## Handoff
→ Architect (final validation)
← Frontend/Backend (if issues found)
```

## .claude/agents/devops.md

```markdown
# 🚀 DevOps Agent

## Role
- Docker configuration
- CI/CD pipeline
- Digital Ocean deployment
- Monitoring and backup

## Infrastructure
```
Digital Ocean Droplet
├── Traefik (SSL, routing)
└── Docker Compose
    ├── Next.js App
    ├── PostgreSQL
    ├── Redis
    └── Backup Cron
```

## CI/CD Flow
1. Push to main
2. Run tests (lint, typecheck, unit, E2E)
3. Build Docker image
4. Push to GitHub Container Registry
5. SSH deploy to Droplet
6. Run migrations
7. Health check

## Backup Strategy
- Daily: Full database backup
- Keep: 7 days, 4 weeks, 6 months

## Emergency Commands
```bash
./scripts/deploy.sh rollback
./scripts/deploy.sh logs app 500
./scripts/deploy.sh backup
```
```

---

# PART 7: SKILLS LIBRARY

## .claude/skills/product/user-stories/SKILL.md

```markdown
# User Stories Skill

## Format
```
As a [user persona]
I want to [action]
So that [benefit]
```

## INVEST Criteria
- **I**ndependent
- **N**egotiable
- **V**aluable
- **E**stimable
- **S**mall
- **T**estable

## Story Points
| Points | Complexity |
|--------|------------|
| 1 | Trivial |
| 2 | Simple |
| 3 | Medium |
| 5 | Complex |
| 8 | Very Complex |
| 13 | Split needed |
```

## .claude/skills/testing/tdd-methodology/SKILL.md

```markdown
# TDD Methodology Skill

## The Cycle
```
RED → GREEN → REFACTOR → (repeat)
```

## Process
1. **RED**: Write failing test first
2. **GREEN**: Minimum code to pass
3. **REFACTOR**: Improve while tests pass

## Rules
- Only write production code to fix failing test
- Only write enough test to fail
- Only write enough code to pass
- Refactor only when green

## Test Structure (AAA)
```typescript
it('should do something', () => {
  // Arrange
  const input = { ... };
  
  // Act
  const result = fn(input);
  
  // Assert
  expect(result).toBe(expected);
});
```
```

## .claude/skills/frontend/nextjs-app-router/SKILL.md

```markdown
# Next.js App Router Skill

## File Conventions
| File | Purpose |
|------|---------|
| `page.tsx` | Route UI |
| `layout.tsx` | Shared wrapper |
| `loading.tsx` | Suspense fallback |
| `error.tsx` | Error boundary |
| `route.ts` | API endpoint |

## Route Groups
```
app/
├── (marketing)/    # No URL segment
├── (dashboard)/    # No URL segment
└── api/
```

## Server Components (Default)
```typescript
async function Page() {
  const data = await db.query();
  return <Component data={data} />;
}
```

## Client Components
```typescript
'use client';
import { useState } from 'react';

function Counter() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(c => c + 1)}>{count}</button>;
}
```

## Data Fetching
```typescript
// Direct in Server Components
const posts = await db.post.findMany();

// With Suspense
<Suspense fallback={<Loading />}>
  <AsyncComponent />
</Suspense>
```
```

## .claude/skills/backend/server-actions/SKILL.md

```markdown
# Server Actions Skill

## Pattern
```typescript
'use server';

import { z } from 'zod';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { revalidatePath } from 'next/cache';

const schema = z.object({
  title: z.string().min(1).max(200),
});

type Result<T> = 
  | { success: true; data: T }
  | { success: false; error: string };

export async function createPost(
  input: z.infer<typeof schema>
): Promise<Result<Post>> {
  try {
    // 1. Auth
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: 'Unauthorized' };
    }
    
    // 2. Validate
    const data = schema.parse(input);
    
    // 3. Execute
    const post = await db.post.create({
      data: { ...data, authorId: session.user.id }
    });
    
    // 4. Revalidate
    revalidatePath('/posts');
    
    // 5. Return
    return { success: true, data: post };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message };
    }
    console.error('createPost error:', error);
    return { success: false, error: 'An error occurred' };
  }
}
```

## Usage in Forms
```typescript
'use client';

function Form() {
  const [state, formAction] = useActionState(createPost, null);
  
  return (
    <form action={formAction}>
      <input name="title" />
      {state?.success === false && <p>{state.error}</p>}
      <button type="submit">Create</button>
    </form>
  );
}
```
```

## .claude/skills/backend/prisma-database/SKILL.md

```markdown
# Prisma Database Skill

## Schema Example
```prisma
model User {
  id            String    @id @default(cuid())
  email         String    @unique
  name          String?
  role          Role      @default(USER)
  posts         Post[]
  subscription  Subscription?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  @@index([email])
}

model Subscription {
  id                   String   @id @default(cuid())
  userId               String   @unique
  user                 User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  stripeCustomerId     String?  @unique
  stripeSubscriptionId String?  @unique
  status               Status   @default(INACTIVE)
  plan                 Plan     @default(FREE)
  createdAt            DateTime @default(now())
  updatedAt            DateTime @updatedAt
}

enum Role { USER ADMIN }
enum Plan { FREE PRO ENTERPRISE }
enum Status { ACTIVE INACTIVE PAST_DUE CANCELED }
```

## Client Singleton
```typescript
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const db = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = db;
}
```

## Common Operations
```typescript
// Create
const user = await db.user.create({ data: { email, name } });

// Read
const user = await db.user.findUnique({ where: { id }, include: { subscription: true } });

// Update
const user = await db.user.update({ where: { id }, data: { name } });

// Delete
await db.user.delete({ where: { id } });

// Pagination
const posts = await db.post.findMany({
  skip: (page - 1) * pageSize,
  take: pageSize,
  orderBy: { createdAt: 'desc' }
});
```

## Commands
```bash
pnpm prisma migrate dev --name add_feature
pnpm prisma migrate deploy
pnpm prisma db push
pnpm prisma studio
```
```

## .claude/skills/testing/vitest-unit/SKILL.md

```markdown
# Vitest Unit Testing Skill

## Setup
```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    coverage: { provider: 'v8', reporter: ['text', 'html'] }
  }
});
```

## Testing Functions
```typescript
import { describe, it, expect } from 'vitest';

describe('formatCurrency', () => {
  it('formats positive numbers', () => {
    expect(formatCurrency(1234.56)).toBe('$1,234.56');
  });
});
```

## Testing Components
```typescript
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

describe('Button', () => {
  it('calls onClick', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Click</Button>);
    await user.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledOnce();
  });
});
```

## Testing Hooks
```typescript
import { renderHook, act } from '@testing-library/react';

describe('useCounter', () => {
  it('increments', () => {
    const { result } = renderHook(() => useCounter());
    act(() => result.current.increment());
    expect(result.current.count).toBe(1);
  });
});
```
```

## .claude/skills/testing/playwright-e2e/SKILL.md

```markdown
# Playwright E2E Skill

## Setup
```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure'
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['iPhone 13'] } }
  ],
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI
  }
});
```

## Test Pattern
```typescript
import { test, expect } from '@playwright/test';

test.describe('Auth', () => {
  test('login works', async ({ page }) => {
    await page.goto('/login');
    await page.fill('[data-testid="email"]', 'demo@example.com');
    await page.fill('[data-testid="password"]', 'demo123');
    await page.click('[data-testid="login-button"]');
    await expect(page).toHaveURL('/dashboard');
  });
});
```

## Page Object Model
```typescript
export class LoginPage {
  constructor(private page: Page) {}
  
  readonly email = this.page.locator('[data-testid="email"]');
  readonly password = this.page.locator('[data-testid="password"]');
  readonly submit = this.page.locator('[data-testid="login-button"]');
  
  async login(email: string, password: string) {
    await this.email.fill(email);
    await this.password.fill(password);
    await this.submit.click();
  }
}
```
```

## .claude/skills/common/conventional-commits/SKILL.md

```markdown
# Conventional Commits Skill

## Format
```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

## Types
| Type | Description |
|------|-------------|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation |
| `style` | Formatting |
| `refactor` | Code restructuring |
| `test` | Tests |
| `chore` | Maintenance |

## Examples
```
feat(auth): add password reset flow
fix(api): handle null user in webhook
docs(readme): update installation steps
test(dashboard): add E2E tests for stats
```

## Breaking Changes
```
feat(api)!: change response format

BREAKING CHANGE: API responses now use camelCase
```
```

---

# PART 8: ORCHESTRATED COMMANDS

## .claude/commands/ship.md

```markdown
# /ship Command

## Purpose
Complete autonomous workflow from description to PR.

## Usage
```
/ship <description>
/ship #<issue_number>
```

## Process

### 1. Parse Request
- Extract feature description or issue number
- If issue number: fetch issue details
- If description: create issue

### 2. Create Branch
```bash
git checkout -b feature/<slug>
```

### 3. Orchestrate Agents

```
┌─────────────┐
│ PM Agent    │ Create user story, AC, DoD
└──────┬──────┘
       ▼
┌─────────────┐
│ Architect   │ Technical design, patterns
└──────┬──────┘
       ▼
┌─────────────┐
│ UI/UX       │ Component specs (if UI)
└──────┬──────┘
       ▼
┌─────────────────────────────┐
│ Frontend    │    Backend    │ TDD implementation
└──────┬──────┴───────┬───────┘
       └──────┬───────┘
              ▼
       ┌─────────────┐
       │ Security    │ Audit code
       └──────┬──────┘
              ▼
       ┌─────────────┐
       │ QA          │ E2E tests, verify AC
       └──────┬──────┘
              ▼
       ┌─────────────┐
       │ Architect   │ Final validation
       └─────────────┘
```

### 4. Implementation (TDD)
For each component/action:
1. Write failing tests
2. Implement to pass
3. Refactor
4. Commit with conventional message

### 5. Quality Checks
```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm test:e2e
```

### 6. Create PR
```bash
git push -u origin feature/<slug>
gh pr create --title "feat: <description>" --body "<details>"
```

### 7. Link Issue
```bash
gh pr edit --add-label "ready-for-review"
```

### 8. Notify
Output: "PR ready for review: <link>"

## Output Format
```
✅ Issue created: #123
✅ Branch: feature/notification-system
✅ PM: User story defined
✅ Architect: Design approved
✅ UI/UX: Components specified
✅ Frontend: 5 components (tests passing)
✅ Backend: 3 actions (tests passing)
✅ Security: Approved
✅ QA: E2E tests passing
✅ PR created: https://github.com/user/repo/pull/42

Ready for review!
```
```

## .claude/commands/approve.md

```markdown
# /approve Command

## Purpose
Merge PR, close issue, cleanup.

## Usage
```
/approve
/approve #<pr_number>
```

## Process

### 1. Identify PR
- Current branch PR or specified number

### 2. Verify Checks
```bash
gh pr checks <number>
```
All must pass:
- CI/CD pipeline
- Required reviews
- No conflicts

### 3. Merge
```bash
gh pr merge <number> --squash --delete-branch
```

### 4. Close Issue
```bash
gh issue close <linked_issue>
```

### 5. Update Changelog
Append to CHANGELOG.md:
```markdown
## [Unreleased]
### Added
- <feature description> (#<issue>)
```

### 6. Cleanup
```bash
git checkout main
git pull
```

## Output
```
✅ PR #42 merged (squash)
✅ Issue #123 closed
✅ Branch feature/notification-system deleted
✅ CHANGELOG.md updated
✅ Local main updated
```
```

## .claude/commands/revise.md

```markdown
# /revise Command

## Purpose
Apply review feedback to current PR.

## Usage
```
/revise <feedback>
```

## Process

### 1. Parse Feedback
Identify:
- Code changes needed
- Test additions
- Documentation updates

### 2. Identify Agents
Based on feedback type:
- UI issues → UI/UX + Frontend
- Logic issues → Backend
- Security concerns → Security
- Test gaps → QA

### 3. Apply Changes (TDD)
1. Write/update tests for feedback
2. Implement fixes
3. Verify all tests pass

### 4. Commit
```bash
git add .
git commit -m "fix: address review feedback"
git push
```

### 5. Update PR
Add comment with changes made.

### 6. Re-notify
```
✅ Review feedback applied
✅ Changes pushed
✅ PR updated: <link>

Ready for re-review!
```
```

---

# PART 9: AUTONOMOUS WORKFLOW

## Complete Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER INPUT                               │
│   "Implement email notifications for new subscriptions"         │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      CLAUDE ORCHESTRATOR                         │
│                                                                  │
│  1. Parse request                                               │
│  2. Create GitHub issue                                         │
│  3. Create feature branch                                       │
│  4. Initialize agent workflow                                   │
└────────────────────────────┬────────────────────────────────────┘
                             │
         ┌───────────────────┼───────────────────┐
         │                   │                   │
         ▼                   ▼                   ▼
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│ 🎯 PM       │───▶│ 🏛️ Architect│───▶│ 🎨 UI/UX    │
│             │    │             │    │             │
│ User Story  │    │ Tech Design │    │ Components  │
│ AC & DoD    │    │ Patterns    │    │ Specs       │
└─────────────┘    └─────────────┘    └──────┬──────┘
                                             │
                   ┌─────────────────────────┴─────────────────────┐
                   │                                               │
                   ▼                                               ▼
          ┌─────────────┐                                 ┌─────────────┐
          │ ⚛️ Frontend  │                                 │ ⚙️ Backend   │
          │             │                                 │             │
          │ TDD:        │                                 │ TDD:        │
          │ 1. Test     │                                 │ 1. Test     │
          │ 2. Code     │                                 │ 2. Code     │
          │ 3. Refactor │                                 │ 3. Refactor │
          └──────┬──────┘                                 └──────┬──────┘
                 │                                               │
                 └─────────────────┬─────────────────────────────┘
                                   │
                                   ▼
                          ┌─────────────┐
                          │ 🔒 Security  │
                          │             │
                          │ Audit       │
                          │ OWASP check │
                          └──────┬──────┘
                                 │
                                 ▼
                          ┌─────────────┐
                          │ 🧪 QA        │
                          │             │
                          │ E2E tests   │
                          │ Verify AC   │
                          └──────┬──────┘
                                 │
                                 ▼
                          ┌─────────────┐
                          │ 🏛️ Architect │
                          │             │
                          │ Final       │
                          │ Validation  │
                          └──────┬──────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                      CLAUDE ORCHESTRATOR                         │
│                                                                  │
│  1. Run all tests                                               │
│  2. Commit changes (conventional commits)                       │
│  3. Push branch                                                 │
│  4. Create PR with full description                            │
│  5. Link to issue                                              │
│  6. Notify user                                                │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                         USER REVIEW                              │
│                                                                  │
│   Review PR on GitHub                                           │
│   ├─▶ "Approve" or "/approve" → Merge flow                     │
│   └─▶ "/revise <feedback>" → Revision flow                     │
└─────────────────────────────────────────────────────────────────┘
```

## Agent Communication Protocol

```typescript
interface AgentMessage {
  from: AgentType;
  to: AgentType;
  type: 'handoff' | 'request' | 'response' | 'approval' | 'rejection';
  payload: {
    context: string;
    artifacts: Artifact[];
    status: 'pending' | 'approved' | 'blocked';
    blockers?: string[];
  };
}

interface Artifact {
  type: 'user-story' | 'design' | 'code' | 'test' | 'review';
  path?: string;
  content: string;
}
```

## TDD Enforcement

Every code change follows:

```
┌────────────────┐
│   RED Phase    │
│                │
│ Write failing  │
│ test first     │
└───────┬────────┘
        │ Test fails ✗
        ▼
┌────────────────┐
│  GREEN Phase   │
│                │
│ Write minimum  │
│ code to pass   │
└───────┬────────┘
        │ Test passes ✓
        ▼
┌────────────────┐
│ REFACTOR Phase │
│                │
│ Improve code   │
│ Tests stay ✓   │
└───────┬────────┘
        │
        ▼
    [Commit]
```

---

# PART 10: ENVIRONMENT CONFIGURATION

## .env.example

```bash
# ===========================================
# APPLICATION
# ===========================================
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000

# ===========================================
# DATABASE
# ===========================================
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/saas?schema=public"

# ===========================================
# REDIS
# ===========================================
REDIS_URL="redis://localhost:6379"

# ===========================================
# AUTHENTICATION (Auth.js)
# ===========================================
AUTH_SECRET="generate-with-openssl-rand-base64-32"
AUTH_URL="http://localhost:3000"

# Google OAuth
AUTH_GOOGLE_ID=""
AUTH_GOOGLE_SECRET=""

# GitHub OAuth
AUTH_GITHUB_ID=""
AUTH_GITHUB_SECRET=""

# ===========================================
# PAYMENTS (Stripe)
# ===========================================
STRIPE_SECRET_KEY=""
STRIPE_WEBHOOK_SECRET=""
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=""

# Stripe Price IDs
STRIPE_PRICE_ID_PRO_MONTHLY=""
STRIPE_PRICE_ID_PRO_YEARLY=""
STRIPE_PRICE_ID_ENTERPRISE_MONTHLY=""
STRIPE_PRICE_ID_ENTERPRISE_YEARLY=""

# ===========================================
# EMAIL (Resend)
# ===========================================
RESEND_API_KEY=""
EMAIL_FROM="noreply@yourdomain.com"

# ===========================================
# STORAGE (S3/MinIO)
# ===========================================
S3_ENDPOINT="http://localhost:9000"
S3_ACCESS_KEY="minioadmin"
S3_SECRET_KEY="minioadmin"
S3_BUCKET="uploads"
S3_REGION="us-east-1"

# ===========================================
# MONITORING (Optional)
# ===========================================
SENTRY_DSN=""
NEXT_PUBLIC_POSTHOG_KEY=""
NEXT_PUBLIC_POSTHOG_HOST=""

# ===========================================
# DEVELOPMENT
# ===========================================
# Mailhog SMTP for local email testing
SMTP_HOST="localhost"
SMTP_PORT="1025"
```

## package.json

```json
{
  "name": "saas-boilerplate",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "lint:fix": "next lint --fix",
    "typecheck": "tsc --noEmit",
    "format": "prettier --write .",
    "test": "vitest",
    "test:watch": "vitest watch",
    "test:coverage": "vitest --coverage",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "db:push": "prisma db push",
    "db:seed": "prisma db seed",
    "db:seed:demo": "tsx prisma/seeds/demo.ts",
    "db:studio": "prisma studio",
    "db:migrate": "prisma migrate dev",
    "db:migrate:deploy": "prisma migrate deploy",
    "email:dev": "email dev",
    "prepare": "husky"
  },
  "dependencies": {
    "next": "^15.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "@prisma/client": "^5.0.0",
    "next-auth": "^5.0.0-beta.0",
    "@auth/prisma-adapter": "^2.0.0",
    "stripe": "^14.0.0",
    "resend": "^2.0.0",
    "@react-email/components": "^0.0.15",
    "zod": "^3.22.0",
    "react-hook-form": "^7.49.0",
    "@hookform/resolvers": "^3.3.0",
    "@tanstack/react-query": "^5.0.0",
    "tailwindcss": "^4.0.0",
    "@tailwindcss/typography": "^0.5.0",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.0.0",
    "tailwind-merge": "^2.0.0",
    "lucide-react": "^0.300.0",
    "@radix-ui/react-dialog": "^1.0.0",
    "@radix-ui/react-dropdown-menu": "^2.0.0",
    "@radix-ui/react-slot": "^1.0.0",
    "@radix-ui/react-toast": "^1.0.0",
    "ioredis": "^5.0.0",
    "bcryptjs": "^2.4.0"
  },
  "devDependencies": {
    "typescript": "^5.3.0",
    "@types/node": "^20.0.0",
    "@types/react": "^18.2.0",
    "@types/bcryptjs": "^2.4.0",
    "prisma": "^5.0.0",
    "vitest": "^1.0.0",
    "@vitejs/plugin-react": "^4.0.0",
    "@testing-library/react": "^14.0.0",
    "@testing-library/user-event": "^14.0.0",
    "@playwright/test": "^1.40.0",
    "eslint": "^8.0.0",
    "eslint-config-next": "^15.0.0",
    "prettier": "^3.0.0",
    "husky": "^9.0.0",
    "lint-staged": "^15.0.0",
    "tsx": "^4.0.0"
  },
  "prisma": {
    "seed": "tsx prisma/seeds/index.ts"
  },
  "lint-staged": {
    "*.{js,jsx,ts,tsx}": ["eslint --fix", "prettier --write"],
    "*.{json,md,yml,yaml}": ["prettier --write"]
  }
}
```

---

# PART 11: DATABASE SEEDS

## prisma/seeds/index.ts

```typescript
import { PrismaClient } from '@prisma/client';
import { seedBase } from './base';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');
  
  await seedBase(prisma);
  
  console.log('✅ Seeding complete!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

## prisma/seeds/base.ts

```typescript
import { PrismaClient, Plan, Role } from '@prisma/client';

export async function seedBase(prisma: PrismaClient) {
  console.log('  Creating base data...');
  
  // This is where you'd add any essential data
  // that needs to exist for the app to function
  
  console.log('  ✓ Base data created');
}
```

## prisma/seeds/demo.ts

```typescript
import { PrismaClient, Plan, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function seedDemo() {
  console.log('🎭 Seeding demo data...');
  
  // Demo User
  const demoPassword = await bcrypt.hash('demo123', 10);
  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@example.com' },
    update: {},
    create: {
      email: 'demo@example.com',
      name: 'Demo User',
      password: demoPassword,
      role: Role.USER,
      emailVerified: new Date(),
      subscription: {
        create: {
          status: 'ACTIVE',
          plan: Plan.PRO,
        }
      }
    }
  });
  console.log('  ✓ Demo user created:', demoUser.email);
  
  // Admin User
  const adminPassword = await bcrypt.hash('admin123', 10);
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      name: 'Admin User',
      password: adminPassword,
      role: Role.ADMIN,
      emailVerified: new Date(),
      subscription: {
        create: {
          status: 'ACTIVE',
          plan: Plan.ENTERPRISE,
        }
      }
    }
  });
  console.log('  ✓ Admin user created:', adminUser.email);
  
  // Demo Blog Posts (if you have a Post model)
  // const posts = await prisma.post.createMany({...});
  
  console.log('✅ Demo seeding complete!');
  console.log('');
  console.log('  Demo accounts:');
  console.log('  📧 demo@example.com / demo123');
  console.log('  📧 admin@example.com / admin123');
}

seedDemo()
  .catch((e) => {
    console.error('❌ Demo seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

---

# PART 12: CI/CD PIPELINE

## .github/workflows/ci.yml

```yaml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - uses: pnpm/action-setup@v2
        with:
          version: 8
          
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'
          
      - run: pnpm install --frozen-lockfile
      - run: pnpm lint
      - run: pnpm typecheck

  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16-alpine
        env:
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
          POSTGRES_DB: test
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
          
    steps:
      - uses: actions/checkout@v4
      
      - uses: pnpm/action-setup@v2
        with:
          version: 8
          
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'
          
      - run: pnpm install --frozen-lockfile
      
      - run: pnpm test:coverage
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/test

  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - uses: pnpm/action-setup@v2
        with:
          version: 8
          
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'
          
      - run: pnpm install --frozen-lockfile
      - run: npx playwright install --with-deps
      - run: pnpm test:e2e
      
      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/
```

## .github/workflows/deploy.yml

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  test:
    uses: ./.github/workflows/ci.yml

  build:
    needs: test
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write
      
    steps:
      - uses: actions/checkout@v4
      
      - uses: docker/setup-buildx-action@v3
      
      - uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}
          
      - uses: docker/build-push-action@v5
        with:
          push: true
          tags: |
            ghcr.io/${{ github.repository }}:${{ github.sha }}
            ghcr.io/${{ github.repository }}:latest
          cache-from: type=gha
          cache-to: type=gha,mode=max

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment: production
    
    steps:
      - uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.DO_HOST }}
          username: ${{ secrets.DO_USERNAME }}
          key: ${{ secrets.DO_SSH_KEY }}
          script: |
            cd /opt/saas
            export IMAGE_TAG=${{ github.sha }}
            docker compose -f docker-compose.yml -f docker-compose.prod.yml pull app
            docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
            docker compose -f docker-compose.yml -f docker-compose.prod.yml exec -T app npx prisma migrate deploy
            sleep 10
            curl -f http://localhost:3000/api/health || exit 1
            docker image prune -f
```

---

# PART 13: CONSTRUCTION EPICS

## Overview

Build the boilerplate in this order:

| Epic | Name | Description |
|------|------|-------------|
| 1 | Foundation | Project setup, Docker, structure |
| 2 | Authentication | Auth.js, OAuth providers |
| 3 | Database | Prisma schema, migrations |
| 4 | Payments | Stripe integration |
| 5 | Email | Resend, templates |
| 6 | Landing Page | Marketing pages |
| 7 | Dashboard | Protected routes, UI |
| 8 | Blog | MDX content |
| 9 | Admin | User management |
| 10 | Testing | Vitest, Playwright |
| 11 | CI/CD | GitHub Actions, deploy |
| 12 | Claude Config | Agents, skills, commands |

## Epic 1: Foundation

```markdown
## User Stories

### US-1.1: Project Initialization
As a developer
I want to initialize a Next.js 15 project with TypeScript
So that I have a modern, type-safe foundation

**AC:**
- [ ] Next.js 15 with App Router
- [ ] TypeScript strict mode
- [ ] TailwindCSS 4 configured
- [ ] shadcn/ui initialized
- [ ] ESLint + Prettier configured

### US-1.2: Docker Development Environment
As a developer
I want Docker services for local development
So that I can run the full stack locally

**AC:**
- [ ] PostgreSQL container
- [ ] Redis container
- [ ] Mailhog container
- [ ] MinIO container
- [ ] dev.sh script working
```

## Epic 2: Authentication

```markdown
## User Stories

### US-2.1: Email/Password Auth
As a user
I want to sign up and login with email/password
So that I can access the application

**AC:**
- [ ] Sign up form with validation
- [ ] Login form
- [ ] Password hashing (bcrypt)
- [ ] Session management
- [ ] Email verification

### US-2.2: OAuth Providers
As a user
I want to login with Google or GitHub
So that I don't need to create a new password

**AC:**
- [ ] Google OAuth configured
- [ ] GitHub OAuth configured
- [ ] Account linking
```

## Epic 3: Database

```markdown
## User Stories

### US-3.1: Database Schema
As a developer
I want a complete Prisma schema
So that I have a solid data foundation

**AC:**
- [ ] User model with roles
- [ ] Account model (OAuth)
- [ ] Session model
- [ ] Subscription model
- [ ] Proper indexes
```

## Epic 4: Payments

```markdown
## User Stories

### US-4.1: Stripe Checkout
As a user
I want to subscribe to a plan
So that I can access premium features

**AC:**
- [ ] Pricing page
- [ ] Stripe Checkout integration
- [ ] Subscription created in database
- [ ] Redirect to success page

### US-4.2: Customer Portal
As a subscriber
I want to manage my subscription
So that I can update payment or cancel

**AC:**
- [ ] Customer portal link
- [ ] Update payment method
- [ ] Cancel subscription
- [ ] View invoices
```

## Epic 5: Email

```markdown
## User Stories

### US-5.1: Transactional Emails
As a user
I want to receive emails for important events
So that I stay informed

**AC:**
- [ ] Welcome email on signup
- [ ] Password reset email
- [ ] Email verification
- [ ] Subscription confirmation
```

## Epic 6: Landing Page

```markdown
## User Stories

### US-6.1: Marketing Landing Page
As a visitor
I want to understand the product value
So that I can decide to sign up

**AC:**
- [ ] Hero section
- [ ] Features section
- [ ] Pricing section
- [ ] Testimonials
- [ ] FAQ
- [ ] CTA sections
```

## Epic 7: Dashboard

```markdown
## User Stories

### US-7.1: Dashboard Layout
As an authenticated user
I want a dashboard interface
So that I can use the application

**AC:**
- [ ] Sidebar navigation
- [ ] Header with user menu
- [ ] Dashboard home with stats
- [ ] Settings pages
```

## Epic 8-12: Additional Epics

Similar format for Blog, Admin, Testing, CI/CD, and Claude Config epics.

---

# USAGE INSTRUCTIONS

## Generate the Boilerplate

1. Create empty folder and open Claude Code:
```bash
mkdir my-saas && cd my-saas
git init
claude
```

2. Give Claude this instruction:
```
Read the CLAUDE_CODE_SAAS_BOILERPLATE.md document and generate the complete boilerplate.
Start with Epic 1 (Foundation), then proceed through each epic in order.
Create all files, configurations, and structure as specified.
```

3. Once generated, start development:
```bash
./scripts/dev.sh up
pnpm install
pnpm db:push
pnpm db:seed:demo
pnpm dev
```

4. Develop features:
```
> "Implement email notifications for subscription events"
```

Claude will autonomously:
- Create issue
- Create branch
- Orchestrate agents
- Implement with TDD
- Create PR
- Notify you

5. Review and merge:
```
> "Approve"
```

---

# END OF DOCUMENT

This document contains everything needed to generate a production-ready SaaS boilerplate with autonomous Claude Code development workflow.
