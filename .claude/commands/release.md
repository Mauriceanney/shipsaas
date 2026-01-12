---
description: Create a semantic version release with changelog and GitHub release
---

# Release

Create a semantic version release following best practices: version bump, changelog generation, git tag, and GitHub release.

## Arguments

| Argument | Short | Description |
|----------|-------|-------------|
| `--major` | | Force major version bump (x.0.0) |
| `--minor` | | Force minor version bump (0.x.0) |
| `--patch` | | Force patch version bump (0.0.x) |
| `--dry-run` | `-n` | Show what would happen without making changes |

## Process

### 1. Pre-flight Checks

```bash
# Check for clean working directory
git status --porcelain
```

If uncommitted changes exist:
```
Error: Working directory is not clean.
Please commit or stash your changes before releasing.

Uncommitted files:
- {file1}
- {file2}

Run: git stash  OR  /checkpoint
```

```bash
# Check current branch
git branch --show-current
```

If not on main/master:
```
Error: Releases must be created from main or master branch.
Current branch: {branch}

Run: git checkout main
```

```bash
# Check if up to date with remote
git fetch origin
git rev-list HEAD..origin/$(git branch --show-current) --count
```

If behind remote:
```
Error: Local branch is behind remote.
{n} commits behind origin/{branch}.

Run: git pull
```

### 2. Determine Version Bump

Get current version:
```bash
node -p "require('./package.json').version"
```

Get commits since last tag:
```bash
git log $(git describe --tags --abbrev=0 2>/dev/null || echo "")..HEAD --oneline --no-merges
```

If no tags exist, use all commits.

**Auto-detection logic:**

Scan commit messages for:
- `BREAKING CHANGE:` or `!:` -> **major** bump
- `feat:` or `feat(` -> **minor** bump
- `fix:`, `perf:` -> **patch** bump
- All others -> **patch** bump (minimum)

**Display to user:**

```
Current version: 1.1.2

Commits since last release:
- feat: add user profile photo upload
- fix: resolve login redirect issue
- docs: update API documentation

Detected changes:
- Features: 1 (minor)
- Fixes: 1 (patch)
- Breaking: 0

Recommended bump: minor
New version: 1.2.0

[Enter] Accept  [major/minor/patch] Override  [q] Cancel
```

If `--major`, `--minor`, or `--patch` provided, skip prompt and use specified bump.

### 3. Update package.json

```bash
# Calculate new version
# major: 1.2.3 -> 2.0.0
# minor: 1.2.3 -> 1.3.0
# patch: 1.2.3 -> 1.2.4

# Update package.json (without creating git tag)
npm version {major|minor|patch} --no-git-tag-version
```

### 4. Update create-ship-saas Version

Sync the version in create-ship-saas/package.json to match the new main version.

```bash
# Read new version from main package.json
NEW_VERSION=$(node -p "require('./package.json').version")

# Update create-ship-saas/package.json version
cd create-ship-saas && npm version $NEW_VERSION --no-git-tag-version --allow-same-version && cd ..
```

**Display:**
```
Updating create-ship-saas version: {old} -> {new}
```

**On failure:**
```
Error: Failed to update create-ship-saas version.
{error message}

This is required for npm publish. Aborting release.
```

### 5. Sync Template

Sync the main project to the create-ship-saas template directory.

```bash
node create-ship-saas/scripts/sync-templates.js
```

**On sync failure:**
```
Error: Template sync failed during release.
{error message}

The release requires a synced template. Aborting.
```

Unlike /checkpoint, template sync is **mandatory** for releases.

### 6. Generate CHANGELOG

Create or update `CHANGELOG.md` following Keep a Changelog format.

**If CHANGELOG.md doesn't exist, create:**

```markdown
# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [{version}] - {YYYY-MM-DD}

### Added
- {feat commits}

### Changed
- {refactor, perf, style commits}

### Fixed
- {fix commits}
```

**If CHANGELOG.md exists, insert new version section after `## [Unreleased]`**

**Commit type to section mapping:**

| Commit Type | Changelog Section |
|-------------|-------------------|
| `feat` | Added |
| `fix` | Fixed |
| `perf` | Changed |
| `refactor` | Changed |
| `style` | Changed |
| `docs` | Changed |
| `security` | Security |
| `deprecate` | Deprecated |
| `remove` | Removed |

**Commit message formatting:**
- Remove type prefix: `feat: add login` -> `Add login`
- Capitalize first letter
- Remove trailing period if present
- Include scope in parentheses if present: `feat(auth): add login` -> `Add login (auth)`

### 7. Check README

```bash
# Verify README exists and has content
wc -l README.md
```

If README.md is missing or empty:
```
Warning: README.md is missing or empty.
Consider adding documentation before releasing.

[Enter] Continue anyway  [q] Cancel
```

Check for version references:
```bash
grep -n "version.*[0-9]\+\.[0-9]\+\.[0-9]\+" README.md || true
```

If old version found, offer to update.

### 8. Create Release Commit

