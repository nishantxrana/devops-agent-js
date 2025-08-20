import { logger } from '../utils/logger.js';
import { stateManager } from '../memory/stateManager.js';
import { notificationHistory } from '../memory/notificationHistory.js';

/**
 * Plans execution steps for tasks using available tools
 */
class Planner {
  constructor() {
    this.planTemplates = {
      'WORK_ITEM_CREATED': [
        { tool: 'fetchWorkItem', reason: 'Get complete work item details' },
        { tool: 'summarizeWorkItem', reason: 'Generate AI summary for new work item' },
        { tool: 'sendWorkItemNotification', reason: 'Notify team of new work item' }
      ],
      'WORK_ITEM_UPDATED': [
        { tool: 'fetchWorkItem', reason: 'Get current work item state' },
        { tool: 'sendWorkItemNotification', reason: 'Notify team of work item changes' }
      ],
      'BUILD_COMPLETED': [
        { tool: 'fetchRecentBuilds', reason: 'Get build details and context' },
        // Conditional steps added during planning based on build result
      ],
      'PULL_REQUEST_CREATED': [
        { tool: 'fetchPullRequest', reason: 'Get complete pull request details' },
        { tool: 'fetchPullRequestDiff', reason: 'Get changes for AI analysis' },
        { tool: 'summarizePullRequest', reason: 'Generate AI summary of changes' },
        { tool: 'sendPullRequestNotification', reason: 'Notify team of new pull request' }
      ],
      'PULL_REQUEST_UPDATED': [
        { tool: 'fetchPullRequest', reason: 'Get current pull request state' },
        { tool: 'sendPullRequestNotification', reason: 'Notify team of pull request changes' }
      ],
      'POLLING_WORK_ITEMS': [
        { tool: 'fetchCurrentSprintWorkItems', reason: 'Get current sprint work items' },
        { tool: 'summarizeSprintWorkItems', reason: 'Generate sprint insights' },
        // Conditional notification based on significant changes
      ],
      'POLLING_BUILDS': [
        { tool: 'fetchRecentBuilds', reason: 'Check for new build completions' },
        // Process each new build individually
      ],
      'POLLING_PULL_REQUESTS': [
        { tool: 'fetchActivePullRequests', reason: 'Check for stale pull requests' },
        // Conditional notifications for stale PRs
      ]
    };
  }

  /**
   * Create execution plan for a task
   */
  async createExecutionPlan(task) {
    try {
      logger.info('Creating execution plan', { 
        taskId: task.id, 
        type: task.type, 
        priority: task.priority 
      });

      const plan = {
        taskId: task.id,
        steps: [],
        reasoning: [],
        estimatedDuration: 0,
        dependencies: [],
        riskFactors: [],
        createdAt: new Date().toISOString()
      };

      // Get base template for task type
      const baseSteps = this.planTemplates[task.type] || [];
      
      // Add reasoning for plan creation
      plan.reasoning.push(`Creating plan for ${task.type} task`);
      plan.reasoning.push(`Base template has ${baseSteps.length} steps`);

      // Copy base steps
      plan.steps = baseSteps.map((step, index) => ({
        id: `${task.id}_step_${index + 1}`,
        tool: step.tool,
        reason: step.reason,
        parameters: {},
        status: 'pending',
        estimatedDuration: this.estimateStepDuration(step.tool),
        dependencies: index > 0 ? [`${task.id}_step_${index}`] : []
      }));

      // Customize plan based on task context and memory
      await this.customizePlan(plan, task);

      // Estimate total duration
      plan.estimatedDuration = plan.steps.reduce((total, step) => 
        total + step.estimatedDuration, 0);

      // Assess risks
      plan.riskFactors = await this.assessRisks(task, plan);

      logger.info('Execution plan created', {
        taskId: task.id,
        stepsCount: plan.steps.length,
        estimatedDuration: `${plan.estimatedDuration}ms`,
        riskFactors: plan.riskFactors.length
      });

      return plan;
    } catch (error) {
      logger.error('Error creating execution plan:', error, { taskId: task.id });
      return null;
    }
  }

