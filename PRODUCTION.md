# 🚀 Study Planner - Production Deployment Guide

## Overview
This guide covers deploying the Study Planner application to production with best practices for performance, security, and reliability.

## Prerequisites
- Node.js 18+ installed
- npm or yarn package manager
- Access to a hosting platform (Vercel, Netlify, AWS, etc.)
- Environment variables configured

## 🏗️ Pre-Deployment Checklist

### 1. Environment Configuration
```bash
# Copy the example environment file
cp env.example .env.local

# Fill in your production values:
- Database connection strings
- Authentication secrets
- API keys for external services
- Real-time service credentials
```

### 2. Code Quality Checks
```bash
# Run all tests
npm run test:all

# Type checking
npm run type-check

# Linting
npm run lint:fix

# Performance tests
npm run test:performance
```

### 3. Build Verification
```bash
# Clean build
npm run clean

# Production build
npm run build:production

# Verify build output
ls -la .next/
```

## 🚀 Deployment Options

### Option 1: Vercel (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod

# Or connect to GitHub for auto-deployment
vercel --github
```

### Option 2: Netlify
```bash
# Build the project
npm run build:production

# Deploy the .next folder
# Configure build command: npm run build
# Configure publish directory: .next
```

### Option 3: Self-Hosted (Docker)
```dockerfile
# Dockerfile
FROM node:18-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM node:18-alpine AS builder
WORKDIR /app
COPY . .
RUN npm run build:production

FROM node:18-alpine AS runner
WORKDIR /app
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package*.json ./
COPY --from=deps /app/node_modules ./node_modules

EXPOSE 3000
CMD ["npm", "start:production"]
```

## 🔧 Production Configuration

### 1. Environment Variables
```bash
# Required for production
NODE_ENV=production
NEXTAUTH_URL=https://yourdomain.com
NEXTAUTH_SECRET=your-secure-secret-here

# Database
DATABASE_URL=your-production-database-url

# Real-time features
PUSHER_APP_ID=your-pusher-app-id
PUSHER_KEY=your-pusher-key
PUSHER_SECRET=your-pusher-secret
PUSHER_CLUSTER=your-cluster
```

### 2. Performance Optimizations
- ✅ Image optimization enabled
- ✅ CSS optimization enabled
- ✅ Bundle analysis available
- ✅ Security headers configured
- ✅ Console logs removed in production

### 3. Security Features
- ✅ XSS protection headers
- ✅ Content type sniffing prevention
- ✅ Frame options security
- ✅ Referrer policy
- ✅ Permissions policy

## 📊 Monitoring & Analytics

### 1. Performance Monitoring
```bash
# Build with bundle analysis
npm run build:analyze

# Check Core Web Vitals
# Use Lighthouse CI or PageSpeed Insights
```

### 2. Error Tracking
```bash
# Optional: Add Sentry for error tracking
NEXT_PUBLIC_SENTRY_DSN=your-sentry-dsn
```

### 3. Analytics
```bash
# Optional: Add Google Analytics
NEXT_PUBLIC_ANALYTICS_ID=your-ga-id
```

## 🔍 Post-Deployment Verification

### 1. Health Checks
- [ ] Application loads without errors
- [ ] Authentication works
- [ ] Real-time features function
- [ ] File uploads work
- [ ] Database connections stable

### 2. Performance Tests
- [ ] Page load times < 3 seconds
- [ ] Core Web Vitals in green
- [ ] Mobile responsiveness
- [ ] Accessibility compliance

### 3. Security Tests
- [ ] HTTPS enforced
- [ ] Security headers present
- [ ] No sensitive data exposed
- [ ] Authentication flows secure

## 🚨 Troubleshooting

### Common Issues
1. **Build Failures**: Check TypeScript errors and linting issues
2. **Environment Variables**: Verify all required vars are set
3. **Database Connections**: Ensure production DB is accessible
4. **Performance Issues**: Run bundle analysis and optimize imports

### Debug Commands
```bash
# Check build output
npm run build:production

# Analyze bundle
npm run build:analyze

# Run tests
npm run test:all

# Check types
npm run type-check
```

## 📈 Scaling Considerations

### 1. Database
- Consider connection pooling
- Implement read replicas if needed
- Monitor query performance

### 2. Caching
- Implement Redis for session storage
- Use CDN for static assets
- Consider edge caching strategies

### 3. Monitoring
- Set up uptime monitoring
- Configure error alerting
- Monitor performance metrics

## 🔄 CI/CD Pipeline

### GitHub Actions Example
```yaml
name: Deploy to Production
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run test:all
      - run: npm run build:production
      - run: npm run deploy
```

## 📞 Support

For deployment issues:
1. Check the troubleshooting section
2. Review build logs
3. Verify environment configuration
4. Test locally with production settings

---

**Last Updated**: $(date)
**Version**: 1.0.0
