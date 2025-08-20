import { notificationService } from '../notifications/notificationService.js';
import { markdownFormatter } from '../utils/markdownFormatter.js';
import { notificationHistory } from '../memory/notificationHistory.js';
import { logger } from '../utils/logger.js';

/**
 * Notification tools for sending alerts and messages
 */

const sendNotification = {
  name: 'sendNotification',
  description: 'Send a notification to configured channels (Teams/Slack)',
  category: 'notification',
  parameters: {
    type: 'object',
    properties: {
      message: {
        type: 'string',
        description: 'The message content to send'
      },
      type: {
        type: 'string',
        description: 'Notification type for categorization'
      },
      targetId: {
        type: 'string',
        description: 'Optional target identifier (e.g., work item ID, build ID)'
      },
      skipDuplicateCheck: {
        type: 'boolean',
        description: 'Skip duplicate notification checking',
        default: false
      }
    },
    required: ['message', 'type']
  },
  examples: [
    {
      description: 'Send a work item notification',
      parameters: {
        message: 'New work item created: Fix login bug',
        type: 'work-item-created',
        targetId: '1234'
      }
    }
  ],
  async execute({ message, type, targetId = null, skipDuplicateCheck = false }) {
    try {
      // Check for duplicates unless explicitly skipped
      if (!skipDuplicateCheck) {
        const isDuplicate = await notificationHistory.isDuplicate(type, message, targetId);
        if (isDuplicate) {
          logger.info('Duplicate notification skipped', { type, targetId });
          return {
            success: true,
            data: { skipped: true, reason: 'duplicate' },
            message: 'Notification skipped to avoid duplicate'
          };
        }
      }

      // Send the notification
      await notificationService.sendNotification(message, type);

      // Record in history
      await notificationHistory.recordNotification(type, message, targetId);

      return {
        success: true,
        data: { sent: true, type, targetId },
        message: 'Notification sent successfully'
      };
    } catch (error) {
      logger.error('Failed to send notification:', error, { type, targetId });
      throw new Error(`Failed to send notification: ${error.message}`);
    }
  }
};

const sendWorkItemNotification = {
  name: 'sendWorkItemNotification',
  description: 'Send a formatted work item notification',
  category: 'notification',
  parameters: {
    type: 'object',
    properties: {
      workItem: {
        type: 'object',
        description: 'Work item data'
      },
      eventType: {
        type: 'string',
        description: 'Type of work item event (created, updated, etc.)'
      },
      aiSummary: {
        type: 'string',
        description: 'Optional AI-generated summary'
      }
    },
    required: ['workItem', 'eventType']
  },
  examples: [
    {
      description: 'Send work item created notification',
      parameters: {
        workItem: { id: 1234, fields: { 'System.Title': 'Fix bug' } },
        eventType: 'created'
      }
    }
  ],
  async execute({ workItem, eventType, aiSummary = null }) {
    try {
      let message;
      const workItemId = workItem.id?.toString();

      if (eventType === 'created') {
        message = markdownFormatter.formatWorkItemCreated(workItem, aiSummary);
      } else if (eventType === 'updated') {
        message = markdownFormatter.formatWorkItemUpdated(workItem);
      } else {
        message = markdownFormatter.formatWorkItem(workItem, eventType);
      }

      return await this.parent.executeTool('sendNotification', {
        message,
        type: `work-item-${eventType}`,
        targetId: workItemId
      });
    } catch (error) {
      logger.error('Failed to send work item notification:', error, { workItemId: workItem?.id });
      throw new Error(`Failed to send work item notification: ${error.message}`);
    }
  }
};

const sendBuildNotification = {
  name: 'sendBuildNotification',
  description: 'Send a formatted build/pipeline notification',
  category: 'notification',
  parameters: {
    type: 'object',
    properties: {
      build: {
        type: 'object',
        description: 'Build data'
      },
      aiSummary: {
        type: 'string',
        description: 'Optional AI-generated failure analysis'
      }
    },
    required: ['build']
  },
  examples: [
    {
      description: 'Send build failure notification',
      parameters: {
        build: { id: 5678, result: 'failed', buildNumber: 'Build_123' }
      }
    }
  ],
  async execute({ build, aiSummary = null }) {
    try {
      let message;
      const buildId = build.id?.toString();
      const result = build.result || 'unknown';

      if (result === 'failed') {
        message = markdownFormatter.formatBuildFailed(build, aiSummary);
      } else if (result === 'succeeded') {
        message = markdownFormatter.formatBuildCompleted(build);
      } else {
        message = markdownFormatter.formatBuild(build, result);
      }

      const notificationType = result === 'failed' ? 'build-failed' : 'build-succeeded';

      return await this.parent.executeTool('sendNotification', {
        message,
        type: notificationType,
        targetId: buildId
      });
    } catch (error) {
      logger.error('Failed to send build notification:', error, { buildId: build?.id });
      throw new Error(`Failed to send build notification: ${error.message}`);
    }
  }
};

