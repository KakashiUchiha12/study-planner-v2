'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { UserDisplay } from '@/components/ui/UserDisplay';
import { X, Reply } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface MessageReplyProps {
  replyTo: {
    id: string;
    content: string;
    sender: {
      id: string;
      name: string;
      image?: string;
    };
  };
  onCancelReply: () => void;
}

export function MessageReply({ replyTo, onCancelReply }: MessageReplyProps) {
  const router = useRouter();
  
  const getDisplayName = (user: any) => {
    return user.name || user.email?.split('@')[0] || 'Unknown';
  };

  const getUserInitials = (user: any) => {
    const name = getDisplayName(user);
    return name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const handleProfileClick = () => {
    router.push(`/profile/${replyTo.sender.id}`);
  };

  return (
    <div className="flex items-start space-x-2 p-2 bg-muted/50 border-l-4 border-primary rounded-r-lg">
      <div className="flex items-center space-x-2 text-xs text-muted-foreground">
        <Reply className="h-3 w-3" />
        <span>Replying to</span>
      </div>
      
      <div className="flex-1 min-w-0">
        <UserDisplay 
          user={replyTo.sender} 
          size="sm" 
          clickable={true}
          showUsername={false}
        />
        
        <div className="mt-1 p-1.5 bg-background/50 rounded-lg">
          <p className="text-xs text-muted-foreground line-clamp-2">
            {replyTo.content}
          </p>
        </div>
      </div>
      
      <Button
        variant="ghost"
        size="sm"
        className="h-5 w-5 p-0"
        onClick={onCancelReply}
      >
        <X className="h-3 w-3" />
      </Button>
    </div>
  );
}