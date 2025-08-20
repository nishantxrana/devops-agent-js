import { logger } from '../utils/logger.js';

/**
 * Tool registry for managing available tools that the agent can use
 */
class ToolRegistry {
  constructor() {
    this.tools = new Map();
    this.initialized = false;
  }

  /**
   * Register a tool with the registry
   */
  register(name, tool) {
    if (!tool.name || !tool.description || !tool.execute) {
      throw new Error(`Invalid tool: ${name}. Must have name, description, and execute properties.`);
    }

    this.tools.set(name, {
      ...tool,
      registeredAt: new Date().toISOString()
    });

    logger.debug('Tool registered', { name, description: tool.description });
  }

  /**
   * Get a tool by name
   */
  getTool(name) {
    return this.tools.get(name);
  }

  /**
   * Get all available tools
   */
  getAllTools() {
    return Array.from(this.tools.values());
  }

  /**
   * Get tools by category
   */
  getToolsByCategory(category) {
    return Array.from(this.tools.values()).filter(tool => tool.category === category);
  }

  /**
   * Check if a tool exists
   */
  hasTool(name) {
    return this.tools.has(name);
  }

  /**
   * Execute a tool with parameters
   */
  async executeTool(name, parameters = {}) {
    const tool = this.getTool(name);
    if (!tool) {
      throw new Error(`Tool not found: ${name}`);
    }

    logger.info('Executing tool', { name, parameters });

    const startTime = Date.now();
    try {
      const result = await tool.execute(parameters);
      const duration = Date.now() - startTime;
      
      logger.info('Tool execution completed', { 
        name, 
        duration: `${duration}ms`,
        success: true 
      });

      return {
        success: true,
        result,
        duration,
        tool: tool.name,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      
      logger.error('Tool execution failed', { 
        name, 
        duration: `${duration}ms`,
        error: error.message 
      });

      return {
        success: false,
        error: error.message,
        duration,
        tool: tool.name,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Get tool execution statistics
   */
  getToolStats() {
    const tools = this.getAllTools();
    return {
      totalTools: tools.length,
      toolsByCategory: tools.reduce((acc, tool) => {
        acc[tool.category] = (acc[tool.category] || 0) + 1;
        return acc;
      }, {}),
      tools: tools.map(tool => ({
        name: tool.name,
        category: tool.category,
        description: tool.description,
        registeredAt: tool.registeredAt
      }))
    };
  }

  /**
   * Validate tool parameters against schema
   */
  validateParameters(toolName, parameters) {
    const tool = this.getTool(toolName);
    if (!tool) {
      throw new Error(`Tool not found: ${toolName}`);
    }

    if (!tool.parameters) {
      return { valid: true };
    }

    const errors = [];
    
    // Check required parameters
    if (tool.parameters.required) {
      for (const param of tool.parameters.required) {
        if (!(param in parameters)) {
          errors.push(`Missing required parameter: ${param}`);
        }
      }
    }

    // Check parameter types (basic validation)
    if (tool.parameters.properties) {
      for (const [param, value] of Object.entries(parameters)) {
        const schema = tool.parameters.properties[param];
        if (schema && schema.type) {
          const actualType = typeof value;
          if (actualType !== schema.type) {
            errors.push(`Parameter ${param} expected ${schema.type}, got ${actualType}`);
          }
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Get tool documentation
   */
  getToolDocumentation(toolName = null) {
    if (toolName) {
      const tool = this.getTool(toolName);
      if (!tool) {
        throw new Error(`Tool not found: ${toolName}`);
      }
      return {
        name: tool.name,
        description: tool.description,
        category: tool.category,
        parameters: tool.parameters,
        examples: tool.examples || []
      };
    }

    // Return documentation for all tools
    return this.getAllTools().map(tool => ({
      name: tool.name,
      description: tool.description,
      category: tool.category,
      parameters: tool.parameters,
      examples: tool.examples || []
    }));
  }

  /**
   * Initialize default tools
   */
  async initialize() {
    if (this.initialized) return;

    // Import and register all tool modules
    try {
      const { azureDevOpsTools } = await import('./azureDevOpsTools.js');
      const { aiTools } = await import('./aiTools.js');
      const { notificationTools } = await import('./notificationTools.js');

      // Register Azure DevOps tools
      azureDevOpsTools.forEach(tool => this.register(tool.name, tool));
      
      // Register AI tools
      aiTools.forEach(tool => this.register(tool.name, tool));
      
      // Register notification tools
      notificationTools.forEach(tool => this.register(tool.name, tool));

      this.initialized = true;
      logger.info('Tool registry initialized', { totalTools: this.tools.size });
    } catch (error) {
      logger.error('Failed to initialize tool registry:', error);
      throw error;
    }
  }
}

export const toolRegistry = new ToolRegistry();