const logger = require('./utils/logger');

/**
 * Detects and parses Codex review comments
 */
class CodexDetector {
  constructor() {
    // Configurable Codex identifiers
    this.codexUsernames = (process.env.CODEX_USERNAMES || 'codex,codex-bot,codex-reviewer').split(',');
    this.codexBotPattern = /codex/i;
    
    // Approval patterns
    this.approvalPatterns = [
      /no major issues found/i,
      /looks good to me/i,
      /lgtm/i,
      /approved/i,
      /no issues/i,
      /ready to merge/i,
      /all clear/i
    ];

    // Issue patterns - Codex typically formats issues in specific ways
    this.issuePatterns = [
      /(?:issue|problem|error|warning|concern):\s*(.+)/gi,
      /(?:fix|change|update|modify):\s*(.+)/gi,
      /❌\s*(.+)/g,
      /⚠️\s*(.+)/g,
      /🔴\s*(.+)/g
    ];
  }

  /**
   * Check if a comment/review is from Codex
   */
  isCodexComment(comment) {
    if (!comment || !comment.user) {
      return false;
    }

    const username = comment.user.login.toLowerCase();
    const isBot = comment.user.type === 'Bot';
    
    // Check if username matches Codex patterns
    const matchesUsername = this.codexUsernames.some(codexName => 
      username.includes(codexName.toLowerCase())
    );

    // Check if it's a bot with Codex in the name
    const matchesBotPattern = isBot && this.codexBotPattern.test(username);

    const isCodex = matchesUsername || matchesBotPattern;
    
    if (isCodex) {
      logger.debug(`Detected Codex comment from ${comment.user.login}`);
    }

    return isCodex;
  }

  /**
   * Check if comment indicates approval
   */
  isApproval(commentBody) {
    if (!commentBody) {
      return false;
    }

    const body = commentBody.toLowerCase();
    
    // Check for approval patterns
    const hasApprovalText = this.approvalPatterns.some(pattern => pattern.test(body));
    
    // Check for thumbs up emoji
    const hasThumbsUp = body.includes('👍') || body.includes(':thumbsup:') || body.includes(':+1:');

    const isApproved = hasApprovalText || hasThumbsUp;

    if (isApproved) {
      logger.info('Detected Codex approval');
    }

    return isApproved;
  }

  /**
   * Parse issues from Codex comment
   */
  parseIssues(commentBody) {
    if (!commentBody) {
      return [];
    }

    const issues = [];
    const lines = commentBody.split('\n');

    // Try to extract structured issues
    for (const pattern of this.issuePatterns) {
      let match;
      while ((match = pattern.exec(commentBody)) !== null) {
        const issue = match[1].trim();
        if (issue && issue.length > 10) { // Filter out very short matches
          issues.push({
            text: issue,
            type: this.categorizeIssue(issue),
            raw: match[0]
          });
        }
      }
    }

    // If no structured issues found, look for bullet points or numbered lists
    if (issues.length === 0) {
      for (const line of lines) {
        const trimmed = line.trim();
        // Match bullet points or numbered lists
        if (/^[-*•]\s+(.+)/.test(trimmed) || /^\d+\.\s+(.+)/.test(trimmed)) {
          const match = trimmed.match(/^(?:[-*•]|\d+\.)\s+(.+)/);
          if (match && match[1].length > 10) {
            issues.push({
              text: match[1],
              type: this.categorizeIssue(match[1]),
              raw: trimmed
            });
          }
        }
      }
    }

    logger.info(`Parsed ${issues.length} issues from Codex comment`);
    return issues;
  }

  /**
   * Categorize issue type
   */
  categorizeIssue(issueText) {
    const text = issueText.toLowerCase();
    
    if (/security|vulnerability|exploit|injection/.test(text)) {
      return 'security';
    }
    if (/performance|slow|optimize|inefficient/.test(text)) {
      return 'performance';
    }
    if (/bug|error|crash|fail/.test(text)) {
      return 'bug';
    }
    if (/style|format|convention|lint/.test(text)) {
      return 'style';
    }
    if (/test|coverage|spec/.test(text)) {
      return 'testing';
    }
    if (/documentation|comment|doc/.test(text)) {
      return 'documentation';
    }
    
    return 'general';
  }

  /**
   * Extract file and line information from review comment
   */
  extractLocation(comment) {
    const location = {
      file: comment.path || null,
      line: comment.line || comment.original_line || null,
      startLine: comment.start_line || null,
      endLine: comment.line || null
    };

    return location;
  }

  /**
   * Parse a complete Codex review
   */
  parseReview(review) {
    const result = {
      isCodex: this.isCodexComment(review),
      isApproval: false,
      issues: [],
      summary: null,
      timestamp: review.submitted_at || review.created_at
    };

    if (!result.isCodex) {
      return result;
    }

    // Check for approval
    result.isApproval = this.isApproval(review.body);

    // Parse issues from review body
    if (review.body) {
      result.issues = this.parseIssues(review.body);
      result.summary = review.body;
    }

    return result;
  }

  /**
   * Parse review comments (inline comments on code)
   */
  parseReviewComments(comments) {
    const codexComments = comments.filter(c => this.isCodexComment(c));
    
    return codexComments.map(comment => ({
      id: comment.id,
      body: comment.body,
      location: this.extractLocation(comment),
      issues: this.parseIssues(comment.body),
      createdAt: comment.created_at
    }));
  }
}

module.exports = new CodexDetector();

