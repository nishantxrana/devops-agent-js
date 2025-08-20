import { logger } from '../utils/logger.js';
import { taskInterpreter } from './taskInterpreter.js';
import { planner } from './planner.js';
import { executor } from './executor.js';
import { toolRegistry } from '../tools/toolRegistry.js';
import { memoryManager } from '../memory/memoryManager.js';
import { stateManager } from '../memory/stateManager.js';
import { notificationHistory } from '../memory/notificationHistory.js';

/**
 * Main agent orchestrator that coordinates task interpretation, planning, and execution
 */
class AgentOrchestrator {
  constructor() {
    this.isInitialized = false;
    this.activeAgents = new Map();
    this.taskQueue = [];
    this.processingQueue = false;
    this.maxConcurrentTasks = 3;
    this.taskHistory = [];
    this.reasoning = [];
  }

  /**
   * Initialize the agent system
   */
  async initialize() {
    if (this.isInitialized) return;

    try {
      logger.info('Initializing Agent Orchestrator...');

      // Initialize memory system
      await memoryManager.initialize();
      
      // Initialize tool registry
      await toolRegistry.initialize();

      // Start background maintenance tasks
      this.startMaintenanceTasks();

      this.isInitialized = true;
      logger.info('Agent Orchestrator initialized successfully', {
        availableTools: toolRegistry.getAllTools().length,
        maxConcurrentTasks: this.maxConcurrentTasks
      });

    } catch (error) {
      logger.error('Failed to initialize Agent Orchestrator:', error);
      throw error;
    }
  }

