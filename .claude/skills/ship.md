---
name: ship
description: Autonomous Feature Development (project)
---

# /ship - Autonomous Feature Development

Execute the full development lifecycle for a feature with multi-agent orchestration.

## Usage

```
/ship <feature-description>
```

## Arguments

- `$ARGUMENTS` - Feature description or GitHub issue number

## Execution Protocol

### MANDATORY WORKFLOW

```
1. Select/Create Issue
2. Create Feature Branch (feature/<issue-slug>)
3. Review Acceptance Criteria
4. TDD Cycle: Red → Green → Refactor
5. Validate against Acceptance Criteria
6. Open PR (link to issue)
7. STOP & WAIT for user validation
8. After approval: Merge & close issue
```

### AGENT ENFORCEMENT RULES

- Every task MUST use the corresponding agent
- Agents may run in parallel only if outputs don't conflict
- Work must be clean, optimized, secure, and robust
- Deviation from workflow is a violation

---

## Phase 1: Planning

### Product Manager Agent
```
@agent:product-manager
- Analyze feature request
- Create user stories with acceptance criteria
- Define scope and priorities
- Output: GitHub issue with user stories
```

### Architect Agent
```
@agent:architect
- Review user stories
- Design technical architecture
- Identify affected files/components
- Define API contracts and data models
- Output: Technical design document
```

---

## Phase 2: Implementation (TDD)

### Backend Developer Agent
```
@agent:backend-developer
- Database schema changes (Prisma)
- Server actions
- API routes (if needed)
- TDD: Write tests FIRST, then implement
```

### Frontend Developer Agent
```
@agent:frontend-developer
- React components (Server Components default)
- UI with shadcn/ui
- Form validation
- TDD: Write tests FIRST, then implement
```

### UI/UX Designer Agent
```
@agent:ui-ux-designer
- Review component styling
- Ensure accessibility (WCAG 2.1 AA)
- Verify responsive design
- Suggest UX improvements
```

---

## Phase 3: Quality Assurance

### Security Agent
```
@agent:security
- Review code for vulnerabilities
- Check auth/authz implementation
- Verify input validation
- Audit database queries
- Output: Security audit report
```

### QA Engineer Agent
```
@agent:qa-engineer
- Run all unit tests: STRIPE_SECRET_KEY="sk_test_mock" npx vitest run
- Run E2E tests: pnpm test:e2e
- Verify acceptance criteria
- Report test coverage (must be >= 80%)
- Output: QA report with sign-off
```

---

## Phase 4: Delivery

### DevOps Agent
```
@agent:devops
- Verify build passes: pnpm build
- Check lint: pnpm lint
- Check types: pnpm typecheck
- Create PR with full description
- Link PR to issue
```

---

## Output Artifacts

1. GitHub Issue with user stories and acceptance criteria
2. Feature branch with TDD implementation
3. All tests passing (unit + E2E)
4. Coverage >= 80%
5. Security audit passed
6. PR ready for review

## Example

```
/ship Add user profile photo upload
/ship #42
```
