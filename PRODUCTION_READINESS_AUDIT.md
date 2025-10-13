# Production Readiness Audit Report
## Azure DevOps Monitoring Agent - Comprehensive Code Review

**Date**: October 13, 2025  
**Stack**: Node.js, Express, MongoDB, React, Vite, Docker, Azure App Service  
**Audit Focus**: Real-world production standards, security, performance, maintainability

---

## Executive Summary

This project is a **partially production-ready** application with several critical issues that must be addressed before deployment to production. The codebase shows good practices in some areas (logging, error handling structure) but has significant security vulnerabilities, missing validations, and configuration issues that pose risks in production environments.

**Production Readiness Score**: 60/100

### Critical Blockers (Must Fix)
1. Missing input validation on API endpoints (SQL/NoSQL injection risk)
2. Overly permissive CORS configuration
3. Development-level rate limiting (10,000 requests/15min)
4. Source maps enabled in production builds
5. Missing Helmet security headers
6. No request validation middleware
7. Public debug endpoint exposing token information
8. Missing environment-based configuration separation

---

## 🔴 CRITICAL ISSUES (Severity: High)

### 1. Security Vulnerabilities

#### 1.1 Missing Input Validation (CRITICAL)
**File**: `backend/api/routes.js`  
**Severity**: Critical  
**Risk**: NoSQL Injection, XSS, Data Corruption

**Issue**:
```javascript
router.put('/settings', async (req, res) => {
  const updates = { ...req.body }; // No validation!
  await updateUserSettings(req.user._id, updates);
});
```

**Impact**: Attackers can inject malicious data into MongoDB, potentially:
- Bypassing authentication
- Accessing other users' data
- Corrupting the database
- Executing unauthorized operations

**Fix**: Implement Zod validation schemas
```javascript
import { z } from 'zod';

const settingsSchema = z.object({
  azureDevOps: z.object({
    organization: z.string().min(1).max(100).regex(/^[a-zA-Z0-9-]+$/),
    project: z.string().min(1).max(100),
    pat: z.string().min(20).max(200).optional(),
    baseUrl: z.string().url()
  }).optional(),
  ai: z.object({
    provider: z.enum(['openai', 'groq', 'gemini']),
    model: z.string().min(1).max(100),
    apiKeys: z.object({
      openai: z.string().max(200).optional(),
      groq: z.string().max(200).optional(),
      gemini: z.string().max(200).optional()
    }).optional()
  }).optional(),
  notifications: z.object({
    enabled: z.boolean(),
    teams: z.object({
      webhookUrl: z.string().url().optional()
    }).optional()
  }).optional(),
  polling: z.object({
    workItems: z.string().regex(/^[*\d\s,\-\/]+$/),
    pipelines: z.string().regex(/^[*\d\s,\-\/]+$/),
    pullRequests: z.string().regex(/^[*\d\s,\-\/]+$/)
  }).optional()
});

router.put('/settings', async (req, res) => {
  try {
    const validated = settingsSchema.parse(req.body);
    await updateUserSettings(req.user._id, validated);
    res.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: error.errors 
      });
    }
    throw error;
  }
});
```

#### 1.2 Overly Permissive CORS Configuration (CRITICAL)
**File**: `backend/main.js` (line 52-57)  
**Severity**: Critical  
**Risk**: Cross-Site Request Forgery (CSRF), unauthorized access

**Issue**:
```javascript
app.use(cors({
  origin: true, // ❌ Allows ALL origins!
  credentials: true
}));
```

**Impact**: Any website can make authenticated requests to your API, enabling:
- CSRF attacks
- Data theft
- Unauthorized operations on behalf of users

**Fix**:
```javascript
const allowedOrigins = process.env.NODE_ENV === 'production'
  ? [process.env.FRONTEND_URL || 'https://your-domain.com']
  : ['http://localhost:5173', 'http://localhost:3000'];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 600 // Cache preflight requests for 10 minutes
}));
```

#### 1.3 Weak Rate Limiting (CRITICAL)
**File**: `backend/main.js` (line 60-74)  
**Severity**: High  
**Risk**: DDoS, API abuse, resource exhaustion

**Issue**:
```javascript
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10000, // ❌ TOO HIGH for production!
  // Comment says "increased for development"
});
```

**Impact**: Attackers can:
- Overwhelm the server with requests
- Abuse expensive AI API calls
- Generate massive costs
- Cause service degradation

