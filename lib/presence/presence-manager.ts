import { dbService } from '@/lib/database';

export interface UserPresence {
  id: string;
  userId: string;
  conversationId?: string;
  isOnline: boolean;
  lastSeen: Date;
  isTyping: boolean;
  typingIn?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class PresenceManager {
  private static prisma = dbService.getPrisma();

  /**
   * Track when a user is actively viewing a conversation
   */
  static async trackUserActivity(userId: string, conversationId?: string): Promise<void> {
    try {
      console.log(`🔍 Presence: Tracking activity for user ${userId} in conversation ${conversationId || 'global'}`);
      
      await this.prisma.userPresence.upsert({
        where: {
          userId_conversationId: {
            userId,
            conversationId: conversationId || null
          }
        },
        update: {
          isOnline: true,
          lastSeen: new Date(),
          isTyping: false,
          typingIn: null,
          updatedAt: new Date()
        },
        create: {
          userId,
          conversationId: conversationId || null,
          isOnline: true,
          lastSeen: new Date(),
          isTyping: false,
          typingIn: null
        }
      });

      console.log(`✅ Presence: User ${userId} marked as online`);
    } catch (error) {
      console.error('❌ Presence: Error tracking user activity:', error);
    }
  }

  /**
   * Stop tracking user activity (when they leave a conversation or go offline)
   */
  static async stopTracking(userId: string, conversationId?: string): Promise<void> {
    try {
      console.log(`🔍 Presence: Stopping tracking for user ${userId} in conversation ${conversationId || 'global'}`);
      
      await this.prisma.userPresence.updateMany({
        where: {
          userId,
          conversationId: conversationId || null
        },
        data: {
          isOnline: false,
          lastSeen: new Date(),
          isTyping: false,
          typingIn: null,
          updatedAt: new Date()
        }
      });

      console.log(`✅ Presence: User ${userId} marked as offline`);
    } catch (error) {
      console.error('❌ Presence: Error stopping user tracking:', error);
    }
  }

  /**
   * Check if a user is actively viewing a specific conversation
   */
  static async isUserActiveInConversation(userId: string, conversationId: string): Promise<boolean> {
    try {
      const presence = await this.prisma.userPresence.findUnique({
        where: {
          userId_conversationId: {
            userId,
            conversationId
          }
        }
      });

      if (!presence) return false;

      // Consider user active if they were online within the last 30 seconds
      const thirtySecondsAgo = new Date(Date.now() - 30 * 1000);
      return presence.isOnline && presence.lastSeen > thirtySecondsAgo;
    } catch (error) {
      console.error('❌ Presence: Error checking user activity:', error);
      return false;
    }
  }

  /**
   * Get the last seen timestamp for a user in a conversation
   */
  static async getLastSeen(userId: string, conversationId?: string): Promise<Date | null> {
    try {
      const presence = await this.prisma.userPresence.findUnique({
        where: {
          userId_conversationId: {
            userId,
            conversationId: conversationId || null
          }
        }
      });

      return presence?.lastSeen || null;
    } catch (error) {
      console.error('❌ Presence: Error getting last seen:', error);
      return null;
    }
  }

  /**
   * Update typing status for a user
   */
  static async updateTypingStatus(userId: string, conversationId: string, isTyping: boolean): Promise<void> {
    try {
      console.log(`🔍 Presence: User ${userId} ${isTyping ? 'started' : 'stopped'} typing in conversation ${conversationId}`);
      
      await this.prisma.userPresence.upsert({
        where: {
          userId_conversationId: {
            userId,
            conversationId
          }
        },
        update: {
          isTyping,
          typingIn: isTyping ? conversationId : null,
          lastSeen: new Date(),
          updatedAt: new Date()
        },
        create: {
          userId,
          conversationId,
          isOnline: true,
          isTyping,
          typingIn: isTyping ? conversationId : null,
          lastSeen: new Date()
        }
      });
    } catch (error) {
      console.error('❌ Presence: Error updating typing status:', error);
    }
  }

  /**
   * Get all users currently typing in a conversation
   */
  static async getTypingUsers(conversationId: string): Promise<string[]> {
    try {
      const typingUsers = await this.prisma.userPresence.findMany({
        where: {
          conversationId,
          isTyping: true,
          // Only include users who were typing within the last 10 seconds
          lastSeen: {
            gte: new Date(Date.now() - 10 * 1000)
          }
        },
        select: {
          userId: true
        }
      });

      return typingUsers.map(user => user.userId);
    } catch (error) {
      console.error('❌ Presence: Error getting typing users:', error);
      return [];
    }
  }

  /**
   * Get online users in a conversation
   */
  static async getOnlineUsers(conversationId: string): Promise<string[]> {
    try {
      const onlineUsers = await this.prisma.userPresence.findMany({
        where: {
          conversationId,
          isOnline: true,
          // Only include users who were active within the last 2 minutes
          lastSeen: {
            gte: new Date(Date.now() - 2 * 60 * 1000)
          }
        },
        select: {
          userId: true
        }
      });

      return onlineUsers.map(user => user.userId);
    } catch (error) {
      console.error('❌ Presence: Error getting online users:', error);
      return [];
    }
  }

  /**
   * Clean up old presence records (run periodically)
   */
  static async cleanupOldPresence(): Promise<void> {
    try {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      
      await this.prisma.userPresence.updateMany({
        where: {
          lastSeen: {
            lt: fiveMinutesAgo
          }
        },
        data: {
          isOnline: false,
          isTyping: false,
          typingIn: null
        }
      });

      console.log('✅ Presence: Cleaned up old presence records');
    } catch (error) {
      console.error('❌ Presence: Error cleaning up old presence:', error);
    }
  }
}
