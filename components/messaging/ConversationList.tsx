'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  MessageCircle, 
  Plus, 
  Search, 
  Users, 
  User,
  Clock,
  MoreHorizontal,
  Pin,
  PinOff
} from 'lucide-react';
import { NewConversationDialog } from './NewConversationDialog';
import { formatDistanceToNow } from 'date-fns';
import socketIOClient from '@/lib/socketio-client';
import { useSocketIOAuth } from '@/lib/hooks/useSocketIOAuth';
import { POLLING_CONFIG, getPollingInterval, getFetchOptions } from '@/lib/config/polling-config';
// Removed persistent pusher manager - using direct WebSocket client

interface Conversation {
  id: string;
  type: string;
  name?: string;
  description?: string;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
  lastMessage?: {
    id: string;
    content: string;
    type: string;
    createdAt: string;
    sender: {
      id: string;
      name: string;
      image?: string;
    };
  };
  unreadCount: number;
  isPinned: boolean;
  pinnedAt?: string;
  participants: Array<{
    id: string;
    role: string;
    joinedAt: string;
    lastReadAt?: string;
    isPinned: boolean;
    pinnedAt?: string;
    user: {
      id: string;
      name: string;
      image?: string;
    };
  }>;
  createdBy: {
    id: string;
    name: string;
    image?: string;
  };
}

interface ConversationListProps {
  selectedConversationId?: string;
  onConversationSelect: (conversationId: string) => void;
  onNewConversation: () => void;
  onConversationCreated?: (conversationId: string) => void;
}