**Fix**:
```javascript
const createRateLimiter = (windowMs, max, message) => 
  rateLimit({
    windowMs,
    max,
    message,
    trustProxy: 1,
    keyGenerator: (req) => {
      const ip = req.ip || req.socket?.remoteAddress || 'unknown';
      return ip.split(':')[0];
    },
    skip: (req) => req.path === '/api/health',
    standardHeaders: true,
    legacyHeaders: false
  });

// Different limits for different endpoint types
const authLimiter = createRateLimiter(
  15 * 60 * 1000, // 15 minutes
  5, // 5 attempts
  'Too many authentication attempts'
);

const apiLimiter = createRateLimiter(
  15 * 60 * 1000, // 15 minutes
  100, // 100 requests per 15 minutes in production
  'Too many requests'
);

const aiLimiter = createRateLimiter(
  60 * 60 * 1000, // 1 hour
  20, // 20 AI calls per hour
  'AI API rate limit exceeded'
);

app.use('/api/auth', authLimiter);
app.use('/api/ai', aiLimiter);
app.use('/api', apiLimiter);
```

#### 1.4 Public Debug Endpoint (CRITICAL)
**File**: `backend/api/routes.js` (line 28-51)  
**Severity**: High  
**Risk**: Information disclosure, token analysis

**Issue**:
```javascript
router.get('/debug/token', (req, res) => {
  // ❌ Exposes token information publicly!
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  res.json({ 
    userId: decoded.userId,
    exp: new Date(decoded.exp * 1000).toISOString()
  });
});
```

**Impact**: Attackers can:
- Validate stolen tokens
- Learn about token structure
- Perform timing attacks
- Gather user enumeration data

**Fix**: Remove entirely or protect with strict authentication and feature flag:
```javascript
// Only enable in development
if (process.env.NODE_ENV === 'development') {
  router.get('/debug/token', authenticate, (req, res) => {
    res.json({ 
      userId: req.user._id,
      tokenExpiresAt: new Date(req.user.tokenExp * 1000).toISOString()
    });
  });
}
```

#### 1.5 Missing Security Headers (HIGH)
**File**: `backend/main.js`  
**Severity**: High  
**Risk**: XSS, clickjacking, MIME sniffing attacks

**Issue**: Helmet is imported but not properly configured

**Fix**:
```javascript
import helmet from 'helmet';

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"], // For Tailwind
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://dev.azure.com"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: []
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  frameguard: { action: 'deny' },
  noSniff: true,
  xssFilter: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' }
}));
```

#### 1.6 JWT Secret Not Validated (HIGH)
**File**: `backend/middleware/auth.js`  
**Severity**: High  
**Risk**: Weak secrets, predictable tokens

**Issue**: No validation that JWT_SECRET is strong enough

**Fix**: Add startup validation:
```javascript
// In backend/config/env.js
import crypto from 'crypto';

function validateSecrets() {
  const required = ['JWT_SECRET', 'ENCRYPTION_KEY', 'MONGODB_URI'];
  
  for (const key of required) {
    if (!process.env[key]) {
      throw new Error(`${key} is required but not set`);
    }
  }
  
  // JWT_SECRET must be at least 32 characters
  if (process.env.JWT_SECRET.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters long');
  }
  
  // ENCRYPTION_KEY must be exactly 64 hex characters (32 bytes)
  if (!/^[0-9a-fA-F]{64}$/.test(process.env.ENCRYPTION_KEY)) {
    throw new Error('ENCRYPTION_KEY must be 64 hex characters (32 bytes)');
  }
}

validateSecrets();
```

---

### 2. Production Build Configuration Issues

#### 2.1 Source Maps Enabled in Production (MEDIUM-HIGH)
**File**: `frontend/vite.config.js` (line 26)  
**Severity**: Medium-High  
**Risk**: Source code exposure, reverse engineering

**Issue**:
```javascript
build: {
  outDir: 'dist',
  sourcemap: true // ❌ Exposes source code in production!
}
```

**Impact**: Source maps reveal:
- Original source code structure
- Business logic
- API endpoints and secrets in comments
- Security mechanisms

**Fix**:
```javascript
build: {
  outDir: 'dist',
  sourcemap: process.env.NODE_ENV !== 'production',
  minify: 'terser',
  terserOptions: {
    compress: {
      drop_console: true, // Remove console.logs in production
      drop_debugger: true
    }
  },
  rollupOptions: {
    output: {
      manualChunks: {
        'vendor': ['react', 'react-dom', 'react-router-dom'],
        'ui': ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu']
      }
    }
  },
  chunkSizeWarningLimit: 1000
}
```

