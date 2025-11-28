# AugmentBot Setup Guide

## Quick Setup (5 minutes)

### Step 1: Get Your Augment Token

```bash
# Login to Auggie CLI (opens browser)
auggie login

# Get your token
auggie tokens print
```

Copy the `accessToken` value from the output.

### Step 2: Add GitHub Secret

1. Go to your repository on GitHub
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Name: `AUGMENT_SESSION_AUTH`
5. Value: Paste the token from Step 1
6. Click **Add secret**

### Step 3: Test the Workflow

1. Create a test branch and PR
2. Add a comment on the PR: `@augment takeover`
3. Check the **Actions** tab - you should see the workflow running
4. The bot will post a confirmation comment

That's it! AugmentBot is now active on your repository.

---

## Testing with a Simulated Codex Review

To test the full workflow without waiting for Codex:

1. Activate the bot: `@augment takeover`
2. Post a comment simulating Codex (use a different account or just test the parsing):
   ```
   Found the following issues:
   - Issue: Missing error handling in main.js
   - Issue: Unused variable in utils.js
   ```
3. Watch the workflow run in the Actions tab
4. The bot should:
   - Detect the "Codex" comment
   - Parse the issues
   - Run Auggie CLI to generate fixes
   - Commit and push changes
   - Tag for re-review

---

## Configuration

### Customize Codex Usernames

Edit `.github/augmentbot-config.yml`:

```yaml
codex_usernames:
  - codex
  - codex-bot
  - your-custom-reviewer-bot
```

### Customize Approval Patterns

Edit `.github/augmentbot-config.yml`:

```yaml
approval_patterns:
  - "no major issues"
  - "looks good"
  - "approved"
  - "👍"
```

### Change Merge Method

Edit `.github/augmentbot-config.yml`:

```yaml
auto_merge:
  enabled: true
  merge_method: squash  # Options: merge, squash, rebase
```

---

## Troubleshooting

### Workflow Not Running?

**Check:**
1. GitHub Actions is enabled (Settings → Actions → Allow all actions)
2. Workflow file exists at `.github/workflows/augmentbot.yml`
3. No syntax errors in workflow file (check Actions tab)

### Secret Not Working?

**Check:**
1. Secret name is exactly `AUGMENT_SESSION_AUTH` (case-sensitive)
2. Token is the `accessToken` value, not the entire JSON
3. Token is still valid (run `auggie tokens print` to verify)

### Auggie CLI Errors?

**Common issues:**
- Token expired: Run `auggie login` again and update the secret
- Network issues: Check GitHub Actions runner can access Augment API
- Prompt too long: Codex comment might be too large

### Auto-merge Not Working?

**Check:**
1. Branch protection rules allow auto-merge
2. All required status checks pass
3. Codex comment contains approval pattern (see config)
4. PR is not in draft mode

---

## Advanced Configuration

### Custom Auggie Prompts

Edit the workflow file `.github/workflows/augmentbot.yml` at line ~194:

```yaml
PROMPT="Fix the following code review issues identified by Codex:

${{ steps.issues.outputs.issues }}

Please analyze the codebase, identify the files that need changes, and apply the necessary fixes to address these issues."
```

Customize this prompt to match your coding standards or specific requirements.

### Multiple Repositories

To use AugmentBot across multiple repositories:

1. Add the `AUGMENT_SESSION_AUTH` secret to each repository
2. Copy `.github/workflows/augmentbot.yml` to each repository
3. Optionally customize `.github/augmentbot-config.yml` per repository

**Or use Organization Secrets:**
1. Go to Organization Settings → Secrets and variables → Actions
2. Create `AUGMENT_SESSION_AUTH` as an organization secret
3. Select which repositories can access it
4. All selected repositories will use the same token

---

## Next Steps

1. ✅ Set up the secret
2. ✅ Test with a PR
3. ✅ Customize configuration
4. 🚀 Use in production!

For questions or issues, create an issue in the repository.

