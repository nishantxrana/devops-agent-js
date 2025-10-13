# Production Readiness Implementation Guide
## Step-by-Step Instructions with Code Examples

This guide provides **ready-to-use code** for implementing all critical production readiness improvements identified in the audit.

---

## 🚀 PHASE 1: CRITICAL SECURITY FIXES (Priority 1)

### Step 1: Install Required Dependencies

```bash
cd backend
npm install zod uuid @sentry/node
npm install --save-dev @types/node

cd ../frontend
npm install --save-dev @sentry/react
```

---

### Step 2: Implement Input Validation with Zod

**Create**: `backend/validators/schemas.js`

```javascript
import { z } from 'zod';

// Common validation patterns
export const cronPattern = /^(\*|([0-9]|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9])|\*\/([0-9]|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9])) (\*|([0-9]|1[0-9]|2[0-3])|\*\/([0-9]|1[0-9]|2[0-3])) (\*|([1-9]|1[0-9]|2[0-9]|3[0-1])|\*\/([1-9]|1[0-9]|2[0-9]|3[0-1])) (\*|([1-9]|1[0-2])|\*\/([1-9]|1[0-2])) (\*|([0-6])|\*\/([0-6]))$/;
export const organizationPattern = /^[a-zA-Z0-9-_]+$/;

// User Settings Schema
export const userSettingsSchema = z.object({
  azureDevOps: z.object({
    organization: z.string()
      .min(1, 'Organization is required')
      .max(100, 'Organization too long')
      .regex(organizationPattern, 'Invalid organization format'),
    project: z.string()
      .min(1, 'Project is required')
      .max(100, 'Project too long'),
    pat: z.string()
      .min(20, 'PAT too short')
      .max(200, 'PAT too long')
      .optional()
      .or(z.literal('***')), // Allow masked value
    baseUrl: z.string()
      .url('Invalid Azure DevOps URL')
      .default('https://dev.azure.com')
  }).optional(),
  
  ai: z.object({
    provider: z.enum(['openai', 'groq', 'gemini'], {
      errorMap: () => ({ message: 'Invalid AI provider' })
    }),
    model: z.string()
      .min(1, 'Model is required')
      .max(100, 'Model name too long'),
    apiKeys: z.object({
      openai: z.string().max(200).optional().or(z.literal('***')),
      groq: z.string().max(200).optional().or(z.literal('***')),
      gemini: z.string().max(200).optional().or(z.literal('***'))
    }).optional()
  }).optional(),
  
  notifications: z.object({
    enabled: z.boolean(),
    teams: z.object({
      webhookUrl: z.string().url('Invalid Teams webhook URL').optional()
    }).optional(),
    slack: z.object({
      webhookUrl: z.string().url('Invalid Slack webhook URL').optional()
    }).optional(),
    googleChat: z.object({
      webhookUrl: z.string().url('Invalid Google Chat webhook URL').optional()
    }).optional()
  }).optional(),
  
  polling: z.object({
    workItems: z.string()
      .regex(cronPattern, 'Invalid cron expression for workItems')
      .optional(),
    pipelines: z.string()
      .regex(cronPattern, 'Invalid cron expression for pipelines')
      .optional(),
    pullRequests: z.string()
      .regex(cronPattern, 'Invalid cron expression for pullRequests')
      .optional(),
    overdueCheck: z.string()
      .regex(cronPattern, 'Invalid cron expression for overdueCheck')
      .optional()
  }).optional()
});

// Test Connection Schema
export const testConnectionSchema = z.object({
  organization: z.string()
    .min(1, 'Organization is required')
    .regex(organizationPattern, 'Invalid organization format'),
  project: z.string().min(1, 'Project is required'),
  personalAccessToken: z.string().min(20, 'PAT is required'),
  baseUrl: z.string().url('Invalid base URL').default('https://dev.azure.com')
});

// Auth Schemas
export const loginSchema = z.object({
  email: z.string()
    .email('Invalid email address')
    .max(255, 'Email too long')
    .toLowerCase(),
  password: z.string()
    .min(1, 'Password is required')
    .max(100, 'Password too long')
});

export const registerSchema = z.object({
  email: z.string()
    .email('Invalid email address')
    .max(255, 'Email too long')
    .toLowerCase(),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password too long')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
  name: z.string()
    .min(1, 'Name is required')
    .max(100, 'Name too long')
    .trim()
});

// Build ID Schema
export const buildIdSchema = z.object({
  buildId: z.string()
    .regex(/^\d+$/, 'Build ID must be numeric')
    .transform(Number)
    .refine(val => val > 0, 'Build ID must be positive')
});

// Pull Request ID Schema
export const pullRequestIdSchema = z.object({
  pullRequestId: z.string()
    .regex(/^\d+$/, 'Pull Request ID must be numeric')
    .transform(Number)
    .refine(val => val > 0, 'Pull Request ID must be positive')
});

// Work Item ID Schema
export const workItemIdSchema = z.object({
  workItemId: z.string()
    .regex(/^\d+$/, 'Work Item ID must be numeric')
    .transform(Number)
    .refine(val => val > 0, 'Work Item ID must be positive')
});

// Pagination Schema
export const paginationSchema = z.object({
  page: z.string()
    .regex(/^\d+$/)
    .transform(Number)
    .refine(val => val > 0, 'Page must be positive')
    .optional()
    .default('1'),
  limit: z.string()
    .regex(/^\d+$/)
    .transform(Number)
    .refine(val => val > 0 && val <= 100, 'Limit must be between 1 and 100')
    .optional()
    .default('20')
});
```

