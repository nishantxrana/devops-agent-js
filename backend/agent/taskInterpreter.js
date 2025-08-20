import { logger } from '../utils/logger.js';

/**
 * Interprets incoming events and webhooks as structured tasks for the agent
 */
class TaskInterpreter {
  constructor() {
    this.taskTypes = {
      'work-item-created': 'WORK_ITEM_CREATED',
      'work-item-updated': 'WORK_ITEM_UPDATED',
      'build-completed': 'BUILD_COMPLETED',
      'pull-request-created': 'PULL_REQUEST_CREATED',
      'pull-request-updated': 'PULL_REQUEST_UPDATED',
      'polling-work-items': 'POLLING_WORK_ITEMS',
      'polling-builds': 'POLLING_BUILDS',
      'polling-pull-requests': 'POLLING_PULL_REQUESTS',
      'overdue-check': 'OVERDUE_CHECK',
      'escalation-check': 'ESCALATION_CHECK'
    };
  }

  /**
   * Interpret a webhook event as a task
   */
  interpretWebhookEvent(eventType, payload) {
    try {
      const taskType = this.taskTypes[eventType];
      if (!taskType) {
        logger.warn('Unknown webhook event type', { eventType });
        return null;
      }

      const task = {
        id: this.generateTaskId(),
        type: taskType,
        source: 'webhook',
        eventType,
        payload,
        priority: this.determinePriority(taskType, payload),
        context: this.extractContext(taskType, payload),
        timestamp: new Date().toISOString(),
        status: 'pending'
      };

      logger.info('Webhook event interpreted as task', {
        taskId: task.id,
        type: task.type,
        priority: task.priority,
        eventType
      });

      return task;
    } catch (error) {
      logger.error('Error interpreting webhook event:', error, { eventType });
      return null;
    }
  }

  /**
   * Interpret a polling event as a task
   */
  interpretPollingEvent(pollingType, data = {}) {
    try {
      const eventType = `polling-${pollingType}`;
      const taskType = this.taskTypes[eventType];
      
      if (!taskType) {
        logger.warn('Unknown polling type', { pollingType });
        return null;
      }

      const task = {
        id: this.generateTaskId(),
        type: taskType,
        source: 'polling',
        pollingType,
        data,
        priority: this.determinePriority(taskType, data),
        context: this.extractContext(taskType, data),
        timestamp: new Date().toISOString(),
        status: 'pending'
      };

      logger.debug('Polling event interpreted as task', {
        taskId: task.id,
        type: task.type,
        priority: task.priority,
        pollingType
      });

      return task;
    } catch (error) {
      logger.error('Error interpreting polling event:', error, { pollingType });
      return null;
    }
  }

  /**
   * Create a manual task for agent execution
   */
  createManualTask(type, description, parameters = {}) {
    try {
      const task = {
        id: this.generateTaskId(),
        type: type.toUpperCase(),
        source: 'manual',
        description,
        parameters,
        priority: parameters.priority || 'medium',
        context: { manual: true, description },
        timestamp: new Date().toISOString(),
        status: 'pending'
      };

      logger.info('Manual task created', {
        taskId: task.id,
        type: task.type,
        description
      });

      return task;
    } catch (error) {
      logger.error('Error creating manual task:', error);
      return null;
    }
  }

  /**
   * Determine task priority based on type and content
   */
  determinePriority(taskType, data) {
    // High priority conditions
    if (taskType === 'BUILD_COMPLETED' && data?.resource?.result === 'failed') {
      return 'high';
    }
    
    if (taskType === 'WORK_ITEM_CREATED' && data?.resource?.fields?.['Microsoft.VSTS.Common.Priority'] === 1) {
      return 'high';
    }

    if (taskType === 'ESCALATION_CHECK') {
      return 'critical';
    }

    // Medium priority conditions
    if (taskType === 'WORK_ITEM_UPDATED') {
      const state = data?.resource?.fields?.['System.State'];
      if (state === 'Active' || state === 'Resolved') {
        return 'medium';
      }
    }

    if (taskType === 'PULL_REQUEST_CREATED') {
      return 'medium';
    }

    // Low priority (default for polling and routine tasks)
    if (taskType.startsWith('POLLING_')) {
      return 'low';
    }

    return 'medium';
  }

