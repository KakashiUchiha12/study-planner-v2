'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  MessageSquare, 
  Hash, 
  Plus, 
  Settings, 
  Users, 
  Send,
  Smile,
  Paperclip,
  MoreVertical,
  Edit,
  Trash2,
  Reply,
  X
} from 'lucide-react';
import { CreateChannelDialog } from './CreateChannelDialog';
import { ChannelSettingsDialog } from './ChannelSettingsDialog';
import { ReactionPicker } from './ReactionPicker';
import { formatDistanceToNow } from 'date-fns';
import socketIOClient from '@/lib/socketio-client';
import { NotificationBadge } from '@/components/ui/notification-badge';
import { useCommunityMessageNotifications } from '@/lib/hooks/useCommunityMessageNotifications';
import { POLLING_CONFIG, getPollingInterval, getFetchOptions } from '@/lib/config/polling-config';

interface Channel {
  id: string;
  name: string;
  description?: string;
  type: 'text' | 'voice' | 'announcement';
  isPrivate: boolean;
  order: number;
  messageCount?: number;
  lastMessage?: {
    content: string;
    author: {
      name: string;
      image?: string;
    };
    createdAt: string;
  };
}

interface Message {
  id: string;
  content: string;
  type: 'text' | 'image' | 'file' | 'system';
  author: {
    id: string;
    name: string;
    image?: string;
  };
  replyTo?: {
    id: string;
    content: string;
    author: {
      id: string;
      name: string;
    };
  };
  isEdited: boolean;
  isDeleted: boolean;
  createdAt: string;
  reactions: {
    emoji: string;
    count: number;
    userReacted: boolean;
  }[];
}

interface CommunityChatProps {
  communityId: string;
}

