'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import socketIOClient from '@/lib/socketio-client';
import { POLLING_CONFIG, getPollingInterval, getFetchOptions } from '@/lib/config/polling-config';
import { startCommunityNotificationsPolling, pollingManager } from '@/lib/utils/polling-manager';

export interface CommunityMessageNotification {
  communityId: string;
  channelId: string;
  channelName: string;
  unreadCount: number;
  channelCounts: {
    [channelId: string]: number;
  };
  lastMessage?: {
    content: string;
    author: {
      name: string;
      image?: string;
    };
    createdAt: string;
  };
}

export interface CommunityNotificationCount {
  communityId: string;
  totalUnreadCount: number;
  channelCounts: {
    [channelId: string]: number;
  };
  timestamp: string;
}

export function useCommunityMessageNotifications() {
  const { data: session } = useSession();
  const [communityNotifications, setCommunityNotifications] = useState<Map<string, CommunityMessageNotification>>(new Map());
  const [totalUnreadCount, setTotalUnreadCount] = useState<number>(0);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [pollingActive, setPollingActive] = useState<boolean>(false);

  // Function to fetch community message notifications
  const fetchCommunityNotifications = useCallback(async () => {
    try {
      // Reduced retry logic to save memory
      let retries = 2;
      let response;
      
      while (retries > 0) {
        try {
          response = await fetch('/api/communities/notifications/messages', getFetchOptions());
          break;
        } catch (fetchError) {
          retries--;
          if (retries === 0) {
            throw fetchError;
          }
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
      
      if (response && response.ok) {
        const data = await response.json();
        // Fetched notifications successfully
        
        const notificationsMap = new Map<string, CommunityMessageNotification>();
        let totalUnread = 0;

        // Get localStorage read timestamps
        const readTimestamps = JSON.parse(localStorage.getItem('communityReadTimestamps') || '{}');

        // Process all communities, including those with 0 unread count
        data.communities.forEach((community: any) => {
          // Only add notification if there are actually unread messages
          if (community.totalUnreadCount > 0) {
            // Create channel counts map
            const channelCounts: { [channelId: string]: number } = {};
            community.channels.forEach((channel: any) => {
              channelCounts[channel.id] = channel.unreadCount || 0;
            });

            const communityNotification: CommunityMessageNotification = {
              communityId: community.id,
              channelId: community.channels[0]?.id || '',
              channelName: community.channels[0]?.name || 'general',
              unreadCount: community.totalUnreadCount,
              channelCounts: channelCounts,
              lastMessage: community.lastMessage
            };
            
            notificationsMap.set(community.id, communityNotification);
            totalUnread += community.totalUnreadCount;
          }
        });

        // Limit notifications map size to prevent memory leaks (max 50 communities)
        if (notificationsMap.size > 50) {
          const entries = Array.from(notificationsMap.entries());
          const limitedEntries = entries.slice(0, 50);
          notificationsMap.clear();
          limitedEntries.forEach(([key, value]) => notificationsMap.set(key, value));
        }

        setCommunityNotifications(notificationsMap);
        setTotalUnreadCount(totalUnread);
        // Updated notification counts
      } else {
        console.error('🔔 useCommunityMessageNotifications: Failed to fetch notifications:', response?.status, response?.statusText);
      }
    } catch (error) {
      console.error('🔔 useCommunityMessageNotifications: Error fetching notifications:', error);
    }
  }, []);

  // Initialize Socket.IO connection and polling for community message notifications
  useEffect(() => {
    if (!session?.user || !(session.user as any).id) return;

    // Initializing connection for user

    // Connection state handlers
    setIsConnected(true);

    // Subscribe to user-specific community notification channel
    const userChannel = socketIOClient.subscribe(`user-${(session.user as any).id}`);
    
    // Handle community message notification count updates
    userChannel.bind('community-notification-count-update', (data: CommunityNotificationCount) => {
      // Received count update
      
      setCommunityNotifications(prev => {
        const newMap = new Map(prev);
        const existing = newMap.get(data.communityId);
        
        if (existing) {
          newMap.set(data.communityId, {
            ...existing,
            unreadCount: data.totalUnreadCount
          });
        }
        
        return newMap;
      });
    });

    // Initial fetch of community notifications
    fetchCommunityNotifications();

    // Start polling for real-time updates with smart intervals
    setPollingActive(true);
    
    // Starting polling for community notifications
    startCommunityNotificationsPolling(fetchCommunityNotifications, (error) => {
      // Polling error occurred
      setPollingActive(false);
    });

    // Cleanup on unmount
    return () => {
      // Cleaning up connection
      socketIOClient.unsubscribe(`user-${(session.user as any).id}`);
      pollingManager.stopPolling('community-notifications');
      setPollingActive(false);
      setIsConnected(false);
    };
  }, [(session?.user as any)?.id]);

  // Function to manually refresh notifications
  const refreshNotifications = useCallback(async () => {
    await fetchCommunityNotifications();
  }, []);

  // Function to get notification count for a specific community
  const getCommunityNotificationCount = useCallback((communityId: string): number => {
    const count = communityNotifications.get(communityId)?.unreadCount || 0;
    // Return notification count
    return count;
  }, [communityNotifications]);

  // Function to get notification count for a specific channel
  const getChannelNotificationCount = useCallback((communityId: string, channelId: string): number => {
    const community = communityNotifications.get(communityId);
    if (!community) return 0;
    
    // Return the specific channel's unread count
    return community.channelCounts[channelId] || 0;
  }, [communityNotifications]);

  const clearCommunityNotification = useCallback((communityId: string) => {
    setCommunityNotifications(prev => {
      const newMap = new Map(prev);
      newMap.delete(communityId);
      return newMap;
    });
    
    // Update total unread count
    setTotalUnreadCount(prev => {
      const notification = communityNotifications.get(communityId);
      return prev - (notification?.unreadCount || 0);
    });
  }, [communityNotifications]);

  const clearChannelNotification = useCallback((communityId: string, channelId: string) => {
    setCommunityNotifications(prev => {
      const newMap = new Map(prev);
      const notification = newMap.get(communityId);
      
      if (notification) {
        // Update the channel counts to set this channel's count to 0
        const updatedChannelCounts = { ...notification.channelCounts };
        const channelUnreadCount = updatedChannelCounts[channelId] || 0;
        updatedChannelCounts[channelId] = 0;
        
        // Recalculate total unread count for the community
        const newTotalUnreadCount = Object.values(updatedChannelCounts).reduce((sum, count) => sum + count, 0);
        
        // Update the notification with new counts
        const updatedNotification = {
          ...notification,
          unreadCount: newTotalUnreadCount,
          channelCounts: updatedChannelCounts
        };
        
        if (newTotalUnreadCount > 0) {
          newMap.set(communityId, updatedNotification);
        } else {
          // If no unread messages left, remove the entire community notification
          newMap.delete(communityId);
        }
        
        // Update total unread count
        setTotalUnreadCount(prev => prev - channelUnreadCount);
      }
      
      return newMap;
    });
  }, []);

  return {
    communityNotifications,
    totalUnreadCount,
    isConnected,
    pollingActive,
    refreshNotifications,
    getCommunityNotificationCount,
    getChannelNotificationCount,
    clearCommunityNotification,
    clearChannelNotification
  };
}
