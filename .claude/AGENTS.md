# Autonomous Agent System

A team of specialized AI agents for SaaS development with Next.js 15 and TypeScript.

## Agents

| Agent | Expertise | Primary Use |
|-------|-----------|-------------|
| **Orchestrator** | Workflow Coordination | Coordinates agents, manages phases |
| **Architect** | Requirements + Design | User stories, technical design, API contracts |
| **Engineer** | Full-Stack + TDD | Backend + frontend implementation |
| **Quality Engineer** | Testing + Security | QA, coverage, security audit |
| **Platform Engineer** | CI/CD | PR creation, deployments |

## Workflow

```
Feature Request
    │
    ├── DESIGN ─────────────────────────────────
    │   └── Architect → Requirements + Technical Design
    │
    ├── IMPLEMENTATION ─────────────────────────
    │   └── Engineer → TDD
    │
    ├── QUALITY ────────────────────────────────
    │   └── Quality Engineer → Tests + Security
    │
    └── DELIVERY ───────────────────────────────
        └── Platform Engineer → PR + CI
```

## Quality Gates

| Gate | Criteria |
|------|----------|
| Requirements | User stories with AC |
| Design | Technical design doc |
| Tests | All tests pass |
| Security | No critical findings |
| Coverage | >= 80% |

## Commands

| Command | Description |
|---------|-------------|
| `/create-spec` | Create requirements + implementation plan |
| `/create-issues` | Create GitHub issues from spec |
| `/continue-feature` | Implement next task from GitHub |
| `/checkpoint` | Create detailed commit |

## File Structure

```
.claude/
├── AGENTS.md              # This file
├── agents/
│   ├── orchestrator.md
│   ├── architect.md
│   ├── engineer.md
│   ├── quality-engineer.md
│   └── platform-engineer.md
├── rules/
│   └── standards.md       # Development standards
└── commands/
    ├── create-spec.md
    ├── create-issues.md
    ├── continue-feature.md
    └── checkpoint.md
```

## Coverage Thresholds

| Metric | Minimum |
|--------|---------|
| Statements | 80% |
| Branches | 70% |
| Functions | 80% |
| Lines | 80% |

## Using Agents with Task Tool

Agents are invoked via Claude Code's Task tool with `subagent_type`. The custom agent files in `.claude/agents/` serve as reference documentation for patterns and expertise.

### Agent Mapping

| Agent Role | subagent_type | Reference File |
|------------|---------------|----------------|
| Requirements | `product-engineer` | `agents/architect.md` |
| Technical Design | `solution-architect` | `agents/architect.md` |
| Backend | `full-stack-engineer` | `agents/engineer.md` |
| Frontend | `ui-engineer` | `agents/engineer.md` |
| QA | `quality-engineer` | `agents/quality-engineer.md` |
| CI/CD | `platform-engineer` | `agents/platform-engineer.md` |
| Coordination | `orchestrator` | `agents/orchestrator.md` |

### Example Usage

```
Task(subagent_type="full-stack-engineer", prompt="Implement login server action following TDD patterns in agents/engineer.md")
```
