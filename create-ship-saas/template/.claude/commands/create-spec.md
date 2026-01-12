---
description: Create a new spec with requirements and implementation plan
---

# Create Feature Spec

Create a new feature specification in `/specs/{feature-name}/`.

## Output Files

- `requirements.md` - User stories and acceptance criteria
- `implementation-plan.md` - Phased task breakdown
- `action-required.md` - Manual steps (if any)

## Process

### 1. Gather Requirements

Ask user for feature description, target users, and core functionality.

### 2. Explore Codebase

```bash
ls src/actions/ src/components/
grep -r "related pattern" src/
```

### 3. Create requirements.md

```markdown
# Feature: {Title}

## Overview
{1-2 sentence description}

## User Stories

### US1: {Story Title}
**As a** {persona}
**I want to** {action}
**So that** {outcome}

#### Acceptance Criteria
- [ ] AC1: Given {condition}, when {action}, then {result}

## Technical Requirements
- {Requirement}

## Out of Scope
- {Exclusion}
```

### 4. Create implementation-plan.md

```markdown
# Implementation Plan: {Feature}

## Overview
Complexity: S | M | L | XL

## Phase 1: {Name}
{Goal description}

### Tasks
- [ ] Task 1
- [ ] Task 2

### Technical Details
{CLI commands, schemas, code snippets, file paths}

## Phase 2: {Name}
...
```

**Important:** Capture ALL technical details in `### Technical Details` - this is the single source of truth.

### 5. Create action-required.md

```markdown
# Action Required: {Feature}

## Before Implementation
- [ ] **{Action}** - {Why needed}

## During Implementation
- [ ] **{Action}** - {Why needed}
```

If no manual steps: "No manual steps required for this feature."

### 6. Report Summary

```
Spec created at specs/{feature-name}/

Files:
- requirements.md
- implementation-plan.md
- action-required.md

Next: Run /create-issues to create GitHub issues
```

## Agent Delegation

Use Claude Code's Task tool with the appropriate `subagent_type`:

| Task Type | subagent_type |
|-----------|---------------|
| Requirements/User Stories | `product-engineer` |
| Technical Design | `solution-architect` |

## Notes

- Keep tasks atomic and implementable in a single session
- Mark complex tasks with `[complex]` suffix
- Don't include testing tasks unless explicitly requested