#### 2.2 Development Proxy Configuration (LOW)
**File**: `frontend/vite.config.js` (line 16-22)  
**Severity**: Low  
**Note**: This is fine for development, but ensure it's not used in production

---

### 3. Environment Variable Management Issues

#### 3.1 Missing Environment Validation (HIGH)
**File**: `backend/config/env.js`  
**Severity**: High  
**Risk**: Silent failures, undefined behavior

**Issue**: Environment variables are used without validation

**Fix**: Create comprehensive validation:
```javascript
import { config } from 'dotenv';
import { z } from 'zod';

config();

const envSchema = z.object({
  // Required in all environments
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().regex(/^\d+$/).transform(Number).default('3001'),
  MONGODB_URI: z.string().url(),
  JWT_SECRET: z.string().min(32),
  ENCRYPTION_KEY: z.string().regex(/^[0-9a-fA-F]{64}$/),
  
  // Optional but recommended
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  FRONTEND_URL: z.string().url().optional(),
  
  // Azure DevOps (optional - can be configured per user)
  AZURE_DEVOPS_ORG: z.string().optional(),
  AZURE_DEVOPS_PROJECT: z.string().optional(),
  AZURE_DEVOPS_PAT: z.string().optional(),
  
  // AI Providers (at least one required)
  OPENAI_API_KEY: z.string().optional(),
  GROQ_API_KEY: z.string().optional(),
  GEMINI_API_KEY: z.string().optional()
});

let validatedEnv;

try {
  validatedEnv = envSchema.parse(process.env);
  
  // At least one AI provider must be configured
  const hasAIProvider = validatedEnv.OPENAI_API_KEY || 
                        validatedEnv.GROQ_API_KEY || 
                        validatedEnv.GEMINI_API_KEY;
  
  if (!hasAIProvider) {
    console.warn('⚠️  No AI provider configured. Users must configure AI settings.');
  }
  
} catch (error) {
  console.error('❌ Environment validation failed:');
  console.error(error.errors);
  process.exit(1);
}

export const env = validatedEnv;
```

#### 3.2 Missing .env.production Template (MEDIUM)
**Severity**: Medium

**Fix**: Create `.env.production.example`:
```env
# Production Environment Configuration

NODE_ENV=production
PORT=3001
LOG_LEVEL=warn

# Database (Required)
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/dbname?retryWrites=true&w=majority

# Security (Required - Generate strong random values)
JWT_SECRET=<generate-64-character-random-string>
ENCRYPTION_KEY=<generate-64-hex-character-string>

# Frontend URL (Required for CORS)
FRONTEND_URL=https://your-production-domain.com

# AI Providers (At least one required)
OPENAI_API_KEY=
GROQ_API_KEY=
GEMINI_API_KEY=

# Azure DevOps (Optional - per-user configuration)
AZURE_DEVOPS_ORG=
AZURE_DEVOPS_PROJECT=
AZURE_DEVOPS_PAT=

# Notifications (Optional)
TEAMS_WEBHOOK_URL=
SLACK_WEBHOOK_URL=
GOOGLE_CHAT_WEBHOOK_URL=
NOTIFICATIONS_ENABLED=true

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
```

---

### 4. Database Security Issues

#### 4.1 No Connection String Sanitization (MEDIUM)
**File**: `backend/main.js` (line 21)  
**Severity**: Medium  
**Risk**: Credential logging, exposure in error messages

**Fix**:
```javascript
function sanitizeMongoUri(uri) {
  return uri.replace(/\/\/([^:]+):([^@]+)@/, '//<credentials>@');
}

async function connectToDatabase() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10, // Add connection pooling
      minPoolSize: 2,
      retryWrites: true,
      w: 'majority'
    });
    logger.info('Connected to MongoDB successfully', {
      uri: sanitizeMongoUri(process.env.MONGODB_URI)
    });
  } catch (err) {
    logger.error('MongoDB connection error:', {
      error: err.message,
      uri: sanitizeMongoUri(process.env.MONGODB_URI)
    });
    throw err;
  }
}
```

#### 4.2 Missing Database Indexes (MEDIUM)
**File**: `backend/models/User.js`  
**Severity**: Medium  
**Risk**: Performance degradation