**Create**: `backend/middleware/validation.js`

```javascript
import { z } from 'zod';
import { logger } from '../utils/logger.js';

/**
 * Validation middleware factory
 * @param {z.ZodSchema} schema - Zod schema to validate against
 * @param {string} source - Where to get data from ('body', 'params', 'query')
 */
export const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    try {
      const data = req[source];
      const validated = schema.parse(data);
      
      // Replace request data with validated data
      req[source] = validated;
      
      // Store original for logging if needed
      req.validatedData = validated;
      
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        logger.warn('Validation failed', {
          path: req.path,
          errors: error.errors,
          requestId: req.id
        });
        
        return res.status(400).json({
          error: 'Validation failed',
          details: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
            code: err.code
          }))
        });
      }
      
      // Unexpected error
      logger.error('Validation error', { error, requestId: req.id });
      return res.status(500).json({ error: 'Internal validation error' });
    }
  };
};

/**
 * Sanitize validated data by removing masked values
 */
export const sanitizeMaskedValues = (data, originalData) => {
  const result = { ...data };
  
  // Remove fields that are marked as '***' (masked)
  const checkMasked = (obj, original, path = []) => {
    for (const key in obj) {
      const currentPath = [...path, key];
      
      if (obj[key] === '***') {
        // Keep original value
        const originalValue = getNestedValue(original, currentPath);
        if (originalValue && originalValue !== '***') {
          setNestedValue(result, currentPath, originalValue);
        } else {
          // Remove the field if it was masked and no original exists
          deleteNestedValue(result, currentPath);
        }
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        checkMasked(obj[key], original, currentPath);
      }
    }
  };
  
  checkMasked(data, originalData);
  return result;
};

function getNestedValue(obj, path) {
  return path.reduce((current, key) => current?.[key], obj);
}

function setNestedValue(obj, path, value) {
  const lastKey = path[path.length - 1];
  const parent = path.slice(0, -1).reduce((current, key) => {
    if (!current[key]) current[key] = {};
    return current[key];
  }, obj);
  parent[lastKey] = value;
}

function deleteNestedValue(obj, path) {
  const lastKey = path[path.length - 1];
  const parent = path.slice(0, -1).reduce((current, key) => current?.[key], obj);
  if (parent) delete parent[lastKey];
}
```

**Update**: `backend/api/routes.js` - Add validation to routes

```javascript
import { validate } from '../middleware/validation.js';
import { 
  userSettingsSchema, 
  testConnectionSchema,
  buildIdSchema 
} from '../validators/schemas.js';

// Apply validation to settings update
router.put('/settings', 
  authenticate,
  validate(userSettingsSchema, 'body'),
  async (req, res) => {
    try {
      const updates = req.validatedData;
      
      // Get current settings to preserve masked values
      const currentSettings = await getUserSettings(req.user._id);
      const sanitized = sanitizeMaskedValues(updates, currentSettings);
      
      await updateUserSettings(req.user._id, sanitized);
      res.json({ success: true, message: 'Settings updated successfully' });
    } catch (error) {
      logger.error('Error updating user settings:', error);
      res.status(500).json({ error: 'Failed to update settings' });
    }
  }
);

// Apply validation to test connection
router.post('/settings/test-connection',
  authenticate,
  validate(testConnectionSchema, 'body'),
  async (req, res) => {
    try {
      const { organization, project, personalAccessToken, baseUrl } = req.validatedData;
      // ... rest of the handler
    } catch (error) {
      logger.error('Error testing connection:', error);
      res.status(500).json({ error: 'Connection test failed' });
    }
  }
);
```

