# AugmentBot - Automated Code Review Response

**Version:** 2.0.0
**Created:** 2025-01-27
**Updated:** 2025-01-28
**Status:** Production Ready

## 🎯 Overview

AugmentBot is a GitHub Actions-based automation that handles the code review cycle with Codex. When a local Augment agent pushes a branch and creates a PR, AugmentBot can take over monitoring, automatically detect Codex reviews, apply fixes using Auggie CLI, and auto-merge when approved.

**Architecture:** Serverless GitHub Actions (no server required!)

### Key Features

- **Serverless Architecture**: Runs on GitHub Actions - no server to maintain!
- **Automated Codex Monitoring**: Continuously monitors PRs for Codex reviews
- **Intelligent Issue Detection**: Parses Codex comments to identify actionable issues
- **Auggie CLI Integration**: Uses Auggie CLI for AI-powered fix generation
- **Auto Re-Review**: Tags @codex for re-review after applying fixes
- **Smart Auto-Merge**: Detects approval ("no major issues" or 👍) and merges automatically
- **GitHub-Native State**: Uses PR labels for state management
- **Zero Infrastructure**: No servers, databases, or external services required

## 🏗️ Architecture

### GitHub Actions Workflow

AugmentBot runs entirely on **GitHub Actions** - no server required!

**Triggers:**
- `issue_comment` - Detects @augment commands and Codex comments
- `pull_request_review` - Detects Codex reviews
- `pull_request` - Monitors PR updates

**Workflow Steps:**
1. Detect event type (command, Codex review, or PR update)
2. Check if PR is being monitored (via `augmentbot:monitoring` label)
3. Parse Codex comments for issues or approval
4. Run Auggie CLI to generate fixes
5. Commit and push changes
6. Tag @codex for re-review
7. Auto-merge when approved

### Automated Review Cycle

```
1. Local Augment Agent
   ├── Pushes branch
   ├── Creates PR
   └── Comments: @augment takeover
           ↓
2. GitHub Actions Workflow Triggered
   ├── Adds "augmentbot:monitoring" label
   └── Posts acknowledgment comment
           ↓
3. Codex Reviews PR
   └── Posts review with issues
           ↓
4. Workflow Detects Codex Comment
   ├── Parses issues from comment
   ├── Runs Auggie CLI with issues as prompt
   └── Auggie generates fixes
           ↓
5. Workflow Applies Fixes
   ├── Commits changes to PR branch
   ├── Pushes to GitHub
   └── Tags @codex for re-review
           ↓
6. Loop Until Approved
   └── Repeat steps 3-5
           ↓
7. Codex Approves
   ├── Workflow detects "no major issues" or 👍
   └── Auto-merges PR (squash merge)
```

## ✅ Implementation Status

### Completed
- [x] GitHub Actions workflow created
- [x] Auggie CLI integration
- [x] Codex detection and parsing
- [x] Auto-fix application
- [x] Auto-merge on approval
- [x] State management via labels
- [x] Configuration file
- [x] Documentation

### Ready for Testing
The bot is fully implemented and ready for testing on real PRs!

## 🚀 Quick Start

### Prerequisites
- GitHub repository with Actions enabled
- Augment CLI account (run `auggie login` locally)
- Codex bot configured for your repository

### Setup Steps

1. **Get Augment Token**
   ```bash
   # Login to Auggie CLI
   auggie login

   # Get your token
   auggie tokens print
   ```

2. **Add GitHub Secret**
   - Go to your repo → Settings → Secrets and variables → Actions
   - Click "New repository secret"
   - Name: `AUGMENT_SESSION_AUTH`
   - Value: Your token from step 1

3. **Enable Workflow**
   - The workflow file is already in `.github/workflows/augmentbot.yml`
   - It will activate automatically on the next PR comment

4. **Configure Codex Usernames** (optional)
   - Edit `.github/augmentbot-config.yml`
   - Add your Codex bot's username to `codex_usernames`

### Usage

#### Activate AugmentBot on a PR

1. Create a PR as usual
2. Add a comment: `@augment takeover`
3. AugmentBot will:
   - Add the `augmentbot:monitoring` label
   - Post an acknowledgment comment
   - Start monitoring for Codex reviews

#### Automated Workflow

Once activated, AugmentBot automatically:
1. **Detects Codex reviews** - Monitors all comments for Codex bot
2. **Parses issues** - Extracts actionable items from review
3. **Applies fixes** - Runs Auggie CLI to generate and apply fixes
4. **Requests re-review** - Tags @codex after pushing fixes
5. **Auto-merges** - Merges PR when Codex approves

**No manual intervention required!** The bot handles the entire review cycle.

## 🔍 How Codex Detection Works

### Identifying Codex Reviews

AugmentBot identifies Codex reviews by:

1. **Username Matching**: Checks if the commenter's username contains "codex" (configurable via `CODEX_USERNAMES`)
2. **Bot Type Detection**: Verifies the user is marked as a Bot by GitHub
3. **Comment Patterns**: Recognizes Codex-specific formatting

### Parsing Issues

The bot extracts issues using multiple patterns:

- **Structured markers**: `Issue:`, `Fix:`, `Error:`, `Warning:`
- **Emoji indicators**: ❌, ⚠️, 🔴
- **Bullet points**: `- Issue description`
- **Numbered lists**: `1. Issue description`

### Detecting Approval

Approval is detected when Codex comments contain:

- **Text patterns**: "no major issues found", "LGTM", "approved", "looks good"
- **Emoji**: 👍 `:thumbsup:` `:+1:`

When approval is detected, the bot automatically merges the PR.

## 📁 Project Structure

