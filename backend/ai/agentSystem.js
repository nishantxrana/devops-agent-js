import { ChatOpenAI } from '@langchain/openai';
import { HumanMessage, SystemMessage, AIMessage } from '@langchain/core/messages';
import { ChatPromptTemplate, MessagesPlaceholder } from '@langchain/core/prompts';
import { Tool } from '@langchain/core/tools';
import { AgentExecutor, createOpenAIToolsAgent } from 'langchain/agents';
import { logger } from '../utils/logger.js';
import { azureDevOpsClient } from '../devops/azureDevOpsClient.js';
import { aiService } from './aiService.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * DevOps Agent System with reasoning, context retention, and autonomous capabilities
 */
class DevOpsAgentSystem {
  constructor() {
    this.conversations = new Map(); // In-memory conversation storage
    this.model = null;
    this.agent = null;
    this.executor = null;
    this.tools = [];
    this.initialized = false;
  }

  /**
   * Initialize the agent system with tools and models
   */
  async initialize() {
    try {
      logger.info('Initializing DevOps Agent System...');
      
      // Initialize the AI model based on current configuration
      await this.initializeModel();
      
      // Create DevOps tools
      this.createDevOpsTools();
      
      // Create the agent
      await this.createAgent();
      
      this.initialized = true;
      logger.info('DevOps Agent System initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize DevOps Agent System:', error);
      throw error;
    }
  }

  /**
   * Initialize the appropriate AI model
   */
  async initializeModel() {
    const config = aiService.config;
    
    if (config.provider === 'openai') {
      this.model = new ChatOpenAI({
        modelName: config.model,
        temperature: 0.3,
        apiKey: config.apiKey
      });
    } else {
      // Fallback to basic completion for non-OpenAI providers
      this.model = {
        invoke: async (messages) => {
          const formattedMessages = messages.map(msg => ({
            role: msg._getType() === 'human' ? 'user' : 
                  msg._getType() === 'ai' ? 'assistant' : 'system',
            content: msg.content
          }));
          
          const response = await aiService.generateCompletion(formattedMessages);
          return new AIMessage(response);
        }
      };
    }
  }

  /**
   * Create DevOps-specific tools for the agent
   */
  createDevOpsTools() {
    this.tools = [
      new Tool({
        name: 'get_work_items',
        description: 'Get current sprint work items and their status',
        func: async () => {
          try {
            const workItems = await azureDevOpsClient.getCurrentSprintWorkItems();
            return JSON.stringify({
              success: true,
              count: workItems.count || 0,
              items: workItems.value || workItems
            });
          } catch (error) {
            return JSON.stringify({
              success: false,
              error: error.message
            });
          }
        }
      }),

      new Tool({
        name: 'get_recent_builds',
        description: 'Get recent pipeline builds and their status',
        func: async (input) => {
          try {
            const count = parseInt(input) || 10;
            const builds = await azureDevOpsClient.getRecentBuilds(count);
            return JSON.stringify({
              success: true,
              count: builds.count || 0,
              builds: builds.value || builds
            });
          } catch (error) {
            return JSON.stringify({
              success: false,
              error: error.message
            });
          }
        }
      }),

      new Tool({
        name: 'get_pull_requests',
        description: 'Get active pull requests and their status',
        func: async () => {
          try {
            const prs = await azureDevOpsClient.getPullRequests();
            return JSON.stringify({
              success: true,
              count: prs.count || 0,
              pullRequests: prs.value || prs
            });
          } catch (error) {
            return JSON.stringify({
              success: false,
              error: error.message
            });
          }
        }
      }),

      new Tool({
        name: 'analyze_build_failure',
        description: 'Analyze a failed build and provide troubleshooting recommendations',
        func: async (buildId) => {
          try {
            const build = await azureDevOpsClient.getBuild(parseInt(buildId));
            const timeline = await azureDevOpsClient.getBuildTimeline(parseInt(buildId));
            const logs = await azureDevOpsClient.getBuildLogs(parseInt(buildId));
            
            const analysis = await aiService.summarizeBuildFailure(build, timeline, logs);
            return JSON.stringify({
              success: true,
              buildId,
              analysis
            });
          } catch (error) {
            return JSON.stringify({
              success: false,
              error: error.message
            });
          }
        }
      }),

      new Tool({
        name: 'generate_sprint_summary',
        description: 'Generate an AI-powered summary of the current sprint',
        func: async () => {
          try {
            const workItems = await azureDevOpsClient.getCurrentSprintWorkItems();
            const summary = await aiService.summarizeSprintWorkItems(workItems.value || workItems);
            return JSON.stringify({
              success: true,
              summary
            });
          } catch (error) {
            return JSON.stringify({
              success: false,
              error: error.message
            });
          }
        }
      }),

      new Tool({
        name: 'get_overdue_items',
        description: 'Get work items that are overdue or at risk',
        func: async () => {
          try {
            const overdueItems = await azureDevOpsClient.getOverdueWorkItems();
            return JSON.stringify({
              success: true,
              count: overdueItems.count || 0,
              items: overdueItems.value || overdueItems
            });
          } catch (error) {
            return JSON.stringify({
              success: false,
              error: error.message
            });
          }
        }
      })
    ];
  }