**Fix**: Add indexes to User model:
```javascript
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ createdAt: -1 });

// For UserSettings model
userSettingsSchema.index({ userId: 1 }, { unique: true });
userSettingsSchema.index({ 'azureDevOps.organization': 1 });
```

#### 4.3 No Query Timeout (MEDIUM)
**Severity**: Medium  
**Risk**: Slow queries can block the application

**Fix**: Add query timeouts:
```javascript
mongoose.set('maxTimeMS', 30000); // 30 second timeout

// Or per query
User.find().maxTimeMS(5000).exec();
```

---

### 5. Authentication & Authorization Issues

#### 5.1 Long JWT Expiration (MEDIUM)
**File**: `backend/middleware/auth.js` (line 27)  
**Severity**: Medium  
**Risk**: Extended exposure if token is compromised

**Issue**:
```javascript
expiresIn: '7d' // ❌ Too long for production
```

**Fix**:
```javascript
export const generateToken = (userId) => {
  const expiresIn = process.env.NODE_ENV === 'production' ? '1d' : '7d';
  return jwt.sign(
    { userId }, 
    process.env.JWT_SECRET, 
    { 
      expiresIn,
      issuer: 'devops-agent',
      audience: 'devops-agent-users'
    }
  );
};

// Add refresh token mechanism
export const generateRefreshToken = (userId) => {
  return jwt.sign(
    { userId, type: 'refresh' },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: '30d' }
  );
};
```

#### 5.2 Missing Password Strength Validation (MEDIUM)
**File**: `backend/routes/auth.js`  
**Severity**: Medium  
**Risk**: Weak passwords, easier brute force attacks

**Fix**: Add password validation with Zod:
```javascript
const registerSchema = z.object({
  email: z.string().email().max(255),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(100)
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
  name: z.string().min(1).max(100).trim()
});
```

#### 5.3 No Account Lockout Mechanism (MEDIUM)
**Severity**: Medium  
**Risk**: Brute force attacks

**Fix**: Implement account lockout:
```javascript
const userSchema = new mongoose.Schema({
  email: String,
  password: String,
  name: String,
  loginAttempts: { type: Number, default: 0 },
  lockUntil: { type: Date },
  createdAt: Date
});

userSchema.methods.incLoginAttempts = async function() {
  // If we have a previous lock that has expired, restart at 1
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return await this.updateOne({
      $set: { loginAttempts: 1 },
      $unset: { lockUntil: 1 }
    });
  }
  
  const updates = { $inc: { loginAttempts: 1 } };
  const maxAttempts = 5;
  const lockTime = 2 * 60 * 60 * 1000; // 2 hours
  
  // Lock the account after max attempts
  if (this.loginAttempts + 1 >= maxAttempts && !this.lockUntil) {
    updates.$set = { lockUntil: Date.now() + lockTime };
  }
  
  return await this.updateOne(updates);
};

userSchema.methods.isLocked = function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
};
```

---

### 6. Logging & Monitoring Issues

#### 6.1 Insufficient Production Logging (MEDIUM)
**File**: `backend/utils/logger.js`  
**Severity**: Medium  
**Risk**: Difficult debugging, no audit trail

**Fix**: Add structured logging with correlation IDs:
```javascript
// Add request ID middleware
import { v4 as uuidv4 } from 'uuid';

app.use((req, res, next) => {
  req.id = req.header('X-Request-ID') || uuidv4();
  res.setHeader('X-Request-ID', req.id);
  next();
});

// Enhanced logging
app.use((req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info('Request completed', {
      requestId: req.id,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      userId: req.user?._id
    });
  });
  
  next();
});
```

#### 6.2 Sensitive Data in Logs (HIGH)
**File**: Multiple files  
**Severity**: High  
**Risk**: Credential leakage

**Fix**: Add log sanitization:
```javascript
function sanitizeForLogging(data) {
  const sensitive = ['password', 'token', 'secret', 'apiKey', 'pat', 'authorization'];
  const sanitized = { ...data };
  
  for (const key in sanitized) {
    if (sensitive.some(s => key.toLowerCase().includes(s))) {
      sanitized[key] = '***REDACTED***';
    } else if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
      sanitized[key] = sanitizeForLogging(sanitized[key]);
    }
  }
  
  return sanitized;
}

// Use in logger
logger.info('User settings updated', sanitizeForLogging({ settings }));
```

