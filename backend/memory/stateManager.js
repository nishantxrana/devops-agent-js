import { memoryManager } from './memoryManager.js';
import { logger } from '../utils/logger.js';

/**
 * Manages state tracking for work items, pipelines, and pull requests
 * Enables contextual decision making by comparing current vs previous states
 */
class StateManager {
  constructor() {
    this.WORK_ITEMS_KEY = 'work-items-state';
    this.BUILDS_KEY = 'builds-state';
    this.PULL_REQUESTS_KEY = 'pull-requests-state';
    this.SPRINT_SUMMARY_KEY = 'sprint-summaries';
  }

  /**
   * Update work item state and detect changes
   */
  async updateWorkItemState(workItemId, newState, fields = {}) {
    try {
      const previousState = await this.getWorkItemState(workItemId);
      
      const stateRecord = {
        id: workItemId,
        state: newState,
        fields,
        lastUpdated: new Date().toISOString(),
        previousState: previousState?.state || null
      };

      await memoryManager.store(`${this.WORK_ITEMS_KEY}-${workItemId}`, stateRecord);

      // Detect significant changes
      const changes = this.detectWorkItemChanges(previousState, stateRecord);
      
      if (changes.hasSignificantChanges) {
        logger.info('Significant work item changes detected', {
          workItemId,
          changes: changes.changes,
          previousState: previousState?.state,
          newState
        });
      }

      return { previousState, newState: stateRecord, changes };
    } catch (error) {
      logger.error('Error updating work item state:', error, { workItemId });
      return null;
    }
  }

  /**
   * Get current work item state
   */
  async getWorkItemState(workItemId) {
    try {
      return await memoryManager.retrieve(`${this.WORK_ITEMS_KEY}-${workItemId}`);
    } catch (error) {
      logger.error('Error getting work item state:', error, { workItemId });
      return null;
    }
  }

  /**
   * Update build/pipeline state
   */
  async updateBuildState(buildId, result, status, definition, metadata = {}) {
    try {
      const previousState = await this.getBuildState(buildId);
      
      const stateRecord = {
        id: buildId,
        result,
        status,
        definition,
        metadata,
        lastUpdated: new Date().toISOString(),
        previousResult: previousState?.result || null,
        previousStatus: previousState?.status || null
      };

      await memoryManager.store(`${this.BUILDS_KEY}-${buildId}`, stateRecord);

      // Track consecutive failures for escalation
      const failurePattern = await this.analyzeFailurePattern(definition, result);

      return { 
        previousState, 
        newState: stateRecord, 
        failurePattern,
        isFirstFailure: previousState?.result !== 'failed' && result === 'failed',
        isRecovery: previousState?.result === 'failed' && result === 'succeeded'
      };
    } catch (error) {
      logger.error('Error updating build state:', error, { buildId });
      return null;
    }
  }

  /**
   * Get current build state
   */
  async getBuildState(buildId) {
    try {
      return await memoryManager.retrieve(`${this.BUILDS_KEY}-${buildId}`);
    } catch (error) {
      logger.error('Error getting build state:', error, { buildId });
      return null;
    }
  }

  /**
   * Update pull request state
   */
  async updatePullRequestState(prId, status, reviewers = [], metadata = {}) {
    try {
      const previousState = await this.getPullRequestState(prId);
      
      const stateRecord = {
        id: prId,
        status,
        reviewers,
        metadata,
        lastUpdated: new Date().toISOString(),
        previousStatus: previousState?.status || null,
        createdAt: previousState?.createdAt || new Date().toISOString()
      };

      await memoryManager.store(`${this.PULL_REQUESTS_KEY}-${prId}`, stateRecord);

      // Calculate idle time
      const idleHours = this.calculateIdleTime(previousState, stateRecord);
      
      return { 
        previousState, 
        newState: stateRecord,
        idleHours,
        isStale: idleHours > 48, // Consider PR stale after 48 hours
        reviewerChanges: this.detectReviewerChanges(previousState?.reviewers || [], reviewers)
      };
    } catch (error) {
      logger.error('Error updating PR state:', error, { prId });
      return null;
    }
  }

  /**
   * Get current pull request state
   */
  async getPullRequestState(prId) {
    try {
      return await memoryManager.retrieve(`${this.PULL_REQUESTS_KEY}-${prId}`);
    } catch (error) {
      logger.error('Error getting PR state:', error, { prId });
      return null;
    }
  }

  /**
   * Store sprint summary
   */
  async updateSprintSummary(sprintId, summary, workItems = []) {
    try {
      const summaryRecord = {
        sprintId,
        summary,
        workItemCount: workItems.length,
        workItems: workItems.map(wi => ({
          id: wi.id,
          title: wi.fields?.['System.Title'],
          state: wi.fields?.['System.State'],
          type: wi.fields?.['System.WorkItemType']
        })),
        generatedAt: new Date().toISOString()
      };

      await memoryManager.store(`${this.SPRINT_SUMMARY_KEY}-${sprintId}`, summaryRecord);
      
      logger.info('Sprint summary updated', { sprintId, workItemCount: workItems.length });
      return summaryRecord;
    } catch (error) {
      logger.error('Error updating sprint summary:', error, { sprintId });
      return null;
    }
  }