export function ConversationList({ 
  selectedConversationId, 
  onConversationSelect, 
  onNewConversation,
  onConversationCreated
}: ConversationListProps) {
  // Use global authentication hook
  useSocketIOAuth();
  const { data: session } = useSession();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [lastPollTime, setLastPollTime] = useState<Date>(new Date());
  const [pollingActive, setPollingActive] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchConversations();
  }, []);

  // Real-time updates for conversation list
  useEffect(() => {
    console.log('🔔 ConversationList: Setting up Pusher subscription for conversation-updates');
    console.log('🔔 ConversationList: socketIOClient:', socketIOClient);
    
    // Direct WebSocket subscription (no persistent manager needed)
    
    const channel = socketIOClient.subscribe('conversation-updates');
    console.log('🔔 ConversationList: Subscribed to conversation-updates channel');
    
    channel.bind('new-message', (data: { message: any; conversationId: string }) => {
      console.log('🔔 ConversationList: Received new-message event:', data);
      // Update the conversation list when a new message is received
      setConversations(prev => {
        return prev.map(conv => {
          if (conv.id === data.conversationId) {
            console.log('🔔 ConversationList: Updating conversation:', conv.id);
            // Don't increment unread count if:
            // 1. This conversation is currently selected (user is viewing it)
            // 2. The message is from the current user (don't notify for own messages)
            const shouldIncrementUnread = conv.id !== selectedConversationId && 
                                        data.message.sender.id !== session?.user?.id;
            
            return {
              ...conv,
              lastMessage: {
                id: data.message.id,
                content: data.message.content,
                type: data.message.type,
                createdAt: data.message.createdAt,
                sender: data.message.sender,
              },
              updatedAt: data.message.createdAt,
              unreadCount: shouldIncrementUnread ? conv.unreadCount + 1 : conv.unreadCount,
            };
          }
          return conv;
        }).sort((a, b) => {
          // First, sort by pinned status (pinned conversations first)
          if (a.isPinned && !b.isPinned) return -1;
          if (!a.isPinned && b.isPinned) return 1;
          
          // If both have same pinned status, sort by updatedAt
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        });
      });
    });

    return () => {
      socketIOClient.unsubscribe('conversation-updates');
    };
  }, [selectedConversationId, session?.user?.id]);

  // Clear unread count when conversation is selected
  useEffect(() => {
    if (selectedConversationId) {
      setConversations(prev => {
        return prev.map(conv => {
          if (conv.id === selectedConversationId) {
            return {
              ...conv,
              unreadCount: 0,
            };
          }
          return conv;
        });
      });
    }
  }, [selectedConversationId]);

  // Enhanced global polling for all conversations to check for new messages
  useEffect(() => {
    if (!session?.user?.id || conversations.length === 0) {
      setPollingActive(false);
      return;
    }

    console.log('🔄 ConversationList: Starting enhanced global polling for all conversations');
    setPollingActive(true);
    
    let pollingInterval: NodeJS.Timeout;
    
    const startPolling = () => {
      // Start polling with configured interval and jitter
      pollingInterval = setInterval(async () => {
        try {
          await pollForNewMessagesInAllConversations();
        } catch (error) {
          console.error('🔄 ConversationList: Global polling error:', error);
        }
      }, getPollingInterval(POLLING_CONFIG.CONVERSATION_LIST.INTERVAL));
    };
    
    startPolling();

    // Cleanup on unmount
    return () => {
      console.log('🔄 ConversationList: Stopping enhanced global polling');
      setPollingActive(false);
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, [session?.user?.id, conversations.length, lastPollTime]);

  const pollForNewMessagesInAllConversations = async () => {
    if (!session?.user?.id || conversations.length === 0) {
      return;
    }

    try {
      console.log('🔄 ConversationList: Enhanced polling for new messages in all conversations');
      
      // Check each conversation for new messages since lastPollTime
      const promises = conversations.map(async (conversation) => {
        try {
          const response = await fetch(
            `/api/messaging/conversations/${conversation.id}/messages?after=${lastPollTime.toISOString()}&limit=10`,
            getFetchOptions()
          );
          
          if (response.ok) {
            const newMessages = await response.json();
            
            if (newMessages.length > 0) {
              console.log(`🔄 ConversationList: Found ${newMessages.length} new messages in conversation ${conversation.id}`);
              
              // Get the latest message
              const latestMessage = newMessages[newMessages.length - 1];
              
              // Update conversation with new message info
              setConversations(prev => {
                return prev.map(conv => {
                  if (conv.id === conversation.id) {
                    // Don't increment unread count if:
                    // 1. This conversation is currently selected (user is viewing it)
                    // 2. The message is from the current user (don't notify for own messages)
                    const shouldIncrementUnread = conv.id !== selectedConversationId && 
                                                latestMessage.sender.id !== session?.user?.id;
                    
                    return {
                      ...conv,
                      lastMessage: {
                        id: latestMessage.id,
                        content: latestMessage.content,
                        type: latestMessage.type,
                        createdAt: latestMessage.createdAt,
                        sender: latestMessage.sender,
                      },
                      updatedAt: latestMessage.createdAt,
                      unreadCount: shouldIncrementUnread ? conv.unreadCount + 1 : conv.unreadCount,
                    };
                  }
                  return conv;
                }).sort((a, b) => {
                  // First, sort by pinned status (pinned conversations first)
                  if (a.isPinned && !b.isPinned) return -1;
                  if (!a.isPinned && b.isPinned) return 1;
                  
                  // If both have same pinned status, sort by updatedAt
                  return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
                });
              });
            }
          } else {
            console.error(`🔄 ConversationList: Failed to poll conversation ${conversation.id}:`, response.status, response.statusText);
          }
        } catch (error) {
          console.error(`🔄 ConversationList: Error polling conversation ${conversation.id}:`, error);
        }
      });

      await Promise.all(promises);
      
      // Update last poll time
      setLastPollTime(new Date());
      console.log('🔄 ConversationList: Polling cycle completed, updated lastPollTime');
      
    } catch (error) {
      console.error('🔄 ConversationList: Error in enhanced global polling:', error);
    }
  };

  const fetchConversations = async () => {
    try {
      const response = await fetch('/api/messaging/conversations');
      if (response.ok) {
        const data = await response.json();
        // Sort conversations with pinned ones first
        const sortedData = data.sort((a: Conversation, b: Conversation) => {
          // First, sort by pinned status (pinned conversations first)
          if (a.isPinned && !b.isPinned) return -1;
          if (!a.isPinned && b.isPinned) return 1;
          
          // If both have same pinned status, sort by updatedAt
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        });
        setConversations(sortedData);
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const togglePin = async (conversationId: string, isPinned: boolean) => {
    try {
      const response = await fetch(`/api/messaging/conversations/${conversationId}/pin`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isPinned: !isPinned }),
      });

      if (response.ok) {
        // Update the conversation in the local state and re-sort
        setConversations(prev => 
          prev.map(conv => 
            conv.id === conversationId 
              ? { ...conv, isPinned: !isPinned, pinnedAt: !isPinned ? new Date().toISOString() : undefined }
              : conv
          ).sort((a, b) => {
            // First, sort by pinned status (pinned conversations first)
            if (a.isPinned && !b.isPinned) return -1;
            if (!a.isPinned && b.isPinned) return 1;
            
            // If both have same pinned status, sort by updatedAt
            return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
          })
        );
      } else {
        const errorData = await response.json();
        alert(`Failed to ${!isPinned ? 'pin' : 'unpin'} conversation: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error toggling pin:', error);
      alert(`Failed to ${!isPinned ? 'pin' : 'unpin'} conversation`);
    }
  };

  const filteredConversations = conversations.filter(conversation => {
    if (!searchQuery) return true;
    
    const searchLower = searchQuery.toLowerCase();
    const conversationName = conversation.name?.toLowerCase() || '';
    const participantNames = conversation.participants
      .map(p => p.user.name.toLowerCase())
      .join(' ');
    
    return conversationName.includes(searchLower) || 
           participantNames.includes(searchLower) ||
           conversation.lastMessage?.content.toLowerCase().includes(searchLower);
  });

  const getConversationDisplayName = (conversation: Conversation) => {
    if (conversation.name) return conversation.name;
    
    if (conversation.type === 'direct') {
      const otherParticipant = conversation.participants.find(
        p => p.user.id !== conversation.createdBy.id
      );
      return otherParticipant?.user.name || 'Unknown User';
    }
    
    return 'Group Chat';
  };

  const getConversationAvatar = (conversation: Conversation) => {
    if (conversation.avatar) return conversation.avatar;
    
    if (conversation.type === 'direct') {
      const otherParticipant = conversation.participants.find(
        p => p.user.id !== conversation.createdBy.id
      );
      return otherParticipant?.user.image;
    }
    
    return null;
  };

  const getConversationIcon = (conversation: Conversation) => {
    switch (conversation.type) {
      case 'direct':
        return <User className="h-4 w-4" />;
      case 'group':
      case 'study_group':
        return <Users className="h-4 w-4" />;
      default:
        return <MessageCircle className="h-4 w-4" />;
    }
  };

  const formatLastMessageTime = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch {
      return 'Unknown time';
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col h-full">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <h2 className="text-lg font-semibold">Messages</h2>
              {pollingActive && (
                <div className="flex items-center space-x-1 text-xs text-green-600">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span>Live</span>
                </div>
              )}
            </div>
            <Button size="sm" onClick={onNewConversation}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search conversations..." 
              className="pl-10"
              value={searchQuery || ''}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        <div className="flex-1 p-4">
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center space-x-3 p-3 rounded-lg">
                <div className="w-10 h-10 bg-muted rounded-full animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded animate-pulse" />
                  <div className="h-3 bg-muted rounded animate-pulse w-2/3" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <h2 className="text-lg font-semibold">Messages</h2>
            {pollingActive && (
              <div className="flex items-center space-x-1 text-xs text-green-600">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span>Live</span>
              </div>
            )}
          </div>
          <NewConversationDialog
            onConversationCreated={(conversationId) => {
              if (onConversationCreated) {
                onConversationCreated(conversationId);
              }
              fetchConversations(); // Refresh the list
            }}
            trigger={
              <Button size="sm">
                <Plus className="h-4 w-4" />
              </Button>
            }
          />
        </div>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search conversations..." 
            className="pl-10"
            value={searchQuery || ''}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Conversations List */}
      <ScrollArea className="flex-1">
        <div className="p-2">
          {filteredConversations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-sm">
                {searchQuery ? 'No conversations found' : 'No conversations yet'}
              </p>
              {!searchQuery && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-2"
                  onClick={onNewConversation}
                >
                  Start a conversation
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-1">
              {filteredConversations.map((conversation) => (
                <Card
                  key={conversation.id}
                  className={`cursor-pointer transition-colors hover:bg-muted/50 overflow-hidden ${
                    selectedConversationId === conversation.id 
                      ? 'bg-muted border-primary' 
                      : ''
                  }`}
                  onClick={() => onConversationSelect(conversation.id)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-center space-x-3">
                      {/* Avatar */}
                      <div className="relative">
                        <Avatar 
                          className="h-10 w-10 cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={() => {
                            if (conversation.type === 'direct') {
                              const otherParticipant = conversation.participants.find(
                                p => p.user.id !== currentUserId
                              );
                              if (otherParticipant) {
                                // If clicking on other user's profile, go to their profile page
                                window.location.href = `/profile/${otherParticipant.user.id}`;
                              } else {
                                // If clicking on own profile, go to own profile page
                                window.location.href = `/profile`;
                              }
                            }
                          }}
                        >
                          <AvatarImage src={getConversationAvatar(conversation)} />
                          <AvatarFallback>
                            {getConversationIcon(conversation)}
                          </AvatarFallback>
                        </Avatar>
                        {conversation.unreadCount > 0 && (
                          <Badge 
                            variant="destructive" 
                            className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                          >
                            {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
                          </Badge>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0 overflow-hidden">
                        <div className="flex items-center justify-between">
                          <h3 className="font-medium text-sm truncate max-w-[120px]">
                            {getConversationDisplayName(conversation)}
                          </h3>
                          {conversation.lastMessage && (
                            <span className="text-xs text-muted-foreground flex items-center">
                              <Clock className="h-3 w-3 mr-1" />
                              {formatLastMessageTime(conversation.lastMessage.createdAt)}
                            </span>
                          )}
                        </div>
                        
                        {conversation.lastMessage ? (
                          <p className="text-sm text-muted-foreground truncate mt-1 max-w-[140px]">
                            <span className="font-medium">
                              {conversation.lastMessage.sender.name}:
                            </span>{' '}
                            {conversation.lastMessage.content}
                          </p>
                        ) : (
                          <p className="text-sm text-muted-foreground truncate mt-1 max-w-[140px]">
                            No messages yet
                          </p>
                        )}
                      </div>

                      {/* Actions */}
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 w-8 p-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          togglePin(conversation.id, conversation.isPinned);
                        }}
                        title={conversation.isPinned ? 'Unpin conversation' : 'Pin conversation'}
                      >
                        {conversation.isPinned ? (
                          <Pin className="h-4 w-4 text-primary" />
                        ) : (
                          <PinOff className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
