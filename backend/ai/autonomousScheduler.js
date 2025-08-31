import cron from 'node-cron';
import { logger } from '../utils/logger.js';
import { devOpsAgent } from '../ai/agentSystem.js';
import { azureDevOpsClient } from '../devops/azureDevOpsClient.js';

/**
 * Autonomous Workflow Scheduler
 * Triggers intelligent workflows based on schedule and conditions
 */
class AutonomousScheduler {
  constructor() {
    this.tasks = new Map();
    this.running = false;
  }

  /**
   * Start all scheduled tasks
   */
  start() {
    if (this.running) {
      logger.warn('Autonomous scheduler is already running');
      return;
    }

    logger.info('Starting autonomous workflow scheduler...');

    // Check for idle PRs every 4 hours during business hours
    this.tasks.set('idle-pr-check', cron.schedule('0 9-17/4 * * 1-5', async () => {
      await this.checkIdlePullRequests();
    }, { scheduled: false }));

    // Sprint health check every day at 9 AM
    this.tasks.set('sprint-health', cron.schedule('0 9 * * 1-5', async () => {
      await this.checkSprintHealth();
    }, { scheduled: false }));

    // Build failure trend analysis every Monday at 10 AM
    this.tasks.set('build-analysis', cron.schedule('0 10 * * 1', async () => {
      await this.analyzeBuildTrends();
    }, { scheduled: false }));

    // Clean up agent conversations daily at midnight
    this.tasks.set('cleanup', cron.schedule('0 0 * * *', async () => {
      await this.performCleanup();
    }, { scheduled: false }));

    // Start all tasks
    for (const [name, task] of this.tasks) {
      task.start();
      logger.info(`Started autonomous task: ${name}`);
    }

    this.running = true;
    logger.info('Autonomous workflow scheduler started successfully');
  }

  /**
   * Stop all scheduled tasks
   */
  stop() {
    if (!this.running) {
      logger.warn('Autonomous scheduler is not running');
      return;
    }

    logger.info('Stopping autonomous workflow scheduler...');

    for (const [name, task] of this.tasks) {
      task.stop();
      logger.info(`Stopped autonomous task: ${name}`);
    }

    this.tasks.clear();
    this.running = false;
    logger.info('Autonomous workflow scheduler stopped');
  }

  /**
   * Check for idle pull requests and trigger workflows
   */
  async checkIdlePullRequests() {
    try {
      logger.info('Checking for idle pull requests...');
      
      const prs = await azureDevOpsClient.getPullRequests();
      const now = new Date();
      const idleThreshold = 2 * 24 * 60 * 60 * 1000; // 2 days in milliseconds

      for (const pr of (prs.value || [])) {
        const lastActivity = new Date(pr.lastMergeCommit?.committer?.date || pr.creationDate);
        const idleTime = now - lastActivity;
        
        if (idleTime > idleThreshold && pr.status === 'active') {
          const idleDays = Math.floor(idleTime / (24 * 60 * 60 * 1000));
          
          await devOpsAgent.executeAutonomousWorkflow('pr_idle', {
            pullRequestId: pr.pullRequestId,
            title: pr.title,
            createdBy: pr.createdBy?.displayName,
            idleDays,
            lastActivity: lastActivity.toISOString()
          });

          logger.info('Triggered autonomous workflow for idle PR', {
            prId: pr.pullRequestId,
            idleDays
          });
        }
      }

    } catch (error) {
      logger.error('Error checking idle pull requests:', error);
    }
  }