  /**
   * Get sprint summary
   */
  async getSprintSummary(sprintId) {
    try {
      return await memoryManager.retrieve(`${this.SPRINT_SUMMARY_KEY}-${sprintId}`);
    } catch (error) {
      logger.error('Error getting sprint summary:', error, { sprintId });
      return null;
    }
  }

  /**
   * Detect work item changes
   */
  detectWorkItemChanges(previousState, newState) {
    if (!previousState) {
      return { hasSignificantChanges: true, changes: ['new-work-item'] };
    }

    const changes = [];
    
    if (previousState.state !== newState.state) {
      changes.push(`state-changed-from-${previousState.state}-to-${newState.state}`);
    }

    // Check for field changes
    const prevFields = previousState.fields || {};
    const newFields = newState.fields || {};
    
    if (prevFields['System.AssignedTo']?.displayName !== newFields['System.AssignedTo']?.displayName) {
      changes.push('assignee-changed');
    }
    
    if (prevFields['System.Title'] !== newFields['System.Title']) {
      changes.push('title-changed');
    }

    return {
      hasSignificantChanges: changes.length > 0,
      changes
    };
  }

  /**
   * Analyze failure patterns for builds
   */
  async analyzeFailurePattern(definition, currentResult) {
    try {
      const cutoffTime = new Date(Date.now() - 24 * 60 * 60 * 1000); // Last 24 hours
      
      // This is a simplified pattern analysis - in a real implementation,
      // you'd query all builds for this definition
      const recentBuilds = await memoryManager.search(
        'builds-state',
        (build) => {
          return build.definition === definition && 
                 new Date(build.lastUpdated) > cutoffTime;
        }
      );

      const consecutiveFailures = this.countConsecutiveFailures(recentBuilds, currentResult);
      
      return {
        consecutiveFailures,
        shouldEscalate: consecutiveFailures >= 3,
        recentFailureRate: this.calculateFailureRate(recentBuilds)
      };
    } catch (error) {
      logger.error('Error analyzing failure pattern:', error);
      return { consecutiveFailures: 0, shouldEscalate: false, recentFailureRate: 0 };
    }
  }

  /**
   * Calculate idle time for pull requests
   */
  calculateIdleTime(previousState, newState) {
    if (!previousState) return 0;
    
    const lastUpdate = new Date(previousState.lastUpdated);
    const now = new Date();
    
    return Math.floor((now - lastUpdate) / (1000 * 60 * 60)); // Hours
  }

  /**
   * Detect reviewer changes
   */
  detectReviewerChanges(previousReviewers, newReviewers) {
    const prevSet = new Set(previousReviewers.map(r => r.id || r.displayName));
    const newSet = new Set(newReviewers.map(r => r.id || r.displayName));
    
    const added = newReviewers.filter(r => !prevSet.has(r.id || r.displayName));
    const removed = previousReviewers.filter(r => !newSet.has(r.id || r.displayName));
    
    return { added, removed, hasChanges: added.length > 0 || removed.length > 0 };
  }

  /**
   * Count consecutive failures
   */
  countConsecutiveFailures(builds, currentResult) {
    // Sort by timestamp descending
    const sortedBuilds = builds.sort((a, b) => new Date(b.lastUpdated) - new Date(a.lastUpdated));
    
    let consecutive = currentResult === 'failed' ? 1 : 0;
    
    for (const build of sortedBuilds) {
      if (build.result === 'failed') {
        consecutive++;
      } else {
        break;
      }
    }
    
    return consecutive;
  }

  /**
   * Calculate failure rate
   */
  calculateFailureRate(builds) {
    if (builds.length === 0) return 0;
    
    const failures = builds.filter(build => build.result === 'failed').length;
    return failures / builds.length;
  }

  /**
   * Get stale pull requests
   */
  async getStalePullRequests(maxIdleHours = 48) {
    try {
      const data = await memoryManager.retrieve(this.PULL_REQUESTS_KEY);
      if (!data || !data.items) return [];

      const cutoffTime = new Date(Date.now() - maxIdleHours * 60 * 60 * 1000);
      
      return data.items.filter(pr => {
        return pr.status !== 'completed' && 
               pr.status !== 'abandoned' &&
               new Date(pr.lastUpdated) < cutoffTime;
      });
    } catch (error) {
      logger.error('Error getting stale PRs:', error);
      return [];
    }
  }

  /**
   * Clean up old state data
   */
  async cleanup(maxAgeHours = 720) { // 30 days
    try {
      logger.info('Starting state cleanup', { maxAgeHours });
      
      // Use memory manager's cleanup which handles file-level cleanup
      const cleaned = await memoryManager.cleanup(maxAgeHours);
      
      logger.info('State cleanup completed', { filesRemoved: cleaned });
      return cleaned;
    } catch (error) {
      logger.error('State cleanup failed:', error);
      return 0;
    }
  }
}

export const stateManager = new StateManager();