/**
 * Check for unresolved Codex issues in PR comment history
 * This prevents missing issues that were posted before AugmentBot was activated
 */

module.exports = async ({ github, context, core }) => {
  const prNumber = context.payload.issue?.number || context.payload.pull_request?.number;
  
  if (!prNumber) {
    core.setOutput('has_unresolved', false);
    return { unresolvedIssues: [], count: 0 };
  }

  // Get all comments on the PR
  const { data: comments } = await github.rest.issues.listComments({
    owner: context.repo.owner,
    repo: context.repo.repo,
    issue_number: prNumber,
    per_page: 100
  });

  // Get all review comments
  const { data: reviewComments } = await github.rest.pulls.listReviews({
    owner: context.repo.owner,
    repo: context.repo.repo,
    pull_number: prNumber,
    per_page: 100
  });

  // Get commit history to check what's been fixed
  const { data: commits } = await github.rest.pulls.listCommits({
    owner: context.repo.owner,
    repo: context.repo.repo,
    pull_number: prNumber,
    per_page: 100
  });

  const codexUsernames = (process.env.CODEX_USERNAMES || 'codex,codex-bot,codex-reviewer').split(',');
  const approvalPatterns = [
    /no major issues/i,
    /looks good/i,
    /lgtm/i,
    /approved/i,
    /👍/,
    /✅.*ready to merge/i
  ];

  // Find all Codex comments
  const codexComments = [
    ...comments.filter(c => 
      codexUsernames.some(u => c.user.login.toLowerCase().includes(u.toLowerCase()))
    ),
    ...reviewComments.filter(r => 
      codexUsernames.some(u => r.user.login.toLowerCase().includes(u.toLowerCase()))
    )
  ].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

  if (codexComments.length === 0) {
    core.setOutput('has_unresolved', false);
    return { unresolvedIssues: [], count: 0 };
  }

  // Get the most recent Codex comment
  const latestCodexComment = codexComments[codexComments.length - 1];
  const isApproved = approvalPatterns.some(p => p.test(latestCodexComment.body));

  if (isApproved) {
    core.info('✅ Latest Codex comment is an approval');
    core.setOutput('has_unresolved', false);
    return { unresolvedIssues: [], count: 0, isApproved: true };
  }

  // Extract issues from the latest non-approval comment
  const commentBody = latestCodexComment.body;
  const issues = extractIssues(commentBody);

  // Check which issues have been addressed in commits
  const unresolvedIssues = issues.filter(issue => {
    return !isIssueResolved(issue, commits);
  });

  // Detect loops - same issue appearing multiple times
  const loopDetection = detectLoops(codexComments, commits);

  core.setOutput('has_unresolved', unresolvedIssues.length > 0);
  core.setOutput('unresolved_count', unresolvedIssues.length);
  core.setOutput('unresolved_issues', unresolvedIssues.join('\n- '));
  core.setOutput('has_loops', loopDetection.hasLoops);
  core.setOutput('loop_details', JSON.stringify(loopDetection.loops));

  return {
    unresolvedIssues,
    count: unresolvedIssues.length,
    isApproved,
    loops: loopDetection
  };
};

function extractIssues(commentBody) {
  const issues = [];
  
  // Pattern 1: Numbered lists (1. Issue, 2. Issue)
  const numberedMatches = commentBody.matchAll(/^\d+\.\s*\*\*(.+?)\*\*/gm);
  for (const match of numberedMatches) {
    issues.push(match[1].trim());
  }
  
  // Pattern 2: Bullet points with bold titles
  const bulletMatches = commentBody.matchAll(/^[-*]\s*\*\*(.+?)\*\*/gm);
  for (const match of bulletMatches) {
    issues.push(match[1].trim());
  }
  
  // Pattern 3: Issue/Problem/Error keywords
  const keywordMatches = commentBody.matchAll(/(?:issue|problem|error|warning|bug):\s*(.+?)(?=\n|$)/gi);
  for (const match of keywordMatches) {
    issues.push(match[1].trim());
  }
  
  return [...new Set(issues)]; // Remove duplicates
}

function isIssueResolved(issue, commits) {
  // Check if any commit message mentions fixing this issue
  const issueKeywords = issue.toLowerCase().split(/\s+/).filter(w => w.length > 3);
  
  return commits.some(commit => {
    const message = commit.commit.message.toLowerCase();
    // Check if commit mentions "fix" and contains issue keywords
    const hasFix = /\b(fix|resolve|address|correct)\b/.test(message);
    const hasKeywords = issueKeywords.some(keyword => message.includes(keyword));
    return hasFix && hasKeywords;
  });
}

function detectLoops(codexComments, commits) {
  const issueOccurrences = new Map();
  
  // Track how many times each issue appears
  codexComments.forEach(comment => {
    const issues = extractIssues(comment.body);
    issues.forEach(issue => {
      const normalized = issue.toLowerCase().trim();
      if (!issueOccurrences.has(normalized)) {
        issueOccurrences.set(normalized, []);
      }
      issueOccurrences.get(normalized).push({
        commentId: comment.id,
        createdAt: comment.created_at
      });
    });
  });
  
  // Find issues that appear 3+ times
  const loops = [];
  issueOccurrences.forEach((occurrences, issue) => {
    if (occurrences.length >= 3) {
      loops.push({
        issue,
        count: occurrences.length,
        occurrences
      });
    }
  });
  
  return {
    hasLoops: loops.length > 0,
    loops
  };
}