  /**
   * Customize plan based on task context and memory
   */
  async customizePlan(plan, task) {
    try {
      // Add parameters to steps based on task context
      for (const step of plan.steps) {
        step.parameters = await this.buildStepParameters(step, task);
      }

      // Add conditional steps based on task type and context
      if (task.type === 'BUILD_COMPLETED') {
        await this.customizeBuildPlan(plan, task);
      } else if (task.type === 'WORK_ITEM_UPDATED') {
        await this.customizeWorkItemUpdatePlan(plan, task);
      } else if (task.type.startsWith('POLLING_')) {
        await this.customizePollingPlan(plan, task);
      }

      // Check for duplicate prevention
      await this.addDuplicatePreventionSteps(plan, task);

      // Add escalation steps if needed
      await this.addEscalationSteps(plan, task);

      plan.reasoning.push(`Plan customized with ${plan.steps.length} total steps`);
    } catch (error) {
      logger.error('Error customizing plan:', error);
    }
  }

  /**
   * Customize plan for build completion tasks
   */
  async customizeBuildPlan(plan, task) {
    const buildResult = task.context?.result;
    const buildId = task.context?.buildId;

    if (buildResult === 'failed') {
      // Add failure analysis steps
      const analysisSteps = [
        {
          id: `${task.id}_step_timeline`,
          tool: 'fetchBuildTimeline',
          reason: 'Get build timeline for failure analysis',
          parameters: { buildId },
          status: 'pending',
          estimatedDuration: 2000,
          dependencies: [plan.steps[0]?.id]
        },
        {
          id: `${task.id}_step_logs`,
          tool: 'fetchPipelineLogs',
          reason: 'Get build logs for AI analysis',
          parameters: { buildId },
          status: 'pending',
          estimatedDuration: 3000,
          dependencies: [plan.steps[0]?.id]
        },
        {
          id: `${task.id}_step_failure_analysis`,
          tool: 'summarizeBuildFailure',
          reason: 'Generate AI analysis of build failure',
          parameters: { build: task.payload?.resource },
          status: 'pending',
          estimatedDuration: 5000,
          dependencies: [`${task.id}_step_timeline`, `${task.id}_step_logs`]
        }
      ];

      // Insert analysis steps before notification
      plan.steps.splice(1, 0, ...analysisSteps);

      // Update notification parameters to include AI summary
      const notificationStep = plan.steps.find(s => s.tool === 'sendBuildNotification');
      if (notificationStep) {
        notificationStep.dependencies.push(`${task.id}_step_failure_analysis`);
      }

      plan.reasoning.push('Added failure analysis steps for failed build');

      // Check for escalation based on consecutive failures
      if (task.context?.definition) {
        const failurePattern = await stateManager.analyzeFailurePattern(
          task.context.definition, 
          buildResult
        );
        
        if (failurePattern.shouldEscalate) {
          plan.steps.push({
            id: `${task.id}_step_escalation`,
            tool: 'sendEscalationNotification',
            reason: 'Escalate due to repeated failures',
            parameters: {
              targetId: task.context.definition,
              failureType: 'build',
              failureCount: failurePattern.consecutiveFailures
            },
            status: 'pending',
            estimatedDuration: 1000,
            dependencies: [notificationStep?.id]
          });
          
          plan.reasoning.push(`Added escalation step: ${failurePattern.consecutiveFailures} consecutive failures`);
        }
      }
    } else {
      // For successful builds, just add notification
      plan.steps.push({
        id: `${task.id}_step_notification`,
        tool: 'sendBuildNotification',
        reason: 'Notify team of successful build',
        parameters: { build: task.payload?.resource },
        status: 'pending',
        estimatedDuration: 1000,
        dependencies: [plan.steps[0]?.id]
      });
    }
  }

  /**
   * Customize plan for work item update tasks
   */
  async customizeWorkItemUpdatePlan(plan, task) {
    const workItemId = task.context?.workItemId;
    
    if (workItemId) {
      // Check if this is a significant state change
      const previousState = await stateManager.getWorkItemState(workItemId);
      const currentState = task.context?.state;

      if (previousState && previousState.state !== currentState) {
        plan.reasoning.push(`Work item state changed: ${previousState.state} → ${currentState}`);
        
        // Add AI summary for significant changes
        if (this.isSignificantStateChange(previousState.state, currentState)) {
          plan.steps.splice(1, 0, {
            id: `${task.id}_step_summary`,
            tool: 'summarizeWorkItem',
            reason: 'Generate summary for significant state change',
            parameters: { workItem: task.payload?.resource },
            status: 'pending',
            estimatedDuration: 3000,
            dependencies: [plan.steps[0]?.id]
          });
          
          plan.reasoning.push('Added AI summary for significant state change');
        }
      }
    }
  }