export function CommunityChat({ communityId }: CommunityChatProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const { getChannelNotificationCount, clearCommunityNotification, clearChannelNotification } = useCommunityMessageNotifications();
  const [channels, setChannels] = useState<Channel[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [showChannels, setShowChannels] = useState(true);
  const [userRole, setUserRole] = useState<string>('member');
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [initializingChannels, setInitializingChannels] = useState(false);
  const [showChannelSettings, setShowChannelSettings] = useState(false);
  const [pollingActive, setPollingActive] = useState(false);
  const [lastMessageId, setLastMessageId] = useState<string | null>(null);

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      // On mobile, show channels by default; on desktop, show both
      setShowChannels(mobile);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    fetchChannels();
  }, [communityId]);

  useEffect(() => {
    if (selectedChannel) {
      fetchMessages(selectedChannel.id);
      subscribeToChannel(selectedChannel.id);
      // Don't mark as read immediately - only when messages are actually viewed
    }
    
    return () => {
      if (selectedChannel) {
        socketIOClient.unsubscribe(`community-channel-${selectedChannel.id}`);
      }
      // Clear typing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [selectedChannel]);

  const markMessagesAsRead = async (channelId: string) => {
    try {
      // Store read timestamp in localStorage as fallback
      const readTimestamps = JSON.parse(localStorage.getItem('communityReadTimestamps') || '{}');
      readTimestamps[`${communityId}-${channelId}`] = new Date().toISOString();
      localStorage.setItem('communityReadTimestamps', JSON.stringify(readTimestamps));
      
      // Clear notification for this specific channel only
      clearChannelNotification(communityId, channelId);
      
      // Try to mark as read in database
      await fetch(`/api/communities/${communityId}/channels/${channelId}/read`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      // Trigger a global refresh of notifications
      window.dispatchEvent(new CustomEvent('community-messages-read', { 
        detail: { communityId, channelId } 
      }));
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  // Enhanced polling effect for real-time message updates
  useEffect(() => {
    if (!selectedChannel) {
      setPollingActive(false);
      return;
    }

    console.log('🔔 CommunityChat: Setting up polling for channel:', selectedChannel.id);
    setPollingActive(true);
    
    let pollingInterval: NodeJS.Timeout;
    
    const startPolling = () => {
      pollingInterval = setInterval(() => {
        console.log('🔔 CommunityChat: Polling for new messages in channel:', selectedChannel.id);
        fetchMessages(selectedChannel.id, lastMessageId || undefined);
      }, getPollingInterval(POLLING_CONFIG.COMMUNITY_CHAT.INTERVAL));
    };
    
    startPolling();

    return () => {
      console.log('🔔 CommunityChat: Cleaning up polling for channel:', selectedChannel.id);
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
      setPollingActive(false);
    };
  }, [selectedChannel, lastMessageId]);

  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages]);

  // Mark messages as read when user actually views them (after a short delay to ensure they're visible)
  useEffect(() => {
    if (selectedChannel && messages.length > 0) {
      // Add a small delay to ensure messages are rendered and user can see them
      const timer = setTimeout(() => {
        markMessagesAsRead(selectedChannel.id);
      }, 1000); // 1 second delay

      return () => clearTimeout(timer);
    }
  }, [selectedChannel, messages]);

  const fetchChannels = async () => {
    try {
      console.log('Fetching channels for community:', communityId);
      const response = await fetch(`/api/communities/${communityId}/channels`);
      console.log('Channels response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Channels data:', data);
        setChannels(data.channels);
        setUserRole(data.userRole || 'member');
        
        // If no channels exist, try to initialize them
        if (data.channels.length === 0 && !initializingChannels) {
          console.log('No channels found, initializing...');
          setInitializingChannels(true);
          await initializeChannels();
        } else if (data.channels.length > 0 && !selectedChannel) {
          // On desktop, auto-select the first channel; on mobile, let user choose
          if (!isMobile) {
            console.log('Setting first channel as selected:', data.channels[0]);
            setSelectedChannel(data.channels[0]);
          }
        }
      } else {
        let errorData;
        try {
          errorData = await response.json();
        } catch (e) {
          errorData = { error: `HTTP ${response.status}: ${response.statusText}` };
        }
        console.error('Error fetching channels:', errorData);
        
        // If it's a 401 error, the user might not be logged in
        if (response.status === 401) {
          console.error('User not authenticated');
        } else if (response.status === 403) {
          console.error('User not a member of this community');
        }
      }
    } catch (error) {
      console.error('Error fetching channels:', error);
    } finally {
      setLoading(false);
    }
  };

  const initializeChannels = async () => {
    try {
      console.log('Initializing channels for community:', communityId);
      const response = await fetch(`/api/communities/${communityId}/channels/init-all`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log('Init channels response status:', response.status);
      if (response.ok) {
        const data = await response.json();
        console.log('Channels initialized:', data);
        setInitializingChannels(false);
        // Refresh channels after initialization
        await fetchChannels();
      } else {
        const errorData = await response.json();
        console.error('Failed to initialize channels:', errorData);
        setInitializingChannels(false);
      }
    } catch (error) {
      console.error('Error initializing channels:', error);
    }
  };

  const fetchMessages = async (channelId: string, after?: string) => {
    try {
      const url = after 
        ? `/api/communities/${communityId}/channels/${channelId}/messages?after=${after}`
        : `/api/communities/${communityId}/channels/${channelId}/messages`;
      
      console.log('🔔 CommunityChat: Fetching messages from:', url);
      const response = await fetch(url, getFetchOptions());
      
      if (response.ok) {
        const data = await response.json();
        console.log('🔔 CommunityChat: Received messages:', data.messages?.length || 0);
        
        if (after) {
          // Polling - add new messages to existing ones
          setMessages(prev => {
            const existingIds = new Set(prev.map(msg => msg.id));
            const newMessages = data.messages.filter((msg: any) => !existingIds.has(msg.id));
            
            if (newMessages.length > 0) {
              console.log('🔔 CommunityChat: Adding', newMessages.length, 'new messages via polling');
              // Update last message ID to the latest message
              const latestMessage = newMessages[newMessages.length - 1];
              setLastMessageId(latestMessage.id);
              
              // Create a new array with unique messages only
              const allMessages = [...prev, ...newMessages];
              const uniqueMessages = allMessages.filter((msg, index, self) => 
                index === self.findIndex(m => m.id === msg.id)
              );
              return uniqueMessages;
            }
            return prev;
          });
        } else {
          // Initial load - ensure unique messages
          const uniqueMessages = (data.messages || []).filter((msg: any, index: number, self: any[]) => 
            index === self.findIndex(m => m.id === msg.id)
          );
          setMessages(uniqueMessages);
          if (uniqueMessages.length > 0) {
            setLastMessageId(uniqueMessages[uniqueMessages.length - 1].id);
            console.log('🔔 CommunityChat: Initial load - Last message ID:', uniqueMessages[uniqueMessages.length - 1].id);
          }
        }
      } else {
        console.error('🔔 CommunityChat: Failed to fetch messages:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('🔔 CommunityChat: Error fetching messages:', error);
    }
  };

  const subscribeToChannel = (channelId: string) => {
    const channel = socketIOClient.subscribe(`community-channel-${channelId}`);
    
    channel.bind('new-message', (data: any) => {
      setMessages(prev => {
        // Check if message already exists to prevent duplicates
        const exists = prev.some(msg => msg.id === data.message.id);
        if (!exists) {
          const newMessages = [...prev, data.message];
          // Double-check for uniqueness
          return newMessages.filter((msg, index, self) => 
            index === self.findIndex(m => m.id === msg.id)
          );
        }
        return prev;
      });
    });

    channel.bind('message-updated', (data: any) => {
      setMessages(prev => prev.map(msg => 
        msg.id === data.messageId ? { ...msg, ...data.updates } : msg
      ));
    });

    channel.bind('message-deleted', (data: any) => {
      setMessages(prev => prev.filter(msg => msg.id !== data.messageId));
    });

    channel.bind('user-typing', (data: any) => {
      if (data.userId !== (session?.user as any)?.id) {
        setTypingUsers(prev => {
          if (!prev.includes(data.userId)) {
            return [...prev, data.userId];
          }
          return prev;
        });
      }
    });

    channel.bind('user-stopped-typing', (data: any) => {
      if (data.userId !== (session?.user as any)?.id) {
        setTypingUsers(prev => prev.filter(id => id !== data.userId));
      }
    });
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedChannel || sending) return;

    console.log('Sending message:', newMessage.trim(), 'to channel:', selectedChannel.id);
    setSending(true);
    
    // Prevent rapid sending by adding a small delay
    await new Promise(resolve => setTimeout(resolve, 100));
    try {
      const response = await fetch(`/api/communities/${communityId}/channels/${selectedChannel.id}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: newMessage.trim(),
          replyToId: replyingTo?.id
        }),
      });

      console.log('Send message response status:', response.status);
      if (response.ok) {
        const data = await response.json();
        console.log('Message sent successfully:', data);
        // Add the message to the local state immediately for instant feedback
        setMessages(prev => {
          // Check for duplicates before adding
          const exists = prev.some(msg => msg.id === data.message.id);
          if (!exists) {
            return [...prev, data.message];
          }
          return prev;
        });
        setLastMessageId(data.message.id);
        setNewMessage('');
        setReplyingTo(null);
      } else {
        const errorData = await response.json();
        console.error('Failed to send message:', errorData);
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleTyping = useCallback(async () => {
    if (!selectedChannel || !(session?.user as any)?.id) return;

    if (!isTyping) {
      setIsTyping(true);
      try {
        await fetch(`/api/communities/${communityId}/channels/${selectedChannel.id}/typing`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ action: 'start' }),
        });
      } catch (error) {
        console.error('Error sending typing indicator:', error);
      }
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing
    typingTimeoutRef.current = setTimeout(async () => {
      setIsTyping(false);
      try {
        await fetch(`/api/communities/${communityId}/channels/${selectedChannel.id}/typing`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ action: 'stop' }),
        });
      } catch (error) {
        console.error('Error stopping typing indicator:', error);
      }
    }, 2000);
  }, [selectedChannel, communityId, (session?.user as any)?.id, isTyping]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleProfileClick = (userId: string) => {
    router.push(`/profile/${userId}`);
  };

  const handleReactionSelect = async (messageId: string, emoji: string) => {
    try {
      const response = await fetch(`/api/communities/${communityId}/channels/${selectedChannel?.id}/messages/${messageId}/reactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          emoji
        }),
      });

      if (response.ok) {
        // Refresh messages to show updated reactions
        if (selectedChannel) {
          fetchMessages(selectedChannel.id);
        }
      }
    } catch (error) {
      console.error('Error adding reaction:', error);
    }
  };

  const getChannelIcon = (type: string) => {
    switch (type) {
      case 'announcement':
        return <MessageSquare className="h-4 w-4" />;
      case 'voice':
        return <Users className="h-4 w-4" />;
      default:
        return <Hash className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="space-y-2">
              <div className="h-3 bg-gray-200 rounded"></div>
              <div className="h-3 bg-gray-200 rounded w-3/4"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="h-[600px] flex border md:rounded-lg overflow-hidden">
      {/* Channels Sidebar - Desktop only */}
      {!isMobile && (
        <div className="w-64 border-r bg-gray-50 flex-shrink-0 overflow-hidden">
          <div className="p-4 border-b">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Channels</h3>
              {['admin', 'moderator', 'owner'].includes(userRole) && (
                <CreateChannelDialog 
                  communityId={communityId} 
                  onChannelCreated={fetchChannels}
                />
              )}
            </div>
          </div>
          
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-1">
              {channels.map((channel) => {
                const channelNotificationCount = getChannelNotificationCount(communityId, channel.id);
                return (
                  <button
                    key={channel.id}
                    onClick={() => setSelectedChannel(channel)}
                    className={`w-full text-left p-2 rounded-md hover:bg-gray-100 transition-colors flex items-center gap-2 relative ${
                      selectedChannel?.id === channel.id ? 'bg-blue-100 text-blue-900' : 'text-gray-700'
                    }`}
                  >
                    {getChannelIcon(channel.type)}
                    <span className="truncate">{channel.name}</span>
                    <div className="ml-auto flex items-center gap-1">
                      {channelNotificationCount > 0 && (
                        <NotificationBadge 
                          count={channelNotificationCount}
                          size="sm"
                          position="top-right"
                          className="mr-1"
                        />
                      )}
                      {channel.isPrivate && (
                        <Badge variant="secondary" className="text-xs">
                          Private
                        </Badge>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </ScrollArea>
        </div>
      )}

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {isMobile && showChannels ? (
          /* Mobile Channels List */
          <div className="flex-1 flex flex-col">
            <div className="p-4 border-b bg-white">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">Channels</h3>
                {['admin', 'moderator', 'owner'].includes(userRole) && (
                  <CreateChannelDialog 
                    communityId={communityId} 
                    onChannelCreated={fetchChannels}
                  />
                )}
              </div>
            </div>
            
            <ScrollArea className="flex-1">
              <div className="p-2 space-y-1">
                {channels.map((channel) => {
                  const channelNotificationCount = getChannelNotificationCount(communityId, channel.id);
                  return (
                    <button
                      key={channel.id}
                      onClick={() => {
                        setSelectedChannel(channel);
                        setShowChannels(false);
                      }}
                      className="w-full text-left p-3 rounded-md hover:bg-gray-100 transition-colors flex items-center gap-3 relative"
                    >
                      {getChannelIcon(channel.type)}
                      <div className="flex-1">
                        <div className="font-medium">{channel.name}</div>
                        {channel.description && (
                          <div className="text-sm text-gray-500 truncate">{channel.description}</div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {channelNotificationCount > 0 && (
                          <NotificationBadge 
                            count={channelNotificationCount}
                            size="sm"
                            position="top-right"
                          />
                        )}
                        {channel.isPrivate && (
                          <Badge variant="secondary" className="text-xs">
                            Private
                          </Badge>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </ScrollArea>
          </div>
        ) : selectedChannel ? (
          <>
            {/* Channel Header */}
            <div className="p-4 border-b bg-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                {isMobile && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowChannels(true)}
                  >
                    <Hash className="h-4 w-4" />
                  </Button>
                )}
                {getChannelIcon(selectedChannel.type)}
                <h2 className="font-semibold">{selectedChannel.name}</h2>
                {selectedChannel.description && (
                  <span className="text-sm text-gray-500">
                    {selectedChannel.description}
                  </span>
                )}
              </div>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setShowChannelSettings(true)}
              >
                <Settings className="h-4 w-4" />
              </Button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4">
              <div className="space-y-4">
                {messages.map((message) => {
                  const isOwnMessage = message.author.id === (session?.user as any)?.id;
                  
                  return (
                    <div key={message.id} className={`flex gap-3 group ${isOwnMessage ? 'flex-row-reverse' : ''}`}>
                      <button
                        onClick={() => handleProfileClick(message.author.id)}
                        className="hover:opacity-80 transition-opacity flex-shrink-0"
                      >
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={message.author.image} />
                          <AvatarFallback>{message.author.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                      </button>
                      <div className={`flex-1 min-w-0 ${isOwnMessage ? 'flex flex-col items-end' : ''}`}>
                        <div className={`flex items-center gap-2 mb-1 ${isOwnMessage ? 'flex-row-reverse' : ''}`}>
                          <button
                            onClick={() => handleProfileClick(message.author.id)}
                            className="font-medium text-sm hover:underline text-left"
                          >
                            {message.author.name}
                          </button>
                          <span className="text-xs text-gray-500">
                            {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
                          </span>
                          {message.isEdited && (
                            <span className="text-xs text-gray-400">(edited)</span>
                          )}
                        </div>
                      
                        {message.replyTo && (
                          <div className={`mb-2 p-2 bg-gray-100 rounded border-l-2 border-blue-500 ${isOwnMessage ? 'border-r-2 border-l-0' : ''}`}>
                            <div className="text-xs text-gray-600">
                              Replying to{' '}
                              <button
                                onClick={() => handleProfileClick(message.replyTo!.author.id)}
                                className="hover:underline"
                              >
                                {message.replyTo.author.name}
                              </button>
                            </div>
                            <div className="text-sm text-gray-700 truncate">
                              {message.replyTo.content}
                            </div>
                          </div>
                        )}
                        
                        <div className={`text-sm whitespace-pre-wrap break-words p-2 rounded-lg ${
                          isOwnMessage 
                            ? 'bg-blue-500 text-white ml-auto max-w-xs' 
                            : 'bg-gray-100 text-gray-900 max-w-xs'
                        }`}>
                          {message.content}
                        </div>
                      
                      {message.reactions.length > 0 && (
                        <div className="flex gap-1 mt-2">
                          {message.reactions.map((reaction, index) => (
                            <button
                              key={index}
                              className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs border ${
                                reaction.userReacted 
                                  ? 'bg-blue-100 border-blue-300 text-blue-700' 
                                  : 'bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200'
                              }`}
                              onClick={async () => {
                                try {
                                  const response = await fetch(`/api/communities/${communityId}/channels/${selectedChannel?.id}/messages/${message.id}/reactions`, {
                                    method: 'POST',
                                    headers: {
                                      'Content-Type': 'application/json',
                                    },
                                    body: JSON.stringify({
                                      emoji: reaction.emoji
                                    }),
                                  });

                                  if (response.ok) {
                                    // Refresh messages to show updated reactions
                                    if (selectedChannel) {
                                      fetchMessages(selectedChannel.id);
                                    }
                                  }
                                } catch (error) {
                                  console.error('Error toggling reaction:', error);
                                }
                              }}
                            >
                              <span>{reaction.emoji}</span>
                              <span>{reaction.count}</span>
                            </button>
                          ))}
                        </div>
                      )}
                      
                      <div className="flex gap-2 mt-2 opacity-60 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setReplyingTo(message)}
                          className="h-6 px-2 text-xs"
                        >
                          <Reply className="h-3 w-3 mr-1" />
                          Reply
                        </Button>
                        <ReactionPicker
                          onReactionSelect={(emoji) => handleReactionSelect(message.id, emoji)}
                        >
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 text-xs"
                          >
                            <Smile className="h-3 w-3 mr-1" />
                            React
                          </Button>
                        </ReactionPicker>
                      </div>
                    </div>
                  </div>
                  );
                })}
                
                {/* Typing Indicator */}
                {typingUsers.length > 0 && (
                  <div className="flex gap-3 py-2">
                    <div className="h-8 w-8 flex items-center justify-center">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    </div>
                    <div className="text-sm text-gray-500">
                      {typingUsers.length === 1 
                        ? 'Someone is typing...' 
                        : `${typingUsers.length} people are typing...`
                      }
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Reply Preview */}
            {replyingTo && (
              <div className="p-3 border-t bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    Replying to{' '}
                    <button
                      onClick={() => handleProfileClick(replyingTo.author.id)}
                      className="hover:underline"
                    >
                      {replyingTo.author.name}
                    </button>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setReplyingTo(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <div className="text-sm text-gray-700 truncate">
                  {replyingTo.content}
                </div>
              </div>
            )}

            {/* Message Input */}
            <div className="p-4 border-t bg-white">
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Textarea
                    value={newMessage}
                    onChange={(e) => {
                      setNewMessage(e.target.value);
                      handleTyping();
                    }}
                    onKeyDown={handleKeyPress}
                    placeholder={`Message #${selectedChannel.name}`}
                    className="min-h-[40px] max-h-32 resize-none pr-20"
                    disabled={sending}
                  />
                  <div className="absolute right-2 bottom-2 flex gap-1">
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                      <Paperclip className="h-3 w-3" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                      <Smile className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <Button
                  onClick={sendMessage}
                  disabled={!newMessage.trim() || sending}
                  size="sm"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>{isMobile ? 'Select a channel to start chatting' : 'Select a channel to start chatting'}</p>
            </div>
          </div>
        )}
      </div>

      {/* Channel Settings Dialog */}
      <ChannelSettingsDialog
        channel={selectedChannel}
        isOpen={showChannelSettings}
        onClose={() => setShowChannelSettings(false)}
        onChannelUpdated={() => {
          fetchChannels();
          setShowChannelSettings(false);
        }}
        onChannelDeleted={() => {
          setSelectedChannel(null);
          setMessages([]);
          fetchChannels();
          setShowChannelSettings(false);
        }}
        userRole={userRole}
      />

      {/* Create Channel Dialog */}
      <CreateChannelDialog
        communityId={communityId}
        onChannelCreated={fetchChannels}
      />
    </div>
  );
}
