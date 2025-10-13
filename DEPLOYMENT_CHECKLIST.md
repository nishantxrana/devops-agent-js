# Production Deployment Checklist
## Pre-Deployment Verification for Azure DevOps Monitoring Agent

Use this checklist before each production deployment to ensure all security and production requirements are met.

---

## 🔐 SECURITY CHECKLIST

### Critical Security Requirements (MUST COMPLETE)

#### Input Validation
- [ ] All API endpoints validate inputs using Zod schemas
- [ ] Test all endpoints with invalid/malicious inputs
- [ ] Verify 400 errors are returned for invalid data
- [ ] Check validation error messages don't leak sensitive info

#### CORS Configuration
- [ ] CORS is configured with specific origins only
- [ ] `FRONTEND_URL` environment variable is set
- [ ] Test CORS with unauthorized origin (should fail)
- [ ] Verify credentials are handled properly

#### Rate Limiting
- [ ] Rate limiting is set to production levels (100 req/15min)
- [ ] Different limits configured for different endpoint types
- [ ] Test rate limiting by making 101+ requests
- [ ] Verify 429 responses after limit exceeded

#### Authentication & Authorization
- [ ] JWT expiration set appropriately (1 day for production)
- [ ] Password requirements enforced (8+ chars, mixed case, numbers, symbols)
- [ ] Debug endpoints removed or protected with auth
- [ ] Account lockout implemented (after 5 failed attempts)

#### Security Headers
- [ ] Helmet middleware properly configured
- [ ] CSP headers set correctly
- [ ] HSTS enabled with reasonable max-age
- [ ] X-Frame-Options set to DENY
- [ ] Test headers using: `curl -I https://your-domain.com`

#### Secrets Management
- [ ] All secrets in environment variables (not in code)
- [ ] JWT_SECRET is 64+ characters long
- [ ] ENCRYPTION_KEY is exactly 64 hex characters
- [ ] No default/example secrets in production
- [ ] Secrets validated at application startup

#### Logging Security
- [ ] Log sanitization implemented
- [ ] No passwords, tokens, or secrets in logs
- [ ] Test by searching logs for: `password`, `token`, `secret`
- [ ] Request IDs present in all log entries

---

## ⚙️ CONFIGURATION CHECKLIST

### Environment Variables

#### Required Variables
- [ ] `NODE_ENV=production`
- [ ] `PORT` (default: 3001)
- [ ] `MONGODB_URI` (connection string)
- [ ] `JWT_SECRET` (64+ characters)
- [ ] `ENCRYPTION_KEY` (64 hex characters)
- [ ] `FRONTEND_URL` (for CORS)

#### Optional but Recommended
- [ ] `LOG_LEVEL=warn` (production)
- [ ] `ALLOWED_ORIGINS` (comma-separated list)
- [ ] At least one AI provider key (OPENAI/GROQ/GEMINI)
- [ ] `SENTRY_DSN` (error tracking)

#### Validation
- [ ] Run startup to verify all required vars present
- [ ] Check logs for environment validation success
- [ ] Verify no warnings about missing configuration

### Database Configuration
- [ ] MongoDB connection string uses `mongodb+srv://`
- [ ] Connection string doesn't contain credentials in logs
- [ ] Connection pooling configured (min: 2, max: 10)
- [ ] Database indexes created for User and UserSettings
- [ ] Test database connectivity before deployment

---

## 🏗️ BUILD CHECKLIST

### Frontend Build

#### Before Build
- [ ] Update version in `package.json`
- [ ] Run `npm audit fix` to fix vulnerabilities
- [ ] Clear node_modules and reinstall: `rm -rf node_modules && npm ci`

#### Build Configuration
- [ ] `NODE_ENV=production` set
- [ ] Source maps disabled in `vite.config.js`
- [ ] Console.log statements removed from production build
- [ ] Code splitting configured properly
- [ ] Build successful: `npm run build`

