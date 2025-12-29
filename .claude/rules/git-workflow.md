# Git Workflow

Standard git workflow for feature development.

## Branch Naming

```
feature/<issue-number>-<short-description>
fix/<issue-number>-<short-description>
hotfix/<description>
```

## Commit Messages

Use conventional commits:

```
feat: add user profile photo upload
fix: resolve login redirect issue
docs: update API documentation
test: add unit tests for auth actions
chore: update dependencies
refactor: simplify validation logic
```

## Workflow Steps

### Starting a Feature

```bash
# Ensure on main and up to date
git checkout main
git pull origin main

# Create feature branch
git checkout -b feature/<issue>-<description>
```

### During Development

```bash
# Stage and commit frequently
git add .
git commit -m "feat: description"

# Keep branch updated
git fetch origin main
git rebase origin/main
```

### Creating PR

```bash
# Push branch
git push -u origin feature/<branch-name>

# Create PR
gh pr create --title "feat: description" --body "..."
```

## PR Requirements

- [ ] Link to issue
- [ ] Description of changes
- [ ] Test plan
- [ ] All CI checks pass
- [ ] Coverage thresholds met
