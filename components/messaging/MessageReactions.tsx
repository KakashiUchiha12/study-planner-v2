'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useSession } from 'next-auth/react';

interface Reaction {
  id: string;
  emoji: string;
  user: {
    id: string;
    name: string;
    image?: string;
  };
}

interface MessageReactionsProps {
  reactions: Reaction[];
  onReactionAdd: (messageId: string, emoji: string) => void;
  onReactionRemove: (messageId: string, emoji: string) => void;
  messageId: string;
}

export function MessageReactions({
  reactions,
  onReactionAdd,
  onReactionRemove,
  messageId,
}: MessageReactionsProps) {
  const { data: session } = useSession();
  const [showAllUsers, setShowAllUsers] = useState(false);

  // Group reactions by emoji
  const reactionsByEmoji = (reactions || []).reduce((acc, reaction) => {
    if (!acc[reaction.emoji]) {
      acc[reaction.emoji] = [];
    }
    acc[reaction.emoji].push(reaction);
    return acc;
  }, {} as Record<string, Reaction[]>);

  const handleReactionClick = (emoji: string) => {
    const userReaction = (reactions || []).find(r => r.emoji === emoji && r.user.id === session?.user?.id);
    
    if (userReaction) {
      onReactionRemove(messageId, emoji);
    } else {
      onReactionAdd(messageId, emoji);
    }
  };

  if (!reactions || reactions.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1 mt-2">
      {Object.entries(reactionsByEmoji).map(([emoji, emojiReactions]) => {
        const userReacted = emojiReactions.some(r => r.user.id === session?.user?.id);
        const otherUsers = emojiReactions.filter(r => r.user.id !== session?.user?.id);
        
        return (
          <Popover key={emoji}>
            <PopoverTrigger asChild>
              <Button
                variant={userReacted ? "default" : "outline"}
                size="sm"
                className={`h-6 px-2 text-xs ${
                  userReacted 
                    ? 'bg-primary text-primary-foreground' 
                    : 'hover:bg-muted'
                }`}
                onClick={() => handleReactionClick(emoji)}
              >
                <span className="mr-1">{emoji}</span>
                <span>{emojiReactions.length}</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-2" align="start">
              <div className="space-y-2">
                <div className="text-sm font-medium">{emoji} Reactions</div>
                <div className="space-y-1">
                  {emojiReactions.map((reaction) => (
                    <div key={reaction.id} className="flex items-center space-x-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={reaction.user.image} />
                        <AvatarFallback className="text-xs">
                          {reaction.user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm">{reaction.user.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </PopoverContent>
          </Popover>
        );
      })}
    </div>
  );
}
