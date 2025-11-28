# AugmentBot Organization-Wide Setup

This guide shows how to enable AugmentBot across **all repositories** in your organization.

---

## Step 1: Set Up Organization Secret

### Option A: Using GitHub Web UI (Recommended)

1. **Go to Organization Settings:**
   - Navigate to: https://github.com/organizations/aedileweb/settings/secrets/actions

2. **Create New Secret:**
   - Click **"New organization secret"**
   - Name: `AUGMENT_SESSION_AUTH`
   - Value: `ff2db5c3a69d6d2dc375391a8e42f9db9d7f1f10cc8e18848510fe5476174a95`
   - Repository access: **"All repositories"** (or select specific ones)
   - Click **"Add secret"**

### Option B: Using GitHub CLI

```bash
# Set organization secret for all repositories
gh secret set AUGMENT_SESSION_AUTH \
  --org aedileweb \
  --visibility all \
  --body "ff2db5c3a69d6d2dc375391a8e42f9db9d7f1f10cc8e18848510fe5476174a95"
```

---

## Step 2: Add AugmentBot to Any Repository

For **each repository** where you want AugmentBot:

### Quick Setup (Copy-Paste)

```bash
# Navigate to your repository
cd /path/to/your/repo

# Create workflows directory if it doesn't exist
mkdir -p .github/workflows

# Create the caller workflow file
cat > .github/workflows/augmentbot.yml << 'EOF'
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
EOF

# Commit and push
git add .github/workflows/augmentbot.yml
git commit -m "feat: Enable AugmentBot"
git push
```

### Manual Setup

1. **Copy the template file:**
   - From: `AugmentBot/.github/workflows/augmentbot-caller.yml.template`
   - To: `YourRepo/.github/workflows/augmentbot.yml`

2. **Commit and push:**
   ```bash
   git add .github/workflows/augmentbot.yml
   git commit -m "feat: Enable AugmentBot"
   git push
   ```

That's it! AugmentBot is now active on that repository.

---

## Step 3: Verify Setup

1. **Check the workflow is active:**
   ```bash
   gh workflow list
   ```
   You should see "AugmentBot" in the list.

2. **Test on a PR:**
   - Create a test PR
   - Comment: `@augment takeover`
   - Check the Actions tab - workflow should run

---

## How It Works

### Centralized Management

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

### Benefits

✅ **One Source of Truth**: All logic in AugmentBot repository  
✅ **Automatic Updates**: Change once, applies to all repos  
✅ **Minimal Setup**: Just 5 lines per repository  
✅ **Centralized Secret**: One organization secret for all repos  
✅ **Easy Maintenance**: Update workflow in one place  

---

## Updating AugmentBot

When you make changes to the main workflow:

1. **Edit** `.github/workflows/augmentbot.yml` in AugmentBot repo
2. **Commit and push** to main branch
3. **All repositories automatically use the new version!**

No need to update individual repositories! 🎉

---

## Configuration Per Repository (Optional)

If a repository needs custom configuration:

1. **Copy the config file:**
   ```bash
   cp AugmentBot/.github/augmentbot-config.yml .github/
   ```

2. **Customize settings:**
   - Edit `.github/augmentbot-config.yml`
   - Adjust Codex usernames, approval patterns, etc.

3. **Commit and push:**
   ```bash
   git add .github/augmentbot-config.yml
   git commit -m "chore: Customize AugmentBot config"
   git push
   ```

The workflow will use the repository's config if it exists, otherwise uses defaults.

---

## Troubleshooting

### Secret Not Found

**Error:** `Secret AUGMENT_SESSION_AUTH not found`

**Fix:**
1. Verify organization secret is created
2. Check repository has access to the secret
3. Go to: https://github.com/organizations/aedileweb/settings/secrets/actions
4. Edit `AUGMENT_SESSION_AUTH` → Update repository access

### Workflow Not Running

**Error:** Workflow doesn't appear in Actions tab

**Fix:**
1. Ensure file is at `.github/workflows/augmentbot.yml` (exact path)
2. Check YAML syntax is valid
3. Verify workflow is committed to default branch (main/master)
4. Check GitHub Actions is enabled in repository settings

### Permission Denied

**Error:** `Resource not accessible by integration`

**Fix:**
1. Verify workflow has correct permissions block
2. Check repository settings → Actions → General → Workflow permissions
3. Set to "Read and write permissions"

---

## Next Steps

1. ✅ Set up organization secret (Step 1)
2. ✅ Add AugmentBot to your first repository (Step 2)
3. ✅ Test with a PR
4. 🚀 Roll out to all repositories!

---

## Support

- **Main Repository:** https://github.com/aedileweb/AugmentBot
- **Documentation:** See README.md and SETUP.md
- **Issues:** Create an issue in the AugmentBot repository

