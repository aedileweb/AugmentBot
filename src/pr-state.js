const logger = require('./utils/logger');

/**
 * In-memory state management for PR automation
 * In production, this should be replaced with a database
 */
class PRState {
  constructor() {
    // Map of PR keys to state objects
    // Key format: "owner/repo#prNumber"
    this.states = new Map();
  }

  /**
   * Get unique key for PR
   */
  getKey(owner, repo, prNumber) {
    return `${owner}/${repo}#${prNumber}`;
  }

  /**
   * Check if PR is under automation
   */
  isMonitored(owner, repo, prNumber) {
    const key = this.getKey(owner, repo, prNumber);
    const state = this.states.get(key);
    return state?.monitored === true;
  }

  /**
   * Start monitoring a PR
   */
  startMonitoring(owner, repo, prNumber, options = {}) {
    const key = this.getKey(owner, repo, prNumber);
    const state = {
      monitored: true,
      startedAt: new Date().toISOString(),
      branch: options.branch,
      baseBranch: options.baseBranch,
      processedComments: new Set(),
      fixAttempts: [],
      lastCodexReview: null,
      status: 'active' // active, waiting_review, approved, stopped
    };

    this.states.set(key, state);
    logger.info(`Started monitoring PR: ${key}`, { options });
    return state;
  }

  /**
   * Stop monitoring a PR
   */
  stopMonitoring(owner, repo, prNumber) {
    const key = this.getKey(owner, repo, prNumber);
    const state = this.states.get(key);
    
    if (state) {
      state.monitored = false;
      state.status = 'stopped';
      state.stoppedAt = new Date().toISOString();
      logger.info(`Stopped monitoring PR: ${key}`);
    }
    
    return state;
  }

  /**
   * Get PR state
   */
  getState(owner, repo, prNumber) {
    const key = this.getKey(owner, repo, prNumber);
    return this.states.get(key);
  }

  /**
   * Update PR state
   */
  updateState(owner, repo, prNumber, updates) {
    const key = this.getKey(owner, repo, prNumber);
    const state = this.states.get(key);
    
    if (!state) {
      logger.warn(`Attempted to update non-existent PR state: ${key}`);
      return null;
    }

    Object.assign(state, updates);
    this.states.set(key, state);
    logger.debug(`Updated PR state: ${key}`, updates);
    return state;
  }

  /**
   * Mark comment as processed
   */
  markCommentProcessed(owner, repo, prNumber, commentId) {
    const state = this.getState(owner, repo, prNumber);
    if (state) {
      state.processedComments.add(commentId);
      logger.debug(`Marked comment ${commentId} as processed for ${this.getKey(owner, repo, prNumber)}`);
    }
  }

  /**
   * Check if comment was already processed
   */
  isCommentProcessed(owner, repo, prNumber, commentId) {
    const state = this.getState(owner, repo, prNumber);
    return state?.processedComments.has(commentId) || false;
  }

  /**
   * Record fix attempt
   */
  recordFixAttempt(owner, repo, prNumber, fixData) {
    const state = this.getState(owner, repo, prNumber);
    if (state) {
      state.fixAttempts.push({
        timestamp: new Date().toISOString(),
        ...fixData
      });
      logger.info(`Recorded fix attempt for ${this.getKey(owner, repo, prNumber)}`, fixData);
    }
  }

  /**
   * Update last Codex review
   */
  updateLastCodexReview(owner, repo, prNumber, reviewData) {
    const state = this.getState(owner, repo, prNumber);
    if (state) {
      state.lastCodexReview = {
        timestamp: new Date().toISOString(),
        ...reviewData
      };
      logger.debug(`Updated last Codex review for ${this.getKey(owner, repo, prNumber)}`);
    }
  }

  /**
   * Get all monitored PRs
   */
  getAllMonitored() {
    const monitored = [];
    for (const [key, state] of this.states.entries()) {
      if (state.monitored) {
        monitored.push({ key, ...state });
      }
    }
    return monitored;
  }

  /**
   * Clear old states (cleanup)
   */
  cleanup(maxAgeHours = 24) {
    const now = new Date();
    const maxAge = maxAgeHours * 60 * 60 * 1000;
    
    for (const [key, state] of this.states.entries()) {
      const stateAge = now - new Date(state.startedAt);
      if (stateAge > maxAge && !state.monitored) {
        this.states.delete(key);
        logger.debug(`Cleaned up old PR state: ${key}`);
      }
    }
  }
}

// Export singleton instance
module.exports = new PRState();

