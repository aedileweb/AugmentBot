# AugmentBot - Automated Code Review Response

**Version:** 3.0.0
**Created:** 2025-01-27
**Updated:** 2025-01-14
**Status:** Production Ready

## 🆕 Version 3.0.0 - Dual Reviewer System

**Major Features:**
- ✅ Dual reviewer support (Codex + Bugbot)
- ✅ Intelligent fallback when reviewers encounter errors
- ✅ Multi-reviewer issue tracking (tracks ALL summoned reviewers)
- ✅ Smart merge logic (ONE approval + ALL issues resolved)
- ✅ Manual Bugbot trigger via "bugbot run" comment
- ✅ Improved issue resolution tracking (only commits AFTER review)

## 🤖 For Augment Agents

**CRITICAL: Before starting work on this repository:**

1. **Read the [Augment Configuration Guide](./AugmentConfiguration/README.md)**
2. **Understand the [MCP Server architecture](./AugmentConfiguration/MCP-Servers.md)** - especially the security rules
3. **Review [Security Best Practices](./AugmentConfiguration/Security-Best-Practices.md)**
4. **Commit key facts to memory** using the `remember` tool

**Key Security Rules:**
- ❌ **NEVER use Lokka MCP for Entra ID write operations**
- ❌ **NEVER configure Lokka with service principal credentials**
- ✅ Use PowerShell or Graph API with Augment service principal for all Entra ID changes
- ✅ Get credentials from AWS Secrets Manager

This ensures you have the context needed to work safely and effectively.

---

## 🎯 Overview

AugmentBot is a GitHub Actions-based automation that handles the code review cycle with **dual PR reviewer support**. When a local Augment agent pushes a branch and creates a PR, AugmentBot can take over monitoring, automatically detect reviews from Codex or Bugbot, apply fixes using Augment Agent, and auto-merge when approved.

**Architecture:** Serverless GitHub Actions (no server required!)

### Key Features

- **Serverless Architecture**: Runs on GitHub Actions - no server to maintain!
- **Dual Reviewer Support**: Works with both Codex (automatic) and Bugbot (manual trigger)
- **Intelligent Fallback**: Automatically switches reviewers if one encounters errors
- **Multi-Reviewer Issue Tracking**: Tracks and resolves issues from ALL summoned reviewers
- **Intelligent Issue Detection**: Parses reviewer comments to identify actionable issues
- **Augment Agent Integration**: Uses Augment Agent for AI-powered fix generation
- **Auto Re-Review**: Requests re-review from appropriate reviewers after applying fixes
- **Smart Auto-Merge**: Merges when ONE reviewer approves AND all issues are resolved
- **GitHub-Native State**: Uses PR labels for state management
- **Zero Infrastructure**: No servers, databases, or external services required

### Supported Reviewers

- **Codex**: Automatic code reviews (no manual trigger needed)
- **Bugbot**: Manual trigger via comment "bugbot run"

## 🏗️ Architecture

### Reusable Workflow Design

AugmentBot uses a **centralized reusable workflow** for easy management across all repositories:

```
┌─────────────────────────────────────┐
│  AugmentBot Repository (Central)    │
│  .github/workflows/augmentbot.yml   │ ← Main workflow logic
│  (Reusable Workflow)                │
└─────────────────────────────────────┘
              ↑ ↑ ↑
              │ │ │ Calls reusable workflow
              │ │ │
    ┌─────────┘ │ └─────────┐
    │           │           │
┌───┴────┐  ┌──┴────┐  ┌───┴────┐
│ Repo A │  │ Repo B│  │ Repo C │
│ (5 line│  │ (5 line│ │ (5 line│
│ caller)│  │ caller)│ │ caller)│
└────────┘  └───────┘  └────────┘
```

**Benefits:**
- ✅ **Update once, apply everywhere** - Change the main workflow, all repos get the update
- ✅ **Minimal setup** - Just 5 lines per repository
- ✅ **Centralized secret** - One organization secret for all repos
- ✅ **Easy maintenance** - No need to update individual repositories

### GitHub Actions Workflow

AugmentBot runs entirely on **GitHub Actions** - no server required!

**Triggers:**
- `issue_comment` - Detects @augment commands, reviewer comments, and manual triggers
- `pull_request_review` - Detects reviewer reviews
- `pull_request` - Monitors PR updates

**Workflow Steps:**
1. Detect event type (command, reviewer comment, or PR update)
2. Check if PR is being monitored (via `augmentbot:monitoring` label)
3. Detect reviewer type (Codex or Bugbot) and check for errors
4. Trigger fallback reviewer if primary reviewer encounters errors
5. Parse reviewer comments for issues or approval
6. Track issues from ALL reviewers (not just latest)
7. Run Augment Agent to generate fixes
8. Commit and push changes
9. Request re-review from appropriate reviewers
10. Auto-merge when ONE reviewer approves AND all issues resolved

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

### For This Repository (AugmentBot)

AugmentBot is already configured and ready to use in this repository!

### For Any Other Repository

AugmentBot uses a **reusable workflow** - add it to any repository with just 5 lines!

#### Option 1: Organization-Wide Setup (Recommended)

**One-time setup for all repositories:**

See **[ORGANIZATION_SETUP.md](ORGANIZATION_SETUP.md)** for complete instructions.

**Quick version:**
1. Organization secret is already set: ✅ `AUGMENT_SESSION_AUTH`
2. Add this file to any repository as `.github/workflows/augmentbot.yml`:

