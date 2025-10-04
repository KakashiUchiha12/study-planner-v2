import { dbService } from './database';

export interface CreateNotificationData {
  userId: string;
  type: 'comment' | 'reaction' | 'mention' | 'follow' | 'post_shared' | 'task_due' | 'goal_achieved';
  title: string;
  message: string;
  actionUrl?: string;
  metadata?: Record<string, any>;
}

export class NotificationService {
  private static prisma = dbService.getPrisma();

  static async createNotification(data: CreateNotificationData) {
    try {
      const notification = await this.prisma.notification.create({
        data: {
          userId: data.userId,
          type: data.type,
          title: data.title,
          message: data.message,
          actionUrl: data.actionUrl,
          metadata: data.metadata ? JSON.stringify(data.metadata) : null
        }
      });

      console.log('Notification created:', notification.id);
      return notification;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  static async createCommentNotification(postUserId: string, commentUserId: string, commentId: string, postId: string) {
    if (postUserId === commentUserId) return; // Don't notify self

    try {
      // Get commenter info
      const commenter = await this.prisma.user.findUnique({
        where: { id: commentUserId },
        select: { name: true }
      });

      if (!commenter) return;

      await this.createNotification({
        userId: postUserId,
        type: 'comment',
        title: 'New Comment',
        message: `${commenter.name} commented on your post`,
        actionUrl: `/social?post=${postId}`,
        metadata: {
          commentId,
          postId,
          commenterId: commentUserId,
          commenterName: commenter.name
        }
      });
    } catch (error) {
      console.error('Error creating comment notification:', error);
    }
  }

  static async createReactionNotification(postUserId: string, reactorUserId: string, reactionType: string, postId: string) {
    if (postUserId === reactorUserId) return; // Don't notify self

    try {
      // Get reactor info
      const reactor = await this.prisma.user.findUnique({
        where: { id: reactorUserId },
        select: { name: true }
      });

      if (!reactor) return;

      const reactionEmojis: Record<string, string> = {
        like: '👍',
        heart: '❤️',
        wow: '😮',
        laugh: '😂',
        sad: '😢',
        fire: '🔥'
      };

      const emoji = reactionEmojis[reactionType] || '👍';

      await this.createNotification({
        userId: postUserId,
        type: 'reaction',
        title: 'New Reaction',
        message: `${reactor.name} reacted ${emoji} to your post`,
        actionUrl: `/social?post=${postId}`,
        metadata: {
          postId,
          reactorId: reactorUserId,
          reactorName: reactor.name,
          reactionType
        }
      });
    } catch (error) {
      console.error('Error creating reaction notification:', error);
    }
  }

  static async createMentionNotification(mentionedUserId: string, mentionerUserId: string, postId: string, commentId?: string) {
    if (mentionedUserId === mentionerUserId) return; // Don't notify self

    try {
      // Get mentioner info
      const mentioner = await this.prisma.user.findUnique({
        where: { id: mentionerUserId },
        select: { name: true }
      });

      if (!mentioner) return;

      await this.createNotification({
        userId: mentionedUserId,
        type: 'mention',
        title: 'You were mentioned',
        message: `${mentioner.name} mentioned you in a ${commentId ? 'comment' : 'post'}`,
        actionUrl: `/social?post=${postId}${commentId ? `&comment=${commentId}` : ''}`,
        metadata: {
          postId,
          commentId,
          mentionerId: mentionerUserId,
          mentionerName: mentioner.name
        }
      });
    } catch (error) {
      console.error('Error creating mention notification:', error);
    }
  }

  static async getUnreadCount(userId: string): Promise<number> {
    try {
      return await this.prisma.notification.count({
        where: { userId, read: false }
      });
    } catch (error) {
      console.error('Error getting unread count:', error);
      return 0;
    }
  }
}
