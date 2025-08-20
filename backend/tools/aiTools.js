import { aiService } from '../ai/aiService.js';
import { logger } from '../utils/logger.js';

/**
 * AI-powered tools for analysis and summarization
 */

const summarizeWorkItem = {
  name: 'summarizeWorkItem',
  description: 'Generate AI summary for a work item',
  category: 'ai',
  parameters: {
    type: 'object',
    properties: {
      workItem: {
        type: 'object',
        description: 'The work item object to summarize'
      }
    },
    required: ['workItem']
  },
  examples: [
    {
      description: 'Summarize a work item',
      parameters: {
        workItem: {
          id: 1234,
          fields: {
            'System.Title': 'Fix login bug',
            'System.Description': 'Users cannot log in...'
          }
        }
      }
    }
  ],
  async execute({ workItem }) {
    try {
      const summary = await aiService.summarizeWorkItem(workItem);
      return {
        success: true,
        data: { summary },
        message: `Successfully generated summary for work item ${workItem.id}`
      };
    } catch (error) {
      logger.error('Failed to summarize work item:', error, { workItemId: workItem?.id });
      throw new Error(`Failed to summarize work item: ${error.message}`);
    }
  }
};

const summarizeBuildFailure = {
  name: 'summarizeBuildFailure',
  description: 'Generate AI analysis of build failure with logs and timeline',
  category: 'ai',
  parameters: {
    type: 'object',
    properties: {
      build: {
        type: 'object',
        description: 'The build object that failed'
      },
      timeline: {
        type: 'object',
        description: 'Build timeline data'
      },
      logs: {
        type: 'object',
        description: 'Build logs data'
      }
    },
    required: ['build']
  },
  examples: [
    {
      description: 'Analyze a failed build',
      parameters: {
        build: { id: 5678, result: 'failed' },
        timeline: {},
        logs: {}
      }
    }
  ],
  async execute({ build, timeline = null, logs = null }) {
    try {
      const summary = await aiService.summarizeBuildFailure(build, timeline, logs);
      return {
        success: true,
        data: { summary },
        message: `Successfully analyzed build failure for build ${build.id}`
      };
    } catch (error) {
      logger.error('Failed to summarize build failure:', error, { buildId: build?.id });
      throw new Error(`Failed to summarize build failure: ${error.message}`);
    }
  }
};

const summarizePullRequest = {
  name: 'summarizePullRequest',
  description: 'Generate AI summary and changelog for a pull request',
  category: 'ai',
  parameters: {
    type: 'object',
    properties: {
      pullRequest: {
        type: 'object',
        description: 'The pull request object to summarize'
      },
      changes: {
        type: 'object',
        description: 'Pull request changes/diff data'
      }
    },
    required: ['pullRequest']
  },
  examples: [
    {
      description: 'Summarize a pull request',
      parameters: {
        pullRequest: { pullRequestId: 123, title: 'Add new feature' },
        changes: {}
      }
    }
  ],
  async execute({ pullRequest, changes = null }) {
    try {
      const summary = await aiService.summarizePullRequest(pullRequest, changes);
      return {
        success: true,
        data: { summary },
        message: `Successfully generated summary for pull request ${pullRequest.pullRequestId}`
      };
    } catch (error) {
      logger.error('Failed to summarize pull request:', error, { prId: pullRequest?.pullRequestId });
      throw new Error(`Failed to summarize pull request: ${error.message}`);
    }
  }
};

const summarizeSprintWorkItems = {
  name: 'summarizeSprintWorkItems',
  description: 'Generate AI insights for sprint work items',
  category: 'ai',
  parameters: {
    type: 'object',
    properties: {
      workItems: {
        type: 'array',
        description: 'Array of work items in the sprint'
      }
    },
    required: ['workItems']
  },
  examples: [
    {
      description: 'Summarize sprint work items',
      parameters: {
        workItems: [
          { id: 1, fields: { 'System.Title': 'Task 1' } },
          { id: 2, fields: { 'System.Title': 'Task 2' } }
        ]
      }
    }
  ],
  async execute({ workItems }) {
    try {
      const summary = await aiService.summarizeSprintWorkItems(workItems);
      return {
        success: true,
        data: { summary },
        message: `Successfully generated sprint summary for ${workItems.length} work items`
      };
    } catch (error) {
      logger.error('Failed to summarize sprint work items:', error);
      throw new Error(`Failed to summarize sprint work items: ${error.message}`);
    }
  }
};

