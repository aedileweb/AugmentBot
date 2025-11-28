const axios = require('axios');
const logger = require('./utils/logger');
const GitOperations = require('./utils/git-operations');
const prState = require('./pr-state');
const codexDetector = require('./codex-detector');

class FixEngine {
  constructor() {
    this.augmentApiUrl = process.env.AUGMENT_API_URL || 'https://api.augmentcode.com';
    this.augmentApiKey = process.env.AUGMENT_API_KEY;
  }

  /**
   * Apply fixes from Codex review
   */
  async applyFixes(octokit, repoFullName, prNumber, targetReviewer = null) {
    const [owner, repo] = repoFullName.split('/');

    try {
      // Get PR details
      const { data: pr } = await octokit.pulls.get({
        owner,
        repo,
        pull_number: prNumber
      });

      // Get review comments
      const { data: reviews } = await octokit.pulls.listReviews({
        owner,
        repo,
        pull_number: prNumber
      });

      // Get review comments (inline comments)
      const { data: reviewComments } = await octokit.pulls.listReviewComments({
        owner,
        repo,
        pull_number: prNumber
      });

      // Filter for Codex reviews
      const codexReviews = reviews.filter(r => codexDetector.isCodexComment(r));
      
      if (codexReviews.length === 0) {
        logger.info(`No Codex reviews found for PR ${owner}/${repo}#${prNumber}`);
        return { success: false, message: 'No Codex reviews found' };
      }

      // Get the latest Codex review
      const latestReview = codexReviews[codexReviews.length - 1];
      const parsedReview = codexDetector.parseReview(latestReview);

      // Parse inline comments
      const parsedComments = codexDetector.parseReviewComments(reviewComments);

      // Combine all issues
      const allIssues = [
        ...parsedReview.issues,
        ...parsedComments.flatMap(c => c.issues.map(issue => ({
          ...issue,
          location: c.location
        })))
      ];

      if (allIssues.length === 0) {
        logger.info(`No issues found in Codex review for PR ${owner}/${repo}#${prNumber}`);
        return { success: false, message: 'No issues to fix' };
      }

      logger.info(`Found ${allIssues.length} issues to fix`);

      // Post acknowledgment
      await octokit.issues.createComment({
        owner,
        repo,
        issue_number: prNumber,
        body: `🔧 **Applying fixes...**

Found ${allIssues.length} issue(s) from Codex review. Working on fixes now...`
      });

      // Generate and apply fixes
      const fixes = await this.generateFixes(pr, allIssues, parsedComments);
      
      if (!fixes || fixes.length === 0) {
        throw new Error('Failed to generate fixes from Augment AI');
      }

      // Apply fixes to repository
      const applied = await this.applyFixesToRepo(octokit, owner, repo, pr, fixes);

      if (applied) {
        // Record fix attempt
        prState.recordFixAttempt(owner, repo, prNumber, {
          issueCount: allIssues.length,
          fixCount: fixes.length,
          success: true
        });

        // Update state
        prState.updateState(owner, repo, prNumber, {
          status: 'waiting_review'
        });

        // Post success comment and request re-review
        await octokit.issues.createComment({
          owner,
          repo,
          issue_number: prNumber,
          body: `✅ **Fixes applied!**

Applied ${fixes.length} fix(es) addressing ${allIssues.length} issue(s).

@codex Please review the changes.`
        });

        return { success: true, fixCount: fixes.length };
      }

      return { success: false, message: 'Failed to apply fixes' };

    } catch (error) {
      logger.error(`Fix application failed for PR ${owner}/${repo}#${prNumber}:`, error);
      
      // Record failed attempt
      prState.recordFixAttempt(owner, repo, prNumber, {
        success: false,
        error: error.message
      });

      throw error;
    }
  }

  /**
   * Generate fixes using Augment AI
   */
  async generateFixes(pr, issues, reviewComments) {
    try {
      // Prepare context for Augment AI
      const context = {
        prTitle: pr.title,
        prDescription: pr.body,
        branch: pr.head.ref,
        baseBranch: pr.base.ref,
        issues: issues.map(i => ({
          text: i.text,
          type: i.type,
          location: i.location
        })),
        reviewComments: reviewComments.map(c => ({
          body: c.body,
          location: c.location
        }))
      };

      logger.info('Generating fixes with Augment AI', { issueCount: issues.length });

      // Call Augment AI API
      // Note: This is a placeholder - actual API integration depends on Augment's API
      const response = await axios.post(
        `${this.augmentApiUrl}/generate-fixes`,
        context,
        {
          headers: {
            'Authorization': `Bearer ${this.augmentApiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 60000 // 60 second timeout
        }
      );

      return response.data.fixes || [];
    } catch (error) {
      logger.error('Augment AI API call failed:', error);
      throw new Error(`Failed to generate fixes: ${error.message}`);
    }
  }

  /**
   * Apply fixes to repository
   */
  async applyFixesToRepo(octokit, owner, repo, pr, fixes) {
    const gitOps = new GitOperations(octokit, owner, repo);
    
    try {
      // Set installation ID
      const installationId = pr.head.repo.owner.id; // This should come from webhook payload
      gitOps.setInstallationId(installationId);

      // Clone repository
      await gitOps.clone(pr.head.ref);

      // Apply changes
      await gitOps.applyChanges(fixes);

      // Commit and push
      const committed = await gitOps.commitAndPush(
        `fix: Apply Codex review fixes\n\nAuto-generated fixes by AugmentBot`,
        pr.head.ref
      );

      return committed;
    } finally {
      // Always cleanup
      await gitOps.cleanup();
    }
  }
}

module.exports = new FixEngine();