  /**
   * Customize plan for polling tasks
   */
  async customizePollingPlan(plan, task) {
    if (task.type === 'POLLING_WORK_ITEMS') {
      // Only send notifications if there are significant changes
      plan.steps.push({
        id: `${task.id}_step_conditional_notification`,
        tool: 'sendCustomNotification',
        reason: 'Send sprint summary if significant changes detected',
        parameters: {
          title: 'Sprint Update',
          type: 'sprint-summary'
        },
        status: 'pending',
        estimatedDuration: 1000,
        dependencies: [plan.steps[plan.steps.length - 1]?.id],
        conditional: true
      });
      
      plan.reasoning.push('Added conditional notification for sprint changes');
    }
  }

  /**
   * Add duplicate prevention steps
   */
  async addDuplicatePreventionSteps(plan, task) {
    // For notification steps, check recent history
    const notificationSteps = plan.steps.filter(step => 
      step.tool.includes('Notification') || step.tool === 'sendNotification'
    );

    for (const step of notificationSteps) {
      const targetId = task.context?.workItemId || task.context?.buildId || task.context?.pullRequestId;
      
      if (targetId) {
        // Check recent notifications for this target
        const recentNotifications = await notificationHistory.getRecentNotificationsForTarget(
          targetId.toString(), 
          1 // Last 1 hour
        );

        if (recentNotifications.length > 0) {
          step.conditional = true;
          step.reason += ' (conditional - checking for duplicates)';
          plan.reasoning.push(`Added duplicate check for ${step.tool}`);
        }
      }
    }
  }

  /**
   * Add escalation steps if needed
   */
  async addEscalationSteps(plan, task) {
    const targetId = task.context?.workItemId || task.context?.buildId || task.context?.pullRequestId;
    
    if (targetId && (task.type.includes('BUILD') || task.type.includes('WORK_ITEM'))) {
      const escalationCheck = await notificationHistory.shouldEscalateFailures(
        targetId.toString(),
        task.type.includes('BUILD') ? 'build' : 'work-item'
      );

      if (escalationCheck.shouldEscalate) {
        plan.steps.push({
          id: `${task.id}_step_auto_escalation`,
          tool: 'sendEscalationNotification',
          reason: 'Auto-escalate due to repeated issues',
          parameters: {
            targetId: targetId.toString(),
            failureType: task.type.includes('BUILD') ? 'build' : 'work-item',
            failureCount: escalationCheck.failureCount,
            recentFailures: escalationCheck.recentFailures
          },
          status: 'pending',
          estimatedDuration: 1000,
          dependencies: []
        });

        plan.reasoning.push(`Added auto-escalation: ${escalationCheck.failureCount} recent failures`);
      }
    }
  }

  /**
   * Build parameters for a specific step
   */
  async buildStepParameters(step, task) {
    const params = { ...step.parameters };

    try {
      switch (step.tool) {
        case 'fetchWorkItem':
          params.workItemId = task.context?.workItemId;
          break;

        case 'fetchPullRequest':
          params.pullRequestId = task.context?.pullRequestId;
          break;

        case 'fetchPipelineLogs':
        case 'fetchBuildTimeline':
          params.buildId = task.context?.buildId;
          break;

        case 'summarizeWorkItem':
          params.workItem = task.payload?.resource;
          break;

        case 'summarizePullRequest':
          params.pullRequest = task.payload?.resource;
          break;

        case 'sendWorkItemNotification':
          params.workItem = task.payload?.resource;
          params.eventType = task.type === 'WORK_ITEM_CREATED' ? 'created' : 'updated';
          break;

        case 'sendBuildNotification':
          params.build = task.payload?.resource;
          break;

        case 'sendPullRequestNotification':
          params.pullRequest = task.payload?.resource;
          params.eventType = task.type === 'PULL_REQUEST_CREATED' ? 'created' : 'updated';
          break;
      }
    } catch (error) {
      logger.warn('Error building step parameters:', error, { step: step.tool });
    }

    return params;
  }

