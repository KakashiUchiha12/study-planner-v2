'use client';

import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  MoreVertical, 
  Users, 
  User, 
  Settings, 
  Phone, 
  Video,
  Search,
  Archive,
  Trash2,
  Info,
  ArrowLeft
} from 'lucide-react';
import { MessageSearch } from './MessageSearch';
import { UserPresence } from './UserPresence';
import { useEffect } from 'react';
import socketIOClient from '@/lib/socketio-client';

interface Participant {
  id: string;
  role: string;
  joinedAt: string;
  lastReadAt?: string;
  user: {
    id: string;
    name: string;
    image?: string;
  };
}

interface Conversation {
  id: string;
  type: string;
  name?: string;
  description?: string;
  avatar?: string;
  participants: Participant[];
  createdBy: {
    id: string;
    name: string;
    image?: string;
  };
}

interface ConversationHeaderProps {
  conversation: Conversation | null;
  currentUserId: string;
  onViewInfo: () => void;
  onSearchMessages: () => void;
  onArchiveConversation: () => void;
  onDeleteConversation: () => void;
  onGroupSettings?: () => void;
}

export function ConversationHeader({
  conversation,
  currentUserId,
  onViewInfo,
  onSearchMessages,
  onArchiveConversation,
  onDeleteConversation,
  onGroupSettings,
}: ConversationHeaderProps) {
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [isOnline, setIsOnline] = useState(false);

  // Subscribe to presence updates
  useEffect(() => {
    if (!conversation) return;

    const presenceChannel = socketIOClient.subscribe(`presence-${conversation.id}`);
    
    presenceChannel.bind('user-online', (data: { userId: string; user: any }) => {
      setOnlineUsers(prev => new Set([...prev, data.userId]));
    });

    presenceChannel.bind('user-offline', (data: { userId: string; user: any }) => {
      setOnlineUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(data.userId);
        return newSet;
      });
    });

    // For direct messages, check if the other user is online
    if (conversation.type === 'direct') {
      const otherParticipant = conversation.participants.find(
        p => p.user.id !== currentUserId
      );
      if (otherParticipant) {
        setIsOnline(onlineUsers.has(otherParticipant.user.id));
      }
    }

    return () => {
      socketIOClient.unsubscribe(`presence-${conversation.id}`);
    };
  }, [conversation, currentUserId, onlineUsers]);

  if (!conversation) {
    return (
      <div className="h-16 border-b bg-background flex items-center px-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-muted rounded-full animate-pulse" />
          <div className="space-y-2">
            <div className="h-4 bg-muted rounded animate-pulse w-32" />
            <div className="h-3 bg-muted rounded animate-pulse w-24" />
          </div>
        </div>
      </div>
    );
  }

  const getConversationDisplayName = () => {
    if (conversation.name) return conversation.name;
    
    if (conversation.type === 'direct') {
      const otherParticipant = conversation.participants.find(
        p => p.user.id !== currentUserId
      );
      return otherParticipant?.user.name || 'Unknown User';
    }
    
    return 'Group Chat';
  };

  const getConversationAvatar = () => {
    if (conversation.avatar) return conversation.avatar;
    
    if (conversation.type === 'direct') {
      const otherParticipant = conversation.participants.find(
        p => p.user.id !== currentUserId
      );
      return otherParticipant?.user.image;
    }
    
    return null;
  };

  const getConversationSubtitle = () => {
    if (conversation.type === 'direct') {
      return isOnline ? 'Online' : 'Last seen recently';
    }
    
    return `${conversation.participants.length} members`;
  };

  const getConversationIcon = () => {
    switch (conversation.type) {
      case 'direct':
        return <User className="h-4 w-4" />;
      case 'group':
      case 'study_group':
        return <Users className="h-4 w-4" />;
      default:
        return <User className="h-4 w-4" />;
    }
  };

  const isCurrentUserAdmin = conversation.participants.some(
    p => p.user.id === currentUserId && p.role === 'admin'
  );

  return (
    <div className="h-16 border-b bg-background flex items-center justify-between px-4">
      {/* Left side - Conversation info */}
      <div className="flex items-center space-x-3">
        <div className="relative">
          <Avatar 
            className="h-10 w-10 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => {
              if (conversation.type === 'direct') {
                const otherParticipant = conversation.participants.find(
                  p => p.user.id !== currentUserId
                );
                
                // Check if the displayed name is actually the current user's name
                const displayedName = getConversationDisplayName();
                const currentUserParticipant = conversation.participants.find(
                  p => p.user.id === currentUserId
                );
                
                if (otherParticipant && displayedName === otherParticipant.user.name) {
                  // If there's another participant and the displayed name matches them, go to their profile
                  window.location.href = `/profile/${otherParticipant.user.id}`;
                } else if (currentUserParticipant && displayedName === currentUserParticipant.user.name) {
                  // If the displayed name matches the current user, go to own profile
                  window.location.href = `/profile`;
                } else if (otherParticipant) {
                  // Fallback: if there's another participant, go to their profile
                  window.location.href = `/profile/${otherParticipant.user.id}`;
                } else {
                  // Fallback: go to own profile
                  window.location.href = `/profile`;
                }
              }
            }}
          >
            <AvatarImage src={getConversationAvatar()} />
            <AvatarFallback>
              {getConversationIcon()}
            </AvatarFallback>
          </Avatar>
          {conversation.type === 'direct' && (
            <div className="absolute -bottom-1 -right-1">
              <UserPresence 
                userId={conversation.participants.find(p => p.user.id !== currentUserId)?.user.id || ''} 
                isOnline={isOnline}
                size="sm"
              />
            </div>
          )}
        </div>
        
        <div className="flex flex-col">
          <div className="flex items-center space-x-2">
            <h2 
              className="font-semibold text-sm cursor-pointer hover:underline"
              onClick={() => {
                if (conversation.type === 'direct') {
                  const otherParticipant = conversation.participants.find(
                    p => p.user.id !== currentUserId
                  );
                  
                  // Check if the displayed name is actually the current user's name
                  const displayedName = getConversationDisplayName();
                  const currentUserParticipant = conversation.participants.find(
                    p => p.user.id === currentUserId
                  );
                  
                  if (otherParticipant && displayedName === otherParticipant.user.name) {
                    // If there's another participant and the displayed name matches them, go to their profile
                    window.location.href = `/profile/${otherParticipant.user.id}`;
                  } else if (currentUserParticipant && displayedName === currentUserParticipant.user.name) {
                    // If the displayed name matches the current user, go to own profile
                    window.location.href = `/profile`;
                  } else if (otherParticipant) {
                    // Fallback: if there's another participant, go to their profile
                    window.location.href = `/profile/${otherParticipant.user.id}`;
                  } else {
                    // Fallback: go to own profile
                    window.location.href = `/profile`;
                  }
                }
              }}
            >
              {getConversationDisplayName()}
            </h2>
            {conversation.type !== 'direct' && (
              <Badge variant="secondary" className="text-xs">
                {conversation.type === 'study_group' ? 'Study Group' : 'Group'}
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            {getConversationSubtitle()}
          </p>
        </div>
      </div>

      {/* Right side - Actions */}
      <div className="flex items-center space-x-1">
        {/* Search */}
        <MessageSearch 
          conversationId={conversation.id}
          onMessageSelect={onSearchMessages}
        />

        {/* Video call (for direct messages) */}
        {conversation.type === 'direct' && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => console.log('Start video call')}
          >
            <Video className="h-4 w-4" />
          </Button>
        )}

        {/* Voice call (for direct messages) */}
        {conversation.type === 'direct' && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => console.log('Start voice call')}
          >
            <Phone className="h-4 w-4" />
          </Button>
        )}

        {/* More options */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={onViewInfo}>
              <Info className="h-4 w-4 mr-2" />
              View Info
            </DropdownMenuItem>
            
            <DropdownMenuItem onClick={onSearchMessages}>
              <Search className="h-4 w-4 mr-2" />
              Search Messages
            </DropdownMenuItem>

            {isCurrentUserAdmin && conversation.type !== 'direct' && onGroupSettings && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onGroupSettings}>
                  <Settings className="h-4 w-4 mr-2" />
                  Group Settings
                </DropdownMenuItem>
              </>
            )}

            <DropdownMenuSeparator />
            
            <DropdownMenuItem onClick={onArchiveConversation}>
              <Archive className="h-4 w-4 mr-2" />
              Archive
            </DropdownMenuItem>

            {isCurrentUserAdmin && (
              <DropdownMenuItem 
                onClick={onDeleteConversation}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Conversation
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
