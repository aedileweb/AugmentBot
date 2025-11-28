# AugmentBot Workflow Guide

## Overview

This document explains how AugmentBot automates the code review cycle with Codex.

## The Automated Review Cycle

### Step 1: Activation

When your local Augment agent creates a PR, activate AugmentBot:

```
@augment takeover
```

**What happens:**
- AugmentBot starts monitoring the PR
- Posts acknowledgment comment
- Waits for Codex to review

### Step 2: Codex Reviews

Codex automatically reviews your PR and posts comments with identified issues.

**Example Codex Review:**
```
Found the following issues:

❌ Security: SQL injection vulnerability in user input
⚠️ Performance: Inefficient database query in loop
- Style: Missing error handling for API calls
```

### Step 3: Automatic Fix Application

AugmentBot detects the Codex review and:

1. **Parses Issues**: Extracts all actionable items from Codex comments
2. **Generates Fixes**: Calls Augment AI to generate code fixes
3. **Applies Changes**: Clones repo, applies fixes, commits, and pushes
4. **Requests Re-Review**: Tags @codex to review the changes

**Bot Comment:**
```
🔧 Applying fixes...

Found 3 issue(s) from Codex review. Working on fixes now...

✅ Fixes applied!

Applied 3 fix(es) addressing 3 issue(s).

@codex Please review the changes.
```

### Step 4: Review Loop

The cycle repeats:
- Codex reviews the fixes
- If more issues found → AugmentBot applies more fixes
- If approved → Proceed to Step 5

### Step 5: Auto-Merge

When Codex approves with:
- "no major issues found"
- "LGTM" / "looks good to me"
- 👍 emoji
- "approved"

AugmentBot automatically:
1. Posts approval confirmation
2. Merges the PR
3. Stops monitoring

**Bot Comment:**
```
✅ Codex approved!

All issues resolved. Auto-merging now...
```

## Manual Controls

### Check Status

```
@augment status
```

Shows current automation state, fix attempts, and last Codex review.

### Stop Automation

```
@augment stop
```

Stops monitoring the PR. You can restart with `@augment takeover`.

### Manual Fix Trigger

```
@augment fix
```

Manually trigger fix application (useful if auto-detection missed something).

### Request Re-Review

```
@augment review codex
```

Manually request Codex to review without applying fixes.

## Codex Detection

### How AugmentBot Identifies Codex

1. **Username Check**: Matches against `CODEX_USERNAMES` environment variable
2. **Bot Verification**: Confirms the user is a GitHub Bot
3. **Pattern Matching**: Recognizes Codex comment formatting

### Configuring Codex Usernames

In `.env`:
```bash
CODEX_USERNAMES=codex,codex-bot,codex-reviewer,my-custom-codex
```

## Issue Parsing

AugmentBot recognizes these issue patterns:

### Structured Markers
```
Issue: Description of the problem
Fix: What needs to be changed
Error: Error description
Warning: Warning description
```

### Emoji Indicators
```
❌ Critical issue
⚠️ Warning
🔴 Error
```

### Lists
```
- Issue description
* Another issue
1. Numbered issue
```

## Approval Detection

### Text Patterns
- "no major issues found"
- "looks good to me"
- "LGTM"
- "approved"
- "no issues"
- "ready to merge"
- "all clear"

### Emoji
- 👍
- :thumbsup:
- :+1:

## State Management

AugmentBot tracks:

- **Monitored PRs**: Which PRs are under automation
- **Processed Comments**: Prevents duplicate processing
- **Fix Attempts**: History of all fix applications
- **Last Codex Review**: Most recent Codex feedback
- **Status**: active, waiting_review, approved, stopped

## Best Practices

### 1. Always Use Takeover

Start with `@augment takeover` to enable full automation.

### 2. Let It Run

Once activated, let AugmentBot handle the review cycle automatically.

### 3. Monitor Status

Use `@augment status` to check progress if needed.

### 4. Stop When Needed

Use `@augment stop` if you need to make manual changes.

### 5. Configure Codex Properly

Ensure `CODEX_USERNAMES` matches your Codex bot's username.

## Troubleshooting

### Bot Not Detecting Codex Reviews

**Check:**
1. Is the PR being monitored? (`@augment status`)
2. Does Codex username match `CODEX_USERNAMES`?
3. Check logs for detection attempts

### Fixes Not Being Applied

**Check:**
1. Augment AI API key configured?
2. Repository permissions correct?
3. Check error messages in PR comments

### Auto-Merge Not Triggering

**Check:**
1. Does Codex comment contain approval keywords?
2. Is PR in "approved" status? (`@augment status`)
3. Check merge permissions on repository

## Example Full Cycle

```
1. Developer: Creates PR with @augment takeover
   → Bot: "🤖 AugmentBot activated! Waiting for Codex review..."

2. Codex: Posts review with 3 issues
   → Bot: "🔧 Applying fixes... Found 3 issue(s)"
   → Bot: "✅ Fixes applied! @codex Please review"

3. Codex: Posts review with 1 remaining issue
   → Bot: "🔧 Applying fixes... Found 1 issue(s)"
   → Bot: "✅ Fixes applied! @codex Please review"

4. Codex: "No major issues found 👍"
   → Bot: "✅ Codex approved! Auto-merging now..."
   → Bot: Merges PR

5. Done! ✅
```