  /**
   * Estimate duration for a tool execution
   */
  estimateStepDuration(tool) {
    const durations = {
      'fetchWorkItem': 1000,
      'fetchCurrentSprintWorkItems': 2000,
      'fetchPipelineLogs': 3000,
      'fetchBuildTimeline': 2000,
      'fetchRecentBuilds': 2000,
      'fetchPullRequest': 1000,
      'fetchActivePullRequests': 2000,
      'fetchPullRequestDiff': 1500,
      'summarizeWorkItem': 3000,
      'summarizeBuildFailure': 5000,
      'summarizePullRequest': 4000,
      'summarizeSprintWorkItems': 4000,
      'sendNotification': 1000,
      'sendWorkItemNotification': 1000,
      'sendBuildNotification': 1000,
      'sendPullRequestNotification': 1000,
      'sendEscalationNotification': 1000
    };

    return durations[tool] || 2000;
  }

  /**
   * Assess risks for the execution plan
   */
  async assessRisks(task, plan) {
    const risks = [];

    try {
      // Check for external dependencies
      const externalSteps = plan.steps.filter(step => 
        step.tool.startsWith('fetch') || step.tool.includes('AI')
      );
      
      if (externalSteps.length > 3) {
        risks.push('high-external-dependency');
      }

      // Check for long execution time
      if (plan.estimatedDuration > 15000) {
        risks.push('long-execution-time');
      }

      // Check for AI service dependency
      const aiSteps = plan.steps.filter(step => step.tool.includes('summarize'));
      if (aiSteps.length > 0) {
        risks.push('ai-service-dependency');
      }

      // Check for notification frequency
      const notificationSteps = plan.steps.filter(step => 
        step.tool.includes('Notification')
      );
      
      if (notificationSteps.length > 2) {
        risks.push('notification-spam-risk');
      }

    } catch (error) {
      logger.warn('Error assessing risks:', error);
      risks.push('risk-assessment-failed');
    }

    return risks;
  }

  /**
   * Check if a state change is significant
   */
  isSignificantStateChange(oldState, newState) {
    const significantChanges = [
      ['New', 'Active'],
      ['Active', 'Resolved'],
      ['Resolved', 'Closed'],
      ['Active', 'Closed'],
      ['Resolved', 'Active'], // Reopened
      ['Closed', 'Active']    // Reopened
    ];

    return significantChanges.some(([from, to]) => 
      oldState === from && newState === to
    );
  }

  /**
   * Optimize plan for efficiency
   */
  optimizePlan(plan) {
    try {
      // Parallelize independent steps
      this.parallelizeIndependentSteps(plan);
      
      // Remove redundant steps
      this.removeRedundantSteps(plan);
      
      // Optimize parameter passing
      this.optimizeParameterPassing(plan);

      plan.reasoning.push('Plan optimized for efficiency');
    } catch (error) {
      logger.warn('Error optimizing plan:', error);
    }

    return plan;
  }

  /**
   * Identify steps that can run in parallel
   */
  parallelizeIndependentSteps(plan) {
    // Mark steps that can run in parallel
    plan.steps.forEach(step => {
      step.canRunInParallel = step.dependencies.length === 0 || 
                             step.dependencies.every(dep => 
                               plan.steps.find(s => s.id === dep)?.status === 'completed'
                             );
    });
  }

  /**
   * Remove redundant or duplicate steps
   */
  removeRedundantSteps(plan) {
    const seen = new Set();
    plan.steps = plan.steps.filter(step => {
      const key = `${step.tool}_${JSON.stringify(step.parameters)}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  /**
   * Optimize parameter passing between steps
   */
  optimizeParameterPassing(plan) {
    // This could be enhanced to pass output from one step as input to another
    // For now, just ensure parameters are properly structured
    plan.steps.forEach(step => {
      if (!step.parameters) {
        step.parameters = {};
      }
    });
  }
}

export const planner = new Planner();