---

## 🟡 HIGH PRIORITY ISSUES (Severity: Medium)

### 7. Error Handling Issues

#### 7.1 Generic Error Messages (MEDIUM)
**File**: `backend/api/routes.js` (multiple endpoints)  
**Severity**: Medium  
**Risk**: Poor user experience, difficult debugging

**Issue**: Many endpoints return generic error messages:
```javascript
res.status(500).json({ error: 'Failed to fetch settings' });
```

**Fix**: Implement proper error categorization:
```javascript
class AppError extends Error {
  constructor(message, statusCode, code, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true;
  }
}

// Usage
if (!settings) {
  throw new AppError(
    'Settings not found',
    404,
    'SETTINGS_NOT_FOUND',
    { userId: req.user._id }
  );
}
```

#### 7.2 Missing Async Error Handling (MEDIUM)
**File**: Multiple route files  
**Severity**: Medium  
**Risk**: Unhandled promise rejections

**Fix**: Create async error wrapper:
```javascript
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Usage
router.get('/settings', asyncHandler(async (req, res) => {
  const settings = await getUserSettings(req.user._id);
  res.json(settings);
}));
```

---

### 8. Performance Issues

#### 8.1 No Response Caching (MEDIUM)
**Severity**: Medium  
**Risk**: Unnecessary database/API calls

**Fix**: Implement caching middleware:
```javascript
import NodeCache from 'node-cache';

const cache = new NodeCache({ stdTTL: 300 }); // 5 minutes

const cacheMiddleware = (duration) => (req, res, next) => {
  if (req.method !== 'GET') {
    return next();
  }
  
  const key = `${req.user._id}:${req.path}`;
  const cached = cache.get(key);
  
  if (cached) {
    return res.json(cached);
  }
  
  const originalJson = res.json.bind(res);
  res.json = (data) => {
    cache.set(key, data, duration);
    originalJson(data);
  };
  
  next();
};

// Usage
router.get('/work-items', cacheMiddleware(60), asyncHandler(async (req, res) => {
  // Cached for 60 seconds
}));
```

#### 8.2 No Database Connection Pooling (MEDIUM)
**File**: `backend/main.js`  
**Severity**: Medium  
**Risk**: Performance bottlenecks

**Fix**: Already shown in section 4.1

#### 8.3 Large Bundle Size (MEDIUM)
**File**: `frontend/vite.config.js`  
**Severity**: Medium  
**Risk**: Slow initial page load

**Fix**: Implement code splitting:
```javascript
import { lazy, Suspense } from 'react';

// Lazy load routes
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Settings = lazy(() => import('./pages/Settings'));

function App() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </Suspense>
  );
}
```

---

### 9. Code Quality Issues

#### 9.1 Inconsistent Error Handling Patterns (LOW-MEDIUM)
**Severity**: Low-Medium  
**Risk**: Maintenance issues

**Fix**: Standardize error handling across all endpoints using the patterns shown above.

#### 9.2 Missing TypeScript (LOW-MEDIUM)
**Severity**: Low-Medium  
**Risk**: Runtime errors, poor IDE support

**Recommendation**: Consider migrating to TypeScript for better type safety, especially for:
- API request/response types
- Database models
- Configuration objects

#### 9.3 No API Versioning (LOW)
**Severity**: Low  
**Risk**: Breaking changes for clients

**Fix**: Implement API versioning:
```javascript
// v1 routes
app.use('/api/v1', apiRoutesV1);

// v2 routes (future)
app.use('/api/v2', apiRoutesV2);
```

---

## 🟢 RECOMMENDED IMPROVEMENTS (Severity: Low)

### 10. Dependency Management

#### 10.1 Outdated Dependencies (LOW-MEDIUM)
**Severity**: Low-Medium

**Action**: Run dependency audit:
```bash
npm audit
npm outdated
```

**Fix**: Update dependencies regularly:
```bash
npm update
npm audit fix
```

**Add to CI/CD**:
```yaml
- name: Check for vulnerabilities
  run: npm audit --audit-level=high
```

#### 10.2 Missing Dependency Pinning (LOW)
**Severity**: Low  
**Risk**: Inconsistent builds

**Fix**: Use exact versions in `package.json`:
```json
{
  "dependencies": {
    "express": "4.18.2" // Not "^4.18.2"
  }
}
```

---

### 11. Testing Infrastructure

