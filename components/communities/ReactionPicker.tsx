'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface ReactionPickerProps {
  onReactionSelect: (emoji: string) => void;
  children: React.ReactNode;
}

const COMMON_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '😡', '🎉', '👏'];

export function ReactionPicker({ onReactionSelect, children }: ReactionPickerProps) {
  const [open, setOpen] = useState(false);

  const handleReactionClick = (emoji: string) => {
    onReactionSelect(emoji);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {children}
      </PopoverTrigger>
      <PopoverContent className="w-auto p-2" align="start">
        <div className="grid grid-cols-4 gap-1">
          {COMMON_REACTIONS.map((emoji) => (
            <Button
              key={emoji}
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-lg hover:bg-gray-100"
              onClick={() => handleReactionClick(emoji)}
            >
              {emoji}
            </Button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
