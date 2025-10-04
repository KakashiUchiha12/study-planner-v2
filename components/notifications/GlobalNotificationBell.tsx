'use client';

import { useState, useEffect } from 'react';
import { Bell, BellRing } from 'lucide-react';
import { useRealtimeNotifications } from '@/lib/hooks/useRealtimeNotifications';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { formatDistanceToNow } from 'date-fns';

interface GlobalNotificationBellProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'ghost' | 'outline';
}

export function GlobalNotificationBell({ 
  className = '', 
  size = 'md',
  variant = 'ghost'
}: GlobalNotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const {
    notifications,
    unreadCount,
    isConnected,
    markAsRead,
    markAllAsRead,
    refreshNotifications,
  } = useRealtimeNotifications();

  // Refresh notifications when popover opens
  useEffect(() => {
    if (isOpen) {
      refreshNotifications();
    }
  }, [isOpen, refreshNotifications]);

  const getIconSize = () => {
    switch (size) {
      case 'sm': return 'h-4 w-4';
      case 'lg': return 'h-6 w-6';
      default: return 'h-5 w-5';
    }
  };

  const getButtonSize = () => {
    switch (size) {
      case 'sm': return 'sm';
      case 'lg': return 'lg';
      default: return 'default';
    }
  };

  const handleNotificationClick = async (notification: any) => {
    if (!notification.read) {
      await markAsRead(notification.id);
    }
    
    // Navigate to the action URL if provided
    if (notification.actionUrl) {
      window.location.href = notification.actionUrl;
    }
    
    setIsOpen(false);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'direct_message':
      case 'group_message':
        return '💬';
      case 'event_reminder':
        return '📅';
      case 'community_invite':
        return '👥';
      case 'study_goal':
        return '🎯';
      case 'system':
        return '🔔';
      default:
        return '📢';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'text-red-600';
      case 'medium':
        return 'text-yellow-600';
      case 'low':
        return 'text-blue-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant={variant}
          size={getButtonSize()}
          className={`relative ${className}`}
          aria-label={`Notifications ${unreadCount > 0 ? `(${unreadCount} unread)` : ''}`}
        >
          {unreadCount > 0 ? (
            <BellRing className={getIconSize()} />
          ) : (
            <Bell className={getIconSize()} />
          )}
          
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
          
          {!isConnected && (
            <div className="absolute -bottom-1 -right-1 h-2 w-2 bg-yellow-500 rounded-full" />
          )}
        </Button>
      </PopoverTrigger>
      
      <PopoverContent className="w-80 p-0" align="end">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-lg">Notifications</h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={markAllAsRead}
                  className="text-xs"
                >
                  Mark all read
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={refreshNotifications}
                className="text-xs"
              >
                Refresh
              </Button>
            </div>
          </div>
          
          {!isConnected && (
            <div className="mt-2 text-xs text-yellow-600 flex items-center gap-1">
              <div className="h-2 w-2 bg-yellow-500 rounded-full" />
              Reconnecting...
            </div>
          )}
        </div>
        
        <ScrollArea className="h-96">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No notifications yet</p>
            </div>
          ) : (
            <div className="p-2">
              {notifications.map((notification, index) => (
                <div key={notification.id}>
                  <div
                    className={`p-3 rounded-lg cursor-pointer transition-colors hover:bg-gray-50 ${
                      !notification.read ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                    }`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="text-lg">
                        {getNotificationIcon(notification.type)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className={`font-medium text-sm ${getPriorityColor(notification.priority)}`}>
                            {notification.title}
                          </h4>
                          {!notification.read && (
                            <div className="h-2 w-2 bg-blue-500 rounded-full flex-shrink-0" />
                          )}
                        </div>
                        
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {notification.message}
                        </p>
                        
                        <p className="text-xs text-gray-400 mt-1">
                          {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {index < notifications.length - 1 && (
                    <Separator className="my-1" />
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
        
        {notifications.length > 0 && (
          <div className="p-3 border-t text-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.location.href = '/notifications'}
              className="text-xs"
            >
              View all notifications
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
