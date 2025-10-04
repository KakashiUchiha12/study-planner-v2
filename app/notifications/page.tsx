"use client";

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MessageDialog } from '@/components/ui/message-dialog';
import { 
  Bell, 
  MessageCircle, 
  Heart, 
  AtSign, 
  Check, 
  Trash2,
  ArrowLeft,
  MoreHorizontal
} from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Notification {
  id: string;
  type: 'comment' | 'reaction' | 'mention' | 'follow' | 'post_shared' | 'task_due' | 'goal_achieved';
  title: string;
  message: string;
  actionUrl?: string;
  read: boolean;
  createdAt: string;
  metadata?: string;
}

export default function NotificationsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [messageDialog, setMessageDialog] = useState<{
    open: boolean;
    type: 'success' | 'error' | 'warning' | 'info';
    title: string;
    message: string;
  }>({
    open: false,
    type: 'info',
    title: '',
    message: ''
  });

  const fetchNotifications = async () => {
    try {
      const response = await fetch('/api/notifications?limit=50');
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      setMessageDialog({
        open: true,
        type: 'error',
        title: 'Error',
        message: 'Failed to load notifications. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId, read: true })
      });

      if (response.ok) {
        setNotifications(prev => 
          prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
        );
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const unreadIds = notifications.filter(n => !n.read).map(n => n.id);
      if (unreadIds.length === 0) return;

      const response = await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationIds: unreadIds, read: true })
      });

      if (response.ok) {
        setNotifications(prev => 
          prev.map(n => ({ ...n, read: true }))
        );
        setMessageDialog({
          open: true,
          type: 'success',
          title: 'Success',
          message: 'All notifications marked as read!'
        });
      }
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
      setMessageDialog({
        open: true,
        type: 'error',
        title: 'Error',
        message: 'Failed to mark notifications as read. Please try again.'
      });
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId })
      });

      if (response.ok) {
        setNotifications(prev => prev.filter(n => n.id !== notificationId));
        setMessageDialog({
          open: true,
          type: 'success',
          title: 'Success',
          message: 'Notification deleted successfully!'
        });
      }
    } catch (error) {
      console.error('Failed to delete notification:', error);
      setMessageDialog({
        open: true,
        type: 'error',
        title: 'Error',
        message: 'Failed to delete notification. Please try again.'
      });
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    // Mark as read
    if (!notification.read) {
      markAsRead(notification.id);
    }

    // Navigate to action URL if available
    if (notification.actionUrl) {
      router.push(notification.actionUrl);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'comment':
        return <MessageCircle className="h-5 w-5 text-blue-600" />;
      case 'reaction':
        return <Heart className="h-5 w-5 text-red-600" />;
      case 'mention':
        return <AtSign className="h-5 w-5 text-green-600" />;
      case 'follow':
        return <Bell className="h-5 w-5 text-purple-600" />;
      case 'post_shared':
        return <MessageCircle className="h-5 w-5 text-orange-600" />;
      case 'task_due':
        return <Check className="h-5 w-5 text-yellow-600" />;
      case 'goal_achieved':
        return <Check className="h-5 w-5 text-green-600" />;
      default:
        return <Bell className="h-5 w-5 text-gray-600" />;
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  useEffect(() => {
    if (session?.user) {
      fetchNotifications();
    }
  }, [session]);

  const unreadCount = notifications.filter(n => !n.read).length;

  if (loading) {
    return (
      <div className="container mx-auto max-w-4xl p-4">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading notifications...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
            <p className="text-gray-600">
              {unreadCount > 0 ? `${unreadCount} unread notifications` : 'All caught up!'}
            </p>
          </div>
        </div>
        
        {unreadCount > 0 && (
          <Button onClick={markAllAsRead} variant="outline" size="sm">
            <Check className="h-4 w-4 mr-2" />
            Mark all as read
          </Button>
        )}
      </div>

      {/* Notifications List */}
      {notifications.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No notifications yet</h3>
            <p className="text-gray-600">
              When you get comments, reactions, or mentions, they'll appear here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => (
            <Card 
              key={notification.id} 
              className={`cursor-pointer transition-colors hover:bg-gray-50 ${
                !notification.read ? 'border-l-4 border-l-blue-500 bg-blue-50' : ''
              }`}
              onClick={() => handleNotificationClick(notification)}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-1">
                    {getNotificationIcon(notification.type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className={`text-sm font-medium ${
                          !notification.read ? 'text-gray-900' : 'text-gray-700'
                        }`}>
                          {notification.title}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-500 mt-2">
                          {formatTimeAgo(notification.createdAt)}
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-2 ml-4">
                        {!notification.read && (
                          <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0"></div>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNotification(notification.id);
                          }}
                          className="h-8 w-8 p-0 text-gray-400 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Message Dialog */}
      <MessageDialog
        open={messageDialog.open}
        onClose={() => setMessageDialog(prev => ({ ...prev, open: false }))}
        type={messageDialog.type}
        title={messageDialog.title}
        message={messageDialog.message}
      />
    </div>
  );
}
