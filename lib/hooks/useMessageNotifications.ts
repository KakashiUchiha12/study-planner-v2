'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import socketIOClient from '@/lib/socketio-client';

export interface MessageNotificationCount {
  unreadCount: number;
  timestamp: string;
}

export function useMessageNotifications() {
  const { data: session } = useSession();
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [pollingActive, setPollingActive] = useState<boolean>(false);

  // Function to fetch unread count
  const fetchUnreadCount = useCallback(async () => {
    try {
      // Add retry logic for failed requests
      let retries = 3;
      let response;
      
      while (retries > 0) {
        try {
          response = await fetch('/api/messaging/conversations');
          break;
        } catch (fetchError) {
          retries--;
          if (retries === 0) {
            throw fetchError;
          }
          console.log(`🔔 useMessageNotifications: Retry ${3 - retries}/3`);
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
      if (response && response.ok) {
        const conversations = await response.json();
        const totalUnread = conversations.reduce((sum: number, conv: any) => sum + (conv.unreadCount || 0), 0);
        console.log('🔔 useMessageNotifications: Fetched unread count:', totalUnread);
        setUnreadCount(totalUnread);
      }
    } catch (error) {
      console.error('🔔 useMessageNotifications: Error fetching unread count:', error);
    }
  }, []);

  // Initialize Socket.IO connection and polling for message notifications
  useEffect(() => {
    if (!session?.user || !(session.user as any).id) return;

    console.log('🔔 useMessageNotifications: Initializing connection for user:', (session.user as any).id);

    // Connection state handlers
    setIsConnected(true);

    // Subscribe to user-specific message notification channel
    const userChannel = socketIOClient.subscribe(`user-${(session.user as any).id}`);
    
    // Handle message notification count updates
    userChannel.bind('notification-count-update', (data: MessageNotificationCount) => {
      console.log('🔔 useMessageNotifications: Received count update:', data.unreadCount);
      setUnreadCount(data.unreadCount);
    });

    // Initial fetch of unread count
    fetchUnreadCount();

    // Start polling for real-time updates
    setPollingActive(true);
    const pollingInterval = setInterval(() => {
      console.log('🔔 useMessageNotifications: Polling for unread count updates');
      fetchUnreadCount();
    }, 3000); // Poll every 3 seconds

    // Cleanup on unmount
    return () => {
      console.log('🔔 useMessageNotifications: Cleaning up connection');
      socketIOClient.unsubscribe(`user-${(session.user as any).id}`);
      clearInterval(pollingInterval);
      setPollingActive(false);
      setIsConnected(false);
    };
  }, [(session?.user as any)?.id, fetchUnreadCount]);

  // Function to manually refresh unread count
  const refreshUnreadCount = useCallback(async () => {
    try {
      const response = await fetch('/api/messaging/conversations');
      if (response.ok) {
        const conversations = await response.json();
        const totalUnread = conversations.reduce((sum: number, conv: any) => sum + (conv.unreadCount || 0), 0);
        setUnreadCount(totalUnread);
      }
    } catch (error) {
      console.error('🔔 useMessageNotifications: Error refreshing unread count:', error);
    }
  }, []);

  return {
    unreadCount,
    isConnected,
    pollingActive,
    refreshUnreadCount
  };
}
