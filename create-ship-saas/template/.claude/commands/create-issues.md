---
description: Create GitHub Issues and Project from a feature spec
---

# Create GitHub Issues

Creates GitHub issues and project from a `/specs/{feature-name}/` folder.

## Prerequisites

- `gh auth status` must be authenticated
- Token needs project scopes: `gh auth refresh -s project,read:project`
- Feature folder with `requirements.md` and `implementation-plan.md`

## Process

### 1. Get Repository Info

```bash
gh repo view --json nameWithOwner,owner -q '.nameWithOwner + " " + .owner.login'
```

### 2. Create Labels

```bash
gh label create "epic" --color "7057ff" 2>/dev/null || true
gh label create "feature/{name}" --color "0E8A16" 2>/dev/null || true
gh label create "phase-1" --color "C5DEF5" 2>/dev/null || true
gh label create "phase-2" --color "BFD4F2" 2>/dev/null || true
gh label create "phase-3" --color "A2C4E0" 2>/dev/null || true
```

### 3. Create Epic Issue

```bash
gh issue create \
  --title "Epic: {Feature Title}" \
  --label "epic" \
  --label "feature/{name}" \
  --body-file specs/{name}/requirements.md
```

### 4. Create Phase Issues

For each phase:

```bash
gh issue create \
  --title "Phase {n}: {Phase Title}" \
  --label "feature/{name}" \
  --label "phase-{n}" \
  --body "## Context
Part of Epic: #{epic}

## Tasks
{task checklist from implementation-plan.md}

## Acceptance Criteria
- [ ] All tasks completed
- [ ] Code passes lint and typecheck"
```

### 5. Create Project

```bash
gh project create --title "Feature: {Title}" --owner {owner}
gh project link {project} --owner {owner} --repo {repo}
```

### 6. Add Issues to Project

```bash
gh project item-add {project} --owner {owner} --url "{issue-url}"
```

### 7. Create github.md

Create `specs/{name}/github.md`:

```markdown
---
epic_issue: {number}
project_number: {number}
---

# GitHub References

- [Epic](https://github.com/{repo}/issues/{epic})
- [Project](https://github.com/users/{owner}/projects/{project})

## Phases
| # | Title | Status |
|---|-------|--------|
| #{n} | Phase 1: {Title} | Open |
```

### 8. Report Summary

```
GitHub issues created!

Epic: {url}
Project: {url}
Phases: {n}
Tasks: {n}

Next: Use /continue-feature to start implementation
```