  /**
   * Create the agent with tools and prompt
   */
  async createAgent() {
    const prompt = ChatPromptTemplate.fromMessages([
      ['system', `You are an intelligent DevOps assistant with access to Azure DevOps data and AI analysis capabilities. 

Your role is to:
1. **Analyze** DevOps metrics, builds, work items, and pull requests
2. **Reason** about patterns, issues, and optimization opportunities  
3. **Provide** actionable insights and recommendations
4. **Automate** multi-step workflows when appropriate
5. **Remember** context from previous conversations to build on insights

Key capabilities:
- Monitor sprint progress and team velocity
- Diagnose build failures and suggest fixes
- Track pull request health and review bottlenecks
- Identify overdue work items and blockers
- Generate comprehensive DevOps reports

Always be proactive in suggesting improvements and maintaining conversation context for better assistance.`],
      new MessagesPlaceholder('chat_history'),
      ['human', '{input}'],
      new MessagesPlaceholder('agent_scratchpad')
    ]);

    if (this.model.invoke) {
      // Use OpenAI Tools Agent for full functionality
      try {
        this.agent = await createOpenAIToolsAgent({
          llm: this.model,
          tools: this.tools,
          prompt
        });

        this.executor = new AgentExecutor({
          agent: this.agent,
          tools: this.tools,
          verbose: true,
          maxIterations: 5
        });
      } catch (error) {
        logger.warn('Failed to create OpenAI agent, falling back to basic agent:', error);
        await this.createBasicAgent(prompt);
      }
    } else {
      await this.createBasicAgent(prompt);
    }
  }

  /**
   * Create a basic agent for non-OpenAI providers
   */
  async createBasicAgent(prompt) {
    this.executor = {
      invoke: async ({ input, chat_history = [] }) => {
        // Simple tool execution logic
        const toolCalls = this.extractToolCalls(input);
        let toolResults = '';
        
        for (const toolCall of toolCalls) {
          const tool = this.tools.find(t => t.name === toolCall.name);
          if (tool) {
            const result = await tool.func(toolCall.args);
            toolResults += `Tool ${toolCall.name} result: ${result}\n`;
          }
        }

        const messages = [
          new SystemMessage(prompt.messages[0].prompt.template),
          ...chat_history,
          new HumanMessage(input + (toolResults ? `\n\nTool Results:\n${toolResults}` : ''))
        ];

        const response = await this.model.invoke(messages);
        return { output: response.content };
      }
    };
  }

  /**
   * Extract tool calls from user input (basic pattern matching)
   */
  extractToolCalls(input) {
    const toolCalls = [];
    const lowerInput = input.toLowerCase();

    if (lowerInput.includes('work items') || lowerInput.includes('sprint') || lowerInput.includes('backlog')) {
      toolCalls.push({ name: 'get_work_items', args: '' });
    }
    if (lowerInput.includes('build') || lowerInput.includes('pipeline')) {
      toolCalls.push({ name: 'get_recent_builds', args: '10' });
    }
    if (lowerInput.includes('pull request') || lowerInput.includes('pr')) {
      toolCalls.push({ name: 'get_pull_requests', args: '' });
    }
    if (lowerInput.includes('summary') && lowerInput.includes('sprint')) {
      toolCalls.push({ name: 'generate_sprint_summary', args: '' });
    }
    if (lowerInput.includes('overdue') || lowerInput.includes('late')) {
      toolCalls.push({ name: 'get_overdue_items', args: '' });
    }

    return toolCalls;
  }

