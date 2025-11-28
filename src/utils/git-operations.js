const simpleGit = require('simple-git');
const fs = require('fs-extra');
const tmp = require('tmp');
const path = require('path');
const logger = require('./logger');

class GitOperations {
  constructor(octokit, owner, repo) {
    this.octokit = octokit;
    this.owner = owner;
    this.repo = repo;
    this.workDir = null;
    this.git = null;
  }

  /**
   * Clone repository to temporary directory
   */
  async clone(branch) {
    try {
      // Create temporary directory
      this.workDir = tmp.dirSync({ unsafeCleanup: true }).name;
      logger.info(`Cloning ${this.owner}/${this.repo} to ${this.workDir}`);

      // Get installation token for git operations
      const { data: { token } } = await this.octokit.apps.createInstallationAccessToken({
        installation_id: this.installationId
      });

      // Clone with authentication
      const cloneUrl = `https://x-access-token:${token}@github.com/${this.owner}/${this.repo}.git`;
      this.git = simpleGit();
      
      await this.git.clone(cloneUrl, this.workDir, ['--branch', branch, '--single-branch']);
      this.git = simpleGit(this.workDir);

      logger.info(`Successfully cloned repository to ${this.workDir}`);
      return this.workDir;
    } catch (error) {
      logger.error('Clone failed:', error);
      await this.cleanup();
      throw error;
    }
  }

  /**
   * Apply changes to files
   */
  async applyChanges(changes) {
    if (!this.git || !this.workDir) {
      throw new Error('Repository not cloned. Call clone() first.');
    }

    try {
      for (const change of changes) {
        const filePath = path.join(this.workDir, change.path);
        
        // Ensure directory exists
        await fs.ensureDir(path.dirname(filePath));
        
        // Write file content
        await fs.writeFile(filePath, change.content, 'utf8');
        
        logger.info(`Applied changes to ${change.path}`);
      }

      return true;
    } catch (error) {
      logger.error('Failed to apply changes:', error);
      throw error;
    }
  }

  /**
   * Commit and push changes
   */
  async commitAndPush(message, branch) {
    if (!this.git) {
      throw new Error('Repository not cloned. Call clone() first.');
    }

    try {
      // Configure git user
      await this.git.addConfig('user.name', 'AugmentBot');
      await this.git.addConfig('user.email', 'bot@augmentcode.com');

      // Stage all changes
      await this.git.add('.');

      // Check if there are changes to commit
      const status = await this.git.status();
      if (status.files.length === 0) {
        logger.info('No changes to commit');
        return false;
      }

      // Commit
      await this.git.commit(message);
      logger.info(`Committed changes: ${message}`);

      // Push
      await this.git.push('origin', branch);
      logger.info(`Pushed changes to ${branch}`);

      return true;
    } catch (error) {
      logger.error('Commit and push failed:', error);
      throw error;
    }
  }

  /**
   * Get file content
   */
  async getFileContent(filePath) {
    if (!this.workDir) {
      throw new Error('Repository not cloned. Call clone() first.');
    }

    const fullPath = path.join(this.workDir, filePath);
    return await fs.readFile(fullPath, 'utf8');
  }

  /**
   * Cleanup temporary directory
   */
  async cleanup() {
    if (this.workDir) {
      try {
        await fs.remove(this.workDir);
        logger.info(`Cleaned up temporary directory: ${this.workDir}`);
        this.workDir = null;
        this.git = null;
      } catch (error) {
        logger.error('Cleanup failed:', error);
      }
    }
  }

  /**
   * Set installation ID for authentication
   */
  setInstallationId(installationId) {
    this.installationId = installationId;
  }
}

module.exports = GitOperations;

