'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import socketIOClient from '@/lib/socketio-client';

export interface RealtimeNotification {
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
  createdAt: string;
}

export interface NotificationCountUpdate {
  unreadCount: number;
  timestamp: string;
}

export interface NotificationReadUpdate {
  notificationId: string;
  timestamp: string;
}

export interface NotificationsUpdate {
  notifications: RealtimeNotification[];
  timestamp: string;
}

export function useRealtimeNotifications() {
  const { data: session } = useSession();
  const [notifications, setNotifications] = useState<RealtimeNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [pusher, setPusher] = useState<any>(null);

  // Initialize Pusher connection
  useEffect(() => {
    if (!session?.user || !(session.user as any).id) return;

    console.log('🔔 useRealtimeNotifications: Initializing Pusher connection for user:', (session.user as any).id);

    setPusher(socketIOClient);

    // Connection state handlers (for mock Pusher, always connected)
    setIsConnected(true);

    // Subscribe to user-specific notification channel
    const userChannel = socketIOClient.subscribe(`user-${(session.user as any).id}`);
    
    // Handle new notifications
    userChannel.bind('new-notification', (data: { notification: RealtimeNotification; timestamp: string }) => {
      console.log('🔔 useRealtimeNotifications: Received new notification:', data.notification);
      
      setNotifications(prev => [data.notification, ...prev]);
      setUnreadCount(prev => prev + 1);
    });

    // Handle notification count updates
    userChannel.bind('notification-count-update', (data: NotificationCountUpdate) => {
      console.log('🔔 useRealtimeNotifications: Received count update:', data.unreadCount);
      setUnreadCount(data.unreadCount);
    });

      // Handle notification read updates
      userChannel.bind('notification-read', (data: NotificationReadUpdate) => {
        console.log('🔔 useRealtimeNotifications: Received read update for notification:', data.notificationId);
        
        setNotifications(prev => 
          prev.map(notification => 
            notification.id === data.notificationId 
              ? { ...notification, read: true }
              : notification
          )
        );
      });

      // Handle bulk notifications update
      userChannel.bind('notifications-update', (data: NotificationsUpdate) => {
        console.log('🔔 useRealtimeNotifications: Received notifications update:', data.notifications.length);
        setNotifications(data.notifications);
      });

    // Cleanup on unmount
    return () => {
      console.log('🔔 useRealtimeNotifications: Cleaning up Pusher connection');
      socketIOClient.unsubscribe(`user-${(session.user as any).id}`);
      setPusher(null);
      setIsConnected(false);
    };
  }, [(session?.user as any)?.id]);

  // Function to mark notification as read
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      console.log('🔔 useRealtimeNotifications: Marking notification as read:', notificationId);
      
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        setNotifications(prev => 
          prev.map(notification => 
            notification.id === notificationId 
              ? { ...notification, read: true }
              : notification
          )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('❌ useRealtimeNotifications: Error marking notification as read:', error);
    }
  }, []);

  // Function to mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    try {
      console.log('🔔 useRealtimeNotifications: Marking all notifications as read');
      
      const response = await fetch('/api/notifications/read-all', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        setNotifications(prev => 
          prev.map(notification => ({ ...notification, read: true }))
        );
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('❌ useRealtimeNotifications: Error marking all notifications as read:', error);
    }
  }, []);

  // Function to refresh notifications
  const refreshNotifications = useCallback(async () => {
    try {
      console.log('🔔 useRealtimeNotifications: Refreshing notifications');
      
      const response = await fetch('/api/notifications?limit=50');
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (error) {
      console.error('❌ useRealtimeNotifications: Error refreshing notifications:', error);
    }
  }, []);

  return {
    notifications,
    unreadCount,
    isConnected,
    pusher,
    markAsRead,
    markAllAsRead,
    refreshNotifications,
  };
}
