import { ChatOpenAI } from '@langchain/openai';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { MemorySaver } from '@langchain/langgraph';
import { StateGraph, START, END } from '@langchain/langgraph';
import { HumanMessage, AIMessage, SystemMessage } from '@langchain/core/messages';
import { Tool } from '@langchain/core/tools';
import { logger } from '../utils/logger.js';
import { configLoader } from '../config/settings.js';

// DevOps-specific tools for the agent
class DevOpsAnalysisTool extends Tool {
  constructor() {
    super();
    this.name = 'devops_analysis';
    this.description = 'Analyze DevOps data including builds, work items, and pull requests with context';
  }

  async _call(input) {
    try {
      const { type, data, context } = JSON.parse(input);
      
      switch (type) {
        case 'build_failure':
          return this.analyzeBuildFailure(data, context);
        case 'work_item':
          return this.analyzeWorkItem(data, context);
        case 'pull_request':
          return this.analyzePullRequest(data, context);
        default:
          return 'Unknown analysis type';
      }
    } catch (error) {
      logger.error('DevOps analysis tool error:', error);
      return 'Error analyzing DevOps data';
    }
  }

  analyzeBuildFailure(data, context) {
    const { build, timeline, logs, historicalData } = data;
    
    // Enhanced analysis with context
    let analysis = `Build Failure Analysis for ${build.buildNumber}\n\n`;
    
    if (historicalData && historicalData.length > 0) {
      const similarFailures = historicalData.filter(h => h.status === 'failed');
      analysis += `Historical Context: Found ${similarFailures.length} similar failures in the past.\n`;
      
      if (similarFailures.length > 0) {
        const commonPatterns = this.findCommonPatterns(similarFailures);
        analysis += `Common patterns: ${commonPatterns.join(', ')}\n`;
      }
    }
    
    analysis += `\nCurrent Error: ${timeline?.errorMessage || 'Unknown error'}\n`;
    analysis += `Recommended Actions: ${this.generateRecommendations(data, context)}`;
    
    return analysis;
  }

  analyzeWorkItem(data, context) {
    const { workItem, sprintContext, teamContext } = data;
    
    let analysis = `Work Item Analysis: ${workItem.title}\n\n`;
    analysis += `Priority: ${workItem.priority || 'Not set'}\n`;
    analysis += `Status: ${workItem.state}\n`;
    
    if (sprintContext) {
      analysis += `Sprint Progress: ${sprintContext.completionPercentage}% complete\n`;
      analysis += `Team Velocity: ${sprintContext.velocity} story points/sprint\n`;
    }
    
    if (teamContext) {
      analysis += `Team Capacity: ${teamContext.availableCapacity} hours\n`;
      analysis += `Current Load: ${teamContext.currentLoad}%\n`;
    }
    
    return analysis;
  }

  analyzePullRequest(data, context) {
    const { pullRequest, reviewHistory, codeMetrics } = data;
    
    let analysis = `Pull Request Analysis: ${pullRequest.title}\n\n`;
    analysis += `Status: ${pullRequest.status}\n`;
    analysis += `Reviews: ${pullRequest.reviewers?.length || 0} reviewers assigned\n`;
    
    if (reviewHistory) {
      analysis += `Review History: ${reviewHistory.length} previous reviews\n`;
      const averageReviewTime = reviewHistory.reduce((sum, r) => sum + r.reviewTime, 0) / reviewHistory.length;
      analysis += `Average Review Time: ${Math.round(averageReviewTime)} hours\n`;
    }
    
    if (codeMetrics) {
      analysis += `Code Changes: +${codeMetrics.additions} -${codeMetrics.deletions} lines\n`;
      analysis += `Files Changed: ${codeMetrics.changedFiles}\n`;
    }
    
    return analysis;
  }

  findCommonPatterns(failures) {
    // Simple pattern detection - could be enhanced with ML
    const patterns = [];
    const errorTypes = failures.map(f => f.errorType).filter(Boolean);
    const uniqueErrors = [...new Set(errorTypes)];
    
    uniqueErrors.forEach(error => {
      const count = errorTypes.filter(e => e === error).length;
      if (count > 1) {
        patterns.push(`${error} (${count} times)`);
      }
    });
    
    return patterns;
  }

  generateRecommendations(data, context) {
    const recommendations = [];
    
    if (data.timeline?.errorMessage?.includes('compilation')) {
      recommendations.push('Check for syntax errors and missing dependencies');
    }
    
    if (data.timeline?.errorMessage?.includes('test')) {
      recommendations.push('Review failing tests and update test data');
    }
    
    if (context?.recentChanges) {
      recommendations.push('Review recent code changes for breaking modifications');
    }
    
    return recommendations.length > 0 ? recommendations.join(', ') : 'Review build logs for specific error details';
  }
}