#### 11.1 No Tests (HIGH for Production)
**File**: `backend/package.json` - Jest configured but not implemented  
**Severity**: High (for production readiness)

**Fix**: Implement comprehensive testing:

**Unit Tests Example**:
```javascript
// backend/__tests__/middleware/auth.test.js
import { authenticate, generateToken } from '../../middleware/auth.js';
import { User } from '../../models/User.js';
import jwt from 'jsonwebtoken';

describe('Authentication Middleware', () => {
  it('should reject requests without token', async () => {
    const req = { header: jest.fn().mockReturnValue(null) };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    const next = jest.fn();
    
    await authenticate(req, res, next);
    
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ 
      error: 'Access denied. No token provided.' 
    });
  });
  
  it('should validate token and attach user to request', async () => {
    const user = { _id: 'user123', email: 'test@example.com' };
    const token = generateToken(user._id);
    
    User.findById = jest.fn().mockResolvedValue(user);
    
    const req = { header: jest.fn().mockReturnValue(`Bearer ${token}`) };
    const res = {};
    const next = jest.fn();
    
    await authenticate(req, res, next);
    
    expect(req.user).toEqual(user);
    expect(next).toHaveBeenCalled();
  });
});
```

**Integration Tests Example**:
```javascript
// backend/__tests__/api/routes.test.js
import request from 'supertest';
import app from '../../main.js';
import { User } from '../../models/User.js';

describe('API Routes', () => {
  let authToken;
  
  beforeAll(async () => {
    // Setup test user and get token
    const user = await User.create({
      email: 'test@example.com',
      password: 'Test123!@#',
      name: 'Test User'
    });
    authToken = generateToken(user._id);
  });
  
  it('GET /api/health should return healthy status', async () => {
    const response = await request(app).get('/api/health');
    
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('healthy');
  });
  
  it('GET /api/settings requires authentication', async () => {
    const response = await request(app).get('/api/settings');
    
    expect(response.status).toBe(401);
  });
  
  it('GET /api/settings returns user settings with valid token', async () => {
    const response = await request(app)
      .get('/api/settings')
      .set('Authorization', `Bearer ${authToken}`);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('azureDevOps');
  });
});
```

**E2E Tests**:
```javascript
// frontend/e2e/auth.spec.js (using Playwright)
import { test, expect } from '@playwright/test';

test('user can login and access dashboard', async ({ page }) => {
  await page.goto('/login');
  
  await page.fill('input[name="email"]', 'test@example.com');
  await page.fill('input[name="password"]', 'Test123!@#');
  await page.click('button[type="submit"]');
  
  await expect(page).toHaveURL('/dashboard');
  await expect(page.locator('h1')).toContainText('Dashboard');
});
```

---

### 12. Monitoring & Observability

#### 12.1 No APM Integration (MEDIUM)
**Severity**: Medium  
**Impact**: Difficult to diagnose production issues

**Recommendation**: Integrate Application Performance Monitoring:
```javascript
// New Relic example
import newrelic from 'newrelic';

// OR Sentry for error tracking
import * as Sentry from '@sentry/node';

if (process.env.NODE_ENV === 'production') {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV,
    tracesSampleRate: 1.0
  });
  
  app.use(Sentry.Handlers.requestHandler());
  app.use(Sentry.Handlers.tracingHandler());
  
  // After all routes
  app.use(Sentry.Handlers.errorHandler());
}
```

#### 12.2 No Health Check Metrics (LOW-MEDIUM)
**Severity**: Low-Medium

**Fix**: Enhanced health check:
```javascript
router.get('/health', async (req, res) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    cpu: process.cpuUsage(),
    environment: process.env.NODE_ENV,
    version: process.env.npm_package_version
  };
  
  // Check critical services
  const checks = {
    database: false,
    redis: false // if using Redis
  };
  
  try {
    await mongoose.connection.db.admin().ping();
    checks.database = true;
  } catch (error) {
    health.status = 'unhealthy';
    logger.error('Database health check failed', error);
  }
  
  health.checks = checks;
  
  const statusCode = health.status === 'healthy' ? 200 : 503;
  res.status(statusCode).json(health);
});
```

---

### 13. Configuration Management

#### 13.1 No Configuration Documentation (LOW)
**Severity**: Low

