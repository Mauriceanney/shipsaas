# Claude Code Commands

This project includes custom slash commands for [Claude Code](https://claude.ai/code) that streamline feature development with GitHub integration.

## Available Commands

| Command | Description |
|---------|-------------|
| `/create-feature` | Create a feature specification with requirements and implementation plan |
| `/create-issues` | Create GitHub Issues and Project from a feature spec |
| `/continue-feature` | Continue implementing the next task for a GitHub-published feature |
| `/checkpoint` | Create a comprehensive checkpoint commit with all changes |

## Prerequisites

Before using the GitHub-integrated commands:

1. **GitHub CLI**: Install and authenticate
   ```bash
   # Install (macOS)
   brew install gh
   # or see https://cli.github.com/

   # Authenticate
   gh auth login

   # Add project scopes (required for /create-issues)
   gh auth refresh -s project,read:project
   ```

2. **Claude Code**: Install from [claude.ai/code](https://claude.ai/code)

## Workflow

### 1. Plan Your Feature

Start a conversation with Claude Code and describe what you want to build:

```
You: I want to add a user preferences page where users can update their
     display name, email notifications, and theme preferences.
```

### 2. Create Feature Specification

Once requirements are clear, run:

```
/create-feature
```

This creates `specs/{feature-name}/` containing:
- `requirements.md` - What the feature does and acceptance criteria
- `implementation-plan.md` - Phased tasks with checkboxes

### 3. Publish to GitHub

Publish the feature for tracking:

```
/create-issues
```

This creates:
- An **Epic issue** with full requirements
- **Task issues** for each implementation step
- A **GitHub Project** to track progress
- **Labels** for organization
- A `github.md` file with all references

### 4. Implement Tasks

Start implementing tasks one at a time:

```
/continue-feature
```

This command:
1. Finds the next unblocked task (respecting dependencies)
2. Updates the GitHub Project status to "In Progress"
3. Implements the task following project conventions
4. Runs lint and typecheck
5. Commits with `closes #{issue-number}`
6. Updates the issue with implementation details
7. Moves the task to "Done" on the Project board

Repeat `/continue-feature` for each task.

### 5. Create Checkpoints

At any point, create a detailed checkpoint commit:

```
/checkpoint
```

## Example Session

```bash
# Start Claude Code
claude

# Discuss feature requirements
You: I need to add API rate limiting to protect our endpoints...

# Claude helps plan, then:
/create-feature

# Review the spec, then publish:
/create-issues

# Implement task by task:
/continue-feature
# ... Claude implements, commits, updates GitHub ...

/continue-feature
# ... next task ...

# When done:
git push
```

## Without GitHub Integration

You can use `/create-feature` to create specs, then manually work through the `implementation-plan.md` checkboxes. The `/continue-feature` command also supports offline mode.

## Command Files

Commands are defined in `.claude/commands/`:

```
.claude/commands/
├── checkpoint.md
├── continue-feature.md
├── create-feature.md
└── create-issues.md
```

Customize these or add new ones following the [Claude Code documentation](https://docs.anthropic.com/en/docs/claude-code).
