import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { NotificationType } from '@prisma/client';

export interface EmailData {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface NotificationEmailContext {
  recipientName: string;
  senderName?: string;
  caseTitle: string;
  caseId: number;
  notificationType: NotificationType;
  customMessage?: string;
  frontendUrl: string;
}

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter;

  constructor() {
    this.initializeTransporter();
  }

  private initializeTransporter() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    // Verify connection configuration
    this.transporter.verify((error) => {
      if (error) {
        this.logger.error('SMTP configuration error:', error);
      } else {
        this.logger.log('Mail service is ready to send emails');
      }
    });
  }

  async sendEmail(emailData: EmailData): Promise<boolean> {
    try {
      this.logger.log(`Sending email to: ${emailData.to}, Subject: ${emailData.subject}`);

      const info = await this.transporter.sendMail({
        from: process.env.SMTP_FROM,
        to: emailData.to,
        subject: emailData.subject,
        text: emailData.text,
        html: emailData.html,
      });

      this.logger.log(`Email sent successfully: ${info.messageId}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send email to ${emailData.to}:`, error);
      return false;
    }
  }

  async sendNotificationEmail(
    recipientEmail: string,
    context: NotificationEmailContext,
  ): Promise<boolean> {
    const { subject, html, text } = this.generateNotificationEmailContent(context);

    return this.sendEmail({
      to: recipientEmail,
      subject,
      html,
      text,
    });
  }

  private generateNotificationEmailContent(context: NotificationEmailContext): {
    subject: string;
    html: string;
    text: string;
  } {
    const caseUrl = `${context.frontendUrl}/cases/${context.caseId}`;
    let subject = '';
    let title = '';
    let message = '';

    switch (context.notificationType) {
      case NotificationType.CASE_CREATED:
        subject = `新案件创建通知 - ${context.caseTitle}`;
        title = '新案件创建';
        message = context.customMessage || `新案件 "${context.caseTitle}" 已创建，需要关注`;
        break;

      case NotificationType.CASE_ASSIGNED:
        subject = `案件分配通知 - ${context.caseTitle}`;
        title = '案件已分配';
        message = context.customMessage || `案件 "${context.caseTitle}" 已分配给您`;
        break;

      case NotificationType.CASE_ACCEPTED:
        subject = `案件接受通知 - ${context.caseTitle}`;
        title = '案件已接受';
        message = context.customMessage || `您的案件 "${context.caseTitle}" 已被接受`;
        break;

      case NotificationType.CASE_REJECTED:
        subject = `案件拒绝通知 - ${context.caseTitle}`;
        title = '案件已拒绝';
        message = context.customMessage || `您的案件 "${context.caseTitle}" 已被拒绝`;
        break;

      case NotificationType.CASE_STATUS_CHANGED:
        subject = `案件状态变更通知 - ${context.caseTitle}`;
        title = '案件状态变更';
        message = context.customMessage || `案件 "${context.caseTitle}" 的状态已更新`;
        break;

      case NotificationType.CASE_COMMENT_ADDED:
        subject = `案件新评论通知 - ${context.caseTitle}`;
        title = '新评论';
        message = context.customMessage || `案件 "${context.caseTitle}" 有新的评论`;
        break;

      default:
        subject = `案件通知 - ${context.caseTitle}`;
        title = '案件通知';
        message = context.customMessage || `案件 "${context.caseTitle}" 有更新`;
    }

    const html = this.generateEmailHTML({
      title,
      recipientName: context.recipientName,
      message,
      caseTitle: context.caseTitle,
      caseId: context.caseId,
      caseUrl,
      senderName: context.senderName,
    });

    const text = this.generateEmailText({
      title,
      recipientName: context.recipientName,
      message,
      caseTitle: context.caseTitle,
      caseId: context.caseId,
      caseUrl,
    });

    return { subject, html, text };
  }

  private generateEmailHTML(params: {
    title: string;
    recipientName: string;
    message: string;
    caseTitle: string;
    caseId: number;
    caseUrl: string;
    senderName?: string;
  }): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${params.title}</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .email-container {
            background-color: white;
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        .header {
            text-align: center;
            border-bottom: 2px solid #3b82f6;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .header h1 {
            color: #3b82f6;
            margin: 0;
            font-size: 24px;
        }
        .content {
            margin: 20px 0;
        }
        .case-info {
            background-color: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 6px;
            padding: 20px;
            margin: 20px 0;
        }
        .case-info h3 {
            margin: 0 0 10px 0;
            color: #1e293b;
        }
        .case-info p {
            margin: 5px 0;
            color: #64748b;
        }
        .action-button {
            display: inline-block;
            padding: 12px 24px;
            background-color: #3b82f6;
            color: white;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 500;
            margin: 20px 0;
        }
        .action-button:hover {
            background-color: #2563eb;
        }
        .footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e2e8f0;
            color: #64748b;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <h1>案例管理系统</h1>
            <p>Case Management System</p>
        </div>
        
        <div class="content">
            <h2>你好, ${params.recipientName}!</h2>
            
            <p>${params.message}</p>
            
            <div class="case-info">
                <h3>案件信息</h3>
                <p><strong>案件标题:</strong> ${params.caseTitle}</p>
                <p><strong>案件ID:</strong> #${params.caseId}</p>
                ${params.senderName ? `<p><strong>操作者:</strong> ${params.senderName}</p>` : ''}
            </div>
            
            <div style="text-align: center;">
                <a href="${params.caseUrl}" class="action-button">查看案件详情</a>
            </div>
            
            <p>请及时查看并处理相关事务。如有任何问题，请联系系统管理员。</p>
        </div>
        
        <div class="footer">
            <p>这是一封自动生成的邮件，请勿直接回复。</p>
            <p>© 2025 案例管理系统. 保留所有权利.</p>
        </div>
    </div>
</body>
</html>
    `;
  }

  private generateEmailText(params: {
    title: string;
    recipientName: string;
    message: string;
    caseTitle: string;
    caseId: number;
    caseUrl: string;
  }): string {
    return `
案例管理系统 - ${params.title}

你好, ${params.recipientName}!

${params.message}

案件信息:
- 案件标题: ${params.caseTitle}
- 案件ID: #${params.caseId}

查看案件详情: ${params.caseUrl}

请及时查看并处理相关事务。如有任何问题，请联系系统管理员。

---
这是一封自动生成的邮件，请勿直接回复。
© 2025 案例管理系统. 保留所有权利.
    `;
  }
}