**Fix**: Create `CONFIG.md`:
```markdown
# Configuration Guide

## Required Environment Variables

### Security
- `JWT_SECRET`: 64+ character random string
- `ENCRYPTION_KEY`: 64 hex characters (32 bytes)
- `MONGODB_URI`: MongoDB connection string

### Application
- `NODE_ENV`: `production` | `development` | `test`
- `PORT`: Server port (default: 3001)
- `FRONTEND_URL`: Frontend URL for CORS

## Optional Environment Variables
...
```

#### 13.2 No Secrets Rotation Strategy (MEDIUM)
**Severity**: Medium

**Recommendation**: Document secret rotation procedure:
1. Generate new secret
2. Add new secret alongside old one
3. Update secret reference
4. Remove old secret after grace period

---

## 📊 PRODUCTION READINESS CHECKLIST

### Critical (Must Complete Before Production)

- [ ] **Implement input validation with Zod on all API endpoints**
- [ ] **Fix CORS configuration to whitelist specific origins**
- [ ] **Reduce rate limiting to production-appropriate levels**
- [ ] **Remove or protect `/api/debug/token` endpoint**
- [ ] **Add comprehensive Helmet security headers**
- [ ] **Validate JWT_SECRET and ENCRYPTION_KEY strength at startup**
- [ ] **Disable source maps in production builds**
- [ ] **Implement environment variable validation with Zod**
- [ ] **Add request ID tracking for debugging**
- [ ] **Sanitize sensitive data from logs**

### High Priority (Important for Production)

- [ ] **Add database connection string sanitization**
- [ ] **Implement database indexes for performance**
- [ ] **Add query timeouts to prevent hanging queries**
- [ ] **Reduce JWT expiration time (1 day in production)**
- [ ] **Add password strength requirements**
- [ ] **Implement account lockout after failed login attempts**
- [ ] **Add structured logging with correlation IDs**
- [ ] **Implement proper error categorization and handling**
- [ ] **Add async error handling wrapper**
- [ ] **Create comprehensive test suite (unit + integration + e2e)**

### Medium Priority (Recommended)

- [ ] **Implement response caching for expensive operations**
- [ ] **Add connection pooling configuration**
- [ ] **Implement code splitting for frontend**
- [ ] **Add API versioning (/api/v1/)**
- [ ] **Integrate APM (Application Performance Monitoring)**
- [ ] **Enhanced health check with service status**
- [ ] **Document configuration in CONFIG.md**
- [ ] **Run npm audit and update dependencies**
- [ ] **Pin dependency versions**

### Low Priority (Nice to Have)

- [ ] **Consider TypeScript migration**
- [ ] **Add API documentation (Swagger/OpenAPI)**
- [ ] **Implement graceful degradation for AI services**
- [ ] **Add feature flags for gradual rollouts**
- [ ] **Create database backup/restore procedures**
- [ ] **Add performance budgets for frontend**

---

## 🔥 TOP 10 PRODUCTION BLOCKERS

1. **Missing Input Validation** - NoSQL injection vulnerability
2. **Open CORS Policy** - Security risk (CSRF attacks)
3. **Weak Rate Limiting** - DDoS and abuse vulnerability
4. **Public Debug Endpoint** - Information disclosure
5. **Missing Security Headers** - XSS/clickjacking risk
6. **Weak JWT Configuration** - Token compromise risk
7. **Source Maps in Production** - Source code exposure
8. **No Environment Validation** - Silent failures
9. **Sensitive Data Logging** - Credential leakage
10. **No Test Coverage** - High risk of bugs in production

---

## 📈 RECOMMENDED IMPLEMENTATION PRIORITY

### Phase 1: Critical Security (Week 1)
1. Add Zod validation to all API endpoints
2. Fix CORS configuration
3. Implement proper rate limiting
4. Remove/protect debug endpoints
5. Add Helmet security headers
6. Validate secrets at startup

### Phase 2: Configuration & Environment (Week 1-2)
1. Implement environment variable validation
2. Disable source maps in production
3. Add connection string sanitization
4. Create production environment templates

### Phase 3: Logging & Monitoring (Week 2)
1. Add request ID tracking
2. Implement log sanitization
3. Add structured logging
4. Integrate APM/error tracking

### Phase 4: Authentication & Authorization (Week 2-3)
1. Reduce JWT expiration
2. Add password strength validation
3. Implement account lockout
4. Add refresh token mechanism

### Phase 5: Error Handling & Resilience (Week 3)
1. Standardize error handling
2. Add async error wrappers
3. Implement proper error categorization
4. Add retry logic for external services

