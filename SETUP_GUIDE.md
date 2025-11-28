# AugmentBot Setup Guide

## Overview
AugmentBot is an automated code review response system that works with Codex to create a continuous improvement loop for AI-generated code.

## How It Works

```
┌─────────────────────────────────────────────────────────────┐
│  1. Developer pushes code → Creates PR                      │
│  2. Comment "@augment takeover" to activate AugmentBot      │
│  3. Codex reviews code → Posts issues                       │
│  4. AugmentBot detects issues → Applies fixes via Auggie    │
│  5. AugmentBot tags @codex for re-review                    │
│  6. Loop continues until Codex approves                     │
│  7. PR auto-merges when approved ✅                          │
└─────────────────────────────────────────────────────────────┘
```

## Features

### ✅ Historical Issue Tracking
- Checks **all unresolved Codex comments** when activated
- Doesn't miss issues posted before AugmentBot was enabled
- Tracks which issues have been addressed via commit messages

### ✅ Loop Detection
- Detects when the same issue appears **3+ times**
- Automatically **pauses fixes** to prevent infinite loops
- Alerts team to review and fix manually

### ✅ Smart Issue Resolution
- Parses Codex comments to extract specific issues
- Applies fixes using Auggie CLI with full context
- Commits with detailed messages listing issues addressed

### ✅ Auto-Merge on Approval
- Detects Codex approval patterns
- Automatically merges PR when approved
- Removes monitoring labels

## Setup Instructions

### 1. Configure Codex
Copy the instructions from `CODEX_PROMPT.md` to Codex's custom instructions. This ensures:
- Codex focuses on AI-generated code review
- Issues are formatted for easy parsing
- Loop detection is supported
- Clear approval/rejection signals

### 2. Add to Repository
Copy `.github/workflows/augmentbot-caller.yml.template` to your repository as `.github/workflows/augmentbot.yml`

### 3. Ensure Secrets
Verify `AUGMENT_SESSION_AUTH` is set as an organization secret (already done for aedileweb org)

### 4. Activate on PR
Comment `@augment takeover` on any PR to enable monitoring

## Usage

### Activate AugmentBot
```
@augment takeover
```

### Check Status
Look for labels:
- `augmentbot:monitoring` - Bot is active
- `augmentbot:waiting-review` - Waiting for Codex re-review

### Manual Intervention
If loop detected, bot will pause and post alert. Review commit history and fix manually.

## Codex Review Format

### For Approval
```
✅ **Code Review: APPROVED**
No major issues found. Ready to merge! 👍
```

### For Issues
```
❌ **Code Review: CHANGES REQUESTED**

## Critical Issues
1. **[Issue Title]**
   - **Problem**: [Description]
   - **Location**: `file.ts:123`
   - **Fix**: [Specific instruction]
```

### For Loops
```
⚠️ **LOOP DETECTED**
Issue: [Description]
Commits: [hash1], [hash2], [hash3]
**Alternative Approach**: [Suggestion]
```

## Architecture

### Reusable Workflow
- **Central repo**: `aedileweb/AugmentBot`
- **Caller repos**: Any repo with the caller workflow
- **Secrets**: Passed from caller to reusable workflow

### Key Components
1. **augmentbot.yml** - Main reusable workflow
2. **check-historical-issues.js** - Historical issue tracker
3. **CODEX_PROMPT.md** - Codex instructions
4. **augmentbot-caller.yml.template** - Template for other repos

## Troubleshooting

### Workflow Not Triggering
- Ensure workflow file is on `main` branch
- Check that `AUGMENT_SESSION_AUTH` secret exists
- Verify AugmentBot repo is **public** (required for reusable workflows)

### Issues Not Detected
- Check Codex username matches `CODEX_USERNAMES` env var
- Verify issue format matches parsing patterns
- Review workflow logs for parsing errors

### Loop Detection Not Working
- Ensure commit messages mention "fix" and issue keywords
- Check that Codex is using consistent issue titles
- Review `check-historical-issues.js` logic

## Best Practices

1. **Always activate with `@augment takeover`** - Don't assume it's monitoring
2. **Review loop alerts carefully** - Manual intervention may be needed
3. **Keep Codex instructions updated** - Use `CODEX_PROMPT.md` as template
4. **Monitor first few runs** - Ensure parsing works with your Codex format
5. **Update issue patterns** - If Codex changes format, update parsing logic

## Next Steps

1. ✅ Test on PR #15 in vCISO-Automation-project
2. Wait for Codex to review and post issues
3. Verify AugmentBot detects and applies fixes
4. Confirm loop detection works if issues repeat
5. Validate auto-merge on approval

## Support

For issues or questions:
- Check workflow logs in GitHub Actions
- Review `check-historical-issues.js` for parsing logic
- Update `CODEX_USERNAMES` if using different reviewer bot
- Modify issue patterns in workflow if needed