**Update**: `backend/routes/auth.js` - Add validation

```javascript
import { validate } from '../middleware/validation.js';
import { loginSchema, registerSchema } from '../validators/schemas.js';

// Login with validation
router.post('/login', validate(loginSchema, 'body'), async (req, res) => {
  try {
    const { email, password } = req.validatedData;
    // ... rest of handler
  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Register with validation
router.post('/register', validate(registerSchema, 'body'), async (req, res) => {
  try {
    const { email, password, name } = req.validatedData;
    // ... rest of handler
  } catch (error) {
    logger.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});
```

---

### Step 3: Fix CORS Configuration

**Update**: `backend/main.js`

```javascript
import cors from 'cors';

// Determine allowed origins based on environment
const allowedOrigins = process.env.NODE_ENV === 'production'
  ? (process.env.ALLOWED_ORIGINS || '').split(',').filter(Boolean)
  : ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:3001'];

// Add production URL as fallback
if (process.env.NODE_ENV === 'production' && process.env.FRONTEND_URL) {
  allowedOrigins.push(process.env.FRONTEND_URL);
}

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin && process.env.NODE_ENV === 'development') {
      return callback(null, true);
    }
    
    if (!origin) {
      return callback(new Error('Origin required'));
    }
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      logger.warn('CORS request rejected', { origin, requestId: req.id });
      callback(new Error(`Origin ${origin} not allowed by CORS`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
  exposedHeaders: ['X-Request-ID'],
  maxAge: 600 // Cache preflight for 10 minutes
}));

// Log allowed origins on startup
logger.info('CORS configured', { 
  allowedOrigins, 
  environment: process.env.NODE_ENV 
});
```

---

### Step 4: Implement Proper Rate Limiting

**Create**: `backend/middleware/rateLimiting.js`

```javascript
import rateLimit from 'express-rate-limit';
import { logger } from '../utils/logger.js';

/**
 * Create a rate limiter with specified options
 */
const createRateLimiter = (options) => {
  const defaults = {
    trustProxy: 1,
    keyGenerator: (req) => {
      const ip = req.ip || req.socket?.remoteAddress || 'unknown';
      return ip.split(':')[0]; // Remove port
    },
    handler: (req, res) => {
      logger.warn('Rate limit exceeded', {
        ip: req.ip,
        path: req.path,
        requestId: req.id
      });
      res.status(429).json({
        error: 'Too many requests',
        message: options.message || 'Please try again later',
        retryAfter: Math.ceil(options.windowMs / 1000)
      });
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => req.path === '/api/health'
  };
  
  return rateLimit({ ...defaults, ...options });
};

// Different rate limiters for different use cases
export const authRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts
  message: 'Too many authentication attempts. Please try again later.',
  skipSuccessfulRequests: true // Don't count successful logins
});

export const apiRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 100 : 1000,
  message: 'API rate limit exceeded. Please slow down.'
});

export const aiRateLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: process.env.NODE_ENV === 'production' ? 20 : 100,
  message: 'AI API rate limit exceeded. Please try again later.'
});

export const webhookRateLimiter = createRateLimiter({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 50, // 50 webhooks per minute
  message: 'Webhook rate limit exceeded.'
});

// Stricter rate limiter for expensive operations
export const expensiveOperationLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 requests per hour
  message: 'Rate limit exceeded for this operation.'
});
```

**Update**: `backend/main.js`

```javascript
import { 
  apiRateLimiter, 
  authRateLimiter, 
  webhookRateLimiter 
} from './middleware/rateLimiting.js';

// Apply different rate limiters to different routes
app.use('/api/auth', authRateLimiter);
app.use('/api/webhooks', webhookRateLimiter);
app.use('/api', apiRateLimiter); // General API rate limit

// Log rate limiter configuration
logger.info('Rate limiting configured', {
  environment: process.env.NODE_ENV,
  authLimit: '5 per 15min',
  apiLimit: process.env.NODE_ENV === 'production' ? '100 per 15min' : '1000 per 15min'
});
```

---