  /**
   * Start or continue a conversation with the agent
   */
  async chat(message, conversationId = null, userId = 'default') {
    if (!this.initialized) {
      await this.initialize();
    }

    // Create new conversation if none provided
    if (!conversationId) {
      conversationId = uuidv4();
    }

    // Get or create conversation history
    const conversationKey = `${userId}:${conversationId}`;
    let conversation = this.conversations.get(conversationKey);
    
    if (!conversation) {
      conversation = {
        id: conversationId,
        userId,
        history: [],
        createdAt: new Date(),
        lastActivity: new Date()
      };
      this.conversations.set(conversationKey, conversation);
    }

    try {
      // Update last activity
      conversation.lastActivity = new Date();

      // Execute the agent
      const response = await this.executor.invoke({
        input: message,
        chat_history: conversation.history
      });

      // Add to conversation history
      conversation.history.push(new HumanMessage(message));
      conversation.history.push(new AIMessage(response.output));

      // Limit conversation history to prevent memory issues
      if (conversation.history.length > 20) {
        conversation.history = conversation.history.slice(-20);
      }

      logger.info('Agent conversation completed', {
        conversationId,
        userId,
        messageLength: message.length,
        responseLength: response.output.length
      });

      return {
        conversationId,
        response: response.output,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      logger.error('Agent conversation failed:', error);
      throw error;
    }
  }

  /**
   * Get conversation history
   */
  getConversation(conversationId, userId = 'default') {
    const conversationKey = `${userId}:${conversationId}`;
    return this.conversations.get(conversationKey);
  }

  /**
   * List conversations for a user
   */
  getConversations(userId = 'default') {
    const userConversations = [];
    for (const [key, conversation] of this.conversations.entries()) {
      if (key.startsWith(`${userId}:`)) {
        userConversations.push({
          id: conversation.id,
          createdAt: conversation.createdAt,
          lastActivity: conversation.lastActivity,
          messageCount: conversation.history.length
        });
      }
    }
    return userConversations.sort((a, b) => b.lastActivity - a.lastActivity);
  }

  /**
   * Clean up old conversations
   */
  cleanupConversations() {
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago
    
    for (const [key, conversation] of this.conversations.entries()) {
      if (conversation.lastActivity < cutoff) {
        this.conversations.delete(key);
      }
    }
    
    logger.debug('Cleaned up old conversations');
  }

  /**
   * Execute autonomous workflow based on triggers
   */
  async executeAutonomousWorkflow(trigger, data) {
    if (!this.initialized) {
      await this.initialize();
    }

    let workflow = '';
    
    switch (trigger) {
      case 'build_failed':
        workflow = `A build just failed: ${data.buildDefinition} #${data.buildNumber}. Please analyze the failure and provide actionable recommendations.`;
        break;
      case 'pr_idle':
        workflow = `Pull request #${data.pullRequestId} has been idle for ${data.idleDays} days. Please analyze the PR and suggest next steps.`;
        break;
      case 'sprint_ending':
        workflow = `The current sprint is ending in ${data.daysRemaining} days. Please provide a sprint summary and identify any at-risk items.`;
        break;
      default:
        return null;
    }

    try {
      const response = await this.executor.invoke({
        input: workflow,
        chat_history: []
      });

      logger.info('Autonomous workflow executed', {
        trigger,
        workflowLength: workflow.length,
        responseLength: response.output.length
      });

      return {
        trigger,
        workflow,
        response: response.output,
        timestamp: new Date().toISOString(),
        autonomous: true
      };

    } catch (error) {
      logger.error('Autonomous workflow failed:', error);
      throw error;
    }
  }
}

export const devOpsAgent = new DevOpsAgentSystem();