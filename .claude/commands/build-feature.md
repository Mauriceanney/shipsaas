---
description: Implement feature tasks from GitHub issues with TDD and auto branch creation
---

# Build Feature

Implements tasks from a GitHub-published feature with TDD workflow and automatic feature branch management.

## Prerequisites

- Feature published to GitHub (`github.md` exists in specs folder)
- `gh` CLI authenticated

## Arguments

| Argument | Short | Description |
|----------|-------|-------------|
| `--offline` | `-o` | Work from implementation-plan.md without GitHub |

## Process

### 1. Load Feature Context

Read from `specs/{name}/`:
- `github.md` - Epic and phase issue numbers
- `requirements.md` - Full requirements
- `implementation-plan.md` - Technical details

### 2. Check Branch Status

```bash
CURRENT_BRANCH=$(git branch --show-current)
echo "Current branch: $CURRENT_BRANCH"
```

**If not on a feature branch:**

```bash
# Check if already on feature/* branch
if [[ "$CURRENT_BRANCH" != feature/* ]]; then
  echo "Not on a feature branch."
fi
```

Prompt user:
```
You are on branch: main
Would you like to create a feature branch?

Suggested name: feature/{feature-name}
(based on the spec being implemented)

[y] Create and switch to feature/{feature-name}
[n] Continue on current branch
[c] Custom branch name
```

**If user confirms (y):**

```bash
# Create and switch to feature branch
git checkout -b feature/{feature-name}

# Set upstream tracking
git push -u origin feature/{feature-name}
```

Report:
```
Created branch: feature/{feature-name}
Upstream set to: origin/feature/{feature-name}
```

**If custom (c):**

Ask for branch name, validate it starts with `feature/`, then create.

### 3. Find Next Task

```bash
gh issue list --label "feature/{name}" --state open --json number,title,body,labels
```

Logic:
- Skip Epic issue (has `epic` label)
- Find earliest phase issue (lowest phase-N label number)
- Parse issue body for first unchecked task: `- [ ]`

### 4. Display Task Info

```
=====================================
Next Task: {task description}
=====================================

Feature: {feature-name}
Phase: {n} - {phase title}
Issue: #{number}
Branch: {current branch}

Ready to implement with TDD.
```

### 5. Implement with TDD

Use **Test-Driven Development**:

1. **RED** - Write failing test first
   ```bash
   # Create test file
   # Run to confirm it fails
   STRIPE_SECRET_KEY="sk_test_mock" npx vitest run {test-file}
   ```

2. **GREEN** - Write minimum code to pass
   ```bash
   # Implement the feature
   STRIPE_SECRET_KEY="sk_test_mock" npx vitest run {test-file}
   ```

3. **REFACTOR** - Clean up while keeping tests green
   ```bash
   pnpm lint && pnpm typecheck
   STRIPE_SECRET_KEY="sk_test_mock" npx vitest run
   ```

### 6. Commit Changes

Use conventional commit format (or run `/checkpoint --no-push`):

```bash
git add .
git commit -m "$(cat <<'EOF'
feat({scope}): {task description}

- {implementation detail 1}
- {implementation detail 2}

Part of #{issue-number}

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

### 7. Update GitHub Issue

```bash
# Get current issue body
gh issue view {number} --json body -q .body > /tmp/issue-body.md

# Update task checkbox: - [ ] -> - [x]
# (Edit the specific task line)

# Update issue
gh issue edit {number} --body-file /tmp/issue-body.md
```

### 8. Report Progress

```
=====================================
Task Complete: {task description}
=====================================

Phase: {n} - {phase title}
Progress: {done}/{total} tasks

Changes:
- {file1.ts} (added/modified)
- {file2.ts} (added/modified)

Test Results:
- {n} tests passing
- Coverage: {n}%

Next Steps:
- /build-feature  -> Continue to next task
- /checkpoint     -> Commit and push progress
- /checkpoint --pr -> Push and create/update PR
```

## Edge Cases

| Scenario | Action |
|----------|--------|
| No github.md | Run `/create-issues` first |
| All phases complete | Close Epic issue, report completion |
| Phase complete | Close phase issue, move to next phase |
| Branch exists remotely | Checkout and track existing branch |
| Merge conflicts | Report conflict, suggest resolution |
| --offline flag | Work from implementation-plan.md directly |

## Phase Completion

When all tasks in a phase are checked:

```bash
# Close the phase issue
gh issue close {phase-number} --comment "All tasks completed"

# Check for next phase
gh issue list --label "feature/{name}" --label "phase-{n+1}" --state open
```

## Feature Completion

When all phases are complete:

```bash
# Close the Epic issue
gh issue close {epic-number} --comment "Feature implementation complete"
```

Report:
```
=====================================
Feature Complete: {feature-name}
=====================================

All phases completed:
- Phase 1: {title} [checkmark]
- Phase 2: {title} [checkmark]
- Phase 3: {title} [checkmark]

Total commits: {n}
Total tasks: {n}

Next: /checkpoint --pr to create final PR
```

## Agent Delegation

Use Claude Code's Task tool with appropriate `subagent_type`:

| Task Type | subagent_type |
|-----------|---------------|
| Backend/Server Actions | `engineer` |
| Frontend/Components | `engineer` |
| Quality/Testing | `quality-engineer` |
| Deployment/CI | `platform-engineer` |