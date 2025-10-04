'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Smile } from 'lucide-react';

interface MessageReactionPickerProps {
  messageId: string;
  currentReactions: Array<{
    id: string;
    emoji: string;
    user: {
      id: string;
      name: string;
      image?: string;
    };
  }>;
  onReactionAdd: (messageId: string, emoji: string) => void;
  onReactionRemove: (messageId: string, emoji: string) => void;
}

const EMOJI_OPTIONS = ['👍', '❤️', '😂', '😮', '😢', '😡', '🎉', '👏', '🔥', '💯'];

export function MessageReactionPicker({
  messageId,
  currentReactions,
  onReactionAdd,
  onReactionRemove,
}: MessageReactionPickerProps) {
  const [open, setOpen] = useState(false);

  const handleEmojiClick = (emoji: string) => {
    const existingReaction = currentReactions.find(r => r.emoji === emoji);
    
    if (existingReaction) {
      onReactionRemove(messageId, emoji);
    } else {
      onReactionAdd(messageId, emoji);
    }
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <Smile className="h-3 w-3" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-2" align="start">
        <div className="flex gap-1">
          {EMOJI_OPTIONS.map((emoji) => (
            <Button
              key={emoji}
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-lg hover:bg-muted"
              onClick={() => handleEmojiClick(emoji)}
            >
              {emoji}
            </Button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
