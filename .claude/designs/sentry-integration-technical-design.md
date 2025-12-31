# Technical Design: Sentry Error Monitoring (#39)

## Overview

**One-liner**: Integrate Sentry error monitoring to capture and track production errors with user context and source maps.

**Complexity**: M

## Requirements

- Sentry captures unhandled errors automatically
- User context (id, email) included in error reports
- Source maps uploaded for debugging
- Production-only activation (disabled in development)

## Architecture

Follow existing PostHog pattern:
- Provider component for client-side initialization
- Config file for centralized settings
- Environment-based enabling
- User context from Auth.js session

## File Structure

### New Files
```
src/
├── instrumentation.ts                    # Next.js 15 server init
├── lib/sentry/
│   ├── index.ts                          # Re-exports
│   ├── config.ts                         # Configuration
│   └── server.ts                         # Server utilities
└── components/providers/
    └── sentry-provider.tsx               # Client provider
```

### Files to Modify
- `next.config.ts` - CSP headers for Sentry
- `src/app/layout.tsx` - Add SentryProvider
- `src/app/error.tsx` - Add Sentry.captureException
- `.env.example` - Add Sentry env vars
- `package.json` - Add @sentry/nextjs

## Environment Variables

```env
NEXT_PUBLIC_SENTRY_DSN=
SENTRY_ORG=
SENTRY_PROJECT=
SENTRY_AUTH_TOKEN=
NEXT_PUBLIC_SENTRY_ENVIRONMENT=production
```

## Implementation Checklist

1. Install `@sentry/nextjs`
2. Create Sentry config module
3. Create instrumentation.ts
4. Create SentryProvider component
5. Update layout.tsx with provider
6. Update error.tsx with capture
7. Update next.config.ts CSP headers
8. Add env vars to .env.example
9. Test in production environment

## Security

- Only send non-sensitive user data (id, email)
- Filter sensitive headers and params in beforeSend
- Source maps uploaded to Sentry only (not public)
- CSP compliant with Sentry domains
