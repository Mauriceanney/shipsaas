---
name: ship
description: Autonomous Feature Development (project). Orchestrates the complete development lifecycle with specialized agents for SaaS features.
---

# /ship - Autonomous Feature Development

Execute the complete development lifecycle for a SaaS feature with specialized agent orchestration.

## Usage

```
/ship <feature-description>
/ship #<issue-number>
```

## Arguments

- `$ARGUMENTS` - Feature description or GitHub issue number

## Execution Protocol

### Mandatory Workflow

```
┌─────────────────────────────────────────────────────────────────────┐
│  1. DISCOVERY         → Select/Create Issue, Analyze Requirements   │
│  2. PLANNING          → User Stories, Technical Design              │
│  3. IMPLEMENTATION    → TDD Backend + Frontend (Parallel)           │
│  4. QUALITY           → Security Audit + QA Verification            │
│  5. DELIVERY          → PR Creation, User Approval                  │
│  6. MERGE             → Squash Merge, Close Issue                   │
└─────────────────────────────────────────────────────────────────────┘
```

### Enforcement Rules

- Every phase uses the designated specialized agent
- Quality gates must pass before proceeding
- TDD is mandatory (tests before implementation)
- User approval required before merge

---

## Phase 1: Discovery

### If Issue Number Provided

```bash
# Fetch issue details
gh issue view $ARGUMENTS

# Review existing requirements
# Validate acceptance criteria
```

### If Feature Description Provided

#### Product Engineer Agent
```
@agent:product-engineer
TASK: Create user story for this feature

INPUT: $ARGUMENTS

OUTPUT:
- GitHub issue with user story
- Acceptance criteria (testable)
- Success metrics
- Technical notes
```

**Gate**: Issue created with complete user story

---

## Phase 2: Planning

### Solution Architect Agent
```
@agent:solution-architect
TASK: Create technical design

INPUT:
- User story from issue
- Existing codebase patterns

OUTPUT:
- Technical design document
- Data model (Prisma schema)
- API contracts (Server Actions)
- Component architecture
- Implementation plan
```

**Gate**: Technical design approved

---

## Phase 3: Implementation (TDD)

### Parallel Execution

#### Full-Stack Engineer Agent
```
@agent:full-stack-engineer
TASK: Implement backend with TDD

INPUT:
- Technical design
- Issue requirements

WORKFLOW:
1. Write failing tests (RED)
2. Implement minimum code (GREEN)
3. Refactor (REFACTOR)

OUTPUT:
- Server actions in src/actions/[feature]/
- Validation schemas in src/lib/validations/
- Tests in tests/unit/actions/[feature]/
- Prisma schema changes (if needed)
```

#### UI Engineer Agent
```
@agent:ui-engineer
TASK: Implement frontend with TDD

INPUT:
- Technical design
- Issue requirements

WORKFLOW:
1. Write failing tests (RED)
2. Implement minimum code (GREEN)
3. Refactor (REFACTOR)

OUTPUT:
- Components in src/components/[feature]/
- Page routes in src/app/
- Tests in tests/unit/components/[feature]/
```

**Gate**: All tests passing, coverage >= 80%

---

## Phase 4: Quality Assurance

### Security Engineer Agent
```
@agent:security-engineer
TASK: Security audit

INPUT:
- All implementation files
- Technical design

CHECKLIST:
- [ ] Authentication verified
- [ ] Authorization verified
- [ ] Input validation complete
- [ ] OWASP Top 10 reviewed

OUTPUT:
- Security audit report
- Findings (if any)
- Sign-off status
```

### Quality Engineer Agent
```
@agent:quality-engineer
TASK: QA verification

INPUT:
- All implementation files
- Test files
- Issue AC

VERIFICATION:
```bash
# Run all tests
STRIPE_SECRET_KEY="sk_test_mock" npx vitest run

# Check coverage
STRIPE_SECRET_KEY="sk_test_mock" npx vitest run --coverage

# Type check
pnpm typecheck

# Lint
pnpm lint

# Build
pnpm build
```

OUTPUT:
- QA report
- Coverage metrics
- AC verification
- Sign-off status
```

**Gate**: Security approved, QA approved

---

## Phase 5: Delivery

### Platform Engineer Agent
```
@agent:platform-engineer
TASK: Create PR

INPUT:
- All changes
- Issue link
- Audit reports

OUTPUT:
- PR with full description
- Linked to issue
- CI passing
```

### PR Template

```markdown
## Summary

[Feature description in 2-3 sentences]

## Related Issues

Closes #[issue-number]

## Changes

### Backend
- [List server actions]

### Frontend
- [List components]

### Database
- [Schema changes if any]

## Test Plan

- [x] Unit tests added
- [x] All tests pass
- [x] Coverage: XX%

## Security

- [x] Security audit passed
- [x] No high/critical findings

## Checklist

- [x] TDD methodology followed
- [x] TypeScript strict
- [x] Accessibility verified
```

---

## Phase 6: User Validation

**MANDATORY STOP POINT**

```
┌────────────────────────────────────────────────────┐
│  WAITING FOR USER APPROVAL                         │
│                                                    │
│  PR: #[number]                                     │
│  Issue: #[number]                                  │
│                                                    │
│  Please review the PR and respond:                 │
│  - "approve" or "/approve" to merge               │
│  - "revise: [feedback]" for changes               │
└────────────────────────────────────────────────────┘
```

---

## Phase 7: Merge (After Approval)

```bash
# Squash and merge
gh pr merge --squash --delete-branch

# Close issue
gh issue close [issue-number]
```

---

## Output Artifacts

At completion:

1. **GitHub Issue** - User story with AC
2. **Technical Design** - Architecture decisions
3. **Implementation** - TDD code with tests
4. **Security Audit** - Passed review
5. **QA Report** - Verified quality
6. **PR** - Ready for merge

## Examples

```
/ship Add user profile photo upload with cropping
/ship #42
/ship Implement team invitation system with email notifications
/ship Add Stripe subscription management for Pro tier
```
