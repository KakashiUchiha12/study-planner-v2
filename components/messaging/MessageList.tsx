'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  MoreVertical, 
  Reply, 
  Edit, 
  Trash2, 
  Heart,
  Smile,
  ThumbsUp,
  Download,
  Eye,
  EyeOff
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { TextTruncator } from '@/components/ui/text-truncator';

interface Message {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  sender: {
    id: string;
    name: string;
    image?: string;
  };
  replyTo?: {
    id: string;
    content: string;
    sender: {
      name: string;
    };
  };
  attachments?: Array<{
    id: string;
    name: string;
    url: string;
    mimeType: string;
    size: number;
  }>;
  reactions?: Array<{
    id: string;
    type: string;
    user: {
      id: string;
      name: string;
    };
  }>;
  isEdited?: boolean;
  isDeleted?: boolean;
}

interface MessageListProps {
  conversationId: string;
  currentUserId: string;
  onReplyToMessage: (message: Message) => void;
  onEditMessage: (message: Message) => void;
  onDeleteMessage: (messageId: string) => void;
  onNewMessage?: (message: any) => void;
}

export function MessageList({
  conversationId,
  currentUserId,
  onReplyToMessage,
  onEditMessage,
  onDeleteMessage,
  onNewMessage
}: MessageListProps) {
  const { data: session } = useSession();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showReactions, setShowReactions] = useState<string | null>(null);

  // Store the handler globally for the messaging page to use
  useEffect(() => {
    (window as any).messageListHandler = (newMessage: any) => {
      setMessages(prev => [...prev, newMessage]);
      scrollToBottom();
    };
    
    return () => {
      delete (window as any).messageListHandler;
    };
  }, []);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const fetchMessages = useCallback(async () => {
    if (!conversationId) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/messaging/conversations/${conversationId}/messages`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch messages');
      }
      
      const data = await response.json();
      setMessages(data.messages || []);
    } catch (err) {
      console.error('Error fetching messages:', err);
      setError(err instanceof Error ? err.message : 'Failed to load messages');
    } finally {
      setLoading(false);
    }
  }, [conversationId]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const handleReaction = async (messageId: string, reactionType: string) => {
    try {
      const response = await fetch(`/api/messaging/messages/${messageId}/reactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ type: reactionType }),
      });

      if (response.ok) {
        // Refresh messages to get updated reactions
        fetchMessages();
      }
    } catch (error) {
      console.error('Error adding reaction:', error);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getReactionEmoji = (type: string) => {
    const reactions: { [key: string]: string } = {
      like: '👍',
      love: '❤️',
      laugh: '😂',
      wow: '😮',
      sad: '😢',
      angry: '😠'
    };
    return reactions[type] || '👍';
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-sm text-muted-foreground">Loading messages...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={fetchMessages} variant="outline">
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">No messages yet. Start the conversation!</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.map((message) => {
        const isOwnMessage = message.sender.id === currentUserId;
        const isDeleted = message.isDeleted;
        
        return (
          <div
            key={message.id}
            className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-[70%] ${isOwnMessage ? 'order-2' : 'order-1'}`}>
              {/* Reply context */}
              {message.replyTo && (
                <div className="mb-2 p-2 bg-muted rounded-lg border-l-4 border-primary">
                  <p className="text-xs text-muted-foreground">
                    Replying to {message.replyTo.sender.name}
                  </p>
                  <TextTruncator
                    text={message.replyTo.content}
                    maxWords={20}
                    className="text-sm"
                  />
                </div>
              )}

              {/* Message content */}
              <div
                className={`rounded-lg p-3 ${
                  isOwnMessage
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted'
                }`}
              >
                {!isDeleted ? (
                  <>
                    {/* Message text */}
                    <div className="mb-2">
                      <TextTruncator
                        text={message.content}
                        maxWords={100}
                        preserveFormatting={true}
                        className="text-sm"
                      />
                    </div>

                    {/* Attachments */}
                    {message.attachments && message.attachments.length > 0 && (
                      <div className="space-y-2 mb-2">
                        {message.attachments.map((attachment) => (
                          <div
                            key={attachment.id}
                            className="flex items-center gap-2 p-2 bg-background/50 rounded border"
                          >
                            <Download className="h-4 w-4" />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium truncate">
                                {attachment.name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {formatFileSize(attachment.size)}
                              </p>
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => window.open(attachment.url, '_blank')}
                            >
                              <Eye className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Message metadata */}
                    <div className="flex items-center justify-between text-xs opacity-70">
                      <span>{formatTime(message.createdAt)}</span>
                      {message.isEdited && (
                        <span className="italic">edited</span>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="text-sm italic opacity-70">
                    This message was deleted
                  </div>
                )}
              </div>

              {/* Reactions */}
              {message.reactions && message.reactions.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {Object.entries(
                    message.reactions.reduce((acc, reaction) => {
                      if (!acc[reaction.type]) {
                        acc[reaction.type] = [];
                      }
                      acc[reaction.type].push(reaction);
                      return acc;
                    }, {} as { [key: string]: typeof message.reactions })
                  ).map(([type, reactions]) => (
                    <Badge
                      key={type}
                      variant="secondary"
                      className="text-xs cursor-pointer hover:bg-secondary/80"
                      onClick={() => setShowReactions(showReactions === message.id ? null : message.id)}
                    >
                      {getReactionEmoji(type)} {reactions.length}
                    </Badge>
                  ))}
                </div>
              )}

              {/* Message actions */}
              {!isDeleted && (
                <div className="flex items-center gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                        <MoreVertical className="h-3 w-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onReplyToMessage(message)}>
                        <Reply className="h-4 w-4 mr-2" />
                        Reply
                      </DropdownMenuItem>
                      {isOwnMessage && (
                        <>
                          <DropdownMenuItem onClick={() => onEditMessage(message)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => onDeleteMessage(message.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </>
                      )}
                      <DropdownMenuItem onClick={() => handleReaction(message.id, 'like')}>
                        <ThumbsUp className="h-4 w-4 mr-2" />
                        Like
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleReaction(message.id, 'love')}>
                        <Heart className="h-4 w-4 mr-2" />
                        Love
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleReaction(message.id, 'laugh')}>
                        <Smile className="h-4 w-4 mr-2" />
                        Laugh
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )}
            </div>

            {/* Sender info */}
            {!isOwnMessage && (
              <div className="order-2 ml-2 flex-shrink-0">
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                  {message.sender.image ? (
                    <img
                      src={message.sender.image}
                      alt={message.sender.name}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-xs font-medium">
                      {message.sender.name.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}
      
      <div ref={messagesEndRef} />
    </div>
  );
}
