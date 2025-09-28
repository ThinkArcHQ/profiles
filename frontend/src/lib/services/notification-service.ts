/**
 * Notification Service
 * Handles sending notifications for meeting requests and status updates
 */

export interface NotificationData {
  type: 'new_request' | 'status_update' | 'counter_proposal';
  recipientEmail: string;
  recipientName: string;
  senderName: string;
  appointmentId: number;
  message?: string;
  status?: string;
  proposedTime?: Date;
  counterMessage?: string;
}

export class NotificationService {
  /**
   * Send notification for new meeting request
   */
  static async sendNewRequestNotification(data: NotificationData): Promise<boolean> {
    try {
      // In a real application, this would integrate with an email service
      // like SendGrid, AWS SES, or similar
      console.log('📧 New meeting request notification:', {
        to: data.recipientEmail,
        subject: `New meeting request from ${data.senderName}`,
        type: data.type,
        appointmentId: data.appointmentId,
      });

      // Simulate email sending
      await new Promise(resolve => setTimeout(resolve, 100));
      
      return true;
    } catch (error) {
      console.error('Failed to send new request notification:', error);
      return false;
    }
  }

  /**
   * Send notification for status update (accepted/rejected)
   */
  static async sendStatusUpdateNotification(data: NotificationData): Promise<boolean> {
    try {
      const statusText = data.status === 'accepted' ? 'accepted' : 'declined';
      
      console.log('📧 Status update notification:', {
        to: data.recipientEmail,
        subject: `Your meeting request has been ${statusText}`,
        type: data.type,
        status: data.status,
        appointmentId: data.appointmentId,
      });

      // Simulate email sending
      await new Promise(resolve => setTimeout(resolve, 100));
      
      return true;
    } catch (error) {
      console.error('Failed to send status update notification:', error);
      return false;
    }
  }

  /**
   * Send notification for counter-proposal
   */
  static async sendCounterProposalNotification(data: NotificationData): Promise<boolean> {
    try {
      console.log('📧 Counter-proposal notification:', {
        to: data.recipientEmail,
        subject: `${data.senderName} proposed an alternative time`,
        type: data.type,
        proposedTime: data.proposedTime,
        counterMessage: data.counterMessage,
        appointmentId: data.appointmentId,
      });

      // Simulate email sending
      await new Promise(resolve => setTimeout(resolve, 100));
      
      return true;
    } catch (error) {
      console.error('Failed to send counter-proposal notification:', error);
      return false;
    }
  }

  /**
   * Send appropriate notification based on type
   */
  static async sendNotification(data: NotificationData): Promise<boolean> {
    switch (data.type) {
      case 'new_request':
        return this.sendNewRequestNotification(data);
      case 'status_update':
        return this.sendStatusUpdateNotification(data);
      case 'counter_proposal':
        return this.sendCounterProposalNotification(data);
      default:
        console.error('Unknown notification type:', data.type);
        return false;
    }
  }

  /**
   * Format date for email display
   */
  static formatDateForEmail(date: Date): string {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short'
    });
  }
}