### Step 5: Remove Debug Endpoint

**Update**: `backend/api/routes.js`

```javascript
// Remove or guard the debug endpoint
if (process.env.NODE_ENV === 'development') {
  router.get('/debug/token', authenticate, (req, res) => {
    // Only allow in development and only for authenticated users
    res.json({ 
      userId: req.user._id,
      email: req.user.email,
      tokenExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      environment: process.env.NODE_ENV
    });
  });
}
```

---

### Step 6: Add Helmet Security Headers

**Update**: `backend/main.js`

```javascript
import helmet from 'helmet';

// Apply Helmet with production-grade configuration
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"], // Tailwind CSS needs unsafe-inline
      scriptSrc: ["'self'"],
      scriptSrcAttr: ["'unsafe-inline'"], // For inline event handlers if needed
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      connectSrc: [
        "'self'", 
        "https://dev.azure.com",
        "https://*.visualstudio.com",
        ...(process.env.NODE_ENV === 'development' ? ['http://localhost:*'] : [])
      ],
      fontSrc: ["'self'", "data:"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
      ...(process.env.NODE_ENV === 'production' && { upgradeInsecureRequests: [] })
    }
  },
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true
  },
  frameguard: {
    action: 'deny' // Prevent clickjacking
  },
  noSniff: true, // Prevent MIME sniffing
  xssFilter: true, // Enable XSS filter
  referrerPolicy: {
    policy: 'strict-origin-when-cross-origin'
  },
  permittedCrossDomainPolicies: {
    permittedPolicies: 'none'
  }
}));

logger.info('Security headers configured with Helmet');
```

---

### Step 7: Validate Secrets at Startup

**Create**: `backend/config/validation.js`

```javascript
import crypto from 'crypto';
import { logger } from '../utils/logger.js';
import { z } from 'zod';

/**
 * Validate environment configuration at startup
 */
export function validateEnvironment() {
  logger.info('Validating environment configuration...');
  
  const errors = [];
  
  // Required secrets
  const requiredSecrets = {
    JWT_SECRET: {
      validator: (val) => val && val.length >= 32,
      message: 'JWT_SECRET must be at least 32 characters long'
    },
    ENCRYPTION_KEY: {
      validator: (val) => val && /^[0-9a-fA-F]{64}$/.test(val),
      message: 'ENCRYPTION_KEY must be exactly 64 hex characters (32 bytes)'
    },
    MONGODB_URI: {
      validator: (val) => val && (val.startsWith('mongodb://') || val.startsWith('mongodb+srv://')),
      message: 'MONGODB_URI must be a valid MongoDB connection string'
    }
  };
  
  // Check required secrets
  for (const [key, config] of Object.entries(requiredSecrets)) {
    const value = process.env[key];
    
    if (!value) {
      errors.push(`${key} is required but not set`);
    } else if (!config.validator(value)) {
      errors.push(config.message);
    }
  }
  
  // Check at least one AI provider is configured (warn only)
  const hasAIProvider = process.env.OPENAI_API_KEY || 
                        process.env.GROQ_API_KEY || 
                        process.env.GEMINI_API_KEY;
  
  if (!hasAIProvider) {
    logger.warn('⚠️  No AI provider API keys configured globally. Users must configure their own AI settings.');
  }
  
  // Validate NODE_ENV
  const validEnvs = ['development', 'production', 'test'];
  const nodeEnv = process.env.NODE_ENV || 'development';
  if (!validEnvs.includes(nodeEnv)) {
    errors.push(`NODE_ENV must be one of: ${validEnvs.join(', ')}`);
  }
  
  // Validate PORT
  const port = process.env.PORT || '3001';
  if (!/^\d+$/.test(port) || parseInt(port) < 1 || parseInt(port) > 65535) {
    errors.push('PORT must be a valid port number (1-65535)');
  }
  
  // Production-specific validations
  if (nodeEnv === 'production') {
    // Ensure FRONTEND_URL is set in production
    if (!process.env.FRONTEND_URL) {
      logger.warn('⚠️  FRONTEND_URL not set in production. CORS may not work correctly.');
    }
    
    // Warn about development-like secrets
    if (process.env.JWT_SECRET === 'your-jwt-secret-key-here-64-characters-long-random-string-example') {
      errors.push('JWT_SECRET is using the default example value. Generate a strong random secret!');
    }
    
    if (process.env.ENCRYPTION_KEY === 'your-32-byte-hex-encryption-key-here-64-characters-total-example') {
      errors.push('ENCRYPTION_KEY is using the default example value. Generate a strong random key!');
    }
    
    // Check log level is appropriate for production
    const logLevel = process.env.LOG_LEVEL || 'info';
    if (logLevel === 'debug') {
      logger.warn('⚠️  LOG_LEVEL is set to "debug" in production. Consider using "info" or "warn".');
    }
  }
  
  // If there are errors, fail startup
  if (errors.length > 0) {
    logger.error('❌ Environment validation failed:', { errors });
    console.error('\n❌ ENVIRONMENT VALIDATION FAILED:\n');
    errors.forEach(err => console.error(`   - ${err}`));
    console.error('\nPlease fix the issues above and restart the application.\n');
    process.exit(1);
  }
  
  logger.info('✅ Environment validation passed', {
    nodeEnv,
    port,
    hasMongoDb: true,
    hasJwtSecret: true,
    hasEncryptionKey: true,
    hasAIProvider
  });
}

/**
 * Generate a strong secret (for documentation purposes)
 */
export function generateSecret(length = 64) {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Generate examples for documentation
 */
export function printSecretExamples() {
  console.log('Example secrets (for development only):');
  console.log(`JWT_SECRET=${generateSecret(32)}`);
  console.log(`ENCRYPTION_KEY=${generateSecret(32)}`);
}
```