#### After Build Verification
- [ ] Check dist/ folder size (should be < 2MB)
- [ ] Verify no .map files in dist/
- [ ] Test production build locally: `npm run preview`
- [ ] Check browser console for errors

### Backend Build

#### Dependencies
- [ ] Run `npm audit` - No high/critical vulnerabilities
- [ ] Run `npm outdated` - Consider updating packages
- [ ] Install production dependencies only: `npm ci --only=production`

#### Code Quality
- [ ] All linters pass
- [ ] No TODO or FIXME comments in critical code
- [ ] All console.log statements removed or replaced with logger

---

## 🧪 TESTING CHECKLIST

### Manual Testing

#### Authentication Flow
- [ ] Register new user with valid credentials
- [ ] Register fails with weak password
- [ ] Register fails with duplicate email
- [ ] Login with valid credentials
- [ ] Login fails with invalid credentials
- [ ] Login locked after 5 failed attempts
- [ ] JWT token expires after expected time

#### API Endpoints
- [ ] Health check returns 200: `GET /api/health`
- [ ] Protected endpoints return 401 without token
- [ ] Protected endpoints work with valid token
- [ ] Invalid inputs return 400 with error details
- [ ] Rate limiting triggers after max requests

#### Settings Management
- [ ] Can view user settings
- [ ] Can update Azure DevOps settings
- [ ] Can update AI provider settings
- [ ] Can test connection to Azure DevOps
- [ ] Masked values (***) not saved to database

#### Error Handling
- [ ] Database errors handled gracefully
- [ ] Network errors don't crash application
- [ ] Invalid tokens return proper error messages
- [ ] Validation errors return helpful messages

### Automated Testing
- [ ] All unit tests pass: `npm test`
- [ ] All integration tests pass
- [ ] Test coverage > 80%: `npm run test:coverage`
- [ ] No failing tests in CI/CD pipeline

---

## 📊 MONITORING CHECKLIST

### Error Tracking
- [ ] Sentry (or similar) configured
- [ ] Test error reporting by throwing test error
- [ ] Verify errors appear in monitoring dashboard
- [ ] Configure alerts for critical errors

### Logging
- [ ] Logs being written to files
- [ ] Log rotation configured (5MB max, 5 files)
- [ ] No sensitive data in logs
- [ ] Request IDs in all log entries
- [ ] Log level appropriate for production (warn/info)

### Health Checks
- [ ] Health endpoint accessible: `GET /api/health`
- [ ] Health check includes database status
- [ ] Health check doesn't expose sensitive info
- [ ] Configure monitoring to ping health endpoint

---

## 🚀 DEPLOYMENT CHECKLIST

### Pre-Deployment

#### Azure App Service Configuration
- [ ] App Service created and running
- [ ] Node.js version set to 18+ in Azure portal
- [ ] All environment variables configured
- [ ] Connection strings configured
- [ ] CORS configured in Azure (if needed)

#### Deployment Package
- [ ] Frontend built successfully
- [ ] Frontend copied to `backend/public/`
- [ ] Backend dependencies installed
- [ ] No development dependencies in production
- [ ] Package size reasonable (< 100MB)

### Deployment Process
- [ ] Run CI/CD pipeline
- [ ] Monitor deployment logs for errors
- [ ] Wait for deployment to complete
- [ ] Check Azure portal shows app as "Running"

### Post-Deployment Verification

#### Smoke Tests
- [ ] App accessible at production URL
- [ ] Homepage loads correctly
- [ ] Can access login page
- [ ] API health check returns 200
- [ ] No 404 errors for static assets

#### Functionality Tests
- [ ] Can register new user
- [ ] Can login with credentials
- [ ] Can access dashboard
- [ ] Can update settings
- [ ] Can test Azure DevOps connection

#### Performance Tests
- [ ] Page load time < 3 seconds
- [ ] API response time < 500ms
- [ ] No memory leaks (monitor for 1 hour)
- [ ] CPU usage reasonable (< 50% average)

#### Security Tests
- [ ] HTTPS enforced (redirects from HTTP)
- [ ] Security headers present
- [ ] CORS blocks unauthorized origins
- [ ] Rate limiting works
- [ ] Debug endpoints not accessible

