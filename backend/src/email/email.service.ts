import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { Case } from '../cases/entities/case.entity';
import { User } from '../users/entities/user.entity';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    this.initializeTransporter();
  }

  private initializeTransporter(): void {
    const emailProvider = this.configService.get<string>('EMAIL_PROVIDER', 'console');
    
    if (emailProvider === 'smtp') {
      // SMTP Configuration for production
      this.transporter = nodemailer.createTransport({
        host: this.configService.get<string>('SMTP_HOST'),
        port: this.configService.get<number>('SMTP_PORT', 587),
        secure: this.configService.get<boolean>('SMTP_SECURE', false),
        auth: {
          user: this.configService.get<string>('SMTP_USER'),
          pass: this.configService.get<string>('SMTP_PASS'),
        },
      });
    } else if (emailProvider === 'mailhog') {
      // MailHog for development
      this.transporter = nodemailer.createTransport({
        host: this.configService.get<string>('MAILHOG_HOST', 'localhost'),
        port: this.configService.get<number>('MAILHOG_PORT', 1025),
        ignoreTLS: true,
      });
    } else {
      // Console output for development/testing
      this.transporter = nodemailer.createTransport({
        streamTransport: true,
        newline: 'unix',
        buffer: true,
      });
    }

    this.logger.log(`Email service initialized with provider: ${emailProvider}`);
  }

  private async sendEmail(options: EmailOptions): Promise<void> {
    try {
      const emailOptions = {
        from: this.configService.get<string>('EMAIL_FROM', 'noreply@casemanagement.local'),
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text || options.html.replace(/<[^>]*>/g, ''),
      };

      const emailProvider = this.configService.get<string>('EMAIL_PROVIDER', 'console');
      
      if (emailProvider === 'console') {
        this.logger.log(`Email would be sent to: ${options.to}`);
        this.logger.log(`Subject: ${options.subject}`);
        this.logger.log(`Content: ${options.text || options.html.replace(/<[^>]*>/g, '')}`);
        return;
      }

      const result = await this.transporter.sendMail(emailOptions);
      this.logger.log(`Email sent successfully to ${options.to}: ${result.messageId || 'No ID'}`);
    } catch (error) {
      this.logger.error(`Failed to send email to ${options.to}`, error instanceof Error ? error.stack : error);
      throw error;
    }
  }

  async sendCaseAssignmentNotification(
    case_: Case,
    assignedUser: User,
    assignedBy: User,
  ): Promise<void> {
    this.logger.log(`Sending case assignment notification for case ${case_.id} to ${assignedUser.email}`);

    const subject = `Case Assignment: ${case_.title} (${case_.caseNumber})`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Case Assignment Notification</h2>
        
        <p>Dear ${assignedUser.firstName} ${assignedUser.lastName},</p>
        
        <p>You have been assigned a new case:</p>
        
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #1f2937;">Case Details</h3>
          <p><strong>Case Number:</strong> ${case_.caseNumber}</p>
          <p><strong>Title:</strong> ${case_.title}</p>
          <p><strong>Type:</strong> ${case_.type}</p>
          <p><strong>Priority:</strong> ${case_.priority}</p>
          <p><strong>Client:</strong> ${case_.client?.fullName || 'N/A'}</p>
          <p><strong>Due Date:</strong> ${case_.dueDate ? new Date(case_.dueDate).toLocaleDateString() : 'Not set'}</p>
          ${case_.description ? `<p><strong>Description:</strong> ${case_.description}</p>` : ''}
        </div>
        
        <p><strong>Assigned by:</strong> ${assignedBy.firstName} ${assignedBy.lastName}</p>
        <p><strong>Assignment Date:</strong> ${new Date().toLocaleDateString()}</p>
        
        <p>Please log into the case management system to review and start working on this case.</p>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 12px;">
          <p>This is an automated notification from the Case Management System.</p>
        </div>
      </div>
    `;

    await this.sendEmail({
      to: assignedUser.email,
      subject,
      html,
    });
  }

  async sendCaseStatusNotification(
    case_: Case,
    previousStatus: string,
    newStatus: string,
    changedBy: User,
  ): Promise<void> {
    this.logger.log(`Sending case status notification for case ${case_.id}`);

    const subject = `Case Status Update: ${case_.title} (${case_.caseNumber})`;
    
    // Determine recipients based on case relationships
    const recipients: string[] = [];
    
    if (case_.client?.email) {
      recipients.push(case_.client.email);
    }
    
    if (case_.assignedTo?.email && case_.assignedTo.email !== changedBy.email) {
      recipients.push(case_.assignedTo.email);
    }
    
    if (case_.createdBy?.email && case_.createdBy.email !== changedBy.email && !recipients.includes(case_.createdBy.email)) {
      recipients.push(case_.createdBy.email);
    }

    const statusMap = {
      new: 'New',
      pending_review: 'Pending Review',
      assigned: 'Assigned',
      in_progress: 'In Progress',
      pending_client_response: 'Pending Client Response',
      on_hold: 'On Hold',
      completed: 'Completed',
      closed: 'Closed',
      archived: 'Archived',
    };

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Case Status Update</h2>
        
        <p>The status of case <strong>${case_.caseNumber}</strong> has been updated.</p>
        
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #1f2937;">Case Details</h3>
          <p><strong>Case Number:</strong> ${case_.caseNumber}</p>
          <p><strong>Title:</strong> ${case_.title}</p>
          <p><strong>Previous Status:</strong> <span style="color: #dc2626;">${statusMap[previousStatus] || previousStatus}</span></p>
          <p><strong>New Status:</strong> <span style="color: #059669;">${statusMap[newStatus] || newStatus}</span></p>
          <p><strong>Updated by:</strong> ${changedBy.firstName} ${changedBy.lastName}</p>
          <p><strong>Update Date:</strong> ${new Date().toLocaleDateString()}</p>
        </div>
        
        <p>Please log into the case management system for more details.</p>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 12px;">
          <p>This is an automated notification from the Case Management System.</p>
        </div>
      </div>
    `;

    // Send notification to all relevant parties
    for (const recipient of recipients) {
      await this.sendEmail({
        to: recipient,
        subject,
        html,
      });
    }
  }

  async sendPasswordResetEmail(user: User, resetToken: string): Promise<void> {
    this.logger.log(`Sending password reset email to ${user.email}`);

    const resetUrl = `${this.configService.get<string>('FRONTEND_URL', 'http://localhost:3001')}/auth/reset-password?token=${resetToken}`;
    
    const subject = 'Password Reset Request';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Password Reset Request</h2>
        
        <p>Dear ${user.firstName} ${user.lastName},</p>
        
        <p>You have requested to reset your password for the Case Management System.</p>
        
        <div style="background-color: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
          <p style="margin: 0;"><strong>Click the link below to reset your password:</strong></p>
          <p style="margin: 10px 0;"><a href="${resetUrl}" style="color: #1d4ed8; text-decoration: none; font-weight: bold;">${resetUrl}</a></p>
          <p style="margin: 0; color: #92400e; font-size: 14px;">This link will expire in 1 hour for security reasons.</p>
        </div>
        
        <p>If you didn't request this password reset, please ignore this email or contact support if you have concerns.</p>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 12px;">
          <p>This is an automated notification from the Case Management System.</p>
          <p>For security reasons, this link will expire in 1 hour.</p>
        </div>
      </div>
    `;

    await this.sendEmail({
      to: user.email,
      subject,
      html,
    });
  }

  async sendEmailVerificationEmail(user: User, verificationToken: string): Promise<void> {
    this.logger.log(`Sending email verification to ${user.email}`);

    const verificationUrl = `${this.configService.get<string>('FRONTEND_URL', 'http://localhost:3001')}/auth/verify-email?token=${verificationToken}`;
    
    const subject = 'Email Verification Required';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Welcome to Case Management System</h2>
        
        <p>Dear ${user.firstName} ${user.lastName},</p>
        
        <p>Thank you for registering with the Case Management System. To complete your registration, please verify your email address.</p>
        
        <div style="background-color: #ecfdf5; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
          <p style="margin: 0;"><strong>Click the link below to verify your email:</strong></p>
          <p style="margin: 10px 0;"><a href="${verificationUrl}" style="color: #1d4ed8; text-decoration: none; font-weight: bold;">${verificationUrl}</a></p>
          <p style="margin: 0; color: #065f46; font-size: 14px;">This link will expire in 24 hours.</p>
        </div>
        
        <p>If you didn't create this account, please ignore this email.</p>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 12px;">
          <p>This is an automated notification from the Case Management System.</p>
        </div>
      </div>
    `;

    await this.sendEmail({
      to: user.email,
      subject,
      html,
    });
  }
}