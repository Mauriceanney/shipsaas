# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.0.1] - 2026-01-12

### Changed
- Complete rebrand from agentic-coding-starter to shipsaas
- Rename CLI package to create-ship-saas
- Update all branding references to ShipSaaS Boilerplate
- Update GitHub repository references to Mauriceanney/shipsaas

## [1.0.0] - 2026-01-12

### Added
- Initialize production-ready SaaS boilerplate with Next.js 15, TypeScript, and Drizzle ORM
- Sync template with latest boilerplate features
- Integrate email system with Better Auth handlers
- Add security hardening with CSP and rate limiting
- Enhance docker-compose with Redis, Mailpit, and persistence
- Add observability improvements with request tracing
- Add CLI skills with conventional commits and release workflow (commands)
- Add create-ship-saas sync to checkpoint and release (commands)
- Add testing infrastructure with Vitest
- Add test job to CI pipeline with coverage

### Changed
- Rename /publish-to-github command to /create-issues
- Rename create-agentic-coding-starter to create-ship-saas
- Consolidate /commit and /push into /checkpoint (commands)
- Clean up project config and gitignore patterns
- Enhance gitignore patterns with industry best practices
- Clean up dependencies and pin versions
- Redesign README with improved visual hierarchy
- Align package versions to 1.0.0