class ProactiveMonitoringTool extends Tool {
  constructor() {
    super();
    this.name = 'proactive_monitoring';
    this.description = 'Proactively monitor DevOps metrics and suggest improvements';
  }

  async _call(input) {
    try {
      const { metrics, trends, thresholds } = JSON.parse(input);
      
      const alerts = [];
      const suggestions = [];
      
      // Check build success rate
      if (metrics.buildSuccessRate < thresholds.minBuildSuccessRate) {
        alerts.push(`Build success rate (${metrics.buildSuccessRate}%) below threshold`);
        suggestions.push('Consider implementing pre-commit hooks and better testing');
      }
      
      // Check deployment frequency
      if (metrics.deploymentFrequency < thresholds.minDeploymentFrequency) {
        alerts.push('Low deployment frequency detected');
        suggestions.push('Automate deployment pipeline and reduce manual steps');
      }
      
      // Check lead time
      if (metrics.leadTime > thresholds.maxLeadTime) {
        alerts.push(`Lead time (${metrics.leadTime} days) exceeds threshold`);
        suggestions.push('Optimize development workflow and reduce bottlenecks');
      }
      
      return {
        alerts,
        suggestions,
        severity: alerts.length > 2 ? 'high' : alerts.length > 0 ? 'medium' : 'low'
      };
    } catch (error) {
      logger.error('Proactive monitoring tool error:', error);
      return { alerts: [], suggestions: [], severity: 'low' };
    }
  }
}

// Agent state definition
class AgentState {
  constructor() {
    this.messages = [];
    this.context = {};
    this.memory = {};
    this.tools_output = null;
    this.next_action = null;
  }
}

class AgenticAIService {
  constructor() {
    this.llm = null;
    this.memory = new MemorySaver();
    this.tools = [
      new DevOpsAnalysisTool(),
      new ProactiveMonitoringTool()
    ];
    this.graph = null;
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return;

    try {
      const config = configLoader.getAIConfig();
      
      // Initialize LLM based on provider
      switch (config.provider) {
        case 'openai':
          this.llm = new ChatOpenAI({
            apiKey: config.openaiApiKey,
            model: config.model,
            temperature: 0.3,
          });
          break;
        case 'gemini':
          this.llm = new ChatGoogleGenerativeAI({
            apiKey: config.geminiApiKey,
            model: config.model,
            temperature: 0.3,
          });
          break;
        default:
          throw new Error(`Provider ${config.provider} not yet supported for agentic mode`);
      }

      // Create the agent graph
      this.graph = this.createAgentGraph();
      this.initialized = true;
      
      logger.info('Agentic AI service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize agentic AI service:', error);
      throw error;
    }
  }

  createAgentGraph() {
    const workflow = new StateGraph(AgentState);

    // Define agent nodes
    workflow.addNode('analyze', this.analyzeNode.bind(this));
    workflow.addNode('reason', this.reasonNode.bind(this));
    workflow.addNode('act', this.actNode.bind(this));
    workflow.addNode('memory_update', this.memoryUpdateNode.bind(this));

    // Define edges
    workflow.addEdge(START, 'analyze');
    workflow.addEdge('analyze', 'reason');
    workflow.addEdge('reason', 'act');
    workflow.addEdge('act', 'memory_update');
    workflow.addEdge('memory_update', END);

    return workflow.compile({
      checkpointer: this.memory
    });
  }

  async analyzeNode(state) {
    logger.debug('Agent analyzing input...');
    
    const lastMessage = state.messages[state.messages.length - 1];
    const userInput = lastMessage.content;
    
    // Determine what type of analysis is needed
    let analysisType = 'general';
    if (userInput.includes('build') || userInput.includes('pipeline')) {
      analysisType = 'build';
    } else if (userInput.includes('work item') || userInput.includes('task')) {
      analysisType = 'work_item';
    } else if (userInput.includes('pull request') || userInput.includes('PR')) {
      analysisType = 'pull_request';
    }
    
    state.context.analysisType = analysisType;
    state.context.originalQuery = userInput;
    
    return state;
  }

  async reasonNode(state) {
    logger.debug('Agent reasoning about response...');
    
    const systemPrompt = `You are an intelligent DevOps agent with context awareness and memory. 
    You help teams optimize their development workflow through proactive monitoring and intelligent analysis.
    
    Current analysis type: ${state.context.analysisType}
    Historical context: ${JSON.stringify(state.memory, null, 2)}
    
    Provide thoughtful, context-aware responses that consider:
    1. Historical patterns and trends
    2. Current team situation
    3. Best practices and recommendations
    4. Proactive suggestions for improvement
    
    Be concise but comprehensive in your analysis.`;

    const messages = [
      new SystemMessage(systemPrompt),
      ...state.messages
    ];

    try {
      const response = await this.llm.invoke(messages);
      state.messages.push(new AIMessage(response.content));
      
      // Determine if tools need to be called
      if (state.context.analysisType !== 'general') {
        state.next_action = 'use_tools';
      } else {
        state.next_action = 'complete';
      }
      
    } catch (error) {
      logger.error('Error in reason node:', error);
      state.messages.push(new AIMessage('I encountered an error while processing your request. Please try again.'));
      state.next_action = 'complete';
    }

    return state;
  }

