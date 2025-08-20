import { logger } from '../utils/logger.js';
import { toolRegistry } from '../tools/toolRegistry.js';

/**
 * Executes planned steps using available tools
 */
class Executor {
  constructor() {
    this.activeExecutions = new Map();
    this.executionHistory = [];
    this.maxConcurrentExecutions = 5;
  }

  /**
   * Execute a complete plan
   */
  async executePlan(plan) {
    const execution = {
      planId: plan.taskId,
      status: 'running',
      startTime: new Date().toISOString(),
      endTime: null,
      steps: [],
      results: {},
      errors: [],
      reasoning: [...plan.reasoning],
      metrics: {
        totalSteps: plan.steps.length,
        completedSteps: 0,
        failedSteps: 0,
        skippedSteps: 0,
        duration: 0
      }
    };

    this.activeExecutions.set(plan.taskId, execution);

    try {
      logger.info('Starting plan execution', {
        planId: plan.taskId,
        totalSteps: plan.steps.length,
        estimatedDuration: plan.estimatedDuration
      });

      execution.reasoning.push('Plan execution started');

      // Execute steps according to dependencies
      await this.executeStepsWithDependencies(plan, execution);

      // Mark execution as completed
      execution.status = execution.errors.length > 0 ? 'completed_with_errors' : 'completed';
      execution.endTime = new Date().toISOString();
      execution.metrics.duration = new Date(execution.endTime) - new Date(execution.startTime);

      execution.reasoning.push(`Plan execution completed: ${execution.status}`);

      logger.info('Plan execution completed', {
        planId: plan.taskId,
        status: execution.status,
        completedSteps: execution.metrics.completedSteps,
        failedSteps: execution.metrics.failedSteps,
        duration: `${execution.metrics.duration}ms`
      });

    } catch (error) {
      execution.status = 'failed';
      execution.endTime = new Date().toISOString();
      execution.errors.push({
        type: 'execution_error',
        message: error.message,
        timestamp: new Date().toISOString()
      });

      logger.error('Plan execution failed:', error, { planId: plan.taskId });
    } finally {
      // Move to history and cleanup
      this.executionHistory.push({ ...execution });
      this.activeExecutions.delete(plan.taskId);

      // Keep only last 100 executions in history
      if (this.executionHistory.length > 100) {
        this.executionHistory = this.executionHistory.slice(-100);
      }
    }

    return execution;
  }

  /**
   * Execute steps respecting dependencies
   */
  async executeStepsWithDependencies(plan, execution) {
    const remainingSteps = [...plan.steps];
    const completedStepIds = new Set();
    
    while (remainingSteps.length > 0) {
      // Find steps that can be executed (dependencies met)
      const executableSteps = remainingSteps.filter(step => 
        step.dependencies.every(dep => completedStepIds.has(dep))
      );

      if (executableSteps.length === 0) {
        const blockedSteps = remainingSteps.map(s => s.id);
        execution.reasoning.push(`Deadlock detected - blocked steps: ${blockedSteps.join(', ')}`);
        logger.warn('Execution deadlock detected', { 
          planId: plan.taskId, 
          blockedSteps 
        });
        break;
      }

      // Execute steps in parallel (up to max concurrent)
      const stepsToExecute = executableSteps.slice(0, this.maxConcurrentExecutions);
      
      execution.reasoning.push(`Executing ${stepsToExecute.length} steps in parallel`);

      const stepPromises = stepsToExecute.map(step => 
        this.executeStep(step, execution)
      );

      const stepResults = await Promise.allSettled(stepPromises);

      // Process results
      stepResults.forEach((result, index) => {
        const step = stepsToExecute[index];
        
        if (result.status === 'fulfilled') {
          completedStepIds.add(step.id);
          execution.metrics.completedSteps++;
          
          if (result.value.skipped) {
            execution.metrics.skippedSteps++;
          }
        } else {
          execution.metrics.failedSteps++;
          execution.errors.push({
            type: 'step_error',
            stepId: step.id,
            tool: step.tool,
            message: result.reason?.message || 'Unknown error',
            timestamp: new Date().toISOString()
          });
        }

        // Remove from remaining steps
        const stepIndex = remainingSteps.findIndex(s => s.id === step.id);
        if (stepIndex >= 0) {
          remainingSteps.splice(stepIndex, 1);
        }
      });
    }
  }

