<div align="center">

# ⚡ ShipSaaS Boilerplate

**Production-ready SaaS starter with Next.js 15, TypeScript, and AI integration**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)

![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white)
![Drizzle](https://img.shields.io/badge/Drizzle-ORM-C5F74F?logo=drizzle&logoColor=black)
![Stripe](https://img.shields.io/badge/Stripe-008CDD?logo=stripe&logoColor=white)

![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-06B6D4?logo=tailwindcss&logoColor=white)
![shadcn/ui](https://img.shields.io/badge/shadcn%2Fui-000000?logo=shadcnui&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel-black?logo=vercel&logoColor=white)

</div>

---

## 🛠️ Tech Stack

| Category | Technologies |
|----------|--------------|
| **Frontend** | Next.js 15, React 19, Tailwind CSS, shadcn/ui |
| **Backend** | Server Actions, Drizzle ORM, PostgreSQL |
| **Auth** | Better Auth (Email, OAuth, 2FA) |
| **Payments** | Stripe (Checkout, Webhooks, Portal) |
| **AI** | Vercel AI SDK + OpenRouter (100+ models) |
| **Observability** | PostHog, Sentry, Pino logging |

---

## 🚀 Features

### 🔐 Authentication
- Email/Password + Google OAuth
- Two-factor authentication with backup codes
- Session management with Better Auth

### 💳 Payments
- Stripe Checkout integration
- Subscription plans with dunning management
- Customer portal for self-service billing

### 🛡️ Security & Compliance
- Rate limiting with Redis (in-memory fallback)
- GDPR compliance (data export, account deletion)
- Email preferences management

### 📊 Observability
- PostHog analytics and feature flags
- Sentry error tracking
- Structured logging with Pino

---

## 📦 Quick Start

### 1️⃣ Create Project

```bash
npx create-ship-saas@latest my-app
cd my-app
```

### 2️⃣ Configure Environment

```bash
cp env.example .env
# Update .env with your credentials
```

### 3️⃣ Start Development

```bash
docker compose up -d        # Start database
pnpm db:migrate             # Run migrations
pnpm dev                    # Start dev server
```

Open [http://localhost:3000](http://localhost:3000) to view your app.

---

## 📁 Project Structure

```
src/
├── app/
│   ├── (auth)/           # Login, register, 2FA
│   ├── (dashboard)/      # Protected routes
│   ├── (marketing)/      # Public pages
│   └── api/              # API routes & webhooks
├── actions/              # Server actions
├── components/           # React components
└── lib/                  # Utilities (auth, db, stripe, email)
```

---

## 🔧 Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | 🔄 Start development server |
| `pnpm build` | 📦 Build for production |
| `pnpm lint` | ✅ Run ESLint |
| `pnpm typecheck` | 🔍 Run TypeScript checks |
| `pnpm db:migrate` | 🗄️ Run database migrations |
| `pnpm db:studio` | 🎛️ Open Drizzle Studio |

---

## 📚 Documentation

| Guide | Description |
|-------|-------------|
| [Stripe Setup](docs/stripe-setup.md) | Configure payments and subscriptions |
| [Observability](docs/observability-setup.md) | PostHog analytics & Sentry errors |
| [GDPR Compliance](docs/gdpr-compliance.md) | Privacy controls and data management |
| [Claude Commands](docs/claude-commands.md) | AI-assisted development workflow |

<details>
<summary><strong>🔑 Environment Variables</strong></summary>

Copy `env.example` to `.env` and configure:

**Required:**
- `POSTGRES_URL` - Database connection string
- `BETTER_AUTH_SECRET` - Auth secret (32+ chars)
- `NEXT_PUBLIC_APP_URL` - Your app URL

**Optional:**
- Stripe, OpenRouter, Redis, Resend, PostHog, Sentry keys

See `env.example` for all options.

</details>

---

## 🚢 Deployment

Deploy to Vercel with one command:

```bash
vercel --prod
```

Add environment variables in the [Vercel Dashboard](https://vercel.com/dashboard).

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

MIT - see [LICENSE](LICENSE) for details.

---

<div align="center">

**If you find this useful, please ⭐ star the repo!**

[Report Bug](https://github.com/your-repo/issues) · [Request Feature](https://github.com/your-repo/issues)

</div>