const sendPullRequestNotification = {
  name: 'sendPullRequestNotification',
  description: 'Send a formatted pull request notification',
  category: 'notification',
  parameters: {
    type: 'object',
    properties: {
      pullRequest: {
        type: 'object',
        description: 'Pull request data'
      },
      eventType: {
        type: 'string',
        description: 'Type of PR event (created, updated, reviewer-assigned, etc.)'
      },
      aiSummary: {
        type: 'string',
        description: 'Optional AI-generated summary'
      },
      reviewers: {
        type: 'array',
        description: 'Array of new reviewers (for reviewer assignment events)'
      }
    },
    required: ['pullRequest', 'eventType']
  },
  examples: [
    {
      description: 'Send PR created notification',
      parameters: {
        pullRequest: { pullRequestId: 123, title: 'Add feature' },
        eventType: 'created'
      }
    }
  ],
  async execute({ pullRequest, eventType, aiSummary = null, reviewers = [] }) {
    try {
      let message;
      const prId = pullRequest.pullRequestId?.toString();

      if (eventType === 'created') {
        message = markdownFormatter.formatPullRequestCreated(pullRequest, aiSummary);
      } else if (eventType === 'updated') {
        message = markdownFormatter.formatPullRequestUpdated(pullRequest);
      } else if (eventType === 'reviewer-assigned') {
        message = markdownFormatter.formatPullRequestReviewerAssigned(pullRequest, reviewers);
      } else {
        message = markdownFormatter.formatPullRequest(pullRequest, eventType);
      }

      return await this.parent.executeTool('sendNotification', {
        message,
        type: `pull-request-${eventType}`,
        targetId: prId
      });
    } catch (error) {
      logger.error('Failed to send PR notification:', error, { prId: pullRequest?.pullRequestId });
      throw new Error(`Failed to send pull request notification: ${error.message}`);
    }
  }
};

const sendCustomNotification = {
  name: 'sendCustomNotification',
  description: 'Send a custom formatted notification with markdown support',
  category: 'notification',
  parameters: {
    type: 'object',
    properties: {
      title: {
        type: 'string',
        description: 'Notification title'
      },
      message: {
        type: 'string',
        description: 'Notification message body'
      },
      type: {
        type: 'string',
        description: 'Notification type for categorization'
      },
      color: {
        type: 'string',
        description: 'Notification color (good, warning, danger, info)'
      },
      targetId: {
        type: 'string',
        description: 'Optional target identifier'
      }
    },
    required: ['title', 'message', 'type']
  },
  examples: [
    {
      description: 'Send a custom alert',
      parameters: {
        title: 'System Alert',
        message: 'Multiple build failures detected',
        type: 'system-alert',
        color: 'danger'
      }
    }
  ],
  async execute({ title, message, type, color = 'info', targetId = null }) {
    try {
      const formattedMessage = markdownFormatter.formatCustomMessage(title, message, color);

      return await this.parent.executeTool('sendNotification', {
        message: formattedMessage,
        type,
        targetId
      });
    } catch (error) {
      logger.error('Failed to send custom notification:', error);
      throw new Error(`Failed to send custom notification: ${error.message}`);
    }
  }
};

const sendEscalationNotification = {
  name: 'sendEscalationNotification',
  description: 'Send an escalation notification for repeated failures',
  category: 'notification',
  parameters: {
    type: 'object',
    properties: {
      targetId: {
        type: 'string',
        description: 'ID of the target with repeated failures'
      },
      failureType: {
        type: 'string',
        description: 'Type of failure (build, deployment, etc.)'
      },
      failureCount: {
        type: 'number',
        description: 'Number of consecutive failures'
      },
      recentFailures: {
        type: 'array',
        description: 'Array of recent failure details'
      }
    },
    required: ['targetId', 'failureType', 'failureCount']
  },
  examples: [
    {
      description: 'Send escalation for repeated build failures',
      parameters: {
        targetId: 'pipeline-123',
        failureType: 'build',
        failureCount: 5
      }
    }
  ],
  async execute({ targetId, failureType, failureCount, recentFailures = [] }) {
    try {
      const title = `🚨 ESCALATION: Repeated ${failureType} Failures`;
      const message = `
**Target:** ${targetId}
**Failure Count:** ${failureCount} consecutive failures
**Type:** ${failureType}

This requires immediate attention from the team.

${recentFailures.length > 0 ? `**Recent Failures:**\n${recentFailures.map(f => `• ${f.timestamp}: ${f.type}`).join('\n')}` : ''}
      `.trim();

      return await this.parent.executeTool('sendCustomNotification', {
        title,
        message,
        type: 'escalation',
        color: 'danger',
        targetId
      });
    } catch (error) {
      logger.error('Failed to send escalation notification:', error);
      throw new Error(`Failed to send escalation notification: ${error.message}`);
    }
  }
};

const getNotificationHistory = {
  name: 'getNotificationHistory',
  description: 'Get notification history and statistics',
  category: 'notification',
  parameters: {
    type: 'object',
    properties: {
      hoursBack: {
        type: 'number',
        description: 'Hours of history to retrieve',
        default: 24
      },
      targetId: {
        type: 'string',
        description: 'Optional target ID to filter by'
      }
    }
  },
  examples: [
    {
      description: 'Get last 24 hours of notification history',
      parameters: {}
    }
  ],
  async execute({ hoursBack = 24, targetId = null }) {
    try {
      let data;
      
      if (targetId) {
        data = await notificationHistory.getRecentNotificationsForTarget(targetId, hoursBack);
      } else {
        data = await notificationHistory.getNotificationStats(hoursBack);
      }

      return {
        success: true,
        data,
        message: `Successfully retrieved notification history for ${hoursBack} hours`
      };
    } catch (error) {
      logger.error('Failed to get notification history:', error);
      throw new Error(`Failed to get notification history: ${error.message}`);
    }
  }
};

// Set parent reference for tools that need to call other tools
[sendWorkItemNotification, sendBuildNotification, sendPullRequestNotification, sendCustomNotification, sendEscalationNotification].forEach(tool => {
  tool.parent = { executeTool: async (name, params) => {
    // This will be replaced with actual tool registry reference when registered
    const { toolRegistry } = await import('./toolRegistry.js');
    return await toolRegistry.executeTool(name, params);
  }};
});

export const notificationTools = [
  sendNotification,
  sendWorkItemNotification,
  sendBuildNotification,
  sendPullRequestNotification,
  sendCustomNotification,
  sendEscalationNotification,
  getNotificationHistory
];