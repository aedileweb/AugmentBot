const logger = require('./utils/logger');

class CommandParser {
  static parse(body) {
    const commands = {
      // @augment takeover - full PR management
      takeover: {
        regex: /@augment\s+takeover/i,
        description: 'Take full control of PR automation'
      },
      
      // @augment fix [reviewer] - fix specific reviewer comments
      fix: {
        regex: /@augment\s+fix(?:\s+(\w+))?/i,
        description: 'Apply fixes from reviewer comments'
      },
      
      // @augment review [reviewer] - request re-review
      review: {
        regex: /@augment\s+review(?:\s+(\w+))?/i,
        description: 'Request re-review from specific reviewer'
      },
      
      // @augment stop - stop automation
      stop: {
        regex: /@augment\s+stop/i,
        description: 'Stop all automation for this PR'
      },
      
      // @augment status - show current status
      status: {
        regex: /@augment\s+status/i,
        description: 'Show current automation status'
      },
      
      // @augment help - show help
      help: {
        regex: /@augment\s+help/i,
        description: 'Show available commands'
      }
    };

    // Try to match each command
    for (const [action, config] of Object.entries(commands)) {
      const match = body.match(config.regex);
      if (match) {
        const result = {
          action,
          target: match[1] || null, // Captured group (e.g., reviewer name)
          fullMatch: match[0],
          params: this.extractParams(body, match[0])
        };
        
        logger.debug('Parsed command:', result);
        return result;
      }
    }

    // Default to help if @augment mentioned but no valid command
    return {
      action: 'help',
      target: null,
      fullMatch: '@augment',
      params: {}
    };
  }

  static extractParams(body, commandMatch) {
    const params = {};
    
    // Extract flags like --force, --dry-run
    const flagRegex = /--(\w+)(?:=(\w+))?/g;
    let flagMatch;
    while ((flagMatch = flagRegex.exec(body)) !== null) {
      params[flagMatch[1]] = flagMatch[2] || true;
    }
    
    // Extract quoted parameters like --message="commit message"
    const quotedRegex = /--(\w+)="([^"]+)"/g;
    let quotedMatch;
    while ((quotedMatch = quotedRegex.exec(body)) !== null) {
      params[quotedMatch[1]] = quotedMatch[2];
    }
    
    return params;
  }

  static getHelpText() {
    return `## 🤖 AugmentBot Commands

**Basic Commands:**
- \`@augment takeover\` - Take full control of PR automation
- \`@augment fix [reviewer]\` - Apply fixes from reviewer comments
- \`@augment review [reviewer]\` - Request re-review from specific reviewer
- \`@augment stop\` - Stop all automation for this PR
- \`@augment status\` - Show current automation status
- \`@augment help\` - Show this help message

**Examples:**
- \`@augment takeover\` - Start full automation
- \`@augment fix codex\` - Fix Codex review comments
- \`@augment fix dependabot\` - Fix Dependabot suggestions
- \`@augment review @john-doe\` - Request re-review from John
- \`@augment stop\` - Disable automation

**Flags:**
- \`--force\` - Force operation even if risky
- \`--dry-run\` - Show what would be done without executing
- \`--message="text"\` - Custom commit message

**Need help?** Tag me with \`@augment help\` for this message.`;
  }

  static validate(command) {
    const { action, target, params } = command;
    const errors = [];

    // Validate action
    const validActions = ['takeover', 'fix', 'review', 'stop', 'status', 'help'];
    if (!validActions.includes(action)) {
      errors.push(`Invalid action: ${action}`);
    }

    // Validate target for specific actions
    if (action === 'fix' && target) {
      // Validate reviewer name format
      if (!/^[a-zA-Z0-9_-]+$/.test(target)) {
        errors.push(`Invalid reviewer name: ${target}`);
      }
    }

    // Validate parameters
    if (params.force && action !== 'fix') {
      errors.push('--force flag only valid with fix command');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

module.exports = CommandParser;