  /**
   * Process a webhook event
   */
  async processWebhookEvent(eventType, payload) {
    try {
      this.addReasoning(`Received webhook event: ${eventType}`);
      
      logger.info('Processing webhook event', { 
        eventType, 
        resourceId: payload?.resource?.id 
      });

      // Interpret event as task
      const task = taskInterpreter.interpretWebhookEvent(eventType, payload);
      if (!task) {
        this.addReasoning(`Failed to interpret webhook event: ${eventType}`);
        return { success: false, error: 'Failed to interpret event' };
      }

      // Add to processing queue
      await this.queueTask(task);
      
      this.addReasoning(`Webhook event queued as task: ${task.id}`);
      
      return { 
        success: true, 
        taskId: task.id,
        message: 'Webhook event queued for processing'
      };

    } catch (error) {
      logger.error('Error processing webhook event:', error, { eventType });
      this.addReasoning(`Error processing webhook: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  /**
   * Process a polling event
   */
  async processPollingEvent(pollingType, data = {}) {
    try {
      this.addReasoning(`Received polling event: ${pollingType}`);
      
      logger.debug('Processing polling event', { pollingType });

      // Interpret event as task
      const task = taskInterpreter.interpretPollingEvent(pollingType, data);
      if (!task) {
        this.addReasoning(`Failed to interpret polling event: ${pollingType}`);
        return { success: false, error: 'Failed to interpret polling event' };
      }

      // Add to processing queue with lower priority
      task.priority = 'low';
      await this.queueTask(task);
      
      this.addReasoning(`Polling event queued as task: ${task.id}`);
      
      return { 
        success: true, 
        taskId: task.id,
        message: 'Polling event queued for processing'
      };

    } catch (error) {
      logger.error('Error processing polling event:', error, { pollingType });
      this.addReasoning(`Error processing polling: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  /**
   * Create and execute a manual task
   */
  async executeManualTask(type, description, parameters = {}) {
    try {
      this.addReasoning(`Creating manual task: ${type} - ${description}`);
      
      logger.info('Creating manual task', { type, description });

      const task = taskInterpreter.createManualTask(type, description, parameters);
      if (!task) {
        return { success: false, error: 'Failed to create manual task' };
      }

      // Execute immediately if high priority, otherwise queue
      if (parameters.priority === 'critical' || parameters.immediate) {
        return await this.processTask(task);
      } else {
        await this.queueTask(task);
        return { 
          success: true, 
          taskId: task.id,
          message: 'Manual task queued for processing'
        };
      }

    } catch (error) {
      logger.error('Error executing manual task:', error, { type });
      return { success: false, error: error.message };
    }
  }

  /**
   * Queue a task for processing
   */
  async queueTask(task) {
    try {
      // Validate task
      const validation = taskInterpreter.validateTask(task);
      if (!validation.valid) {
        throw new Error(`Invalid task: ${validation.error}`);
      }

      // Analyze relationships with existing tasks
      const existingTasks = [...this.taskQueue, ...Array.from(this.activeAgents.keys())];
      const relationships = taskInterpreter.analyzeTaskRelationships(task, existingTasks);

      // Handle duplicates
      if (relationships.duplicates.length > 0) {
        logger.info('Duplicate task detected, skipping', {
          taskId: task.id,
          duplicates: relationships.duplicates
        });
        this.addReasoning(`Task ${task.id} skipped - duplicate of ${relationships.duplicates[0]}`);
        return;
      }

      // Add to queue
      this.taskQueue.push({
        ...task,
        relationships,
        queuedAt: new Date().toISOString()
      });

      // Sort queue by priority
      this.sortTaskQueue();

      // Start processing if not already running
      if (!this.processingQueue) {
        this.processTaskQueue();
      }

      this.addReasoning(`Task ${task.id} added to queue (position: ${this.taskQueue.length})`);

    } catch (error) {
      logger.error('Error queueing task:', error, { taskId: task.id });
      throw error;
    }
  }

  /**
   * Process the task queue
   */
  async processTaskQueue() {
    if (this.processingQueue) return;
    
    this.processingQueue = true;
    this.addReasoning('Started processing task queue');

    try {
      while (this.taskQueue.length > 0 && this.activeAgents.size < this.maxConcurrentTasks) {
        const task = this.taskQueue.shift();
        
        // Process task in background
        this.processTask(task).catch(error => {
          logger.error('Background task processing failed:', error, { taskId: task.id });
        });
      }
    } catch (error) {
      logger.error('Error processing task queue:', error);
    } finally {
      this.processingQueue = false;
      
      // Continue processing if there are more tasks
      if (this.taskQueue.length > 0 && this.activeAgents.size < this.maxConcurrentTasks) {
        setTimeout(() => this.processTaskQueue(), 1000);
      }
    }
  }

  /**
   * Process a single task
   */
  async processTask(task) {
    const agentId = `agent_${task.id}`;
    
    try {
      logger.info('Starting task processing', {
        taskId: task.id,
        type: task.type,
        priority: task.priority
      });

      // Mark task as active
      this.activeAgents.set(agentId, {
        taskId: task.id,
        startTime: new Date().toISOString(),
        status: 'processing',
        currentStep: 'planning'
      });

      this.addReasoning(`Agent ${agentId} started processing task ${task.id}`);

      // Update state based on task context
      await this.updateStateFromTask(task);

      // Create execution plan
      const plan = await planner.createExecutionPlan(task);
      if (!plan) {
        throw new Error('Failed to create execution plan');
      }

      this.addReasoning(`Created execution plan with ${plan.steps.length} steps`);
      this.activeAgents.get(agentId).currentStep = 'executing';

      // Execute the plan
      const execution = await executor.executePlan(plan);
      
      // Update task status
      task.status = execution.status;
      task.completedAt = execution.endTime;
      task.execution = execution;

      this.addReasoning(`Task ${task.id} completed with status: ${execution.status}`);

      // Store results in memory for future context
      await this.storeTaskResults(task, execution);

      // Move to history
      this.taskHistory.push(task);
      if (this.taskHistory.length > 100) {
        this.taskHistory = this.taskHistory.slice(-100);
      }

      logger.info('Task processing completed', {
        taskId: task.id,
        status: execution.status,
        duration: execution.metrics.duration,
        completedSteps: execution.metrics.completedSteps,
        failedSteps: execution.metrics.failedSteps
      });

      return {
        success: execution.status !== 'failed',
        taskId: task.id,
        status: execution.status,
        results: execution.results,
        reasoning: execution.reasoning
      };

    } catch (error) {
      logger.error('Task processing failed:', error, { taskId: task.id });
      
      task.status = 'failed';
      task.error = error.message;
      task.completedAt = new Date().toISOString();
      
      this.addReasoning(`Task ${task.id} failed: ${error.message}`);
      
      return {
        success: false,
        taskId: task.id,
        error: error.message
      };
      
    } finally {
      // Remove from active agents
      this.activeAgents.delete(agentId);
      
      // Continue processing queue
      if (this.taskQueue.length > 0) {
        setTimeout(() => this.processTaskQueue(), 500);
      }
    }
  }

  /**
   * Update state based on task context
   */
  async updateStateFromTask(task) {
    try {
      switch (task.type) {
        case 'WORK_ITEM_CREATED':
        case 'WORK_ITEM_UPDATED':
          if (task.context?.workItemId) {
            await stateManager.updateWorkItemState(
              task.context.workItemId,
              task.context.state,
              task.payload?.resource?.fields
            );
          }
          break;

        case 'BUILD_COMPLETED':
          if (task.context?.buildId) {
            await stateManager.updateBuildState(
              task.context.buildId,
              task.context.result,
              task.payload?.resource?.status,
              task.context.definition,
              task.payload?.resource
            );
          }
          break;

        case 'PULL_REQUEST_CREATED':
        case 'PULL_REQUEST_UPDATED':
          if (task.context?.pullRequestId) {
            await stateManager.updatePullRequestState(
              task.context.pullRequestId,
              task.context.status,
              task.payload?.resource?.reviewers,
              task.payload?.resource
            );
          }
          break;
      }
    } catch (error) {
      logger.warn('Error updating state from task:', error, { taskId: task.id });
    }
  }

  /**
   * Store task results for future context
   */
  async storeTaskResults(task, execution) {
    try {
      const results = {
        taskId: task.id,
        type: task.type,
        status: execution.status,
        results: execution.results,
        reasoning: execution.reasoning,
        metrics: execution.metrics,
        timestamp: new Date().toISOString()
      };

      await memoryManager.store(`task-result-${task.id}`, results);
      
      // Also append to general task results history
      await memoryManager.append('task-results-history', {
        taskId: task.id,
        type: task.type,
        status: execution.status,
        completedSteps: execution.metrics.completedSteps,
        duration: execution.metrics.duration
      });

    } catch (error) {
      logger.warn('Error storing task results:', error, { taskId: task.id });
    }
  }

  /**
   * Sort task queue by priority and timestamp
   */
  sortTaskQueue() {
    const priorityOrder = { 'critical': 0, 'high': 1, 'medium': 2, 'low': 3 };
    
    this.taskQueue.sort((a, b) => {
      // First sort by priority
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff !== 0) return priorityDiff;
      
      // Then by timestamp (older first)
      return new Date(a.timestamp) - new Date(b.timestamp);
    });
  }

  /**
   * Add reasoning entry
   */
  addReasoning(entry) {
    this.reasoning.push({
      timestamp: new Date().toISOString(),
      entry
    });

    // Keep only last 1000 reasoning entries
    if (this.reasoning.length > 1000) {
      this.reasoning = this.reasoning.slice(-1000);
    }
  }

  /**
   * Get agent status and statistics
   */
  getStatus() {
    const executorStats = executor.getExecutionStats();
    const toolStats = toolRegistry.getToolStats();

    return {
      initialized: this.isInitialized,
      taskQueue: {
        pending: this.taskQueue.length,
        active: this.activeAgents.size,
        completed: this.taskHistory.length
      },
      activeAgents: Array.from(this.activeAgents.values()),
      recentReasoning: this.reasoning.slice(-10),
      executor: executorStats,
      tools: toolStats,
      uptime: process.uptime(),
      memory: {
        used: process.memoryUsage().heapUsed,
        total: process.memoryUsage().heapTotal
      }
    };
  }

  /**
   * Get task history
   */
  getTaskHistory(limit = 50) {
    return this.taskHistory.slice(-limit);
  }

  /**
   * Get reasoning history
   */
  getReasoningHistory(limit = 100) {
    return this.reasoning.slice(-limit);
  }

  /**
   * Start background maintenance tasks
   */
  startMaintenanceTasks() {
    // Clean up old data every hour
    setInterval(async () => {
      try {
        logger.debug('Running maintenance tasks...');
        
        // Cleanup memory
        await memoryManager.cleanup(168); // 7 days
        await stateManager.cleanup(720);  // 30 days
        await notificationHistory.cleanup(168); // 7 days
        
        logger.debug('Maintenance tasks completed');
      } catch (error) {
        logger.error('Error running maintenance tasks:', error);
      }
    }, 60 * 60 * 1000); // 1 hour

    // Health check every 5 minutes
    setInterval(async () => {
      try {
        const status = this.getStatus();
        logger.debug('Agent health check', {
          pendingTasks: status.taskQueue.pending,
          activeAgents: status.taskQueue.active,
          memoryUsage: Math.round(status.memory.used / 1024 / 1024) + 'MB'
        });
      } catch (error) {
        logger.warn('Health check failed:', error);
      }
    }, 5 * 60 * 1000); // 5 minutes
  }

  /**
   * Shutdown the agent system gracefully
   */
  async shutdown() {
    logger.info('Shutting down Agent Orchestrator...');
    
    try {
      // Cancel all active executions
      const activeAgentIds = Array.from(this.activeAgents.keys());
      for (const agentId of activeAgentIds) {
        const agent = this.activeAgents.get(agentId);
        if (agent) {
          await executor.cancelExecution(agent.taskId, 'System shutdown');
        }
      }

      // Clear queues
      this.taskQueue = [];
      this.activeAgents.clear();
      
      this.isInitialized = false;
      logger.info('Agent Orchestrator shutdown complete');
      
    } catch (error) {
      logger.error('Error during shutdown:', error);
    }
  }
}

export const agentOrchestrator = new AgentOrchestrator();