```yaml
name: AugmentBot
on:
  issue_comment:
    types: [created]
  pull_request_review:
    types: [submitted]
  pull_request:
    types: [opened, synchronize]
permissions:
  contents: write
  pull-requests: write
  issues: write
jobs:
  augmentbot:
    uses: aedileweb/AugmentBot/.github/workflows/augmentbot.yml@main
    secrets:
      AUGMENT_SESSION_AUTH: ${{ secrets.AUGMENT_SESSION_AUTH }}
      GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

3. Commit and push - Done! 🎉

#### Option 2: Single Repository Setup

If you only want AugmentBot on one repository:

1. **Add repository secret:**
   - Go to repo → Settings → Secrets → Actions
   - Name: `AUGMENT_SESSION_AUTH`
   - Value: Your Augment token (get with `auggie tokens print`)

2. **Add the workflow file** (same 5-line file as above)

3. **Commit and push**

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
1. **Detects reviewer comments** - Monitors for Codex (automatic) or Bugbot (manual trigger)
2. **Parses issues** - Extracts actionable items from reviews
3. **Tracks all issues** - Maintains issues from ALL summoned reviewers
4. **Applies fixes** - Runs Augment Agent to generate and apply fixes
5. **Requests re-review** - Pings appropriate reviewers after pushing fixes
6. **Auto-merges** - Merges when ONE reviewer approves AND all issues resolved

**No manual intervention required!** The bot handles the entire review cycle.

## 🔄 Dual Reviewer System

### Supported Reviewers

**Codex (Automatic)**
- Automatically reviews PRs when configured
- No manual trigger needed
- Username patterns: `codex`, `codex-bot`, `codex-reviewer`, `chatgpt-codex-connector`

**Bugbot (Manual Trigger)**
- Triggered by commenting: `bugbot run`
- On-demand code review
- Username patterns: `bugbot`, `cursor-bugbot`

### Intelligent Fallback

AugmentBot automatically switches reviewers if one encounters errors:

**Codex Error → Bugbot Fallback**
- Detects: "usage limits reached", "out of credits", "not configured"
- Action: Automatically comments "bugbot run" to trigger Bugbot

**Bugbot Error → Codex Fallback**
- Detects: "unable to review", "cannot review", "review failed"
- Action: Automatically comments "@codex please review" to trigger Codex

### Multi-Reviewer Issue Tracking

**Key Features:**
- Tracks issues from ALL summoned reviewers (not just the latest)
- Each issue tagged with reviewer type (Codex or Bugbot)
- Only considers commits made AFTER each review comment
- Merge requires ALL issues from ALL reviewers to be resolved

**Example Scenario:**
1. Codex reviews → finds 3 issues
2. Fixes applied → 2 issues resolved
3. Bugbot triggered → finds 2 new issues
4. Fixes applied → all 5 issues must be resolved before merge
5. Either Codex OR Bugbot approval triggers auto-merge (if all issues resolved)

## 🔍 How Reviewer Detection Works

### Identifying Reviews

AugmentBot identifies reviews by:

1. **Username Matching**: Checks if commenter's username matches known patterns
2. **Bot Type Detection**: Verifies the user is marked as a Bot by GitHub
3. **Manual Triggers**: Detects "bugbot run" comment for Bugbot
4. **Comment Patterns**: Recognizes reviewer-specific formatting

### Parsing Issues

The bot extracts issues using multiple patterns:

- **Structured markers**: `Issue:`, `Fix:`, `Error:`, `Warning:`
- **Priority badges**: P0/P1/P2 badges (Codex/Bugbot format)
- **Emoji indicators**: ❌, ⚠️, 🔴
- **Bullet points**: `- Issue description`
- **Numbered lists**: `1. Issue description`

### Detecting Approval

Approval is detected when reviewer comments contain:

- **Text patterns**: "no major issues found", "LGTM", "approved", "looks good", "no bugs found", "all clear"
- **Emoji**: 👍 `:thumbsup:` `:+1:`
- **Badge patterns**: ✅ with approval text

### Merge Logic

**Requirements for Auto-Merge:**
1. ✅ ONE reviewer (Codex OR Bugbot) must approve
2. ✅ ALL issues from ALL summoned reviewers must be resolved
3. ✅ No loop detection (same issue appearing 3+ times)

**Example:**
- Codex finds 3 issues → fixes applied → 2 resolved
- Bugbot triggered → finds 2 issues → fixes applied → all resolved
- Codex approves → **Auto-merge proceeds** (all 5 issues resolved)

**Blocked Merge:**
- Bugbot approves BUT Codex still has 1 unresolved issue → **Merge blocked**
- Message: "Bugbot approved but there are still unresolved issues from other reviewers"

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

## 🔄 Updating AugmentBot

### Updating the Workflow for All Repositories

Since AugmentBot uses a reusable workflow, updates are automatic:

1. **Edit the main workflow:**
   ```bash
   # In the AugmentBot repository
   vim .github/workflows/augmentbot.yml
   ```

2. **Commit and push:**
   ```bash
   git add .github/workflows/augmentbot.yml
   git commit -m "feat: Improve Codex detection"
   git push
   ```

3. **All repositories automatically use the new version!** 🎉

No need to update individual repositories - they all reference `@main` and get updates automatically.

### Updating Configuration Per Repository

If a specific repository needs custom settings:

1. **Copy the config file:**
   ```bash
   cp .github/augmentbot-config.yml /path/to/other/repo/.github/
   ```

2. **Customize and commit:**
   ```bash
   cd /path/to/other/repo
   vim .github/augmentbot-config.yml
   git add .github/augmentbot-config.yml
   git commit -m "chore: Customize AugmentBot config"
   git push
   ```

---

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