const analyzeLogErrors = {
  name: 'analyzeLogErrors',
  description: 'Analyze logs to identify errors and patterns',
  category: 'ai',
  parameters: {
    type: 'object',
    properties: {
      logs: {
        type: 'string',
        description: 'Log content to analyze'
      },
      context: {
        type: 'string',
        description: 'Additional context for the analysis (e.g., build type, environment)'
      }
    },
    required: ['logs']
  },
  examples: [
    {
      description: 'Analyze build logs for errors',
      parameters: {
        logs: 'Error: Module not found...',
        context: 'Node.js build on CI/CD pipeline'
      }
    }
  ],
  async execute({ logs, context = '' }) {
    try {
      // This would use a more sophisticated AI analysis in a real implementation
      const prompt = `Analyze these logs and identify the main issues:\n\nContext: ${context}\n\nLogs:\n${logs}`;
      
      // For now, we'll use the existing AI service structure
      // In a full implementation, you'd add a specific log analysis method to aiService
      const summary = await aiService.generateCompletion([
        {
          role: 'user',
          content: prompt
        }
      ], {
        max_tokens: 200,
        temperature: 0.1
      });

      return {
        success: true,
        data: { analysis: summary },
        message: 'Successfully analyzed logs for errors and patterns'
      };
    } catch (error) {
      logger.error('Failed to analyze logs:', error);
      throw new Error(`Failed to analyze logs: ${error.message}`);
    }
  }
};

const generateInsights = {
  name: 'generateInsights',
  description: 'Generate AI insights from data patterns',
  category: 'ai',
  parameters: {
    type: 'object',
    properties: {
      data: {
        type: 'object',
        description: 'Data to analyze for insights'
      },
      type: {
        type: 'string',
        description: 'Type of insights to generate (e.g., "trends", "anomalies", "recommendations")'
      },
      context: {
        type: 'string',
        description: 'Additional context for the analysis'
      }
    },
    required: ['data', 'type']
  },
  examples: [
    {
      description: 'Generate trend insights from build data',
      parameters: {
        data: { builds: [], failureRate: 0.2 },
        type: 'trends',
        context: 'Weekly build analysis'
      }
    }
  ],
  async execute({ data, type, context = '' }) {
    try {
      const prompt = `Generate ${type} insights from the following data:\n\nContext: ${context}\n\nData: ${JSON.stringify(data, null, 2)}`;
      
      const insights = await aiService.generateCompletion([
        {
          role: 'user',
          content: prompt
        }
      ], {
        max_tokens: 300,
        temperature: 0.2
      });

      return {
        success: true,
        data: { insights, type },
        message: `Successfully generated ${type} insights`
      };
    } catch (error) {
      logger.error('Failed to generate insights:', error);
      throw new Error(`Failed to generate insights: ${error.message}`);
    }
  }
};

const checkAiServiceHealth = {
  name: 'checkAiServiceHealth',
  description: 'Check if AI service is properly configured and working',
  category: 'ai',
  parameters: {
    type: 'object',
    properties: {}
  },
  examples: [
    {
      description: 'Check AI service health',
      parameters: {}
    }
  ],
  async execute() {
    try {
      // Test AI service with a simple request
      const testResponse = await aiService.generateCompletion([
        {
          role: 'user',
          content: 'Respond with "AI service is working" if you can understand this message.'
        }
      ], {
        max_tokens: 10,
        temperature: 0
      });

      const isWorking = testResponse.toLowerCase().includes('working');
      
      return {
        success: isWorking,
        data: { 
          status: isWorking ? 'healthy' : 'degraded',
          response: testResponse,
          initialized: aiService.initialized
        },
        message: isWorking ? 'AI service is working properly' : 'AI service may have issues'
      };
    } catch (error) {
      logger.error('AI service health check failed:', error);
      return {
        success: false,
        data: { 
          status: 'unhealthy',
          error: error.message,
          initialized: aiService.initialized
        },
        message: `AI service health check failed: ${error.message}`
      };
    }
  }
};

export const aiTools = [
  summarizeWorkItem,
  summarizeBuildFailure,
  summarizePullRequest,
  summarizeSprintWorkItems,
  analyzeLogErrors,
  generateInsights,
  checkAiServiceHealth
];