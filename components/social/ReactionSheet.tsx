'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

interface ReactionSheetProps {
  onReaction: (emoji: string) => void;
  currentReaction?: string | null;
}

const REACTIONS = [
  { key: 'like', emoji: '👍', label: 'Like' },
  { key: 'heart', emoji: '❤️', label: 'Love' },
  { key: 'laugh', emoji: '😂', label: 'Laugh' },
  { key: 'wow', emoji: '😮', label: 'Wow' },
  { key: 'sad', emoji: '😢', label: 'Sad' },
  { key: 'fire', emoji: '🔥', label: 'Fire' },
];

export function ReactionSheet({ onReaction, currentReaction }: ReactionSheetProps) {
  const [showReactions, setShowReactions] = useState(false);

  const handleReaction = (emoji: string) => {
    onReaction(emoji);
    setShowReactions(false);
  };

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="sm"
        className="flex items-center gap-1 text-muted-foreground hover:text-foreground"
        onClick={() => setShowReactions(!showReactions)}
      >
        <span className="text-lg">{currentReaction || '👍'}</span>
        <span className="text-sm">React</span>
      </Button>

      {showReactions && (
        <div className="absolute bottom-full mb-2 left-0 bg-white border rounded-lg shadow-lg p-2 flex gap-1 z-10">
          {REACTIONS.map((reaction) => (
            <Button
              key={reaction.key}
              variant="ghost"
              size="sm"
              className="p-1 h-8 w-8"
              onClick={() => handleReaction(reaction.emoji)}
              title={reaction.label}
            >
              <span className="text-lg">{reaction.emoji}</span>
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}
