// Audit Logging Service
const mongoose = require('mongoose');
const logger = require('./logger');

const auditLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    action: {
      type: String,
      enum: [
        'CREATE_PROJECT',
        'UPDATE_PROJECT',
        'DELETE_PROJECT',
        'CREATE_FILE',
        'UPDATE_FILE',
        'DELETE_FILE',
        'JOIN_PROJECT',
        'LEAVE_PROJECT',
        'INVITE_USER',
        'LOGIN',
        'LOGOUT',
        'UPDATE_PROFILE',
        'CODE_EDIT',
      ],
      required: true,
      index: true,
    },
    resourceType: {
      type: String,
      enum: ['PROJECT', 'FILE', 'USER', 'AUTH'],
      required: true,
    },
    resourceId: {
      type: mongoose.Schema.Types.ObjectId,
      index: true,
    },
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      index: true,
    },
    changes: {
      before: mongoose.Schema.Types.Mixed,
      after: mongoose.Schema.Types.Mixed,
    },
    metadata: {
      ipAddress: String,
      userAgent: String,
      statusCode: Number,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      index: -1,
    },
  },
  { timestamps: false }
);

// Compound indexes for efficient queries
auditLogSchema.index({ userId: 1, createdAt: -1 });
auditLogSchema.index({ projectId: 1, createdAt: -1 });
auditLogSchema.index({ action: 1, createdAt: -1 });

const AuditLog = mongoose.model('AuditLog', auditLogSchema);

class AuditService {
  static async log(data) {
    try {
      const {
        userId,
        action,
        resourceType,
        resourceId,
        projectId,
        changes,
        metadata,
      } = data;

      await AuditLog.create({
        userId,
        action,
        resourceType,
        resourceId,
        projectId,
        changes,
        metadata,
      });

      logger.info(
        `Audit log: ${action} by user ${userId} on ${resourceType} ${resourceId}`
      );
    } catch (error) {
      logger.error(`Failed to create audit log: ${error.message}`);
    }
  }

  static async getUserActivity(userId, limit = 50) {
    try {
      return await AuditLog.find({ userId })
        .sort({ createdAt: -1 })
        .limit(limit)
        .populate('userId', 'name email')
        .populate('projectId', 'name');
    } catch (error) {
      logger.error(`Failed to fetch user activity: ${error.message}`);
      return [];
    }
  }

  static async getProjectActivity(projectId, limit = 100) {
    try {
      return await AuditLog.find({ projectId })
        .sort({ createdAt: -1 })
        .limit(limit)
        .populate('userId', 'name email');
    } catch (error) {
      logger.error(`Failed to fetch project activity: ${error.message}`);
      return [];
    }
  }

  static async getRecentChanges(resourceId, limit = 20) {
    try {
      return await AuditLog.find({ resourceId })
        .sort({ createdAt: -1 })
        .limit(limit)
        .populate('userId', 'name email');
    } catch (error) {
      logger.error(`Failed to fetch changes: ${error.message}`);
      return [];
    }
  }

  static async cleanup(daysOld = 90) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const result = await AuditLog.deleteMany({
        createdAt: { $lt: cutoffDate },
      });

      logger.info(
        `Cleaned up ${result.deletedCount} old audit logs (older than ${daysOld} days)`
      );
    } catch (error) {
      logger.error(`Audit log cleanup failed: ${error.message}`);
    }
  }
}

module.exports = { AuditLog, AuditService };
