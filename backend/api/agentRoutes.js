import express from 'express';
import { logger } from '../utils/logger.js';
import { devOpsAgent } from '../ai/agentSystem.js';
import rateLimit from 'express-rate-limit';

const router = express.Router();

// Rate limiting for agent interactions
const agentRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // limit each IP to 50 requests per windowMs
  message: {
    error: 'Too many agent requests, please try again later',
    retryAfter: 15 * 60 // 15 minutes in seconds
  }
});

// Apply rate limiting to all agent routes
router.use(agentRateLimit);

/**
 * Start a new conversation with the DevOps agent
 * POST /api/agent/chat
 */
router.post('/chat', async (req, res) => {
  try {
    const { message, conversationId, userId = 'default' } = req.body;
    
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({
        error: 'Message is required and must be a non-empty string'
      });
    }

    if (message.length > 2000) {
      return res.status(400).json({
        error: 'Message too long, maximum 2000 characters allowed'
      });
    }

    logger.info('Agent chat request', {
      userId,
      conversationId,
      messageLength: message.length
    });

    const response = await devOpsAgent.chat(message, conversationId, userId);
    
    res.json({
      success: true,
      ...response
    });

  } catch (error) {
    logger.error('Agent chat error:', error);
    res.status(500).json({
      error: 'Failed to process agent request',
      message: error.message
    });
  }
});

/**
 * Get conversation history
 * GET /api/agent/conversations/:conversationId
 */
router.get('/conversations/:conversationId', async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { userId = 'default' } = req.query;

    const conversation = devOpsAgent.getConversation(conversationId, userId);
    
    if (!conversation) {
      return res.status(404).json({
        error: 'Conversation not found'
      });
    }

    // Format conversation history for frontend
    const formattedHistory = conversation.history.map((message, index) => ({
      id: index,
      type: message._getType(),
      content: message.content,
      timestamp: conversation.createdAt // Simplified - in production, track individual message timestamps
    }));

    res.json({
      success: true,
      conversation: {
        id: conversation.id,
        userId: conversation.userId,
        createdAt: conversation.createdAt,
        lastActivity: conversation.lastActivity,
        messages: formattedHistory
      }
    });

  } catch (error) {
    logger.error('Get conversation error:', error);
    res.status(500).json({
      error: 'Failed to get conversation',
      message: error.message
    });
  }
});

/**
 * List all conversations for a user
 * GET /api/agent/conversations
 */
router.get('/conversations', async (req, res) => {
  try {
    const { userId = 'default' } = req.query;

    const conversations = devOpsAgent.getConversations(userId);
    
    res.json({
      success: true,
      conversations
    });

  } catch (error) {
    logger.error('List conversations error:', error);
    res.status(500).json({
      error: 'Failed to list conversations',
      message: error.message
    });
  }
});

/**
 * Execute an autonomous workflow
 * POST /api/agent/workflow
 */
router.post('/workflow', async (req, res) => {
  try {
    const { trigger, data } = req.body;
    
    if (!trigger || typeof trigger !== 'string') {
      return res.status(400).json({
        error: 'Trigger is required and must be a string'
      });
    }

    const validTriggers = ['build_failed', 'pr_idle', 'sprint_ending'];
    if (!validTriggers.includes(trigger)) {
      return res.status(400).json({
        error: `Invalid trigger. Must be one of: ${validTriggers.join(', ')}`
      });
    }

    logger.info('Autonomous workflow request', {
      trigger,
      dataKeys: data ? Object.keys(data) : []
    });

    const response = await devOpsAgent.executeAutonomousWorkflow(trigger, data || {});
    
    if (!response) {
      return res.status(400).json({
        error: 'No workflow found for the specified trigger'
      });
    }

    res.json({
      success: true,
      ...response
    });

  } catch (error) {
    logger.error('Autonomous workflow error:', error);
    res.status(500).json({
      error: 'Failed to execute autonomous workflow',
      message: error.message
    });
  }
});

/**
 * Get agent status and capabilities
 * GET /api/agent/status
 */
router.get('/status', async (req, res) => {
  try {
    const status = {
      initialized: devOpsAgent.initialized,
      model: devOpsAgent.model ? 'Connected' : 'Not initialized',
      tools: devOpsAgent.tools.map(tool => ({
        name: tool.name,
        description: tool.description
      })),
      conversationCount: devOpsAgent.conversations.size,
      capabilities: {
        reasoning: true,
        contextRetention: true,
        autonomousWorkflows: true,
        multiStepOperations: true,
        devOpsIntegration: true
      }
    };

    res.json({
      success: true,
      status
    });

  } catch (error) {
    logger.error('Agent status error:', error);
    res.status(500).json({
      error: 'Failed to get agent status',
      message: error.message
    });
  }
});

/**
 * Initialize the agent system
 * POST /api/agent/initialize
 */
router.post('/initialize', async (req, res) => {
  try {
    await devOpsAgent.initialize();
    
    res.json({
      success: true,
      message: 'Agent system initialized successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Agent initialization error:', error);
    res.status(500).json({
      error: 'Failed to initialize agent system',
      message: error.message
    });
  }
});

/**
 * Health check for agent system
 * GET /api/agent/health
 */
router.get('/health', async (req, res) => {
  try {
    const health = {
      status: devOpsAgent.initialized ? 'healthy' : 'initializing',
      initialized: devOpsAgent.initialized,
      modelReady: !!devOpsAgent.model,
      toolsCount: devOpsAgent.tools.length,
      conversationsActive: devOpsAgent.conversations.size,
      timestamp: new Date().toISOString()
    };

    const statusCode = devOpsAgent.initialized ? 200 : 503;
    res.status(statusCode).json(health);

  } catch (error) {
    logger.error('Agent health check error:', error);
    res.status(500).json({
      status: 'error',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

export default router;