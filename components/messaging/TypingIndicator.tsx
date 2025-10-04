'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useEffect, useState } from 'react';

interface TypingUser {
  id: string;
  name: string;
  image?: string;
}

interface TypingIndicatorProps {
  typingUsers: TypingUser[];
}

export function TypingIndicator({ typingUsers }: TypingIndicatorProps) {
  const [visibleUsers, setVisibleUsers] = useState<TypingUser[]>([]);

  // Add users with animation delay
  useEffect(() => {
    if (typingUsers.length > 0) {
      setVisibleUsers(typingUsers);
    } else {
      // Remove users with fade out
      const timer = setTimeout(() => {
        setVisibleUsers([]);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [typingUsers]);

  if (visibleUsers.length === 0) return null;

  const getDisplayName = (user: TypingUser) => {
    return user.name || 'Unknown';
  };

  const getUserInitials = (user: TypingUser) => {
    const name = getDisplayName(user);
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getTypingText = () => {
    if (visibleUsers.length === 1) {
      return `${getDisplayName(visibleUsers[0])} is typing`;
    } else if (visibleUsers.length === 2) {
      return `${getDisplayName(visibleUsers[0])} and ${getDisplayName(visibleUsers[1])} are typing`;
    } else {
      return `${getDisplayName(visibleUsers[0])} and ${visibleUsers.length - 1} others are typing`;
    }
  };

  return (
    <div className="flex items-start space-x-2 px-4 py-2 animate-in slide-in-from-bottom-2 duration-300">
      {/* Avatar */}
      <Avatar className="h-8 w-8">
        <AvatarImage src={visibleUsers[0].image} />
        <AvatarFallback>
          {getUserInitials(visibleUsers[0])}
        </AvatarFallback>
      </Avatar>

      {/* Typing bubble */}
      <div className="bg-muted rounded-2xl px-3 py-2 max-w-xs">
        <div className="flex items-center space-x-2">
          <div className="flex space-x-1">
            <div 
              className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" 
              style={{ animationDelay: '0ms', animationDuration: '1.4s' }}
            ></div>
            <div 
              className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" 
              style={{ animationDelay: '200ms', animationDuration: '1.4s' }}
            ></div>
            <div 
              className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" 
              style={{ animationDelay: '400ms', animationDuration: '1.4s' }}
            ></div>
          </div>
          <span className="text-xs text-muted-foreground font-medium">
            {getTypingText()}
          </span>
        </div>
      </div>
    </div>
  );
}