---

## 📝 DOCUMENTATION CHECKLIST

### Updated Documentation
- [ ] README.md updated with production info
- [ ] API documentation current
- [ ] Environment variables documented
- [ ] Deployment process documented
- [ ] Troubleshooting guide available

### Team Knowledge
- [ ] Deployment runbook reviewed
- [ ] Incident response plan in place
- [ ] Team trained on monitoring tools
- [ ] On-call rotation established

---

## 🔄 POST-DEPLOYMENT CHECKLIST

### Immediate (First Hour)
- [ ] Monitor error logs for issues
- [ ] Check error tracking dashboard
- [ ] Verify user registrations working
- [ ] Test all critical user flows
- [ ] Monitor database connections

### First 24 Hours
- [ ] Review all error logs
- [ ] Check performance metrics
- [ ] Verify rate limiting not too strict
- [ ] Monitor API response times
- [ ] Check for memory leaks

### First Week
- [ ] Collect user feedback
- [ ] Review analytics data
- [ ] Check for any security issues
- [ ] Update documentation based on issues
- [ ] Plan next iteration improvements

---

## ⚠️ ROLLBACK PLAN

### Indicators for Rollback
- Critical error rate > 5%
- P95 response time > 2 seconds
- Database connection failures
- Memory/CPU usage > 90%
- Security vulnerability discovered

### Rollback Process
1. [ ] Stop new deployments
2. [ ] Notify team of rollback
3. [ ] Deploy previous version
4. [ ] Verify previous version working
5. [ ] Document what went wrong
6. [ ] Plan fix and re-deployment

---

## 📞 CONTACTS

### Escalation Path
- **Level 1**: Development team
- **Level 2**: Tech lead
- **Level 3**: CTO/Senior leadership

### Critical Services
- **Azure Support**: [Azure Portal](https://portal.azure.com)
- **MongoDB Atlas**: [Cloud Dashboard](https://cloud.mongodb.com)
- **Sentry**: [Error Dashboard](https://sentry.io)

---

## ✅ SIGN-OFF

### Pre-Deployment Approval

**Checklist Completed By**: _________________ Date: _________

**Security Review**: _________________ Date: _________

**Technical Lead Approval**: _________________ Date: _________

**Final Approval**: _________________ Date: _________

### Post-Deployment Verification

**Smoke Tests Passed**: _________________ Date: _________

**Functionality Verified**: _________________ Date: _________

**Performance Acceptable**: _________________ Date: _________

**Security Confirmed**: _________________ Date: _________

---

## 📚 RELATED DOCUMENTS

- [Production Readiness Audit](./PRODUCTION_READINESS_AUDIT.md) - Complete analysis
- [Implementation Guide](./IMPLEMENTATION_GUIDE.md) - Code examples and fixes
- [Quick Reference](./QUICK_REFERENCE.md) - Fast lookup guide
- [Summary Report](./PRODUCTION_READINESS_SUMMARY.md) - Executive overview

---

**Last Updated**: October 13, 2025  
**Version**: 1.0  
**Next Review**: After first production deployment

---

## 💡 TIPS

### Before Using This Checklist
1. Print this checklist or keep it open during deployment
2. Check off items as you complete them
3. Don't skip items marked as "MUST COMPLETE"
4. Document any issues encountered
5. Update checklist based on learnings

### Common Issues
- **Forgot to set NODE_ENV**: App won't start properly
- **Wrong CORS origin**: Frontend can't connect to API
- **Weak secrets**: Security vulnerabilities
- **No rate limiting test**: May discover too late limits are wrong
- **Skipped smoke tests**: Miss critical issues

### Success Criteria
- ✅ All "MUST COMPLETE" items checked
- ✅ All tests passing
- ✅ No critical errors in logs
- ✅ Users can access and use application
- ✅ Performance metrics acceptable

---

**Remember**: It's better to delay deployment and fix issues than to deploy with known problems!
