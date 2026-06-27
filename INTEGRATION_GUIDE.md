# Integration Guides - Backend Enhancements

Complete guides for integrating all new production-ready features.

## 🧪 Testing Setup

### Installation
```bash
npm install --save-dev jest supertest
```

### Jest Configuration
Create `jest.config.js`:
```javascript
module.exports = {
  testEnvironment: 'node',
  collectCoverageFrom: ['src/**/*.js'],
  coveragePathIgnorePatterns: ['/node_modules/'],
  testMatch: ['**/test/**/*.test.js'],
  setupFilesAfterEnv: ['<rootDir>/test/setup.js'],
};
```

### Running Tests
```bash
npm test              # Run all tests
npm run test:watch   # Watch mode
npm run test:coverage # Coverage report
```

### Writing Tests
```javascript
// test/example.test.js
const { request, app } = require('./setup');

describe('Feature Tests', () => {
  it('should test endpoint', async () => {
    const response = await request(app)
      .post('/api/projects')
      .set('Authorization', 'Bearer TOKEN')
      .send({ name: 'Test Project' });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
  });
});
```

---

## ✅ Input Validation

### Usage in Routes
```javascript
// routes/auth.js
const { validate } = require('../middlewares/validation.middleware');
const { registerSchema, loginSchema } = require('../utils/validation.schemas');

router.post('/register', validate(registerSchema), registerController.register);
router.post('/login', validate(loginSchema), registerController.login);
```

### Adding Custom Validators
```javascript
// utils/validation.schemas.js
const customSchema = z.object({
  field: z.string().min(3).max(50),
  email: emailSchema,
  // ... more fields
});
```

---

## 🔐 Security Enhancements

### CORS Configuration
```env
# .env
ALLOWED_ORIGINS=http://localhost:5173,https://yourdomain.com,https://app.yourdomain.com
NODE_ENV=production
```

### Security Headers
All headers automatically applied via Helmet:
- Content Security Policy
- Strict-Transport-Security
- X-Content-Type-Options
- X-Frame-Options
- etc.

---

## 🛡️ Rate Limiting

### Pre-configured Limiters
```javascript
// Apply to your routes
const { apiLimiter, authLimiter, fileLimiter } = require('../middlewares/rateLimit.advanced');

app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/', apiLimiter);
app.use('/api/files', fileLimiter);
```

### Configure Limits
```bash
# .env
REDIS_URL=redis://localhost:6379  # Required for distributed rate limiting
```

---

## 🔑 Authorization Checks

### Protect Routes
```javascript
const { protect } = require('../middlewares/auth.middleware');
const {
  checkProjectOwnership,
  checkFileAccess,
  checkProjectOwnerOnly,
} = require('../middlewares/authorization.middleware');

// Route protection examples
router.get('/projects/:projectId',
  protect,
  checkProjectOwnership,
  projectController.getProject
);

router.delete('/files/:fileId',
  protect,
  checkFileAccess,
  checkProjectOwnerOnly,  // Only owner can delete
  fileController.deleteFile
);
```

---

## 📊 Database Indexes

### Add to Models
```javascript
// models/user.model.js
const userSchema = new Schema({...});

userSchema.index({ email: 1 });           // Unique, fast lookups
userSchema.index({ createdAt: -1 });      // Sort by date
userSchema.index({ email: 1, createdAt: -1 }); // Compound

module.exports = mongoose.model('User', userSchema);
```

### Check Indexes
```bash
db.users.getIndexes()  # MongoDB CLI
```

---

## 📝 Audit Logging

### Log Actions
```javascript
const { AuditService } = require('../utils/audit.service');

// After any action
await AuditService.log({
  userId: req.user.id,
  action: 'CREATE_FILE',
  resourceType: 'FILE',
  resourceId: file._id,
  projectId: projectId,
  changes: {
    before: null,
    after: file,
  },
  metadata: {
    ipAddress: req.ip,
    userAgent: req.get('user-agent'),
    statusCode: 201,
  },
});
```