**Update**: `backend/main.js`

```javascript
import { validateEnvironment } from './config/validation.js';

// Validate environment before starting anything else
try {
  validateEnvironment();
} catch (error) {
  logger.error('Failed to validate environment:', error);
  process.exit(1);
}

// Rest of the application...
```

---

### Step 8: Disable Source Maps in Production

**Update**: `frontend/vite.config.js`

```javascript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig(({ mode }) => {
  const isProduction = mode === 'production';
  
  return {
    plugins: [react()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    server: {
      port: 5173,
      host: true,
      proxy: {
        '/api': {
          target: process.env.VITE_API_URL || 'http://localhost:3001',
          changeOrigin: true,
          secure: false
        }
      }
    },
    build: {
      outDir: 'dist',
      sourcemap: !isProduction, // Disable source maps in production
      minify: isProduction ? 'terser' : 'esbuild',
      terserOptions: isProduction ? {
        compress: {
          drop_console: true, // Remove console.logs in production
          drop_debugger: true,
          pure_funcs: ['console.log', 'console.debug'] // Remove specific console methods
        },
        format: {
          comments: false // Remove all comments
        }
      } : undefined,
      rollupOptions: {
        output: {
          manualChunks: {
            // Split vendor code for better caching
            'react-vendor': ['react', 'react-dom', 'react-router-dom'],
            'ui-vendor': [
              '@radix-ui/react-dialog',
              '@radix-ui/react-dropdown-menu',
              '@radix-ui/react-scroll-area',
              '@radix-ui/react-separator',
              '@radix-ui/react-tabs',
              '@radix-ui/react-tooltip'
            ],
            'utils': ['axios', 'date-fns', 'clsx']
          }
        }
      },
      chunkSizeWarningLimit: 1000 // Warn for chunks > 1MB
    },
    define: {
      // Ensure environment is clearly defined
      'process.env.NODE_ENV': JSON.stringify(mode)
    }
  };
});
```

---

### Step 9: Add Request ID Tracking

**Create**: `backend/middleware/requestId.js`

```javascript
import { v4 as uuidv4 } from 'uuid';

/**
 * Add unique request ID to each request for tracing
 */
export const requestIdMiddleware = (req, res, next) => {
  // Use existing request ID if provided, otherwise generate new one
  req.id = req.header('X-Request-ID') || uuidv4();
  
  // Add to response headers
  res.setHeader('X-Request-ID', req.id);
  
  next();
};
```

**Update**: `backend/main.js`

```javascript
import { requestIdMiddleware } from './middleware/requestId.js';

// Add request ID middleware early in the chain
app.use(requestIdMiddleware);

// Update request logging to include request ID
app.use((req, res, next) => {
  const start = Date.now();
  
  // Log request start
  logger.info('Request started', {
    requestId: req.id,
    method: req.method,
    path: req.path,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });
  
  // Log when response finishes
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info('Request completed', {
      requestId: req.id,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration,
      userId: req.user?._id
    });
  });
  
  next();
});
```

---

