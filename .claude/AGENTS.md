# Agent System Documentation

This document describes the specialized agent system for SaaS development. Each agent is a domain expert with years of experience in their specific area, focused on delivering production-ready SaaS features.

## Agent Overview

| Agent | Specialty | When to Use |
|-------|-----------|-------------|
| **Orchestrator** | Workflow coordination | Starting any feature, complex tasks |
| **Product Engineer** | Requirements & user stories | New features, requirements gathering |
| **Solution Architect** | Technical design | After requirements, before implementation |
| **Full-Stack Engineer** | Backend implementation | Server actions, database, APIs |
| **UI Engineer** | Frontend implementation | Components, forms, user interfaces |
| **Security Engineer** | Security audits | Before PR merge, security reviews |
| **Quality Engineer** | Testing & QA | After implementation, before approval |
| **Platform Engineer** | CI/CD & deployment | PR creation, deployments |

## Agent Hierarchy

```
                    ┌─────────────────┐
                    │   Orchestrator  │
                    │  (Coordinator)  │
                    └────────┬────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
        ▼                    ▼                    ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│    Planning   │   │Implementation │   │    Quality    │
│    Phase      │   │    Phase      │   │    Phase      │
└───────┬───────┘   └───────┬───────┘   └───────┬───────┘
        │                   │                   │
   ┌────┴────┐         ┌────┴────┐         ┌────┴────┐
   │         │         │         │         │         │
   ▼         ▼         ▼         ▼         ▼         ▼
Product   Solution   Full-Stack  UI      Security  Quality
Engineer  Architect  Engineer  Engineer Engineer  Engineer
                                                     │
                                                     ▼
                                              Platform
                                              Engineer
```

## Workflow Phases

### Phase 1: Discovery & Planning

**Parallel Execution Possible**

1. **Product Engineer**
   - Analyzes feature request
   - Creates user stories with acceptance criteria
   - Defines success metrics
   - Creates GitHub issue

2. **Solution Architect**
   - Assesses technical feasibility
   - Identifies affected systems
   - Flags potential risks

### Phase 2: Technical Design

**Sequential - Requires Phase 1**

1. **Solution Architect**
   - Creates technical design document
   - Defines data models
   - Specifies API contracts
   - Documents component architecture

**Gate**: Design review and approval

### Phase 3: Implementation

**Parallel Execution Possible**

1. **Full-Stack Engineer**
   - Implements database schema
   - Creates server actions
   - Follows strict TDD
   - Achieves test coverage

2. **UI Engineer**
   - Implements React components
   - Ensures accessibility (WCAG 2.1 AA)
   - Follows strict TDD
   - Creates responsive layouts

**Gate**: All tests passing, coverage thresholds met

### Phase 4: Quality Assurance

**Sequential then Parallel**

1. **Security Engineer**
   - Reviews authentication/authorization
   - Checks OWASP Top 10 compliance
   - Validates input handling
   - Produces security audit report

2. **Quality Engineer**
   - Runs complete test suites
   - Verifies coverage metrics
   - Validates acceptance criteria
   - Produces QA report

**Gate**: Security approved, QA approved

### Phase 5: Delivery

**Sequential - Requires Phase 4**

1. **Platform Engineer**
   - Creates PR with full description
   - Verifies CI pipeline passes
   - Prepares deployment notes
   - Links to issue

**Gate**: User approval, merge

## Available Skills

Skills are workflow commands that invoke appropriate agents for specific tasks.

### Development Workflow

| Skill | Purpose | Primary Agent(s) |
|-------|---------|------------------|
| `/ship` | Full feature development | Orchestrator + All |
| `/fix` | Quick bug fix | Full-Stack or UI Engineer |
| `/plan` | Technical design only | Solution Architect |
| `/revise` | Apply feedback | Appropriate engineer |

### Quality & Security

| Skill | Purpose | Primary Agent(s) |
|-------|---------|------------------|
| `/test` | Run tests with analysis | Quality Engineer |
| `/audit` | Security audit | Security Engineer |
| `/review` | Code review | Quality + Security Engineers |

### Project Management

| Skill | Purpose | Primary Agent(s) |
|-------|---------|------------------|
| `/status` | Project status report | None (utility) |
| `/approve` | Approve and merge PR | Platform Engineer |
| `/deploy` | Manual deployment | Platform Engineer |

### Choosing the Right Skill

| Scenario | Use |
|----------|-----|
| Building a new feature | `/ship` |
| Fixing a specific bug | `/fix` |
| Need design before coding | `/plan` |
| Applying review feedback | `/revise` |
| Running/analyzing tests | `/test` |
| Checking security | `/audit` |
| Reviewing code changes | `/review` |
| Checking project health | `/status` |
| Merging a PR | `/approve` |
| Manual deployment | `/deploy` |

## Agent Invocation

### Via /ship Command

The `/ship` command automatically orchestrates all agents:

