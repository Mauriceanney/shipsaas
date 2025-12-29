---
name: plan
description: Technical Planning (project). Create technical design and architecture for a feature before implementation.
---

# /plan - Technical Planning

Create technical design and architecture for a feature. Use when you need design decisions before writing code.

## Usage

```
/plan <feature-description>
/plan #<issue-number>
```

## Arguments

- `$ARGUMENTS` - Feature description or GitHub issue number

## When to Use

Use `/plan` when you need:
- Technical design before implementation
- Architecture decisions documented
- API contracts defined
- Data model designed
- Team alignment on approach

## Planning Protocol

### Step 1: Requirements Gathering

```bash
# If issue exists
gh issue view $ARGUMENTS

# Explore related code
ls -la src/components/
ls -la src/actions/
grep -r "related-term" src/
```

### Step 2: Product Analysis

```
@agent:product-engineer

TASK: Analyze requirements

OUTPUT:
- User story (if not exists)
- Acceptance criteria
- Success metrics
- Scope boundaries
```

### Step 3: Technical Design

```
@agent:solution-architect

TASK: Create technical design

ANALYZE:
- Existing patterns in codebase
- Affected systems/files
- Data model requirements
- API requirements
- Security considerations
- Performance implications

OUTPUT:
- Technical design document
- Data model (Prisma schema)
- API contracts (Server Actions)
- Component architecture
- Implementation plan
- Risk assessment
```

## Technical Design Template

```markdown
# Technical Design: [Feature Name]

## Overview
[1-2 sentence description]

## Requirements
From Issue #[number]:
- [Requirement 1]
- [Requirement 2]

## Decision

### Chosen Approach
[Description of the approach]

### Alternatives Considered
| Option | Pros | Cons | Decision |
|--------|------|------|----------|
| [A] | [+] | [-] | Rejected |
| [B] | [+] | [-] | **Selected** |

## Data Model

```prisma
model Feature {
  id        String   @id @default(cuid())
  // fields
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

## API Design

### Server Actions
| Action | Input | Output | Auth |
|--------|-------|--------|------|
| `createFeature` | `CreateInput` | `ActionResult<Feature>` | Required |

### Validation Schema
```typescript
const createSchema = z.object({
  name: z.string().min(1).max(255),
});
```

## Component Architecture

```
src/components/feature/
├── index.ts           # Exports
├── feature-list.tsx   # Server Component
├── feature-form.tsx   # Client Component
└── feature-card.tsx   # Server Component
```

## Implementation Plan

### Phase 1: Foundation
- [ ] Schema changes
- [ ] Validation schemas
- [ ] Types

### Phase 2: Backend
- [ ] Server actions (TDD)
- [ ] Unit tests

### Phase 3: Frontend
- [ ] Components (TDD)
- [ ] Component tests

### Phase 4: Integration
- [ ] Page routes
- [ ] E2E tests

## Security Considerations
- [ ] Auth required
- [ ] Ownership verified
- [ ] Input validated

## Performance Considerations
- [ ] Indexes planned
- [ ] Pagination for lists
- [ ] Caching strategy

## Risks
| Risk | Likelihood | Mitigation |
|------|------------|------------|
| [Risk] | Low/Med/High | [Strategy] |

## Open Questions
1. [Question needing clarification]
```

## Output

After `/plan` completes:

1. **Technical Design Document** - Full architecture
2. **Implementation Plan** - Step-by-step tasks
3. **Risk Assessment** - Known risks and mitigations
4. **Open Questions** - Items needing clarification

## Next Steps

After planning is complete:
- `/ship #[issue]` - Implement the feature
- `/fix [issue]` - If it's a bug fix
- Ask clarifying questions if open questions exist

## Examples

```
/plan Add team invitation system
/plan #42
/plan Implement Stripe subscription upgrades
/plan Add user profile settings page
```