### Step 10: Sanitize Logs

**Create**: `backend/utils/logSanitizer.js`

```javascript
/**
 * Sanitize sensitive data from logs
 */
export function sanitizeForLogging(data, depth = 0) {
  // Prevent infinite recursion
  if (depth > 5) return '[Max Depth Exceeded]';
  
  // List of sensitive field names (case-insensitive)
  const sensitiveFields = [
    'password',
    'token',
    'secret',
    'apikey',
    'api_key',
    'apiKey',
    'pat',
    'personalAccessToken',
    'authorization',
    'auth',
    'bearer',
    'credential',
    'private',
    'key',
    'passphrase',
    'accessToken',
    'refreshToken',
    'sessionId',
    'cookie',
    'csrf'
  ];
  
  if (data === null || data === undefined) {
    return data;
  }
  
  if (typeof data === 'string') {
    // Check if string looks like a token/secret
    if (data.length > 20 && /^[A-Za-z0-9_\-\.]+$/.test(data)) {
      return `***${data.slice(-4)}`;
    }
    return data;
  }
  
  if (Array.isArray(data)) {
    return data.map(item => sanitizeForLogging(item, depth + 1));
  }
  
  if (typeof data === 'object') {
    const sanitized = {};
    
    for (const [key, value] of Object.entries(data)) {
      const lowerKey = key.toLowerCase();
      
      // Check if field name is sensitive
      const isSensitive = sensitiveFields.some(field => 
        lowerKey.includes(field.toLowerCase())
      );
      
      if (isSensitive) {
        sanitized[key] = '***REDACTED***';
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = sanitizeForLogging(value, depth + 1);
      } else {
        sanitized[key] = value;
      }
    }
    
    return sanitized;
  }
  
  return data;
}

/**
 * Sanitize error objects for logging
 */
export function sanitizeError(error) {
  return {
    message: error.message,
    name: error.name,
    code: error.code,
    stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    ...(error.details && { details: sanitizeForLogging(error.details) })
  };
}
```

**Update**: `backend/utils/logger.js`

```javascript
import { sanitizeForLogging } from './logSanitizer.js';

// Override logger methods to sanitize
const originalInfo = logger.info.bind(logger);
const originalWarn = logger.warn.bind(logger);
const originalError = logger.error.bind(logger);

logger.info = (message, meta) => {
  originalInfo(message, sanitizeForLogging(meta));
};

logger.warn = (message, meta) => {
  originalWarn(message, sanitizeForLogging(meta));
};

logger.error = (message, meta) => {
  originalError(message, sanitizeForLogging(meta));
};
```

---

## 📝 UPDATE ENVIRONMENT FILES

### Update `.env.example`

```env
# Environment
NODE_ENV=development
PORT=3001
LOG_LEVEL=info

# Database (Required)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/dbname?retryWrites=true&w=majority

# Security (Required - MUST CHANGE IN PRODUCTION)
JWT_SECRET=your-jwt-secret-key-here-64-characters-long-random-string-example-12
ENCRYPTION_KEY=0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef

# CORS Configuration (Production)
FRONTEND_URL=https://your-production-domain.com
ALLOWED_ORIGINS=https://your-production-domain.com,https://www.your-production-domain.com

# Azure DevOps (Optional - can be configured per user)
AZURE_DEVOPS_ORG=your-organization
AZURE_DEVOPS_PROJECT=your-project
AZURE_DEVOPS_PAT=your-personal-access-token
AZURE_DEVOPS_BASE_URL=https://dev.azure.com

# AI Providers (Optional - at least one recommended)
OPENAI_API_KEY=sk-...
GROQ_API_KEY=gsk_...
GEMINI_API_KEY=AI...
AI_MODEL=gemini-2.0-flash

# Notifications (Optional)
TEAMS_WEBHOOK_URL=https://outlook.office.com/webhook/...
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...
GOOGLE_CHAT_WEBHOOK_URL=https://chat.googleapis.com/v1/spaces/...
NOTIFICATIONS_ENABLED=true

# Rate Limiting (Optional)
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100

# Monitoring (Optional)
SENTRY_DSN=https://...@sentry.io/...
```

### Create `.env.production.example`

