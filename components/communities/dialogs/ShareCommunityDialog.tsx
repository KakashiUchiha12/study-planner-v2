'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Share2, Copy, Check } from 'lucide-react';

interface ShareCommunityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  community: {
    id: string;
    name: string;
    description?: string;
  };
}

export function ShareCommunityDialog({
  open,
  onOpenChange,
  community,
}: ShareCommunityDialogProps) {
  const [copied, setCopied] = useState(false);
  const communityUrl = `${window.location.origin}/communities/${community.id}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(communityUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: community.name,
          text: community.description || `Join ${community.name} community`,
          url: communityUrl,
        });
        onOpenChange(false);
      } catch (error) {
        console.error('Error sharing:', error);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Share2 className="h-5 w-5 text-blue-500" />
            <DialogTitle>Share Community</DialogTitle>
          </div>
          <DialogDescription>
            Share <strong>{community.name}</strong> with others
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="community-url">Community Link</Label>
            <div className="flex gap-2">
              <Input
                id="community-url"
                value={communityUrl}
                readOnly
                className="flex-1"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={handleCopy}
                className="shrink-0"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>
          {navigator.share && (
            <Button onClick={handleNativeShare}>
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
