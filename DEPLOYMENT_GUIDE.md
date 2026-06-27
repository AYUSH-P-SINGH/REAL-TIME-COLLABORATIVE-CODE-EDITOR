# Production Deployment Guide

Complete guide for deploying the Real-Time Collaborative Code Editor to production.

---

## 🚀 Pre-Deployment Checklist

### Code Quality
- [ ] All tests passing: `npm test`
- [ ] No ESLint errors: `npm run lint`
- [ ] Code coverage acceptable
- [ ] No console.log statements in production code
- [ ] Error handling complete

### Environment Configuration
- [ ] `.env` configured with production values
- [ ] `JWT_SECRET` is 32+ characters and unique
- [ ] `MONGO_URI` points to production database
- [ ] `REDIS_URL` points to production Redis
- [ ] `ALLOWED_ORIGINS` configured correctly
- [ ] `SENTRY_DSN` configured (if using error monitoring)
- [ ] Email service configured (if using invitations)

### Security
- [ ] HTTPS enabled on all endpoints
- [ ] CORS origins restricted
- [ ] Rate limiting enabled
- [ ] Input validation active
- [ ] Authorization checks in place
- [ ] Audit logging enabled
- [ ] No secrets in code
- [ ] Dependencies up to date

### Database
- [ ] MongoDB indexes created
- [ ] Backups configured
- [ ] Replica set enabled (for transactions)
- [ ] Connection pooling configured
- [ ] Database user has minimal permissions

### Monitoring & Logging
- [ ] Sentry project created and configured
- [ ] Winston logging configured
- [ ] Error alerts set up
- [ ] Performance monitoring enabled
- [ ] Audit logs retention policy set

---

## 🏗️ Production Architecture

```
┌─────────────────────────────────────────────────┐
│         Client (React/Vite)                     │
│      - Monaco Editor                             │
│      - Socket.io Client                          │
└──────────────────┬──────────────────────────────┘
                   │ HTTPS
                   ▼
┌─────────────────────────────────────────────────┐
│    Load Balancer / Reverse Proxy                │
│     (Nginx / AWS ALB / Cloudflare)              │
└──────────────────┬──────────────────────────────┘
                   │
        ┌──────────┼──────────┐
        ▼          ▼          ▼
    ┌────────┐ ┌────────┐ ┌────────┐
    │Server 1│ │Server 2│ │Server 3│ (Multiple instances)
    │Express │ │Express │ │Express │
    └────┬───┘ └────┬───┘ └────┬───┘
         │          │          │
         └──────────┼──────────┘
                    │
        ┌───────────┼────────────┐
        ▼           ▼            ▼
    ┌────────┐ ┌────────┐  ┌─────────┐
    │MongoDB │ │ Redis  │  │S3/Blob  │
    │Cluster │ │Cluster │  │Storage  │
    └────────┘ └────────┘  └─────────┘
```

---

## 🐳 Docker Deployment

### Build Docker Image
```bash
# From project root
docker build -f backend/Dockerfile -t collab-editor:latest .

# Tag for registry
docker tag collab-editor:latest your-registry/collab-editor:latest

# Push to registry
docker push your-registry/collab-editor:latest
```

### Production docker-compose.yml
```yaml
version: '3.8'

services:
  api:
    image: your-registry/collab-editor:latest
    ports:
      - "5000:5000"
    environment:
      NODE_ENV: production
      PORT: 5000
      MONGO_URI: mongodb+srv://user:pass@cluster.mongodb.net/db
      REDIS_URL: redis://redis:6379
      JWT_SECRET: ${JWT_SECRET}
      ALLOWED_ORIGINS: https://yourdomain.com
      SENTRY_DSN: ${SENTRY_DSN}
      EMAIL_SERVICE: smtp
      EMAIL_USER: ${EMAIL_USER}
      EMAIL_PASSWORD: ${EMAIL_PASSWORD}
    depends_on:
      - redis
    restart: always
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:5000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data
    restart: always

  frontend:
    image: your-registry/collab-editor-frontend:latest
    ports:
      - "80:80"
      - "443:443"
    environment:
      VITE_API_URL: https://api.yourdomain.com
    restart: always

volumes:
  redis-data:
```

### Deploy with Docker Compose
```bash
# Set production environment variables
export JWT_SECRET=$(openssl rand -base64 32)
export SENTRY_DSN="https://..."

# Start services
docker-compose -f docker-compose.prod.yml up -d

# View logs
docker-compose logs -f api

# Scale API instances
docker-compose up -d --scale api=3
```

---

## ☁️ Cloud Deployment

### AWS Deployment

#### Option 1: Elastic Beanstalk
```bash
# Initialize EB
eb init -p "Node.js 18 running on 64bit Amazon Linux 2"

# Configure environment
eb create production-env

# Deploy
eb deploy

# View logs
eb logs

# Scale
eb scale 5
```

#### Option 2: ECS + Fargate
```bash
# Push image to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 123456789.dkr.ecr.us-east-1.amazonaws.com

docker tag collab-editor:latest 123456789.dkr.ecr.us-east-1.amazonaws.com/collab-editor:latest

docker push 123456789.dkr.ecr.us-east-1.amazonaws.com/collab-editor:latest

# Create ECS task definition and service in AWS Console
# Or use CloudFormation/Terraform
```

### Heroku Deployment
```bash
# Create app
heroku create collab-editor-prod

# Set environment variables
heroku config:set JWT_SECRET=$(openssl rand -base64 32)
heroku config:set MONGO_URI=mongodb+srv://...
heroku config:set REDIS_URL=redis://...
heroku config:set SENTRY_DSN=https://...

# Deploy
git push heroku main

# View logs
heroku logs --tail
```

