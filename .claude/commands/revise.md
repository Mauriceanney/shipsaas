# /revise - Revise Feature Based on Feedback

Apply feedback and revisions to an in-progress feature.

## Usage

```
/revise <feedback>
```

## Workflow

1. **Parse Feedback**
   - Understand requested changes
   - Identify affected components
   - Prioritize revisions

2. **Update Implementation**
   - Modify code based on feedback
   - Update tests if needed
   - Ensure no regressions

3. **Verify Changes**
   - Run affected tests
   - Check build passes
   - Update PR description

4. **Push Changes**
   - Commit with descriptive message
   - Push to feature branch
   - Comment on PR with changes summary

## Example

```
/revise Add loading state to submit button and handle network errors
```