  /**
   * Extract relevant context from the task data
   */
  extractContext(taskType, data) {
    const context = { taskType };

    try {
      switch (taskType) {
        case 'WORK_ITEM_CREATED':
        case 'WORK_ITEM_UPDATED':
          context.workItemId = data?.resource?.workItemId || data?.resource?.id;
          context.workItemType = data?.resource?.fields?.['System.WorkItemType'];
          context.title = data?.resource?.fields?.['System.Title'];
          context.state = data?.resource?.fields?.['System.State'];
          context.assignedTo = data?.resource?.fields?.['System.AssignedTo']?.displayName;
          break;

        case 'BUILD_COMPLETED':
          context.buildId = data?.resource?.id;
          context.buildNumber = data?.resource?.buildNumber;
          context.result = data?.resource?.result;
          context.definition = data?.resource?.definition?.name;
          context.requestedBy = data?.resource?.requestedBy?.displayName;
          break;

        case 'PULL_REQUEST_CREATED':
        case 'PULL_REQUEST_UPDATED':
          context.pullRequestId = data?.resource?.pullRequestId;
          context.title = data?.resource?.title;
          context.status = data?.resource?.status;
          context.createdBy = data?.resource?.createdBy?.displayName;
          context.sourceBranch = data?.resource?.sourceRefName;
          context.targetBranch = data?.resource?.targetRefName;
          break;

        case 'POLLING_WORK_ITEMS':
          context.sprintScope = true;
          break;

        case 'POLLING_BUILDS':
          context.recentBuildsScope = true;
          break;

        case 'POLLING_PULL_REQUESTS':
          context.activePRsScope = true;
          break;

        default:
          // Generic context extraction
          if (data?.resource) {
            context.resourceId = data.resource.id;
            context.resourceType = data.resource.resourceType;
          }
      }
    } catch (error) {
      logger.warn('Error extracting context:', error, { taskType });
    }

    return context;
  }

  /**
   * Analyze task relationships and dependencies
   */
  analyzeTaskRelationships(task, existingTasks = []) {
    const relationships = {
      duplicates: [],
      related: [],
      dependencies: [],
      conflicts: []
    };

    try {
      for (const existingTask of existingTasks) {
        // Check for duplicates
        if (this.isDuplicateTask(task, existingTask)) {
          relationships.duplicates.push(existingTask.id);
        }
        
        // Check for related tasks (same resource)
        else if (this.isRelatedTask(task, existingTask)) {
          relationships.related.push(existingTask.id);
        }

        // Check for dependencies
        if (this.hasDependency(task, existingTask)) {
          relationships.dependencies.push(existingTask.id);
        }

        // Check for conflicts
        if (this.hasConflict(task, existingTask)) {
          relationships.conflicts.push(existingTask.id);
        }
      }

      if (relationships.duplicates.length > 0) {
        logger.info('Duplicate tasks detected', {
          taskId: task.id,
          duplicates: relationships.duplicates
        });
      }

    } catch (error) {
      logger.error('Error analyzing task relationships:', error);
    }

    return relationships;
  }

  /**
   * Check if two tasks are duplicates
   */
  isDuplicateTask(task1, task2) {
    if (task1.type !== task2.type) return false;
    
    const timeDiff = Math.abs(new Date(task1.timestamp) - new Date(task2.timestamp));
    const withinTimeWindow = timeDiff < 60000; // 1 minute

    // Check for duplicate work item tasks
    if (task1.type.includes('WORK_ITEM') && task2.type.includes('WORK_ITEM')) {
      return task1.context?.workItemId === task2.context?.workItemId && withinTimeWindow;
    }

    // Check for duplicate build tasks
    if (task1.type.includes('BUILD') && task2.type.includes('BUILD')) {
      return task1.context?.buildId === task2.context?.buildId && withinTimeWindow;
    }

    // Check for duplicate PR tasks
    if (task1.type.includes('PULL_REQUEST') && task2.type.includes('PULL_REQUEST')) {
      return task1.context?.pullRequestId === task2.context?.pullRequestId && withinTimeWindow;
    }

    return false;
  }

  /**
   * Check if two tasks are related (same resource, different events)
   */
  isRelatedTask(task1, task2) {
    if (task1.type.includes('WORK_ITEM') && task2.type.includes('WORK_ITEM')) {
      return task1.context?.workItemId === task2.context?.workItemId;
    }

    if (task1.type.includes('PULL_REQUEST') && task2.type.includes('PULL_REQUEST')) {
      return task1.context?.pullRequestId === task2.context?.pullRequestId;
    }

    return false;
  }

  /**
   * Check if one task depends on another
   */
  hasDependency(task, existingTask) {
    // Build completion might depend on work item updates
    if (task.type === 'BUILD_COMPLETED' && existingTask.type === 'WORK_ITEM_UPDATED') {
      // Simple heuristic - could be enhanced with actual branch/commit relationships
      return true;
    }

    return false;
  }

  /**
   * Check if two tasks conflict with each other
   */
  hasConflict(task1, task2) {
    // Polling tasks might conflict with webhook tasks for the same resource
    if (task1.source === 'polling' && task2.source === 'webhook') {
      const timeDiff = Math.abs(new Date(task1.timestamp) - new Date(task2.timestamp));
      return timeDiff < 300000; // 5 minutes
    }

    return false;
  }

  /**
   * Generate a unique task ID
   */
  generateTaskId() {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    return `task_${timestamp}_${random}`;
  }

  /**
   * Validate task structure
   */
  validateTask(task) {
    const required = ['id', 'type', 'source', 'priority', 'timestamp', 'status'];
    
    for (const field of required) {
      if (!task[field]) {
        return { valid: false, error: `Missing required field: ${field}` };
      }
    }

    if (!Object.values(this.taskTypes).includes(task.type)) {
      return { valid: false, error: `Invalid task type: ${task.type}` };
    }

    return { valid: true };
  }
}

export const taskInterpreter = new TaskInterpreter();