# AugmentBot Testing Guide

## Test Scenarios for Dual Reviewer System

### 1. Basic Codex Review Flow

**Setup:**
1. Create a PR with intentional issues
2. Comment: `@augment takeover`
3. Wait for Codex to review

**Expected Behavior:**
- ✅ AugmentBot detects Codex review
- ✅ Parses issues from Codex
- ✅ Applies fixes using Augment Agent
- ✅ Requests re-review from Codex
- ✅ Auto-merges when Codex approves

### 2. Manual Bugbot Trigger

**Setup:**
1. Create a PR with intentional issues
2. Comment: `@augment takeover`
3. Comment: `bugbot run`

**Expected Behavior:**
- ✅ AugmentBot detects Bugbot trigger
- ✅ Posts "Bugbot triggered!" message
- ✅ Adds `augmentbot:bugbot-review` label
- ✅ Waits for Bugbot review
- ✅ Parses issues from Bugbot
- ✅ Applies fixes
- ✅ Auto-merges when Bugbot approves

### 3. Codex Error → Bugbot Fallback

**Setup:**
1. Create a PR
2. Comment: `@augment takeover`
3. Simulate Codex error (or wait for actual credit exhaustion)

**Expected Behavior:**
- ✅ AugmentBot detects Codex error message
- ✅ Posts fallback message
- ✅ Automatically comments "bugbot run"
- ✅ Bugbot takes over review
- ✅ Issues tracked from Bugbot
- ✅ Auto-merges when Bugbot approves

### 4. Bugbot Error → Codex Fallback

**Setup:**
1. Create a PR
2. Comment: `@augment takeover`
3. Comment: `bugbot run`
4. Simulate Bugbot error

**Expected Behavior:**
- ✅ AugmentBot detects Bugbot error message
- ✅ Posts fallback message
- ✅ Automatically comments "@codex please review"
- ✅ Codex takes over review
- ✅ Issues tracked from Codex
- ✅ Auto-merges when Codex approves

### 5. Multi-Reviewer Issue Tracking

**Setup:**
1. Create a PR with multiple issues
2. Comment: `@augment takeover`
3. Wait for Codex review (finds 3 issues)
4. Fixes applied (2 issues resolved, 1 remains)
5. Comment: `bugbot run`
6. Wait for Bugbot review (finds 2 new issues)

**Expected Behavior:**
- ✅ Tracks 3 issues from Codex
- ✅ After fixes, 1 Codex issue still unresolved
- ✅ Tracks 2 new issues from Bugbot
- ✅ Total: 3 unresolved issues (1 Codex + 2 Bugbot)
- ✅ Status shows "From reviewers: codex,bugbot"
- ✅ Merge blocked until ALL 3 issues resolved

### 6. Mixed Reviewer Approval

**Scenario A: Bugbot approves, Codex has unresolved issues**

**Expected Behavior:**
- ✅ Bugbot approval detected
- ✅ Merge blocked with message: "Bugbot approved but there are still unresolved issues from other reviewers"
- ✅ No auto-merge

**Scenario B: All issues resolved, Bugbot approves**

**Expected Behavior:**
- ✅ Bugbot approval detected
- ✅ All issues from all reviewers resolved
- ✅ Auto-merge proceeds
- ✅ Commit message: "Merge PR #X - bugbot approved"

### 7. Issue Resolution Timing

**Setup:**
1. Codex reviews at 10:00 AM (finds 3 issues)
2. Commit made at 9:55 AM (before review)
3. Commit made at 10:05 AM (after review, fixes 2 issues)

**Expected Behavior:**
- ✅ 9:55 AM commit ignored (before review)
- ✅ 10:05 AM commit considered (after review)
- ✅ 2 issues marked as resolved
- ✅ 1 issue remains unresolved

### 8. Loop Detection Across Reviewers

**Setup:**
1. Codex finds issue "Missing error handling"
2. Fix applied
3. Codex finds same issue again
4. Fix applied
5. Bugbot finds same issue third time

**Expected Behavior:**
- ✅ Loop detected (same issue 3+ times)
- ✅ Automated fixes paused
- ✅ Alert posted with loop details
- ✅ Shows issue appeared across multiple reviewers

## Error Patterns to Test

### Codex Error Messages
- "usage limits have been reached"
- "out of credits"
- "credits must be used"
- "not configured"
- "check with the admins"
- "increase the limits"
- "codex is not enabled"
- "codex has been disabled"

### Bugbot Error Messages
- "unable to review"
- "cannot review"
- "review failed"

## Manual Testing Checklist

- [ ] Test Codex automatic review
- [ ] Test Bugbot manual trigger
- [ ] Test Codex → Bugbot fallback
- [ ] Test Bugbot → Codex fallback
- [ ] Test multi-reviewer issue tracking
- [ ] Test merge with Codex approval only
- [ ] Test merge with Bugbot approval only
- [ ] Test merge blocked (unresolved issues from other reviewer)
- [ ] Test issue resolution timing (commits after review)
- [ ] Test loop detection across reviewers
- [ ] Verify labels applied correctly
- [ ] Verify status messages accurate
- [ ] Verify re-review requests correct

