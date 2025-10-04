'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { X } from 'lucide-react';

interface ReactionUser {
  id: string;
  name: string;
  image?: string;
}

interface ReactionsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  postId: string;
  reactions: { [key: string]: ReactionUser[] };
}

const REACTIONS = [
  { key: 'like', emoji: '👍', label: 'Like' },
  { key: 'heart', emoji: '❤️', label: 'Love' },
  { key: 'laugh', emoji: '😂', label: 'Laugh' },
  { key: 'wow', emoji: '😮', label: 'Wow' },
  { key: 'sad', emoji: '😢', label: 'Sad' },
  { key: 'fire', emoji: '🔥', label: 'Fire' },
];

export function ReactionsDialog({ isOpen, onClose, postId, reactions }: ReactionsDialogProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<string>('');

  // Set the first reaction type as active tab when dialog opens
  useEffect(() => {
    if (isOpen && reactions) {
      const firstReactionType = Object.keys(reactions)[0];
      if (firstReactionType) {
        setActiveTab(firstReactionType);
      }
    }
  }, [isOpen, reactions]);

  const handleUserClick = (userId: string) => {
    router.push(`/profile/${userId}`);
    onClose();
  };

  if (!isOpen || !reactions) return null;

  const reactionTypes = Object.keys(reactions).filter(type => reactions[type].length > 0);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Reactions</span>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Reaction Type Tabs */}
          {reactionTypes.length > 1 && (
            <div className="flex flex-wrap gap-2">
              {reactionTypes.map((reactionType) => {
                const reaction = REACTIONS.find(r => r.key === reactionType);
                const users = reactions[reactionType];
                return (
                  <Button
                    key={reactionType}
                    variant={activeTab === reactionType ? "default" : "outline"}
                    size="sm"
                    onClick={() => setActiveTab(reactionType)}
                    className="flex items-center gap-2"
                  >
                    <span>{reaction?.emoji}</span>
                    <span>{users.length}</span>
                  </Button>
                );
              })}
            </div>
          )}

          {/* Users List */}
          {activeTab && reactions[activeTab] && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">
                  {REACTIONS.find(r => r.key === activeTab)?.emoji}
                </span>
                <span className="font-medium">
                  {REACTIONS.find(r => r.key === activeTab)?.label}
                </span>
                <span className="text-sm text-muted-foreground">
                  ({reactions[activeTab].length})
                </span>
              </div>

              <div className="max-h-60 overflow-y-auto space-y-2">
                {reactions[activeTab].map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => handleUserClick(user.id)}
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.image} alt={user.name} />
                      <AvatarFallback>
                        {user.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium text-sm">{user.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Show all reactions if only one type */}
          {reactionTypes.length === 1 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">
                  {REACTIONS.find(r => r.key === reactionTypes[0])?.emoji}
                </span>
                <span className="font-medium">
                  {REACTIONS.find(r => r.key === reactionTypes[0])?.label}
                </span>
                <span className="text-sm text-muted-foreground">
                  ({reactions[reactionTypes[0]].length})
                </span>
              </div>

              <div className="max-h-60 overflow-y-auto space-y-2">
                {reactions[reactionTypes[0]].map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => handleUserClick(user.id)}
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.image} alt={user.name} />
                      <AvatarFallback>
                        {user.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium text-sm">{user.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
