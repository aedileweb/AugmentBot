const express = require('express');
const { createAppAuth } = require('@octokit/auth-app');
const { Octokit } = require('@octokit/rest');
const crypto = require('crypto');
const fs = require('fs');
require('dotenv').config();

const CommandParser = require('./command-parser');
const PRManager = require('./pr-manager');
const FixEngine = require('./fix-engine');
const logger = require('./utils/logger');
const prState = require('./pr-state');
const codexDetector = require('./codex-detector');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.raw({ type: 'application/json' }));

// Webhook signature verification
function verifySignature(req, res, next) {
  const signature = req.get('X-Hub-Signature-256');
  const payload = JSON.stringify(req.body);
  const expectedSignature = 'sha256=' + 
    crypto.createHmac('sha256', process.env.GITHUB_WEBHOOK_SECRET)
          .update(payload, 'utf8')
          .digest('hex');

  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
    return res.status(401).send('Unauthorized');
  }
  next();
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0'
  });
});

// Main webhook handler
app.post('/webhook/github', verifySignature, async (req, res) => {
  const event = req.get('X-GitHub-Event');
  const payload = req.body;

  // Quick response to GitHub
  res.status(200).json({ received: true });

  try {
    await handleWebhookEvent(event, payload);
  } catch (error) {
    logger.error('Webhook handling error:', error);
  }
});

async function handleWebhookEvent(event, payload) {
  const { action, comment, pull_request, review, repository, installation } = payload;

  // Create authenticated Octokit instance
  const octokit = new Octokit({
    authStrategy: createAppAuth,
    auth: {
      appId: process.env.GITHUB_APP_ID,
      privateKey: process.env.GITHUB_PRIVATE_KEY,
      installationId: installation.id
    }
  });

  const context = {
    octokit,
    repo: repository.full_name,
    prNumber: pull_request?.number,
    installationId: installation.id,
    comment: comment || review,
    event,
    action
  };

  // Handle @augment commands
  const body = comment?.body || review?.body || '';
  if (body.includes('@augment')) {
    logger.info(`Processing @augment mention in ${repository.full_name}`, {
      event,
      action,
      prNumber: pull_request?.number
    });

    const command = CommandParser.parse(body);
    await routeCommand(command, context);
    return;
  }

  // Handle Codex reviews for monitored PRs
  await handleCodexReview(context);
}

async function routeCommand(command, context) {
  const { action, target, params } = command;
  const { octokit, repo, prNumber } = context;

  try {
    switch (action) {
      case 'takeover':
        await PRManager.takeover(octokit, repo, prNumber);
        break;

      case 'fix':
        await FixEngine.applyFixes(octokit, repo, prNumber, target);
        break;

      case 'review':
        await PRManager.requestReview(octokit, repo, prNumber, target);
        break;

      case 'stop':
        await PRManager.stopAutomation(octokit, repo, prNumber);
        break;

      case 'status':
        await PRManager.showStatus(octokit, repo, prNumber);
        break;

      case 'help':
        await PRManager.showHelp(octokit, repo, prNumber);
        break;

      default:
        await PRManager.showHelp(octokit, repo, prNumber);
    }
  } catch (error) {
    logger.error(`Command execution error: ${action}`, error);
    await PRManager.reportError(octokit, repo, prNumber, error);
  }
}

/**
 * Handle Codex reviews for monitored PRs
 */
async function handleCodexReview(context) {
  const { octokit, repo, prNumber, comment, event, action } = context;

  if (!prNumber) {
    return; // Not a PR event
  }

  const [owner, repoName] = repo.split('/');

  // Check if this PR is being monitored
  if (!prState.isMonitored(owner, repoName, prNumber)) {
    return; // Not monitoring this PR
  }

  logger.info(`Checking for Codex review on monitored PR ${repo}#${prNumber}`);

  // Handle review events
  if (event === 'pull_request_review' && comment) {
    const isCodex = codexDetector.isCodexComment(comment);

    if (!isCodex) {
      logger.debug(`Review from ${comment.user?.login} is not from Codex`);
      return;
    }

    logger.info(`Detected Codex review on PR ${repo}#${prNumber}`);

    // Check if already processed
    if (prState.isCommentProcessed(owner, repoName, prNumber, comment.id)) {
      logger.debug(`Codex review ${comment.id} already processed`);
      return;
    }

    // Mark as processed
    prState.markCommentProcessed(owner, repoName, prNumber, comment.id);

    // Parse the review
    const parsedReview = codexDetector.parseReview(comment);
    prState.updateLastCodexReview(owner, repoName, prNumber, parsedReview);

    // Check if it's an approval
    if (parsedReview.isApproval) {
      logger.info(`Codex approved PR ${repo}#${prNumber} - triggering auto-merge`);

      prState.updateState(owner, repoName, prNumber, {
        status: 'approved'
      });

      await PRManager.autoMerge(octokit, repo, prNumber);
      return;
    }

    // If there are issues, apply fixes
    if (parsedReview.issues.length > 0) {
      logger.info(`Found ${parsedReview.issues.length} issues in Codex review - applying fixes`);

      try {
        await FixEngine.applyFixes(octokit, repo, prNumber);
      } catch (error) {
        logger.error(`Failed to apply fixes for PR ${repo}#${prNumber}:`, error);
        await PRManager.reportError(octokit, repo, prNumber, error);
      }
    }
  }

  // Handle issue comments (PR comments)
  if (event === 'issue_comment' && comment && action === 'created') {
    const isCodex = codexDetector.isCodexComment(comment);

    if (!isCodex) {
      return;
    }

    logger.info(`Detected Codex comment on PR ${repo}#${prNumber}`);

    // Check if already processed
    if (prState.isCommentProcessed(owner, repoName, prNumber, comment.id)) {
      logger.debug(`Codex comment ${comment.id} already processed`);
      return;
    }

    // Mark as processed
    prState.markCommentProcessed(owner, repoName, prNumber, comment.id);

    // Check for approval
    if (codexDetector.isApproval(comment.body)) {
      logger.info(`Codex approved PR ${repo}#${prNumber} via comment - triggering auto-merge`);

      prState.updateState(owner, repoName, prNumber, {
        status: 'approved'
      });

      await PRManager.autoMerge(octokit, repo, prNumber);
      return;
    }

    // Parse issues from comment
    const issues = codexDetector.parseIssues(comment.body);
    if (issues.length > 0) {
      logger.info(`Found ${issues.length} issues in Codex comment - applying fixes`);

      try {
        await FixEngine.applyFixes(octokit, repo, prNumber);
      } catch (error) {
        logger.error(`Failed to apply fixes for PR ${repo}#${prNumber}:`, error);
        await PRManager.reportError(octokit, repo, prNumber, error);
      }
    }
  }
}

// Error handling middleware
app.use((error, req, res, next) => {
  logger.error('Express error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(port, () => {
  logger.info(`AugmentBot server running on port ${port}`);
  logger.info('Environment:', {
    nodeEnv: process.env.NODE_ENV,
    appId: process.env.GITHUB_APP_ID,
    hasPrivateKey: !!process.env.GITHUB_PRIVATE_KEY,
    hasWebhookSecret: !!process.env.GITHUB_WEBHOOK_SECRET,
    hasAugmentKey: !!process.env.AUGMENT_API_KEY
  });
});

module.exports = app;