  /**
   * Execute a single step
   */
  async executeStep(step, execution) {
    const stepExecution = {
      stepId: step.id,
      tool: step.tool,
      parameters: step.parameters,
      status: 'running',
      startTime: new Date().toISOString(),
      endTime: null,
      result: null,
      error: null,
      reasoning: [step.reason],
      skipped: false
    };

    execution.steps.push(stepExecution);

    try {
      logger.debug('Executing step', {
        planId: execution.planId,
        stepId: step.id,
        tool: step.tool
      });

      stepExecution.reasoning.push(`Starting tool execution: ${step.tool}`);

      // Check if step should be skipped (conditional execution)
      if (step.conditional) {
        const shouldSkip = await this.shouldSkipStep(step, execution);
        if (shouldSkip.skip) {
          stepExecution.status = 'skipped';
          stepExecution.skipped = true;
          stepExecution.reasoning.push(`Step skipped: ${shouldSkip.reason}`);
          stepExecution.endTime = new Date().toISOString();
          
          logger.debug('Step skipped', {
            planId: execution.planId,
            stepId: step.id,
            reason: shouldSkip.reason
          });

          return stepExecution;
        }
      }

      // Prepare parameters with context from previous steps
      const enrichedParameters = await this.enrichStepParameters(step, execution);

      // Execute the tool
      const toolResult = await toolRegistry.executeTool(step.tool, enrichedParameters);

      stepExecution.result = toolResult;
      stepExecution.status = toolResult.success ? 'completed' : 'failed';
      stepExecution.endTime = new Date().toISOString();

      if (toolResult.success) {
        stepExecution.reasoning.push('Tool execution completed successfully');
        execution.results[step.id] = toolResult.result;
        
        logger.debug('Step completed successfully', {
          planId: execution.planId,
          stepId: step.id,
          duration: toolResult.duration
        });
      } else {
        stepExecution.error = toolResult.error;
        stepExecution.reasoning.push(`Tool execution failed: ${toolResult.error}`);
        
        logger.warn('Step failed', {
          planId: execution.planId,
          stepId: step.id,
          error: toolResult.error
        });
      }

    } catch (error) {
      stepExecution.status = 'failed';
      stepExecution.error = error.message;
      stepExecution.endTime = new Date().toISOString();
      stepExecution.reasoning.push(`Step execution error: ${error.message}`);

      logger.error('Step execution error:', error, {
        planId: execution.planId,
        stepId: step.id
      });

      throw error;
    }

    return stepExecution;
  }

  /**
   * Check if a conditional step should be skipped
   */
  async shouldSkipStep(step, execution) {
    try {
      // Check for duplicate notifications
      if (step.tool.includes('Notification')) {
        // Get target ID from parameters or previous results
        const targetId = step.parameters.targetId || 
                        this.extractTargetIdFromResults(execution.results);

        if (targetId) {
          // This would integrate with notification history
          // For now, return a simple check
          return { skip: false, reason: 'No duplicates detected' };
        }
      }

      // Check for data-dependent conditions
      if (step.tool === 'sendCustomNotification' && step.parameters.title === 'Sprint Update') {
        // Check if there are significant changes in sprint data
        const sprintData = execution.results[Object.keys(execution.results).find(key => 
          execution.results[key]?.data?.workItems
        )];

        if (sprintData && sprintData.data.workItems?.length === 0) {
          return { skip: true, reason: 'No work items to report' };
        }
      }

      return { skip: false, reason: 'Condition met' };
    } catch (error) {
      logger.warn('Error checking step condition:', error);
      return { skip: false, reason: 'Condition check failed - executing anyway' };
    }
  }

  /**
   * Enrich step parameters with data from previous steps
   */
  async enrichStepParameters(step, execution) {
    const enriched = { ...step.parameters };

    try {
      // For AI tools that need data from fetch tools
      if (step.tool === 'summarizeBuildFailure') {
        const buildData = this.findResultByTool(execution.results, 'fetchRecentBuilds');
        const timelineData = this.findResultByTool(execution.results, 'fetchBuildTimeline');
        const logsData = this.findResultByTool(execution.results, 'fetchPipelineLogs');

        if (buildData) enriched.build = buildData.data;
        if (timelineData) enriched.timeline = timelineData.data;
        if (logsData) enriched.logs = logsData.data;
      }

      // For notification tools that need AI summaries
      if (step.tool.includes('Notification')) {
        const aiSummary = this.findResultByToolPattern(execution.results, /summarize/);
        if (aiSummary) {
          enriched.aiSummary = aiSummary.data?.summary || aiSummary.data;
        }
      }

      // For tools that need work item data
      if (step.tool === 'summarizeWorkItem') {
        const workItemData = this.findResultByTool(execution.results, 'fetchWorkItem');
        if (workItemData) {
          enriched.workItem = workItemData.data;
        }
      }

      // For PR summary tools
      if (step.tool === 'summarizePullRequest') {
        const prData = this.findResultByTool(execution.results, 'fetchPullRequest');
        const diffData = this.findResultByTool(execution.results, 'fetchPullRequestDiff');
        
        if (prData) enriched.pullRequest = prData.data;
        if (diffData) enriched.changes = diffData.data;
      }

    } catch (error) {
      logger.warn('Error enriching step parameters:', error, { stepId: step.id });
    }

    return enriched;
  }

