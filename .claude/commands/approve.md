# /approve - Approve and Merge Feature

Review, approve, and merge a feature PR.

## Usage

```
/approve [pr-number]
```

If no PR number provided, uses current branch's PR.

## Workflow

1. **Fetch PR Details**
   - Get PR description and linked issues
   - Review all commits and changes

2. **Run Quality Checks**
   - Verify all CI checks pass
   - Run local tests to confirm
   - Check test coverage meets threshold

3. **Code Review**
   - Review changed files
   - Check for code quality issues
   - Verify coding standards compliance

4. **Merge**
   - Squash and merge PR
   - Delete feature branch
   - Close linked issues

## Example

```
/approve 42
/approve        # Uses current branch PR
```