```
/ship Add user profile photo upload
```

This triggers the Orchestrator, which coordinates all phases.

### Direct Agent Invocation

For specific tasks, invoke agents directly:

```
@agent:product-engineer Create user stories for [feature]
@agent:solution-architect Design technical architecture for [feature]
@agent:full-stack-engineer Implement server actions for [feature]
@agent:ui-engineer Create components for [feature]
@agent:security-engineer Audit [feature] implementation
@agent:quality-engineer Verify [feature] tests and coverage
@agent:platform-engineer Create PR for [feature]
```

## Agent Communication Protocol

### Handoff Format

When one agent passes work to another:

```markdown
## Handoff: [Source Agent] → [Target Agent]

### Context
- Feature: [Name]
- Issue: #[number]
- Previous artifacts: [list]

### Your Task
[Specific instruction]

### Inputs Available
- [Artifact 1]: [location]
- [Artifact 2]: [location]

### Expected Output
[Deliverable description]
```

### Artifact Locations

| Artifact | Location | Created By |
|----------|----------|------------|
| User Story | GitHub Issue | Product Engineer |
| Technical Design | PR Description / DESIGN.md | Solution Architect |
| Server Actions | `src/actions/[feature]/` | Full-Stack Engineer |
| Components | `src/components/[feature]/` | UI Engineer |
| Tests | `tests/unit/[feature]/` | Both Engineers |
| Security Report | PR Comment | Security Engineer |
| QA Report | PR Comment | Quality Engineer |
| PR | GitHub | Platform Engineer |

## Quality Gates

### Gate 1: Requirements Complete
- [ ] User stories follow INVEST criteria
- [ ] Acceptance criteria are testable
- [ ] Success metrics defined
- [ ] GitHub issue created

### Gate 2: Design Approved
- [ ] Technical design document complete
- [ ] Data model defined
- [ ] API contracts specified
- [ ] Security considerations documented

### Gate 3: Implementation Complete
- [ ] All tests written (TDD)
- [ ] All tests passing
- [ ] Coverage >= 80%
- [ ] No TypeScript errors
- [ ] No ESLint warnings

### Gate 4: Security Approved
- [ ] No critical/high vulnerabilities
- [ ] Authentication verified
- [ ] Authorization verified
- [ ] Input validation complete

### Gate 5: QA Approved
- [ ] All tests pass
- [ ] Coverage thresholds met
- [ ] All AC verified
- [ ] Edge cases covered

### Gate 6: Ready to Merge
- [ ] CI pipeline passes
- [ ] PR reviewed
- [ ] User approved

## Parallelization Rules

### Safe to Parallelize
- Product Engineer + Solution Architect (discovery)
- Full-Stack Engineer + UI Engineer (implementation)
- Security Engineer + Quality Engineer (review)

### Must Be Sequential
- Design → Implementation
- Implementation → Security Review
- QA Approval → PR Creation
- Any work that modifies the same files

## Error Handling

### Agent Failures

When an agent encounters an issue:

1. **Stop current work**
2. **Document the blocker**
3. **Notify Orchestrator**
4. **Wait for resolution**

### Conflict Resolution

When agents produce conflicting outputs:

1. **Identify the conflict source**
2. **Determine domain authority**
3. **Orchestrator makes final decision**
4. **Document rationale**

## Customization

### Adding New Agents

Create a new file in `.claude/agents/`:

```yaml
---
name: agent-name
description: What this agent does and when to use it
tools: Read, Edit, Write, Bash, Grep, Glob
model: sonnet
skills: skill-1, skill-2
---

# Agent Title

You are a **[Role]** with [X] years of experience...

## Core Identity
...

## Responsibilities
...

## Output
...
```

### Modifying Agent Behavior

Edit the agent's markdown file to:
- Change expertise areas
- Add new patterns
- Update templates
- Modify checklists

### Integrating with Skills

Add skills to an agent:

```yaml
---
name: agent-name
skills: skill-1, skill-2
---
```

The skill's instructions are loaded into the agent's context.

## Best Practices

### For Optimal Results

1. **Provide clear context**: Include issue numbers, file paths, requirements
2. **Use appropriate agent**: Don't use UI Engineer for database work
3. **Trust the workflow**: Let agents complete their phase before moving on
4. **Review outputs**: Agents are specialized but not infallible
5. **Iterate quickly**: Small features ship faster than large ones

### Common Mistakes

1. **Skipping phases**: Don't skip design for "simple" features
2. **Parallel when sequential needed**: Respect dependencies
3. **Ignoring gates**: Quality gates exist for a reason
4. **Over-engineering**: Agents are trained to keep things simple

## Metrics

### Per-Feature Tracking

- Total tokens consumed
- Time per phase
- Number of iterations
- Test coverage achieved
- Security findings count

### Quality Indicators

- First-time PR approval rate
- Post-deployment incident rate
- Test coverage trends
- Code review feedback volume