  /**
   * Find result by tool name
   */
  findResultByTool(results, toolName) {
    for (const [stepId, result] of Object.entries(results)) {
      if (stepId.includes(toolName.toLowerCase()) || 
          (result.tool && result.tool === toolName)) {
        return result;
      }
    }
    return null;
  }

  /**
   * Find result by tool name pattern
   */
  findResultByToolPattern(results, pattern) {
    for (const [stepId, result] of Object.entries(results)) {
      if (pattern.test(stepId) || (result.tool && pattern.test(result.tool))) {
        return result;
      }
    }
    return null;
  }

  /**
   * Extract target ID from execution results
   */
  extractTargetIdFromResults(results) {
    // Look for common ID patterns in results
    for (const result of Object.values(results)) {
      if (result.data) {
        if (result.data.id) return result.data.id.toString();
        if (result.data.workItemId) return result.data.workItemId.toString();
        if (result.data.buildId) return result.data.buildId.toString();
        if (result.data.pullRequestId) return result.data.pullRequestId.toString();
      }
    }
    return null;
  }

  /**
   * Get execution status
   */
  getExecutionStatus(planId) {
    const active = this.activeExecutions.get(planId);
    if (active) return active;

    const historical = this.executionHistory.find(e => e.planId === planId);
    return historical || null;
  }

  /**
   * Get all active executions
   */
  getActiveExecutions() {
    return Array.from(this.activeExecutions.values());
  }

  /**
   * Get execution history
   */
  getExecutionHistory(limit = 50) {
    return this.executionHistory.slice(-limit);
  }

  /**
   * Get execution statistics
   */
  getExecutionStats() {
    const all = [...this.activeExecutions.values(), ...this.executionHistory];
    
    const stats = {
      total: all.length,
      active: this.activeExecutions.size,
      completed: all.filter(e => e.status === 'completed').length,
      failed: all.filter(e => e.status === 'failed').length,
      completedWithErrors: all.filter(e => e.status === 'completed_with_errors').length,
      averageDuration: 0,
      toolUsage: {},
      successRate: 0
    };

    // Calculate average duration for completed executions
    const completedExecutions = all.filter(e => e.endTime);
    if (completedExecutions.length > 0) {
      const totalDuration = completedExecutions.reduce((sum, exec) => {
        return sum + (new Date(exec.endTime) - new Date(exec.startTime));
      }, 0);
      stats.averageDuration = Math.round(totalDuration / completedExecutions.length);
    }

    // Calculate success rate
    const finishedExecutions = all.filter(e => 
      e.status === 'completed' || 
      e.status === 'failed' || 
      e.status === 'completed_with_errors'
    );
    
    if (finishedExecutions.length > 0) {
      const successful = finishedExecutions.filter(e => 
        e.status === 'completed' || e.status === 'completed_with_errors'
      ).length;
      stats.successRate = Math.round((successful / finishedExecutions.length) * 100);
    }

    // Calculate tool usage statistics
    all.forEach(execution => {
      execution.steps.forEach(step => {
        stats.toolUsage[step.tool] = (stats.toolUsage[step.tool] || 0) + 1;
      });
    });

    return stats;
  }

  /**
   * Cancel an active execution
   */
  async cancelExecution(planId, reason = 'Manual cancellation') {
    const execution = this.activeExecutions.get(planId);
    if (!execution) {
      throw new Error(`No active execution found for plan: ${planId}`);
    }

    execution.status = 'cancelled';
    execution.endTime = new Date().toISOString();
    execution.reasoning.push(`Execution cancelled: ${reason}`);

    // Mark any running steps as cancelled
    execution.steps.forEach(step => {
      if (step.status === 'running') {
        step.status = 'cancelled';
        step.endTime = new Date().toISOString();
        step.reasoning.push(`Step cancelled: ${reason}`);
      }
    });

    logger.info('Execution cancelled', { planId, reason });

    // Move to history
    this.executionHistory.push({ ...execution });
    this.activeExecutions.delete(planId);

    return execution;
  }
}

export const executor = new Executor();