  /**
   * Check sprint health and trigger workflows if needed
   */
  async checkSprintHealth() {
    try {
      logger.info('Checking sprint health...');

      // Get current sprint work items
      const workItems = await azureDevOpsClient.getCurrentSprintWorkItems();
      const items = workItems.value || [];

      // Analyze sprint progress
      const totalItems = items.length;
      const completedItems = items.filter(item => 
        ['Done', 'Closed', 'Resolved', 'Completed'].includes(item.fields?.['System.State'])
      ).length;

      const activeItems = items.filter(item => 
        ['Active', 'In Progress', 'Development', 'Testing'].includes(item.fields?.['System.State'])
      ).length;

      const newItems = items.filter(item => 
        ['New', 'To Do', 'Proposed'].includes(item.fields?.['System.State'])
      ).length;

      // Check for potential issues
      const completionRate = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;
      const issuesFound = [];

      if (completionRate < 30 && totalItems > 5) {
        issuesFound.push('low_completion_rate');
      }

      if (newItems > activeItems && totalItems > 3) {
        issuesFound.push('too_many_new_items');
      }

      // Get overdue items
      try {
        const overdueItems = await azureDevOpsClient.getOverdueWorkItems();
        if ((overdueItems.value || []).length > 0) {
          issuesFound.push('overdue_items');
        }
      } catch (error) {
        logger.warn('Could not fetch overdue items:', error.message);
      }

      // Trigger workflow if issues found or weekly summary needed
      if (issuesFound.length > 0 || new Date().getDay() === 1) { // Monday
        await devOpsAgent.executeAutonomousWorkflow('sprint_ending', {
          totalItems,
          completedItems,
          activeItems,
          newItems,
          completionRate: Math.round(completionRate),
          issuesFound,
          daysRemaining: 7 // Simplified - in real scenario, calculate from sprint dates
        });

        logger.info('Triggered autonomous workflow for sprint health', {
          totalItems,
          completionRate,
          issuesFound
        });
      }

    } catch (error) {
      logger.error('Error checking sprint health:', error);
    }
  }

  /**
   * Analyze build failure trends
   */
  async analyzeBuildTrends() {
    try {
      logger.info('Analyzing build failure trends...');

      const builds = await azureDevOpsClient.getRecentBuilds(50);
      const buildList = builds.value || [];

      if (buildList.length === 0) {
        return;
      }

      // Analyze failure patterns
      const failedBuilds = buildList.filter(build => build.result === 'failed');
      const failureRate = (failedBuilds.length / buildList.length) * 100;

      // Group failures by definition
      const failuresByDefinition = {};
      failedBuilds.forEach(build => {
        const defName = build.definition?.name || 'Unknown';
        failuresByDefinition[defName] = (failuresByDefinition[defName] || 0) + 1;
      });

      // Find patterns
      const patterns = [];
      if (failureRate > 20) {
        patterns.push('high_failure_rate');
      }

      const frequentFailures = Object.entries(failuresByDefinition)
        .filter(([_, count]) => count >= 3)
        .map(([name, count]) => ({ name, count }));

      if (frequentFailures.length > 0) {
        patterns.push('frequent_pipeline_failures');
      }

      if (patterns.length > 0) {
        await devOpsAgent.executeAutonomousWorkflow('build_trends', {
          totalBuilds: buildList.length,
          failedBuilds: failedBuilds.length,
          failureRate: Math.round(failureRate),
          patterns,
          frequentFailures,
          analysisDate: new Date().toISOString()
        });

        logger.info('Triggered autonomous workflow for build trends', {
          failureRate,
          patterns,
          frequentFailures: frequentFailures.length
        });
      }

    } catch (error) {
      logger.error('Error analyzing build trends:', error);
    }
  }

  /**
   * Perform cleanup tasks
   */
  async performCleanup() {
    try {
      logger.info('Performing autonomous system cleanup...');

      // Clean up old conversations
      devOpsAgent.cleanupConversations();

      logger.info('Autonomous system cleanup completed');

    } catch (error) {
      logger.error('Error during autonomous cleanup:', error);
    }
  }

  /**
   * Get scheduler status
   */
  getStatus() {
    return {
      running: this.running,
      tasksCount: this.tasks.size,
      tasks: Array.from(this.tasks.keys())
    };
  }

  /**
   * Manually trigger a specific workflow type
   */
  async triggerWorkflow(workflowType) {
    switch (workflowType) {
      case 'idle-pr-check':
        await this.checkIdlePullRequests();
        break;
      case 'sprint-health':
        await this.checkSprintHealth();
        break;
      case 'build-analysis':
        await this.analyzeBuildTrends();
        break;
      case 'cleanup':
        await this.performCleanup();
        break;
      default:
        throw new Error(`Unknown workflow type: ${workflowType}`);
    }
  }
}

export const autonomousScheduler = new AutonomousScheduler();