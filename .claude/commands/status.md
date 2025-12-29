# /status - Project Status Report

Get comprehensive status of the project and current work.

## Usage

```
/status [area]
```

Areas: `all`, `issues`, `prs`, `tests`, `coverage`, `ci`

## Output

### Issues Summary
- Open issues by label (epic, bug, feature)
- Recently closed issues
- Stale issues (no activity >7 days)

### PRs Summary
- Open PRs with status
- PRs awaiting review
- PRs with failing checks

### Test Status
- Unit test count and pass rate
- E2E test count and pass rate
- Test coverage percentage

### CI Status
- Last workflow run status
- Failed jobs (if any)
- Build time trends

### Branch Status
- Current branch
- Commits ahead/behind main
- Uncommitted changes

## Example

```
/status           # Full status
/status tests     # Just test status
/status prs       # Just PR status
```
