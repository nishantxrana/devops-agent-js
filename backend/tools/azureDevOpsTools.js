import { azureDevOpsClient } from '../devops/azureDevOpsClient.js';
import { logger } from '../utils/logger.js';

/**
 * Azure DevOps tools that wrap existing functionality for agent use
 */

const fetchWorkItem = {
  name: 'fetchWorkItem',
  description: 'Fetch a specific work item by ID from Azure DevOps',
  category: 'azuredevops',
  parameters: {
    type: 'object',
    properties: {
      workItemId: {
        type: 'number',
        description: 'The ID of the work item to fetch'
      },
      expand: {
        type: 'string',
        description: 'Fields to expand (e.g., "relations")',
        default: 'all'
      }
    },
    required: ['workItemId']
  },
  examples: [
    {
      description: 'Fetch work item with ID 1234',
      parameters: { workItemId: 1234 }
    }
  ],
  async execute({ workItemId, expand = 'all' }) {
    try {
      const workItem = await azureDevOpsClient.getWorkItem(workItemId, expand);
      return {
        success: true,
        data: workItem,
        message: `Successfully fetched work item ${workItemId}`
      };
    } catch (error) {
      logger.error('Failed to fetch work item:', error, { workItemId });
      throw new Error(`Failed to fetch work item ${workItemId}: ${error.message}`);
    }
  }
};

const fetchCurrentSprintWorkItems = {
  name: 'fetchCurrentSprintWorkItems',
  description: 'Fetch all work items in the current sprint',
  category: 'azuredevops',
  parameters: {
    type: 'object',
    properties: {
      top: {
        type: 'number',
        description: 'Maximum number of work items to return',
        default: 100
      }
    }
  },
  examples: [
    {
      description: 'Fetch current sprint work items',
      parameters: {}
    }
  ],
  async execute({ top = 100 } = {}) {
    try {
      const workItems = await azureDevOpsClient.getCurrentSprintWorkItems(top);
      return {
        success: true,
        data: workItems,
        message: `Successfully fetched ${workItems.count || 0} work items from current sprint`
      };
    } catch (error) {
      logger.error('Failed to fetch current sprint work items:', error);
      throw new Error(`Failed to fetch current sprint work items: ${error.message}`);
    }
  }
};

const fetchPipelineLogs = {
  name: 'fetchPipelineLogs',
  description: 'Fetch logs for a specific build/pipeline',
  category: 'azuredevops',
  parameters: {
    type: 'object',
    properties: {
      buildId: {
        type: 'number',
        description: 'The ID of the build to fetch logs for'
      }
    },
    required: ['buildId']
  },
  examples: [
    {
      description: 'Fetch logs for build 5678',
      parameters: { buildId: 5678 }
    }
  ],
  async execute({ buildId }) {
    try {
      const logs = await azureDevOpsClient.getBuildLogs(buildId);
      return {
        success: true,
        data: logs,
        message: `Successfully fetched logs for build ${buildId}`
      };
    } catch (error) {
      logger.error('Failed to fetch pipeline logs:', error, { buildId });
      throw new Error(`Failed to fetch pipeline logs for build ${buildId}: ${error.message}`);
    }
  }
};

const fetchBuildTimeline = {
  name: 'fetchBuildTimeline',
  description: 'Fetch timeline/details for a specific build',
  category: 'azuredevops',
  parameters: {
    type: 'object',
    properties: {
      buildId: {
        type: 'number',
        description: 'The ID of the build to fetch timeline for'
      }
    },
    required: ['buildId']
  },
  examples: [
    {
      description: 'Fetch timeline for build 5678',
      parameters: { buildId: 5678 }
    }
  ],
  async execute({ buildId }) {
    try {
      const timeline = await azureDevOpsClient.getBuildTimeline(buildId);
      return {
        success: true,
        data: timeline,
        message: `Successfully fetched timeline for build ${buildId}`
      };
    } catch (error) {
      logger.error('Failed to fetch build timeline:', error, { buildId });
      throw new Error(`Failed to fetch build timeline for build ${buildId}: ${error.message}`);
    }
  }
};