```bash
# Stage changed files (including create-ship-saas)
git add package.json CHANGELOG.md create-ship-saas/

# Create commit
git commit -m "$(cat <<'EOF'
chore(release): v{version}

Release version {version}

Changes included:
- {summary of changelog sections}
- Synced create-ship-saas template

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

### 9. Create Git Tag

```bash
# Create annotated tag with changelog as message
git tag -a v{version} -m "$(cat <<'EOF'
v{version}

{changelog entries for this version}
EOF
)"
```

### 10. Push to Remote

```bash
# Push commit and tag
git push origin $(git branch --show-current) --follow-tags
```

If push fails:
```
Error: Push failed. Remote may have new commits.

Run: git pull --rebase
Then retry: /release
```

### 11. Create GitHub Release

```bash
gh release create v{version} \
  --title "v{version}" \
  --notes "$(cat <<'EOF'
## What's Changed

### Added
{feat entries}

### Fixed
{fix entries}

### Changed
{other entries}

**Full Changelog**: https://github.com/{owner}/{repo}/compare/v{prev}...v{version}
EOF
)" \
  --latest
```

### 12. Publish to npm

Publish the create-ship-saas package to npm.

**Pre-publish check:**
```bash
npm whoami
```

If not authenticated:
```
Error: Not authenticated with npm.
Run: npm login
```

**Publish:**
```bash
cd create-ship-saas && npm publish --access public && cd ..
```

**On publish success:**
```
Published create-ship-saas@{version} to npm
```

**On publish failure:**
```
Warning: npm publish failed.
{error message}

Note: GitHub release was created successfully.
The create-ship-saas package was not published.
Manual publish required: cd create-ship-saas && npm publish
```

Do NOT fail the entire release if only npm publish fails - the git release is complete.

### 13. Report Summary

```
=====================================
Release v{version} Complete
=====================================

Version: {old} -> {new}
Bump: {major|minor|patch}

Files updated:
- package.json (version)
- CHANGELOG.md (new section)
- create-ship-saas/package.json (version)
- create-ship-saas/template/ (synced)

Git:
- Commit: {hash}
- Tag: v{version}
- Pushed to: origin/{branch}

GitHub Release:
- URL: https://github.com/{owner}/{repo}/releases/tag/v{version}
- Status: Published (latest)

create-ship-saas:
- Version: {old} -> {new}
- Template: Synced
- npm: Published to registry

{If npm publish failed}
create-ship-saas:
- Version: {old} -> {new}
- Template: Synced
- npm: FAILED - manual publish required
  Run: cd create-ship-saas && npm publish

Changelog entries:
- Added: {n} items
- Changed: {n} items
- Fixed: {n} items
```

## Dry Run Mode

With `--dry-run`, show all actions without executing:

```
=====================================
Release v{version} (DRY RUN)
=====================================

Would perform:

1. Version bump: 1.1.2 -> 1.2.0 (minor)

2. Update package.json:
   - "version": "1.1.2" -> "version": "1.2.0"

3. Update create-ship-saas/package.json:
   - "version": "{old}" -> "version": "1.2.0"

4. Sync template:
   - Would run: node create-ship-saas/scripts/sync-templates.js

5. Update CHANGELOG.md:
   ## [1.2.0] - 2024-01-15
   ### Added
   - Add user profile photo upload

6. Create commit:
   chore(release): v1.2.0

7. Create tag: v1.2.0

8. Push to origin/main with tags

9. Create GitHub release: v1.2.0

10. Publish to npm:
    - Would run: cd create-ship-saas && npm publish --access public
    - Package: create-ship-saas@1.2.0

No changes made (dry run).
To execute, run: /release
```

## Edge Cases

| Scenario | Action |
|----------|--------|
| Dirty working directory | Error, require clean state |
| Not on main/master | Error, require main branch |
| Behind remote | Error, require pull first |
| No commits since last tag | Warn, confirm to proceed |
| No previous tags | Use all commits, start at package.json version |
| README missing | Warn but continue |
| Push fails | Error, suggest resolution |
| gh not authenticated | Error, require `gh auth login` |
| create-ship-saas/package.json missing | Error, abort release |
| Template sync fails | Error, abort release |
| npm not authenticated | Error before publish, show `npm login` |
| npm publish fails | Warn, complete git release, manual publish needed |
| Version already on npm | npm error, suggest version bump |

## Initial Release (No Previous Tags)

For first release:

```
No previous releases found.
This will be the initial release.

Current package.json version: 1.1.2
All {n} commits will be included in changelog.

Proceed with v1.1.2 release? [y/n/custom version]
```

## CHANGELOG Format Example

```markdown
# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.2.0] - 2024-01-15

### Added
- Add user profile photo upload
- Add OAuth provider support (auth)

### Changed
- Improve error messages in forms
- Update dependencies

### Fixed
- Resolve login redirect issue
- Fix session expiration handling

## [1.1.2] - 2024-01-01

### Fixed
- Initial release fixes
```