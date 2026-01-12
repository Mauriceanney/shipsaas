---
description: Create commit and push to remote in one step
---

# Checkpoint

Create a conventional commit and push to remote in a single workflow. Optionally create or update a pull request.

## Arguments

| Argument | Short | Description |
|----------|-------|-------------|
| `--pr` | `-p` | Run all checks, then create or update a PR |
| `--no-push` | | Only commit, skip push (for offline work) |

## Process

### 1. Analyze Changes

```bash
git status
git diff --cached
git diff
git log -5 --oneline
```

**Checks:**
- If no changes (staged or unstaged): Report "Nothing to commit" and stop
- If on `main` or `master`: Ask for confirmation before proceeding

### 2. Sync Template

Sync the main project to the create-ship-saas template directory before staging.

```bash
node create-ship-saas/scripts/sync-templates.js
```

**On sync success:**
```
Template synced: {n} files updated
```

**On sync failure:**
```
Warning: Template sync failed.
{error message}

Continue without syncing template? [y/n]
```

- If yes: Continue to staging (template may be out of sync)
- If no: Abort checkpoint

### 3. Stage Changes

```bash
git add -A
```

### 4. Create Commit

Follow conventional commit format:

```
<type>(<scope>): <subject>

<body - bullet points explaining changes>

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
```

#### Commit Types

| Type | Description | Changelog Section |
|------|-------------|-------------------|
| `feat` | New feature | Added |
| `fix` | Bug fix | Fixed |
| `docs` | Documentation only | Changed |
| `style` | Code style (formatting, semicolons) | Changed |
| `refactor` | Code change that neither fixes nor adds | Changed |
| `perf` | Performance improvement | Changed |
| `test` | Adding/updating tests | Changed |
| `build` | Build system or dependencies | Changed |
| `ci` | CI configuration | Changed |
| `chore` | Maintenance tasks | Changed |
| `revert` | Reverts a previous commit | Changed |

#### Common Scopes

- `auth` - Authentication related
- `stripe` - Payment related
- `db` - Database/schema
- `api` - API routes
- `ui` - Components/styling
- `email` - Email system

#### Breaking Changes

Indicate breaking changes with:
- **Exclamation mark**: `feat!: remove deprecated API`
- **Footer**: `BREAKING CHANGE: description of what breaks`

```bash
git commit -m "$(cat <<'EOF'
{type}({scope}): {subject}

{body}

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

### 5. Run Checks (if --pr flag)

Run in sequence, abort on first failure:

```bash
pnpm lint
pnpm typecheck
STRIPE_SECRET_KEY="sk_test_mock" npx vitest run
npx playwright test
```

If any check fails:
- Report the specific error
- Do NOT push or create PR
- Suggest fixes

### 6. Push to Remote (unless --no-push)

```bash
# Check for unpushed commits
git log @{upstream}..HEAD --oneline 2>/dev/null || \
  git log origin/$(git branch --show-current)..HEAD --oneline 2>/dev/null
```

If commits to push:

```bash
git push -u origin $(git branch --show-current)
```

**Push failure handling:**
- Rejected (non-fast-forward): Suggest `git pull --rebase`
- No remote: Create with `-u` flag
- Auth failure: Check credentials

### 7. Handle PR (if --pr flag)

Check for existing PR:

```bash
gh pr list --state open --head $(git branch --show-current) --json number,url
```

**No existing PR - Create:**

```bash
gh pr create --title "{title}" --body "$(cat <<'EOF'
## Summary
{bullets derived from commits since branching}

## Test Plan
- [x] Lint passed
- [x] Typecheck passed
- [x] Unit tests passed
- [x] E2E tests passed

---
Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

**Existing PR - Update:**

```bash
gh pr edit {number} --body "$(cat <<'EOF'
## Summary
{updated bullets from all commits}

## Test Plan
- [x] Lint passed
- [x] Typecheck passed
- [x] Unit tests passed
- [x] E2E tests passed

---
Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

**PR Title Generation:**
- Use commit subject if single commit
- Derive from branch name: `feature/add-login` -> "Add login"
- For multiple commits: Summarize the overall change

### 8. Report Summary

```
=====================================
Checkpoint Complete
=====================================

Commit: {hash} {type}({scope}): {subject}
Branch: {branch-name}
Pushed: {n} commit(s) to origin/{branch}

Template:
  [checkmark] Synced {n} files to create-ship-saas/template/
  {or}
  [checkmark] Already in sync

{If --pr}
PR: #{number} - {url}
Status: Created / Updated

{If checks ran}
Checks:
  [checkmark] Lint passed
  [checkmark] Typecheck passed
  [checkmark] Unit tests passed ({n} tests)
  [checkmark] E2E tests passed

{If --no-push}
Note: Commit created locally (--no-push flag used)
Push when ready with: git push

{Warnings if any}
```

## Edge Cases

| Scenario | Action |
|----------|--------|
| No changes | Report "Nothing to commit" and stop |
| On main/master | Ask for confirmation |
| Uncommitted + --no-push | Commit only, remind to push later |
| Push rejected | Suggest `git pull --rebase` |
| Check fails + --pr | Abort, do not push or create PR |
| No upstream | Use `-u` flag automatically |
| PR already exists | Update instead of create |
| Offline | Use `--no-push` flag |
| Sync script missing | Error: "Sync script missing", abort |
| Sync fails | Warn, ask to continue without sync |
| No template changes | Report "Template: already in sync" |

## Examples

### Basic checkpoint (commit + push)

```
/checkpoint
```

Creates commit and pushes to remote.

### Checkpoint without push

```
/checkpoint --no-push
```

Creates commit only, useful for offline work or batching commits.

### Checkpoint with PR

```
/checkpoint --pr
```

Runs all checks, creates commit, pushes, and creates/updates PR.

### Revert Commit

```
/checkpoint --no-push
```

For reverting a previous commit, use this format:

```bash
git commit -m "$(cat <<'EOF'
revert: feat(auth): add OAuth provider

This reverts commit abc1234.

Reason: OAuth integration causing session conflicts.
Will re-implement with proper session handling.

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

## Validation Rules

Before committing, verify:
- [ ] Subject line under 72 characters
- [ ] Subject uses imperative mood ("add" not "added")
- [ ] Type is valid conventional commit type
- [ ] Breaking changes are properly marked
- [ ] Body explains *why*, not just *what*