```env
# PRODUCTION ENVIRONMENT CONFIGURATION
# ⚠️ GENERATE STRONG RANDOM VALUES FOR ALL SECRETS!

NODE_ENV=production
PORT=3001
LOG_LEVEL=warn

# Database (Required)
MONGODB_URI=mongodb+srv://user:password@production-cluster.mongodb.net/production-db?retryWrites=true&w=majority

# Security (Required - GENERATE NEW VALUES!)
# Generate JWT_SECRET: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
JWT_SECRET=
# Generate ENCRYPTION_KEY: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
ENCRYPTION_KEY=

# CORS Configuration (Required)
FRONTEND_URL=https://your-production-domain.com
ALLOWED_ORIGINS=https://your-production-domain.com

# Azure DevOps (Optional)
AZURE_DEVOPS_ORG=
AZURE_DEVOPS_PROJECT=
AZURE_DEVOPS_PAT=
AZURE_DEVOPS_BASE_URL=https://dev.azure.com

# AI Providers (At least one required)
OPENAI_API_KEY=
GROQ_API_KEY=
GEMINI_API_KEY=

# Notifications (Optional)
TEAMS_WEBHOOK_URL=
SLACK_WEBHOOK_URL=
GOOGLE_CHAT_WEBHOOK_URL=
NOTIFICATIONS_ENABLED=true

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100

# Monitoring (Recommended)
SENTRY_DSN=
```

---

## 🧪 TESTING

### Create Test Infrastructure

**Create**: `backend/__tests__/setup.js`

```javascript
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongoServer;

// Setup before all tests
beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);
});

// Cleanup after all tests
afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

// Clear database between tests
afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany();
  }
});
```

**Update**: `backend/package.json`

```json
{
  "scripts": {
    "test": "NODE_ENV=test jest --detectOpenHandles",
    "test:watch": "NODE_ENV=test jest --watch",
    "test:coverage": "NODE_ENV=test jest --coverage"
  },
  "jest": {
    "testEnvironment": "node",
    "setupFilesAfterEnv": ["./__tests__/setup.js"],
    "coveragePathIgnorePatterns": ["/node_modules/", "/__tests__/"],
    "testMatch": ["**/__tests__/**/*.test.js"]
  }
}
```

---

## 📦 FINAL PACKAGE.JSON UPDATES

**Update**: `backend/package.json` - Add new dependencies

```json
{
  "dependencies": {
    "existing-deps": "...",
    "zod": "^3.22.4",
    "uuid": "^9.0.1",
    "@sentry/node": "^7.93.0",
    "node-cache": "^5.1.2",
    "compression": "^1.7.4"
  },
  "devDependencies": {
    "existing-dev-deps": "...",
    "mongodb-memory-server": "^9.1.5"
  }
}
```

Run:
```bash
cd backend
npm install
```

---

## ✅ VALIDATION CHECKLIST

After implementing all changes:

- [ ] Run `npm audit` and fix vulnerabilities
- [ ] Test all API endpoints with invalid inputs
- [ ] Verify CORS only allows configured origins
- [ ] Test rate limiting by making many requests
- [ ] Confirm debug endpoint is removed/protected
- [ ] Verify source maps are not in production build
- [ ] Test with missing environment variables
- [ ] Check logs for sensitive data leakage
- [ ] Verify request IDs in all log entries
- [ ] Test authentication with weak passwords (should fail)

---

## 🚀 DEPLOYMENT CHECKLIST

Before deploying to production:

1. **Generate Production Secrets**
   ```bash
   node -e "console.log('JWT_SECRET=' + require('crypto').randomBytes(32).toString('hex'))"
   node -e "console.log('ENCRYPTION_KEY=' + require('crypto').randomBytes(32).toString('hex'))"
   ```

2. **Set Environment Variables in Azure App Service**
   - Go to Configuration → Application Settings
   - Add all required environment variables
   - Set `NODE_ENV=production`

3. **Test Production Build Locally**
   ```bash
   npm run build
   NODE_ENV=production npm start
   ```

4. **Verify Security Headers**
   ```bash
   curl -I https://your-domain.com
   # Check for X-Frame-Options, X-Content-Type-Options, etc.
   ```

5. **Test Rate Limiting**
   ```bash
   # Make 101 requests quickly
   for i in {1..101}; do curl https://your-domain.com/api/health; done
   # Should see 429 after 100 requests
   ```

6. **Monitor Logs**
   - Check for any errors
   - Verify no sensitive data in logs
   - Confirm request IDs are present

---

**End of Implementation Guide**

For complete audit details, see `PRODUCTION_READINESS_AUDIT.md`
