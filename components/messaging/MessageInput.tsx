'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Send, 
  Paperclip, 
  Image, 
  Smile, 
  X,
  Reply
} from 'lucide-react';
import { MessageAttachmentUpload } from './MessageAttachmentUpload';
import socketIOClient from '@/lib/socketio-client';
import { useSession } from 'next-auth/react';
import { useSocketIOAuth } from '@/lib/hooks/useSocketIOAuth';

interface Message {
  id: string;
  content: string;
  sender: {
    id: string;
    name: string;
    image?: string;
  };
}

interface MessageInputProps {
  conversationId: string;
  onMessageSent: (message: Message) => void;
  replyToMessage?: Message | null;
  onCancelReply: () => void;
}

export function MessageInput({ 
  conversationId, 
  onMessageSent, 
  replyToMessage,
  onCancelReply 
}: MessageInputProps) {
  const { data: session } = useSession();
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showAttachmentUpload, setShowAttachmentUpload] = useState(false);
  const [attachments, setAttachments] = useState<Array<{
    id: string;
    type: string;
    url: string;
    name: string;
    size?: number;
    mimeType: string;
  }>>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [isTypingSent, setIsTypingSent] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const typingSentTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [replyToMessage]);

  // Use global authentication hook
  useSocketIOAuth();

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      if (typingSentTimeoutRef.current) {
        clearTimeout(typingSentTimeoutRef.current);
      }
    };
  }, []);

  const sendTypingEvent = useCallback(async (action: 'start' | 'stop') => {
    if (!(session?.user as any)?.id || !conversationId || !socketIOClient) return;

    try {
      if (action === 'start') {
        // Send typing indicator via Socket.IO
        socketIOClient.sendTyping(conversationId);
      } else {
        // Send typing stop via Socket.IO
        socketIOClient.sendStopTyping(conversationId);
      }
    } catch (error) {
      console.error('Failed to send typing event:', error);
    }
  }, [session?.user, conversationId]);

  const handleTyping = useCallback(() => {
    if (!(session?.user as any)?.id || !conversationId) return;

    // Send typing start event if not already sent
    if (!isTypingSent) {
      setIsTypingSent(true);
      sendTypingEvent('start');
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set timeout to stop typing
    typingTimeoutRef.current = setTimeout(() => {
      setIsTypingSent(false);
      sendTypingEvent('stop');
    }, 2000);
  }, [session?.user, conversationId, isTypingSent, sendTypingEvent]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim() || isLoading) return;

    // Stop typing immediately when sending
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    if (isTypingSent) {
      sendTypingEvent('stop');
      setIsTypingSent(false);
    }

    setIsLoading(true);
    
    try {
      console.log('🔔 MessageInput: Making API call to:', `/api/messaging/conversations/${conversationId}/messages`);
      console.log('🔔 MessageInput: Request body:', {
        content: message.trim(),
        type: 'text',
        replyToId: replyToMessage?.id || null,
        attachments: attachments,
      });
      
      const response = await fetch(`/api/messaging/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: message.trim(),
          type: 'text',
          replyToId: replyToMessage?.id || null,
          attachments: attachments,
        }),
      });
      
      console.log('🔔 MessageInput: Response status:', response.status);
      console.log('🔔 MessageInput: Response ok:', response.ok);

      if (response.ok) {
        const sentMessage = await response.json();
        console.log('🔔 Message sent successfully:', sentMessage);
        setMessage('');
        setAttachments([]);
        
        // Transform the message to match our interface
        const transformedMessage = {
          id: sentMessage.id,
          content: sentMessage.content,
          type: sentMessage.type,
          createdAt: sentMessage.createdAt,
          editedAt: sentMessage.editedAt,
          status: 'sent' as const,
          sentAt: sentMessage.createdAt,
          deliveredAt: sentMessage.createdAt,
          readAt: null,
          sender: {
            id: sentMessage.sender.id,
            name: sentMessage.sender.name,
            image: sentMessage.sender.image,
          },
          replyTo: sentMessage.replyTo,
          attachments: sentMessage.attachments || [],
          reactions: sentMessage.reactions || [],
          _count: sentMessage._count || { replies: 0 }
        };
        
        console.log('🔔 MessageInput: Calling onMessageSent with:', transformedMessage);
        onMessageSent(transformedMessage);
        onCancelReply();
      } else {
        const errorData = await response.json();
        console.error('🔔 MessageInput: Failed to send message:', errorData);
        console.error('🔔 MessageInput: Response status:', response.status);
        console.error('🔔 MessageInput: Response statusText:', response.statusText);
        alert(`Failed to send message: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('🔔 MessageInput: Error sending message:', error);
      console.error('🔔 MessageInput: Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleFileUpload = () => {
    setShowAttachmentUpload(true);
  };

  const handleImageUpload = () => {
    setShowAttachmentUpload(true);
  };

  const handleAttachmentsUploaded = (uploadedAttachments: Array<{
    id: string;
    type: string;
    url: string;
    name: string;
    size?: number;
    mimeType: string;
  }>) => {
    setAttachments(prev => [...prev, ...uploadedAttachments]);
    setShowAttachmentUpload(false);
  };

  const handleMessageChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    handleTyping();
  };

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [message]);

  return (
    <div className="border-t bg-background">
      {/* Reply indicator */}
      {replyToMessage && (
        <div className="p-3 bg-muted border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Reply className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                Replying to <span className="font-medium">{replyToMessage.sender.name}</span>
              </span>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onCancelReply}
              className="h-6 w-6 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-1 truncate">
            {replyToMessage.content}
          </p>
        </div>
      )}

      {/* Message input */}
      <form onSubmit={handleSubmit} className="p-3">
        <div className="flex items-end space-x-2">
          {/* Attachment buttons */}
          <div className="flex items-center space-x-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleFileUpload}
              className="h-8 w-8 p-0 hover:bg-muted"
            >
              <Paperclip className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleImageUpload}
              className="h-8 w-8 p-0 hover:bg-muted"
            >
              <Image className="h-4 w-4" />
            </Button>
          </div>

          {/* Message textarea */}
          <div className="flex-1">
            <Textarea
              ref={textareaRef}
              value={message}
              onChange={handleMessageChange}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              className="min-h-[40px] max-h-[120px] resize-none border-0 focus-visible:ring-0 bg-muted/50"
              disabled={isLoading}
            />
          </div>

          {/* Send button */}
          <Button 
            type="submit" 
            size="sm" 
            disabled={!message.trim() || isLoading}
            className="h-8 w-8 p-0"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>

        {/* Attachments preview */}
        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {attachments.map((attachment) => (
              <div key={attachment.id} className="flex items-center space-x-2 p-2 bg-muted rounded-lg">
                <span className="text-sm">{attachment.name}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setAttachments(prev => prev.filter(att => att.id !== attachment.id))}
                  className="h-4 w-4 p-0"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Character count */}
        {message.length > 0 && (
          <div className="flex justify-between items-center mt-2 text-xs text-muted-foreground">
            <span>{message.length} characters</span>
            <span>Press Enter to send, Shift+Enter for new line</span>
          </div>
        )}
      </form>

      {/* Attachment Upload Dialog */}
      <MessageAttachmentUpload
        open={showAttachmentUpload}
        onClose={() => setShowAttachmentUpload(false)}
        onAttachmentsUploaded={handleAttachmentsUploaded}
      />
    </div>
  );
}