import express from 'express';
import { logger } from '../utils/logger.js';
import { configLoader } from '../config/settings.js';
import { workItemWebhook } from './workItemWebhook.js';
import { buildWebhook } from './buildWebhook.js';
import { pullRequestWebhook } from './pullRequestWebhook.js';
import { validateWebhookSignature } from '../utils/webhookValidator.js';

const router = express.Router();

// Middleware to validate webhook signature (if configured)
const webhookAuth = (req, res, next) => {
  const webhookSecret = configLoader.getSecurityConfig().webhookSecret;
  
  if (webhookSecret) {
    const isValid = validateWebhookSignature(req, webhookSecret);
    if (!isValid) {
      logger.warn('Invalid webhook signature', {
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
      return res.status(401).json({ error: 'Invalid signature' });
    }
  }
  
  next();
};

// Middleware to log all webhook events
const logWebhookEvent = (req, res, next) => {
  const eventType = req.body?.eventType || 'unknown';
  const resourceType = req.body?.resource?.resourceType || 'unknown';
  
  logger.info('Webhook event received', {
    eventType,
    resourceType,
    subscriptionId: req.body?.subscriptionId,
    ip: req.ip
  });
  
  next();
};

// Apply middleware to all webhook routes
// router.use(webhookAuth);
router.use(logWebhookEvent);

// Work Item webhooks
router.post('/workitem/created', workItemWebhook.handleCreated);
router.post('/workitem/updated', workItemWebhook.handleUpdated);

// Build/Pipeline webhooks
router.post('/build/completed', buildWebhook.handleCompleted);

// Pull Request webhooks
router.post('/pullrequest/created', pullRequestWebhook.handleCreated);
router.post('/pullrequest/updated', pullRequestWebhook.handleUpdated);

// Generic webhook endpoint for testing
router.post('/test', (req, res) => {
  logger.info('Test webhook received', {
    body: req.body,
    headers: req.headers
  });
  
  res.json({
    message: 'Test webhook received successfully',
    timestamp: new Date().toISOString(),
    eventType: req.body?.eventType || 'test'
  });
});

// Health check for webhooks
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'webhooks',
    timestamp: new Date().toISOString()
  });
});

export { router as webhookRoutes };