const fetchRecentBuilds = {
  name: 'fetchRecentBuilds',
  description: 'Fetch recent builds/pipelines from Azure DevOps',
  category: 'azuredevops',
  parameters: {
    type: 'object',
    properties: {
      top: {
        type: 'number',
        description: 'Maximum number of builds to return',
        default: 50
      },
      definitionId: {
        type: 'number',
        description: 'Filter by specific pipeline definition ID'
      },
      status: {
        type: 'string',
        description: 'Filter by build status (e.g., "completed")'
      }
    }
  },
  examples: [
    {
      description: 'Fetch 10 most recent builds',
      parameters: { top: 10 }
    }
  ],
  async execute({ top = 50, definitionId, status } = {}) {
    try {
      const builds = await azureDevOpsClient.getRecentBuilds(top, definitionId, status);
      return {
        success: true,
        data: builds,
        message: `Successfully fetched ${builds.count || 0} recent builds`
      };
    } catch (error) {
      logger.error('Failed to fetch recent builds:', error);
      throw new Error(`Failed to fetch recent builds: ${error.message}`);
    }
  }
};

const fetchPullRequest = {
  name: 'fetchPullRequest',
  description: 'Fetch a specific pull request by ID',
  category: 'azuredevops',
  parameters: {
    type: 'object',
    properties: {
      pullRequestId: {
        type: 'number',
        description: 'The ID of the pull request to fetch'
      }
    },
    required: ['pullRequestId']
  },
  examples: [
    {
      description: 'Fetch pull request with ID 123',
      parameters: { pullRequestId: 123 }
    }
  ],
  async execute({ pullRequestId }) {
    try {
      const pullRequest = await azureDevOpsClient.getPullRequest(pullRequestId);
      return {
        success: true,
        data: pullRequest,
        message: `Successfully fetched pull request ${pullRequestId}`
      };
    } catch (error) {
      logger.error('Failed to fetch pull request:', error, { pullRequestId });
      throw new Error(`Failed to fetch pull request ${pullRequestId}: ${error.message}`);
    }
  }
};

const fetchActivePullRequests = {
  name: 'fetchActivePullRequests',
  description: 'Fetch active pull requests from Azure DevOps',
  category: 'azuredevops',
  parameters: {
    type: 'object',
    properties: {
      top: {
        type: 'number',
        description: 'Maximum number of pull requests to return',
        default: 50
      },
      status: {
        type: 'string',
        description: 'Filter by PR status (e.g., "active")',
        default: 'active'
      }
    }
  },
  examples: [
    {
      description: 'Fetch active pull requests',
      parameters: {}
    }
  ],
  async execute({ top = 50, status = 'active' } = {}) {
    try {
      const pullRequests = await azureDevOpsClient.getActivePullRequests(top, status);
      return {
        success: true,
        data: pullRequests,
        message: `Successfully fetched ${pullRequests.count || 0} active pull requests`
      };
    } catch (error) {
      logger.error('Failed to fetch active pull requests:', error);
      throw new Error(`Failed to fetch active pull requests: ${error.message}`);
    }
  }
};

const fetchPullRequestDiff = {
  name: 'fetchPullRequestDiff',
  description: 'Fetch the diff/changes for a pull request',
  category: 'azuredevops',
  parameters: {
    type: 'object',
    properties: {
      pullRequestId: {
        type: 'number',
        description: 'The ID of the pull request to get diff for'
      }
    },
    required: ['pullRequestId']
  },
  examples: [
    {
      description: 'Fetch diff for pull request 123',
      parameters: { pullRequestId: 123 }
    }
  ],
  async execute({ pullRequestId }) {
    try {
      // Note: This assumes azureDevOpsClient has a method to get PR diffs
      // You may need to implement this method if it doesn't exist
      const diff = await azureDevOpsClient.getPullRequestChanges(pullRequestId);
      return {
        success: true,
        data: diff,
        message: `Successfully fetched diff for pull request ${pullRequestId}`
      };
    } catch (error) {
      logger.error('Failed to fetch pull request diff:', error, { pullRequestId });
      throw new Error(`Failed to fetch pull request diff for ${pullRequestId}: ${error.message}`);
    }
  }
};

const checkProjectConnection = {
  name: 'checkProjectConnection',
  description: 'Test connection to Azure DevOps project',
  category: 'azuredevops',
  parameters: {
    type: 'object',
    properties: {}
  },
  examples: [
    {
      description: 'Test Azure DevOps connection',
      parameters: {}
    }
  ],
  async execute() {
    try {
      const result = await azureDevOpsClient.testConnection();
      return {
        success: true,
        data: result,
        message: 'Successfully connected to Azure DevOps project'
      };
    } catch (error) {
      logger.error('Failed to connect to Azure DevOps:', error);
      throw new Error(`Failed to connect to Azure DevOps: ${error.message}`);
    }
  }
};

export const azureDevOpsTools = [
  fetchWorkItem,
  fetchCurrentSprintWorkItems,
  fetchPipelineLogs,
  fetchBuildTimeline,
  fetchRecentBuilds,
  fetchPullRequest,
  fetchActivePullRequests,
  fetchPullRequestDiff,
  checkProjectConnection
];