```
AugmentBot/
├── README.md                           # This file
├── .github/
│   ├── workflows/
│   │   └── augmentbot.yml             # Main workflow (GitHub Actions)
│   └── augmentbot-config.yml          # Bot configuration
│
├── docs/
│   ├── WORKFLOW.md                    # Detailed workflow guide
│   └── REFACTOR_SUMMARY.md           # Implementation details
│
└── src/                               # Legacy files (not used in GitHub Actions)
    ├── codex-detector.js              # Codex detection logic (reference)
    ├── pr-manager.js                  # PR operations (reference)
    └── utils/                         # Utility functions (reference)
```

**Note:** The GitHub Actions workflow (`.github/workflows/augmentbot.yml`) contains all the logic. The `src/` directory contains reference implementations that were used to design the workflow.

## 🔧 Technical Details

### GitHub Actions Permissions
The workflow requires these permissions (already configured in workflow file):
- **contents**: write (for committing fixes)
- **pull-requests**: write (for comments and labels)
- **issues**: write (for PR comments)

### Workflow Triggers
- `issue_comment.created` - Detects @augment commands and Codex comments
- `pull_request_review.submitted` - Detects Codex reviews
- `pull_request.opened` - Monitors new PRs
- `pull_request.synchronize` - Monitors PR updates

### Required Secrets
Only one secret is required:
```bash
AUGMENT_SESSION_AUTH=<your-auggie-token>
```

Get your token with:
```bash
auggie login
auggie tokens print
```

### Configuration
Edit `.github/augmentbot-config.yml` to customize:
- Codex bot usernames
- Approval patterns
- Auto-merge settings
- Git commit settings

## 📊 How It Works

### Workflow Execution

1. **Event Trigger**: GitHub webhook fires when comment is posted
2. **Workflow Starts**: GitHub Actions runner spins up (Ubuntu VM)
3. **Checkout Code**: Clones repository and PR branch
4. **Install Auggie**: Installs Auggie CLI via npm
5. **Detect Codex**: Checks if comment is from Codex bot
6. **Parse Issues**: Extracts issues from Codex comment
7. **Run Auggie**: Executes `auggie --print --quiet "Fix these issues: ..."`
8. **Commit Changes**: Commits and pushes fixes to PR branch
9. **Tag Reviewer**: Posts comment tagging @codex
10. **Auto-merge**: If approved, merges PR automatically

### State Management

AugmentBot uses GitHub PR labels for state:
- `augmentbot:monitoring` - Bot is actively monitoring this PR
- `augmentbot:waiting-review` - Fixes applied, waiting for re-review
- `augmentbot:approved` - Codex approved, ready to merge

## 🛡️ Security

### Access Control
- Workflow uses GitHub's built-in GITHUB_TOKEN (scoped to repository)
- Augment token stored as encrypted GitHub Secret
- No external services or databases
- All operations logged in GitHub Actions

### Data Handling
- Code never leaves GitHub's infrastructure
- Auggie CLI runs in isolated GitHub Actions runner
- No persistent storage of code or credentials
- Runners are destroyed after each workflow run

## 🔍 Troubleshooting

### Workflow Not Running?
1. Check that GitHub Actions is enabled for your repository
2. Verify the workflow file exists at `.github/workflows/augmentbot.yml`
3. Check the Actions tab for any errors

### Bot Not Responding to @augment takeover?
1. Ensure the comment is on a Pull Request (not an Issue)
2. Check that the workflow has `issue_comment` trigger
3. Look for errors in the Actions tab

### Auggie CLI Failing?
1. Verify `AUGMENT_SESSION_AUTH` secret is set correctly
2. Check that your Augment token is still valid (`auggie tokens print`)
3. Review the workflow logs for Auggie error messages

### Auto-merge Not Working?
1. Ensure branch protection rules allow auto-merge
2. Check that all required status checks pass
3. Verify Codex comment contains approval patterns (see config)

## 🚀 Future Enhancements

### Planned Features
- **Multiple Reviewer Support**: Handle reviews from different bots (Dependabot, etc.)
- **Custom Prompts**: Repository-specific Auggie prompts
- **Slack/Discord Notifications**: Alert teams when fixes are applied
- **Analytics**: Track fix success rates and cycle times
- **Conflict Resolution**: Automated handling of merge conflicts
- **Batch Processing**: Handle multiple Codex comments in one run

## 📝 Contributing

### Testing the Workflow

1. Create a test PR in your repository
2. Add a comment: `@augment takeover`
3. Simulate a Codex review by posting a comment with issues
4. Watch the workflow run in the Actions tab

### Modifying the Workflow

The workflow file is at `.github/workflows/augmentbot.yml`. Key sections:
- **Triggers**: Lines 3-8 (what events activate the workflow)
- **Codex Detection**: Lines 107-149 (how Codex comments are identified)
- **Issue Parsing**: Lines 151-176 (how issues are extracted)
- **Auggie Integration**: Lines 189-207 (how fixes are generated)
- **Auto-merge**: Lines 251-297 (how approval is detected and merge happens)

### Configuration

Edit `.github/augmentbot-config.yml` to customize:
- Codex bot usernames
- Approval patterns
- Merge method (squash, merge, rebase)
- Git commit settings

---

## 🎯 Getting Started

1. **Add the secret**: `AUGMENT_SESSION_AUTH` (see Quick Start above)
2. **Create a test PR**: Push a branch and open a PR
3. **Activate the bot**: Comment `@augment takeover`
4. **Test with Codex**: Wait for Codex review or simulate one
5. **Watch it work**: Check the Actions tab to see the workflow run

That's it! No servers, no deployment, no infrastructure. Just GitHub Actions. 🚀

---

For questions or issues, create an issue in this repository.