### DigitalOcean App Platform
```bash
# Using doctl CLI
doctl apps create --spec app.yaml

# Or deploy via web console
# 1. Connect GitHub repo
# 2. Configure environment
# 3. Deploy
```

---

## 🔧 Post-Deployment Setup

### 1. Domain Configuration
```bash
# Update DNS
# A record: your-domain.com -> Load Balancer IP
# CNAME: api.your-domain.com -> api-load-balancer

# SSL Certificate (Let's Encrypt)
certbot certonly --standalone -d your-domain.com -d api.your-domain.com
```

### 2. Database Setup
```bash
# MongoDB Atlas
# 1. Create cluster
# 2. Create database user
# 3. Configure IP whitelist
# 4. Copy connection string to MONGO_URI

# Run migrations (if any)
npm run migrate
```

### 3. Redis Setup
```bash
# Redis Cloud or self-hosted
# Verify connection
redis-cli -u redis://your-redis-url PING
# Should return: PONG
```

### 4. Monitoring Setup

#### Sentry
```bash
# 1. Create project at sentry.io
# 2. Copy DSN
# 3. Set SENTRY_DSN environment variable
# 4. Configure alerts in Sentry dashboard
```

#### CloudWatch/DataDog
```bash
# Configure application performance monitoring
# Setup log aggregation
# Create dashboards
```

### 5. Email Service
```bash
# Gmail: Create app-specific password
# SendGrid: Create API key
# AWS SES: Verify sender identity

# Test email sending
# Trigger invitation to verify setup
```

---

## 📊 Monitoring & Observability

### Application Monitoring
```bash
# Setup application metrics
# Track:
# - Response times
# - Error rates
# - Database queries
# - WebSocket connections
# - Memory usage
# - CPU usage
```

### Log Monitoring
```bash
# Aggregate logs from all instances
# Tools: ELK Stack, Splunk, DataDog

# Set up alerts for:
# - Error rates > 1%
# - Response time > 2s
# - Database connection failures
# - Redis connection failures
```

### Uptime Monitoring
```bash
# Setup health check monitoring
# Services: Pingdom, StatusCake, Uptime Robot

# Monitor endpoints:
# - GET /health
# - POST /api/auth/login
# - WebSocket connection
```

---

## 🔒 SSL/TLS Setup

### Nginx Configuration
```nginx
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    location / {
        proxy_pass http://api:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

---

## 📈 Performance Optimization

### Caching Strategy
```javascript
// Cache static assets
// Cache API responses (where appropriate)
// Use Redis for session data

// Nginx caching
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=api_cache:10m;
proxy_cache api_cache;
proxy_cache_valid 200 10m;
```

### Database Optimization
```bash
# Verify indexes
db.users.getIndexes()
db.projects.getIndexes()
db.files.getIndexes()

# Monitor slow queries
db.setProfilingLevel(1, { slowms: 100 })
```

### Load Testing
```bash
# Use Apache Bench
ab -n 10000 -c 100 http://your-domain.com/api/health

# Or Artillery
npm install -g artillery
artillery quick --count 100 --num 1000 http://your-domain.com/api
```

---

## 🔄 Continuous Deployment

### GitHub Actions Workflow
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
      
      - name: Run Tests
        run: |
          npm install
          npm test
      
      - name: Build Docker Image
        run: docker build -t collab-editor:${{ github.sha }} .
      
      - name: Push to Registry
        run: docker push your-registry/collab-editor:${{ github.sha }}
      
      - name: Deploy to Production
        run: |
          # Deploy command (eb deploy, docker-compose, etc.)
          eb deploy
```

---

## 🔍 Rollback Plan

### If Deployment Fails
```bash
# Revert to previous version
git revert HEAD
git push

# Redeploy
docker-compose pull
docker-compose up -d

# Or with Heroku
heroku releases
heroku rollback v<previous-version>
```

### Data Recovery
```bash
# MongoDB backup restore
mongorestore --uri mongodb+srv://... --archive backup.archive

# Redis snapshot restore
# Copy dump.rdb to Redis data directory
# Restart Redis
```

---

## ✅ Post-Deployment Validation

- [ ] Health check endpoint responds
- [ ] Authentication working (login/register)
- [ ] Project CRUD operations working
- [ ] Real-time collaboration working
- [ ] WebSocket connections established
- [ ] File uploads working
- [ ] Invitations sending emails
- [ ] Error monitoring capturing errors
- [ ] Audit logs being recorded
- [ ] Rate limiting enforced
- [ ] CORS working correctly
- [ ] SSL certificate valid

---

## 📞 Troubleshooting

### Common Issues

**Database Connection Failed**
```bash
# Verify connection string
# Check IP whitelist
# Verify username/password
# Check network connectivity
```

**Redis Connection Failed**
```bash
# Verify Redis is running
# Check connection string
# Verify credentials
redis-cli -u $REDIS_URL PING
```

**Email Not Sending**
```bash
# Verify SMTP settings
# Check credentials
# Verify IP whitelist with email provider
# Check Sentry logs
```

**WebSocket Connection Issues**
```bash
# Verify Socket.io configuration
# Check CORS settings
# Verify Redis pub/sub working
# Check load balancer WebSocket support
```

---

## 📚 Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [AWS Deployment Guide](https://docs.aws.amazon.com/)
- [Heroku Deployment Guide](https://devcenter.heroku.com/)
- [Sentry Documentation](https://docs.sentry.io/)
- [MongoDB Deployment Guide](https://docs.mongodb.com/manual/administration/production-deployment/)

---

**Last Updated**: June 27, 2026  
**Status**: Production-Ready ✅

