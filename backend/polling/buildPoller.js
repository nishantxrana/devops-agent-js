import { logger } from '../utils/logger.js';
import { azureDevOpsClient } from '../devops/azureDevOpsClient.js';
import { agentOrchestrator } from '../agent/agentOrchestrator.js';

class BuildPoller {
  constructor() {
    this.lastPollTime = new Date();
    this.processedBuilds = new Set();
  }

  async pollBuilds() {
    try {
      logger.info('Starting builds polling');

      // Route through agent orchestrator
      const result = await agentOrchestrator.processPollingEvent('builds', {
        timestamp: new Date().toISOString(),
        lastPollTime: this.lastPollTime
      });

      if (result.success) {
        logger.info('Builds polling processed by agent', { taskId: result.taskId });
      } else {
        // Fallback to direct processing
        logger.warn('Agent polling failed, falling back to direct processing', { error: result.error });
        
        // Get recent builds
        const recentBuilds = await azureDevOpsClient.getRecentBuilds(20);
        
        if (recentBuilds.count > 0) {
          logger.info(`Found ${recentBuilds.count} recent builds`);
          
          // Filter builds that completed since last poll
          const newBuilds = recentBuilds.value.filter(build => {
            const finishTime = new Date(build.finishTime);
            return finishTime > this.lastPollTime && !this.processedBuilds.has(build.id);
          });

          if (newBuilds.length > 0) {
            logger.info(`Found ${newBuilds.length} new completed builds since last poll`);
            
            for (const build of newBuilds) {
              await this.processBuild(build);
            }
          }
        } else {
          logger.info('No recent builds found');
        }
      }

      this.lastPollTime = new Date();
    } catch (error) {
      logger.error('Error polling builds:', error);
    }
  }

  async processBuild(build) {
    try {
      logger.info(`Processing build: ${build.definition?.name} #${build.buildNumber}`, {
        buildId: build.id,
        result: build.result,
        status: build.status
      });

      // Note: In a real scenario, build completion notifications would typically
      // be handled by webhooks rather than polling. This polling is mainly for
      // backup/fallback scenarios or when webhooks aren't available.
      
      // For now, we'll just log the build information
      // The actual notification logic is handled in the webhook handlers
      
      // Mark as processed
      this.processedBuilds.add(build.id);
      
    } catch (error) {
      logger.error(`Error processing build ${build.id}:`, error);
    }
  }

  cleanupProcessedBuilds() {
    // Keep only the last 1000 processed build IDs to prevent memory leaks
    if (this.processedBuilds.size > 1000) {
      const buildsArray = Array.from(this.processedBuilds);
      const toKeep = buildsArray.slice(-500); // Keep last 500
      this.processedBuilds = new Set(toKeep);
      
      logger.debug('Cleaned up processed builds cache');
    }
  }
}

export const buildPoller = new BuildPoller();
