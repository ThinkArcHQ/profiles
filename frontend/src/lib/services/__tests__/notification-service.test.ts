import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { NotificationService, NotificationData } from '../notification-service';

// Mock console.log to capture output
const mockConsoleLog = vi.fn();
const originalConsoleLog = console.log;

beforeEach(() => {
  console.log = mockConsoleLog;
  mockConsoleLog.mockClear();
});

afterEach(() => {
  console.log = originalConsoleLog;
});

describe('NotificationService', () => {
  const mockNotificationData: NotificationData = {
    type: 'new_request',
    recipientEmail: 'recipient@example.com',
    recipientName: 'John Doe',
    senderName: 'Jane Smith',
    appointmentId: 123,
    message: 'Test message',
  };

  describe('sendNewRequestNotification', () => {
    it('should send new request notification successfully', async () => {
      const result = await NotificationService.sendNewRequestNotification(mockNotificationData);
      
      expect(result).toBe(true);
      expect(mockConsoleLog).toHaveBeenCalledWith(
        '📧 New meeting request notification:',
        expect.objectContaining({
          to: 'recipient@example.com',
          subject: 'New meeting request from Jane Smith',
          type: 'new_request',
          appointmentId: 123,
        })
      );
    });
  });

  describe('sendStatusUpdateNotification', () => {
    it('should send accepted status notification', async () => {
      const data = { ...mockNotificationData, type: 'status_update' as const, status: 'accepted' };
      const result = await NotificationService.sendStatusUpdateNotification(data);
      
      expect(result).toBe(true);
      expect(mockConsoleLog).toHaveBeenCalledWith(
        '📧 Status update notification:',
        expect.objectContaining({
          to: 'recipient@example.com',
          subject: 'Your meeting request has been accepted',
          status: 'accepted',
        })
      );
    });

    it('should send rejected status notification', async () => {
      const data = { ...mockNotificationData, type: 'status_update' as const, status: 'rejected' };
      const result = await NotificationService.sendStatusUpdateNotification(data);
      
      expect(result).toBe(true);
      expect(mockConsoleLog).toHaveBeenCalledWith(
        '📧 Status update notification:',
        expect.objectContaining({
          subject: 'Your meeting request has been declined',
          status: 'rejected',
        })
      );
    });
  });

  describe('sendCounterProposalNotification', () => {
    it('should send counter-proposal notification', async () => {
      const data = {
        ...mockNotificationData,
        type: 'counter_proposal' as const,
        proposedTime: new Date('2024-01-15T10:00:00Z'),
        counterMessage: 'How about this time instead?',
      };
      
      const result = await NotificationService.sendCounterProposalNotification(data);
      
      expect(result).toBe(true);
      expect(mockConsoleLog).toHaveBeenCalledWith(
        '📧 Counter-proposal notification:',
        expect.objectContaining({
          to: 'recipient@example.com',
          subject: 'Jane Smith proposed an alternative time',
          type: 'counter_proposal',
          proposedTime: expect.any(Date),
          counterMessage: 'How about this time instead?',
        })
      );
    });
  });

  describe('sendNotification', () => {
    it('should route to correct notification method based on type', async () => {
      const newRequestSpy = vi.spyOn(NotificationService, 'sendNewRequestNotification');
      const statusUpdateSpy = vi.spyOn(NotificationService, 'sendStatusUpdateNotification');
      const counterProposalSpy = vi.spyOn(NotificationService, 'sendCounterProposalNotification');

      // Test new_request
      await NotificationService.sendNotification({ ...mockNotificationData, type: 'new_request' });
      expect(newRequestSpy).toHaveBeenCalled();

      // Test status_update
      await NotificationService.sendNotification({ ...mockNotificationData, type: 'status_update' });
      expect(statusUpdateSpy).toHaveBeenCalled();

      // Test counter_proposal
      await NotificationService.sendNotification({ ...mockNotificationData, type: 'counter_proposal' });
      expect(counterProposalSpy).toHaveBeenCalled();

      newRequestSpy.mockRestore();
      statusUpdateSpy.mockRestore();
      counterProposalSpy.mockRestore();
    });

    it('should handle unknown notification type', async () => {
      const mockConsoleError = vi.fn();
      const originalConsoleError = console.error;
      console.error = mockConsoleError;

      const result = await NotificationService.sendNotification({
        ...mockNotificationData,
        type: 'unknown' as any,
      });

      expect(result).toBe(false);
      expect(mockConsoleError).toHaveBeenCalledWith('Unknown notification type:', 'unknown');

      console.error = originalConsoleError;
    });
  });

  describe('formatDateForEmail', () => {
    it('should format date correctly for email display', () => {
      const testDate = new Date('2024-01-15T10:30:00Z');
      const formatted = NotificationService.formatDateForEmail(testDate);
      
      expect(formatted).toMatch(/Monday, January 15, 2024/);
      expect(formatted).toMatch(/30/); // Just check for minutes, timezone may vary
    });
  });
});