  async actNode(state) {
    logger.debug('Agent taking action...');
    
    if (state.next_action === 'use_tools') {
      // Use appropriate tool based on context
      const tool = this.tools.find(t => t.name === 'devops_analysis');
      if (tool) {
        const toolInput = JSON.stringify({
          type: state.context.analysisType,
          data: state.context.data || {},
          context: state.context
        });
        
        try {
          const toolOutput = await tool._call(toolInput);
          state.tools_output = toolOutput;
          
          // Generate enhanced response with tool output
          const enhancedPrompt = `Based on the analysis: ${toolOutput}\n\nProvide a comprehensive response with actionable insights.`;
          const response = await this.llm.invoke([new HumanMessage(enhancedPrompt)]);
          
          // Replace the last AI message with enhanced response
          state.messages[state.messages.length - 1] = new AIMessage(response.content);
        } catch (error) {
          logger.error('Error using tools:', error);
        }
      }
    }
    
    return state;
  }

  async memoryUpdateNode(state) {
    logger.debug('Agent updating memory...');
    
    // Update memory with new interaction
    const interaction = {
      timestamp: new Date().toISOString(),
      query: state.context.originalQuery,
      analysisType: state.context.analysisType,
      response: state.messages[state.messages.length - 1].content,
      toolsUsed: state.tools_output ? ['devops_analysis'] : []
    };
    
    if (!state.memory.interactions) {
      state.memory.interactions = [];
    }
    
    state.memory.interactions.push(interaction);
    
    // Keep only last 50 interactions to manage memory
    if (state.memory.interactions.length > 50) {
      state.memory.interactions = state.memory.interactions.slice(-50);
    }
    
    return state;
  }

  async processQuery(query, sessionId = 'default', additionalContext = {}) {
    try {
      await this.initialize();
      
      const initialState = new AgentState();
      initialState.messages = [new HumanMessage(query)];
      initialState.context = { ...additionalContext };
      
      // Load memory for this session
      const sessionMemory = await this.loadSessionMemory(sessionId);
      initialState.memory = sessionMemory;
      
      const result = await this.graph.invoke(initialState, {
        configurable: { thread_id: sessionId }
      });
      
      const response = result.messages[result.messages.length - 1].content;
      
      // Save updated memory
      await this.saveSessionMemory(sessionId, result.memory);
      
      return {
        response,
        context: result.context,
        toolsUsed: result.tools_output ? ['devops_analysis'] : []
      };
    } catch (error) {
      logger.error('Error processing agentic query:', error);
      return {
        response: 'I encountered an error while processing your request. Please try again.',
        context: {},
        toolsUsed: []
      };
    }
  }

  async loadSessionMemory(sessionId) {
    // In a production environment, this would load from a persistent store
    // For now, we'll use a simple in-memory approach
    if (!this.sessionMemories) {
      this.sessionMemories = new Map();
    }
    
    return this.sessionMemories.get(sessionId) || {};
  }

  async saveSessionMemory(sessionId, memory) {
    if (!this.sessionMemories) {
      this.sessionMemories = new Map();
    }
    
    this.sessionMemories.set(sessionId, memory);
  }

  // Enhanced methods that utilize agentic capabilities
  async summarizeWithContext(type, data, sessionId = 'default') {
    const contextualQuery = this.buildContextualQuery(type, data);
    return await this.processQuery(contextualQuery, sessionId, { data, type });
  }

  buildContextualQuery(type, data) {
    switch (type) {
      case 'build_failure':
        return `Analyze this build failure and provide actionable insights: ${JSON.stringify(data, null, 2)}`;
      case 'work_item':
        return `Analyze this work item and provide progress insights: ${JSON.stringify(data, null, 2)}`;
      case 'pull_request':
        return `Analyze this pull request and provide review insights: ${JSON.stringify(data, null, 2)}`;
      case 'sprint_summary':
        return `Analyze this sprint data and provide team performance insights: ${JSON.stringify(data, null, 2)}`;
      default:
        return `Analyze this DevOps data: ${JSON.stringify(data, null, 2)}`;
    }
  }

  async getProactiveInsights(metrics, sessionId = 'team_metrics') {
    const query = `Based on these DevOps metrics, what proactive improvements should the team consider? ${JSON.stringify(metrics, null, 2)}`;
    return await this.processQuery(query, sessionId, { metrics, type: 'proactive_analysis' });
  }
}

export const agenticAIService = new AgenticAIService();