### Retrieve Activity
```javascript
// Get user activity
const activity = await AuditService.getUserActivity(userId, limit);

// Get project activity
const projectActivity = await AuditService.getProjectActivity(projectId, limit);

// Cleanup old logs (7+ days)
await AuditService.cleanup(7);
```

---

## 📄 Pagination

### Using Pagination Utility
```javascript
const PaginationUtil = require('../utils/pagination.util');
const Project = require('../projects/project.model');

router.get('/projects', protect, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const query = Project.find({ owner: req.user.id });
    const result = await PaginationUtil.paginate(query, page, limit);

    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});
```

---

## 📦 File Size Limits

### Middleware Application
```javascript
const { checkFileSize, checkProjectSize } = require('../middlewares/fileSize.middleware');

router.post('/files/:projectId/upload',
  protect,
  checkFileSize,           // Check individual file (10MB)
  checkProjectSize,        // Check project total (500MB)
  fileController.uploadFile
);
```

### Configuration
```env
# .env
# Limits are hardcoded but can be made configurable
# File: 10MB
# Project Total: 500MB
```

---

## 🔄 API Versioning

### Using Versions
```javascript
// routes/index.js
app.use('/api/v1', routerV1);  // Legacy
app.use('/api/v2', routerV2);  // Current
app.use('/api', routerV2);     // Default to v2
```

### Version-Specific Logic
```javascript
// Middleware
const apiVersion = (version) => {
  return (req, res, next) => {
    req.apiVersion = version;
    next();
  };
};

// In controller
if (req.apiVersion === '1.0') {
  // Legacy behavior
} else {
  // New behavior
}
```

---

## ⚡ Operational Transformation (OT)

### Resolve Conflicts
```javascript
const OT = require('../utils/operational-transform');

// When conflicting edits occur
const resolution = OT.resolveConflict(
  originalText,
  userAEdit,     // { p: 10, s: 'hello' }
  userBEdit      // { p: 12, d: 3 }
);
```

### Operations Structure
```javascript
{
  p: 10,         // Position
  s: 'text',     // String to insert
  d: 5           // OR number of chars to delete
}
```

---

## 📊 Error Monitoring with Sentry

### Setup
```bash
npm install @sentry/node
```

### Configuration
```env
# .env
SENTRY_DSN=https://your-key@sentry.io/project-id
```

### Capturing Errors
```javascript
const { captureException, captureMessage } = require('../utils/sentry.config');

try {
  // Some operation
} catch (error) {
  captureException(error, { userId: req.user.id });
}

// Log messages
captureMessage('Important event occurred', 'warning');
```

### View Errors
- Dashboard: https://sentry.io/organizations/your-org/
- Real-time monitoring and alerting
- Error grouping and analysis

---

## 💌 Invitation & Notifications

### Send Invitations
```javascript
const { InvitationService } = require('../utils/invitation.service');

await InvitationService.sendInvitation(
  projectId,
  invitedByUserId,
  invitedEmail,
  'editor'  // role
);
```

### Accept Invitations
```javascript
await InvitationService.acceptInvitation(invitationToken, userId);
```

### Get Pending Invitations
```javascript
const pending = await InvitationService.getPendingInvitations(userId);
```

### Email Setup
```env
# .env
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=noreply@yourdomain.com
FRONTEND_URL=https://app.yourdomain.com
```

---

## 🔧 Integration Checklist

- [ ] Install dependencies: `npm install`
- [ ] Add testing setup
- [ ] Configure validation schemas
- [ ] Setup security (CORS, Helmet)
- [ ] Enable rate limiting
- [ ] Add authorization checks
- [ ] Create database indexes
- [ ] Setup audit logging
- [ ] Implement pagination
- [ ] Add file size limits
- [ ] Configure API versioning
- [ ] Integrate OT for conflict resolution
- [ ] Setup Sentry error monitoring
- [ ] Configure email for invitations
- [ ] Test all features
- [ ] Update environment variables
- [ ] Deploy to production

---

**For detailed API usage, see [API.md](../API.md)**

