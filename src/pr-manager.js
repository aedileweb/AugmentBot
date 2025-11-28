const logger = require('./utils/logger');
const prState = require('./pr-state');
const codexDetector = require('./codex-detector');
const CommandParser = require('./command-parser');

class PRManager {
  /**
   * Take over PR automation
   */
  async takeover(octokit, repoFullName, prNumber) {
    const [owner, repo] = repoFullName.split('/');
    
    try {
      // Get PR details
      const { data: pr } = await octokit.pulls.get({
        owner,
        repo,
        pull_number: prNumber
      });

      // Start monitoring
      prState.startMonitoring(owner, repo, prNumber, {
        branch: pr.head.ref,
        baseBranch: pr.base.ref
      });

      // Post acknowledgment comment
      await octokit.issues.createComment({
        owner,
        repo,
        issue_number: prNumber,
        body: `🤖 **AugmentBot activated!**

I'm now monitoring this PR for Codex reviews. Here's what I'll do:

✅ Automatically detect Codex review comments
✅ Parse and analyze identified issues
✅ Apply fixes using Augment AI
✅ Request re-review from @codex
✅ Auto-merge when approved

You can stop me anytime with \`@augment stop\`.

*Waiting for Codex review...*`
      });

      logger.info(`Took over PR ${owner}/${repo}#${prNumber}`);
      return true;
    } catch (error) {
      logger.error(`Failed to takeover PR ${owner}/${repo}#${prNumber}:`, error);
      throw error;
    }
  }

  /**
   * Stop automation for a PR
   */
  async stopAutomation(octokit, repoFullName, prNumber) {
    const [owner, repo] = repoFullName.split('/');
    
    prState.stopMonitoring(owner, repo, prNumber);

    await octokit.issues.createComment({
      owner,
      repo,
      issue_number: prNumber,
      body: `🛑 **AugmentBot deactivated**

Automation stopped for this PR. You can reactivate me with \`@augment takeover\`.`
    });

    logger.info(`Stopped automation for PR ${owner}/${repo}#${prNumber}`);
  }

  /**
   * Request re-review from Codex
   */
  async requestReview(octokit, repoFullName, prNumber, reviewer = 'codex') {
    const [owner, repo] = repoFullName.split('/');

    try {
      await octokit.issues.createComment({
        owner,
        repo,
        issue_number: prNumber,
        body: `@${reviewer} Please review the latest changes.`
      });

      logger.info(`Requested review from @${reviewer} on PR ${owner}/${repo}#${prNumber}`);
      return true;
    } catch (error) {
      logger.error(`Failed to request review:`, error);
      throw error;
    }
  }

  /**
   * Auto-merge PR when approved
   */
  async autoMerge(octokit, repoFullName, prNumber) {
    const [owner, repo] = repoFullName.split('/');

    try {
      // Post comment before merging
      await octokit.issues.createComment({
        owner,
        repo,
        issue_number: prNumber,
        body: `✅ **Codex approved!**

All issues resolved. Auto-merging now...`
      });

      // Merge the PR
      await octokit.pulls.merge({
        owner,
        repo,
        pull_number: prNumber,
        merge_method: 'squash', // or 'merge' or 'rebase' based on repo settings
        commit_title: `Auto-merge: PR #${prNumber} approved by Codex`,
        commit_message: 'Automatically merged after Codex approval via AugmentBot'
      });

      // Stop monitoring after merge
      prState.stopMonitoring(owner, repo, prNumber);

      logger.info(`Auto-merged PR ${owner}/${repo}#${prNumber}`);
      return true;
    } catch (error) {
      logger.error(`Failed to auto-merge PR ${owner}/${repo}#${prNumber}:`, error);
      
      // Post error comment
      await octokit.issues.createComment({
        owner,
        repo,
        issue_number: prNumber,
        body: `⚠️ **Auto-merge failed**

Error: ${error.message}

Please merge manually or check PR settings.`
      });
      
      throw error;
    }
  }

  /**
   * Show help message
   */
  async showHelp(octokit, repoFullName, prNumber) {
    const [owner, repo] = repoFullName.split('/');

    await octokit.issues.createComment({
      owner,
      repo,
      issue_number: prNumber,
      body: CommandParser.getHelpText()
    });
  }

  /**
   * Report error to PR
   */
  async reportError(octokit, repoFullName, prNumber, error) {
    const [owner, repo] = repoFullName.split('/');

    try {
      await octokit.issues.createComment({
        owner,
        repo,
        issue_number: prNumber,
        body: `❌ **Error occurred**

\`\`\`
${error.message}
\`\`\`

Please check the logs or contact support.`
      });
    } catch (commentError) {
      logger.error('Failed to post error comment:', commentError);
    }
  }

  /**
   * Get PR status
   */
  async showStatus(octokit, repoFullName, prNumber) {
    const [owner, repo] = repoFullName.split('/');
    const state = prState.getState(owner, repo, prNumber);

    if (!state || !state.monitored) {
      await octokit.issues.createComment({
        owner,
        repo,
        issue_number: prNumber,
        body: `ℹ️ **Status: Not monitoring**

This PR is not under automation. Use \`@augment takeover\` to start.`
      });
      return;
    }

    const statusEmoji = {
      active: '🟢',
      waiting_review: '🟡',
      approved: '✅',
      stopped: '🔴'
    };

    await octokit.issues.createComment({
      owner,
      repo,
      issue_number: prNumber,
      body: `${statusEmoji[state.status] || 'ℹ️'} **Status: ${state.status}**

**Started:** ${new Date(state.startedAt).toLocaleString()}
**Fix attempts:** ${state.fixAttempts.length}
**Processed comments:** ${state.processedComments.size}
**Last Codex review:** ${state.lastCodexReview ? new Date(state.lastCodexReview.timestamp).toLocaleString() : 'None'}

Use \`@augment stop\` to deactivate.`
    });
  }
}

module.exports = new PRManager();