### Phase 6: Performance & Optimization (Week 4)
1. Implement caching
2. Add database indexes
3. Optimize frontend bundle
4. Add code splitting

### Phase 7: Testing (Week 4-5)
1. Set up testing infrastructure
2. Write unit tests (80%+ coverage)
3. Write integration tests
4. Add E2E tests for critical paths

### Phase 8: Documentation & DevOps (Week 5-6)
1. Document configuration
2. Create deployment runbooks
3. Add monitoring dashboards
4. Implement CI/CD improvements

---

## 💡 QUICK WINS (Immediate Impact, Low Effort)

1. **Remove debug endpoint** (5 minutes)
2. **Disable source maps** (5 minutes)
3. **Add Helmet security headers** (10 minutes)
4. **Fix CORS configuration** (15 minutes)
5. **Add environment validation** (30 minutes)
6. **Implement log sanitization** (30 minutes)
7. **Reduce rate limiting** (10 minutes)
8. **Add database indexes** (20 minutes)

---

## 📝 ADDITIONAL RECOMMENDATIONS

### Docker Configuration
Create a proper `Dockerfile`:
```dockerfile
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package*.json ./
COPY frontend/package*.json ./frontend/
COPY backend/package*.json ./backend/

RUN npm ci --only=production --workspace=backend
RUN npm ci --only=production --workspace=frontend

# Build frontend
FROM base AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3001

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nodejs

# Copy backend
COPY --from=deps /app/backend/node_modules ./backend/node_modules
COPY backend/ ./backend/

# Copy built frontend
COPY --from=frontend-builder /app/frontend/dist ./backend/public

RUN chown -R nodejs:nodejs /app
USER nodejs

EXPOSE 3001

CMD ["node", "backend/main.js"]
```

### `.dockerignore`
```
node_modules
npm-debug.log
.env
.env.local
.git
.gitignore
README.md
logs/
*.log
frontend/dist
backend/public
.DS_Store
```

### CI/CD Improvements
Add security scanning to deployment workflow:
```yaml
- name: Security audit
  run: |
    npm audit --audit-level=high
    cd backend && npm audit --audit-level=high
    cd ../frontend && npm audit --audit-level=high

- name: Run tests
  run: |
    cd backend && npm test
    cd ../frontend && npm test

- name: Check environment variables
  run: |
    # Ensure all required vars are set in Azure App Service
```

---

## 🎯 SUCCESS METRICS

Track these metrics after implementing fixes:

### Security Metrics
- Zero critical vulnerabilities in npm audit
- All API endpoints have input validation
- No sensitive data in logs (scan with regex)
- CORS restricted to specific origins
- Rate limiting effectively prevents abuse

### Performance Metrics
- API response time < 200ms (p95)
- Frontend initial load < 2s
- Database query time < 100ms (p95)
- Cache hit rate > 70%

### Reliability Metrics
- Test coverage > 80%
- Zero unhandled promise rejections
- Error rate < 0.1%
- Uptime > 99.9%

### Code Quality Metrics
- All functions have error handling
- All routes use asyncHandler
- All user inputs validated
- Consistent code style

---

## 📞 SUPPORT & NEXT STEPS

After implementing these fixes:

1. **Security Review**: Conduct a penetration test
2. **Load Testing**: Test with realistic traffic patterns
3. **Monitoring Setup**: Configure alerts for critical metrics
4. **Documentation**: Update all documentation
5. **Team Training**: Ensure team understands security best practices
6. **Incident Response**: Create incident response plan
7. **Regular Audits**: Schedule quarterly security audits

---

## 📄 APPENDIX: USEFUL LIBRARIES

### Security
- `zod` - Runtime type validation
- `helmet` - Security headers
- `express-rate-limit` - Rate limiting
- `express-validator` - Input validation
- `bcryptjs` - Password hashing

### Monitoring
- `@sentry/node` - Error tracking
- `prom-client` - Prometheus metrics
- `newrelic` - APM

### Performance
- `node-cache` - In-memory caching
- `compression` - Response compression
- `@google-cloud/trace-agent` - Distributed tracing

### Testing
- `jest` - Unit testing
- `supertest` - API testing
- `@playwright/test` - E2E testing
- `mongodb-memory-server` - In-memory MongoDB for tests

---

**End of Production Readiness Audit Report**

**Last Updated**: October 13, 2025  
**Next Review**: After Phase 1 implementation
