import { dbService } from '@/lib/database';
import { PresenceManager } from '@/lib/presence/presence-manager';
import { NotificationBroadcaster } from '@/lib/websocket/notification-broadcaster';

export interface MessageNotificationData {
  conversationId: string;
  messageId: string;
  senderId: string;
  senderName: string;
  conversationName?: string;
  conversationType: 'direct' | 'group' | 'study_group';
  messageContent: string;
  messageType: string;
}

export class MessageNotificationHandler {
  private static prisma = dbService.getPrisma();

  /**
   * Handle new message and create notifications for offline users
   */
  static async handleNewMessage(messageData: MessageNotificationData): Promise<void> {
    try {
      console.log(`🔔 MessageNotification: Handling new message in conversation ${messageData.conversationId}`);
      
      // Get all participants in the conversation
      const participants = await this.getConversationParticipants(messageData.conversationId);
      
      for (const participant of participants) {
        // Skip the sender
        if (participant.userId === messageData.senderId) continue;
        
        // Check if user is actively viewing this conversation
        const isActive = await PresenceManager.isUserActiveInConversation(
          participant.userId, 
          messageData.conversationId
        );
        
        console.log(`🔍 MessageNotification: User ${participant.userId} active in conversation: ${isActive}`);
        
        // Only create notification if user is NOT actively chatting
        if (!isActive) {
          await this.createMessageNotification(participant.userId, messageData);
        } else {
          console.log(`⏭️ MessageNotification: Skipping notification for active user ${participant.userId}`);
        }
      }
    } catch (error) {
      console.error('❌ MessageNotification: Error handling new message:', error);
    }
  }

  /**
   * Create a message notification for a specific user
   */
  private static async createMessageNotification(userId: string, messageData: MessageNotificationData): Promise<void> {
    try {
      const notificationTitle = this.getNotificationTitle(messageData);
      const notificationMessage = this.getNotificationMessage(messageData);
      
      console.log(`🔔 MessageNotification: Creating notification for user ${userId}: ${notificationTitle}`);
      
      const notification = await this.prisma.notification.create({
        data: {
          userId,
          type: messageData.conversationType === 'direct' ? 'direct_message' : 'group_message',
          category: 'messaging',
          title: notificationTitle,
          message: notificationMessage,
          priority: 'high',
          actionUrl: `/messaging/${messageData.conversationId}`,
          senderId: messageData.senderId,
          data: JSON.stringify({
            conversationId: messageData.conversationId,
            messageId: messageData.messageId,
            senderId: messageData.senderId,
            conversationType: messageData.conversationType,
            messageType: messageData.messageType
          })
        }
      });

      console.log(`✅ MessageNotification: Created notification ${notification.id} for user ${userId}`);
      
      // Send real-time notification via WebSocket
      await NotificationBroadcaster.broadcastToUser(userId, {
        id: notification.id,
        userId: notification.userId,
        type: notification.type,
        category: notification.category,
        title: notification.title,
        message: notification.message,
        priority: notification.priority,
        actionUrl: notification.actionUrl,
        senderId: notification.senderId,
        data: notification.data ? JSON.parse(notification.data) : undefined,
        createdAt: notification.createdAt
      });

      // Also broadcast notification count update
      const unreadCount = await this.getUnreadMessageCount(userId);
      await NotificationBroadcaster.broadcastNotificationCount(userId, unreadCount);
      
    } catch (error) {
      console.error('❌ MessageNotification: Error creating notification:', error);
    }
  }

  /**
   * Get conversation participants
   */
  private static async getConversationParticipants(conversationId: string): Promise<{ userId: string }[]> {
    try {
      const participants = await this.prisma.conversationParticipant.findMany({
        where: {
          conversationId,
          isActive: true
        },
        select: {
          userId: true
        }
      });

      return participants;
    } catch (error) {
      console.error('❌ MessageNotification: Error getting conversation participants:', error);
      return [];
    }
  }

  /**
   * Generate notification title based on conversation type
   */
  private static getNotificationTitle(messageData: MessageNotificationData): string {
    switch (messageData.conversationType) {
      case 'direct':
        return `New message from ${messageData.senderName}`;
      case 'group':
      case 'study_group':
        return `New message in ${messageData.conversationName || 'Group'}`;
      default:
        return 'New message';
    }
  }

  /**
   * Generate notification message with truncated content
   */
  private static getNotificationMessage(messageData: MessageNotificationData): string {
    const maxLength = 100;
    let content = messageData.messageContent;
    
    // Handle different message types
    switch (messageData.messageType) {
      case 'image':
        content = '📷 Sent a photo';
        break;
      case 'file':
        content = '📎 Sent a file';
        break;
      case 'system':
        content = 'System message';
        break;
      default:
        // Truncate text content
        if (content.length > maxLength) {
          content = content.substring(0, maxLength) + '...';
        }
    }
    
    return content;
  }

  /**
   * Mark message notifications as read when user views conversation
   */
  static async markMessageNotificationsAsRead(userId: string, conversationId: string): Promise<void> {
    try {
      console.log(`🔔 MessageNotification: Marking notifications as read for user ${userId} in conversation ${conversationId}`);
      
      await this.prisma.notification.updateMany({
        where: {
          userId,
          type: {
            in: ['direct_message', 'group_message']
          },
          data: {
            contains: JSON.stringify({
              conversationId
            })
          },
          read: false
        },
        data: {
          read: true,
          updatedAt: new Date()
        }
      });

      console.log(`✅ MessageNotification: Marked notifications as read for user ${userId}`);
      
      // Broadcast notification count update
      const unreadCount = await this.getUnreadMessageCount(userId);
      await NotificationBroadcaster.broadcastNotificationCount(userId, unreadCount);
    } catch (error) {
      console.error('❌ MessageNotification: Error marking notifications as read:', error);
    }
  }

  /**
   * Get unread message count for a user
   */
  static async getUnreadMessageCount(userId: string): Promise<number> {
    try {
      const count = await this.prisma.notification.count({
        where: {
          userId,
          type: {
            in: ['direct_message', 'group_message']
          },
          read: false
        }
      });

      return count;
    } catch (error) {
      console.error('❌ MessageNotification: Error getting unread message count:', error);
      return 0;
    }
  }

  /**
   * Get unread message count for a specific conversation
   */
  static async getUnreadMessageCountForConversation(userId: string, conversationId: string): Promise<number> {
    try {
      const count = await this.prisma.notification.count({
        where: {
          userId,
          type: {
            in: ['direct_message', 'group_message']
          },
          data: {
            contains: JSON.stringify({
              conversationId
            })
          },
          read: false
        }
      });

      return count;
    } catch (error) {
      console.error('❌ MessageNotification: Error getting unread message count for conversation:', error);
      return 0;
    }
  }
}
