import { pusherServer } from '@/lib/pusher';

export interface NotificationBroadcast {
  id: string;
  userId: string;
  type: string;
  category: string;
  title: string;
  message: string;
  priority: string;
  actionUrl?: string;
  senderId?: string;
  data?: any;
  createdAt: Date;
}

export class NotificationBroadcaster {
  /**
   * Broadcast a notification to a specific user in real-time
   */
  static async broadcastToUser(userId: string, notification: NotificationBroadcast): Promise<void> {
    try {
      console.log(`🔔 NotificationBroadcaster: Broadcasting notification ${notification.id} to user ${userId}`);
      
      await pusherServer.trigger(`user-${userId}`, 'new-notification', {
        notification,
        timestamp: new Date().toISOString()
      });

      console.log(`✅ NotificationBroadcaster: Successfully broadcasted notification to user ${userId}`);
    } catch (error) {
      console.error('❌ NotificationBroadcaster: Error broadcasting notification:', error);
    }
  }

  /**
   * Broadcast notification count update to a user
   */
  static async broadcastNotificationCount(userId: string, unreadCount: number): Promise<void> {
    try {
      console.log(`🔔 NotificationBroadcaster: Broadcasting count update for user ${userId}: ${unreadCount}`);
      
      await pusherServer.trigger(`user-${userId}`, 'notification-count-update', {
        unreadCount,
        timestamp: new Date().toISOString()
      });

      console.log(`✅ NotificationBroadcaster: Successfully broadcasted count update to user ${userId}`);
    } catch (error) {
      console.error('❌ NotificationBroadcaster: Error broadcasting count update:', error);
    }
  }

  /**
   * Broadcast notification read status update
   */
  static async broadcastNotificationRead(userId: string, notificationId: string): Promise<void> {
    try {
      console.log(`🔔 NotificationBroadcaster: Broadcasting read status for notification ${notificationId}`);
      
      await pusherServer.trigger(`user-${userId}`, 'notification-read', {
        notificationId,
        timestamp: new Date().toISOString()
      });

      console.log(`✅ NotificationBroadcaster: Successfully broadcasted read status`);
    } catch (error) {
      console.error('❌ NotificationBroadcaster: Error broadcasting read status:', error);
    }
  }

  /**
   * Broadcast multiple notifications (for initial load or bulk updates)
   */
  static async broadcastNotifications(userId: string, notifications: NotificationBroadcast[]): Promise<void> {
    try {
      console.log(`🔔 NotificationBroadcaster: Broadcasting ${notifications.length} notifications to user ${userId}`);
      
      await pusherServer.trigger(`user-${userId}`, 'notifications-update', {
        notifications,
        timestamp: new Date().toISOString()
      });

      console.log(`✅ NotificationBroadcaster: Successfully broadcasted notifications to user ${userId}`);
    } catch (error) {
      console.error('❌ NotificationBroadcaster: Error broadcasting notifications:', error);
    }
  }

  /**
   * Broadcast typing indicators in conversations
   */
  static async broadcastTypingIndicator(conversationId: string, userId: string, isTyping: boolean, userName: string): Promise<void> {
    try {
      console.log(`🔔 NotificationBroadcaster: Broadcasting typing indicator for conversation ${conversationId}`);
      
      await pusherServer.trigger(`conversation-${conversationId}`, 'typing-indicator', {
        userId,
        userName,
        isTyping,
        timestamp: new Date().toISOString()
      });

      console.log(`✅ NotificationBroadcaster: Successfully broadcasted typing indicator`);
    } catch (error) {
      console.error('❌ NotificationBroadcaster: Error broadcasting typing indicator:', error);
    }
  }

  /**
   * Broadcast user presence updates
   */
  static async broadcastPresenceUpdate(conversationId: string, userId: string, isOnline: boolean, userName: string): Promise<void> {
    try {
      console.log(`🔔 NotificationBroadcaster: Broadcasting presence update for conversation ${conversationId}`);
      
      await pusherServer.trigger(`conversation-${conversationId}`, 'presence-update', {
        userId,
        userName,
        isOnline,
        timestamp: new Date().toISOString()
      });

      console.log(`✅ NotificationBroadcaster: Successfully broadcasted presence update`);
    } catch (error) {
      console.error('❌ NotificationBroadcaster: Error broadcasting presence update:', error);
    }
  }
}
