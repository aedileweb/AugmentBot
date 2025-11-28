# AugmentBot Quick Reference

## 🚀 Add to Any Repository (30 seconds)

```bash
# Navigate to your repository
cd /path/to/your/repo

# Create the workflow file
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

**Done!** AugmentBot is now active. ✅

---

## 📝 Usage

### Activate on a PR
```
@augment takeover
```

### What Happens Next
1. Bot adds `augmentbot:monitoring` label
2. Monitors for Codex reviews
3. Automatically applies fixes when Codex comments
4. Tags @codex for re-review
5. Auto-merges when Codex approves

---

## 🔧 Configuration (Optional)

### Customize Codex Usernames

Create `.github/augmentbot-config.yml`:

```yaml
codex_usernames:
  - codex
  - codex-bot
  - your-custom-bot

approval_patterns:
  - "no major issues"
  - "lgtm"
  - "👍"

auto_merge:
  enabled: true
  merge_method: squash
```

---

## 🔄 Update All Repositories

To update AugmentBot across **all repositories**:

1. Edit `.github/workflows/augmentbot.yml` in the **AugmentBot** repository
2. Commit and push to main
3. All repositories automatically get the update! 🎉

---

## 🧪 Test It

```bash
# Create a test PR
git checkout -b test-augmentbot
echo "test" > test.txt
git add test.txt
git commit -m "test: AugmentBot"
git push -u origin test-augmentbot

# Create PR and comment
gh pr create --title "Test AugmentBot" --body "Testing"
gh pr comment --body "@augment takeover"

# Check workflow
gh run list --workflow=augmentbot.yml
```

---

## 📊 Status Check

```bash
# List workflows
gh workflow list

# View recent runs
gh run list --workflow=augmentbot.yml --limit 5

# View specific run
gh run view <run-id>

# View logs
gh run view <run-id> --log
```

---

## 🔍 Troubleshooting

### Workflow not running?
```bash
# Check workflow exists
ls -la .github/workflows/augmentbot.yml

# Validate YAML
gh workflow view augmentbot.yml

# Check Actions are enabled
gh api repos/{owner}/{repo}/actions/permissions
```

### Secret not found?
```bash
# Check organization secret
gh secret list --org aedileweb

# Check repository secret
gh secret list
```

### Permission denied?
- Go to repo Settings → Actions → General
- Set "Workflow permissions" to "Read and write permissions"

---

## 📚 Full Documentation

- **Setup Guide:** [ORGANIZATION_SETUP.md](ORGANIZATION_SETUP.md)
- **Main README:** [README.md](README.md)
- **Deployment Summary:** [DEPLOYMENT_SUMMARY.md](DEPLOYMENT_SUMMARY.md)

---

## 🎯 Key Points

✅ **Organization secret already set:** `AUGMENT_SESSION_AUTH`  
✅ **Just 5 lines per repository**  
✅ **Updates apply automatically to all repos**  
✅ **No server, no infrastructure, no maintenance**  
✅ **Free on GitHub Actions**  

---

**Questions?** Create an issue in the AugmentBot repository.

