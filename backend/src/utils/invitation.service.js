// User Invitation & Notification System
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
const logger = require('./logger');

const invitationSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
      index: true,
    },
    invitedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    invitedUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    invitedEmail: {
      type: String,
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'declined', 'expired'],
      default: 'pending',
      index: true,
    },
    token: {
      type: String,
      unique: true,
      index: true,
    },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      index: true,
    },
    role: {
      type: String,
      enum: ['viewer', 'editor', 'admin'],
      default: 'editor',
    },
    createdAt: {
      type: Date,
      default: Date.now,
      index: -1,
    },
  },
  { timestamps: true }
);

// Compound indexes
invitationSchema.index({ projectId: 1, status: 1 });
invitationSchema.index({ invitedEmail: 1, status: 1 });

const Invitation = mongoose.model('Invitation', invitationSchema);

class InvitationService {
  static async sendInvitation(projectId, invitedBy, invitedEmail, role = 'editor') {
    try {
      const token = require('crypto').randomBytes(32).toString('hex');

      const invitation = await Invitation.create({
        projectId,
        invitedBy,
        invitedEmail,
        token,
        role,
      });

      // Send email notification
      await this.sendInvitationEmail(invitedEmail, projectId, token, invitedBy);

      logger.info(`Invitation sent to ${invitedEmail} for project ${projectId}`);
      return invitation;
    } catch (error) {
      logger.error(`Failed to send invitation: ${error.message}`);
      throw error;
    }
  }

  static async acceptInvitation(token, userId) {
    try {
      const invitation = await Invitation.findOne({ token });

      if (!invitation) {
        throw new Error('Invitation not found');
      }

      if (invitation.status !== 'pending') {
        throw new Error(`Invitation already ${invitation.status}`);
      }

      if (new Date() > invitation.expiresAt) {
        invitation.status = 'expired';
        await invitation.save();
        throw new Error('Invitation has expired');
      }

      // Update invitation status
      invitation.status = 'accepted';
      invitation.invitedUser = userId;
      await invitation.save();

      // Add user to project collaborators
      const Project = require('../projects/project.model');
      await Project.findByIdAndUpdate(
        invitation.projectId,
        { $addToSet: { collaborators: userId } }
      );

      logger.info(`Invitation accepted by user ${userId}`);
      return invitation;
    } catch (error) {
      logger.error(`Failed to accept invitation: ${error.message}`);
      throw error;
    }
  }

  static async declineInvitation(token) {
    try {
      const invitation = await Invitation.findOneAndUpdate(
        { token },
        { status: 'declined' },
        { new: true }
      );

      logger.info(`Invitation declined for ${invitation.invitedEmail}`);
      return invitation;
    } catch (error) {
      logger.error(`Failed to decline invitation: ${error.message}`);
      throw error;
    }
  }

  static async getPendingInvitations(_userId) {
    try {
      return await Invitation.find({
        invitedEmail: { $exists: true },
        status: 'pending',
        expiresAt: { $gt: new Date() },
      })
        .populate('projectId', 'name')
        .populate('invitedBy', 'name');
    } catch (error) {
      logger.error(`Failed to fetch invitations: ${error.message}`);
      return [];
    }
  }

  static async sendInvitationEmail(email, projectId, token, _invitedBy) {
    try {
      // Configure email service
      const transporter = nodemailer.createTransport({
        service: process.env.EMAIL_SERVICE || 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD,
        },
      });

      const invitationLink = `${process.env.FRONTEND_URL}/invite/${token}`;

      const mailOptions = {
        from: process.env.EMAIL_FROM || 'noreply@collab-editor.dev',
        to: email,
        subject: 'You have been invited to a project',
        html: `
          <h2>Project Invitation</h2>
          <p>You have been invited to collaborate on a project!</p>
          <a href="${invitationLink}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Accept Invitation
          </a>
          <p>This invitation will expire in 7 days.</p>
        `,
      };

      if (process.env.NODE_ENV === 'production') {
        await transporter.sendMail(mailOptions);
        logger.info(`Invitation email sent to ${email}`);
      } else {
        logger.info(`Invitation email would be sent to ${email} (development mode)`);
      }
    } catch (error) {
      logger.error(`Failed to send invitation email: ${error.message}`);
      // Don't throw - invitation was created successfully
    }
  }

  static async cleanupExpiredInvitations() {
    try {
      const result = await Invitation.updateMany(
        {
          status: 'pending',
          expiresAt: { $lt: new Date() },
        },
        { status: 'expired' }
      );

      logger.info(`Cleaned up ${result.modifiedCount} expired invitations`);
    } catch (error) {
      logger.error(`Failed to cleanup expired invitations: ${error.message}`);
    }
  }
}

module.exports = { Invitation, InvitationService };
