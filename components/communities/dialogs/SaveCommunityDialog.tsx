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
import { Bookmark, BookmarkCheck } from 'lucide-react';

interface SaveCommunityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  community: {
    id: string;
    name: string;
  };
  isSaved?: boolean;
  onSave: () => void;
  onUnsave: () => void;
}

export function SaveCommunityDialog({
  open,
  onOpenChange,
  community,
  isSaved = false,
  onSave,
  onUnsave,
}: SaveCommunityDialogProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      if (isSaved) {
        await onUnsave();
      } else {
        await onSave();
      }
      onOpenChange(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            {isSaved ? (
              <BookmarkCheck className="h-5 w-5 text-green-500" />
            ) : (
              <Bookmark className="h-5 w-5 text-blue-500" />
            )}
            <DialogTitle>
              {isSaved ? 'Remove from Saved' : 'Save Community'}
            </DialogTitle>
          </div>
          <DialogDescription>
            {isSaved ? (
              <>
                Remove <strong>{community.name}</strong> from your saved communities?
              </>
            ) : (
              <>
                Save <strong>{community.name}</strong> to your bookmarks for easy access?
              </>
            )}
          </DialogDescription>
        </DialogHeader>
        
        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isLoading}
            variant={isSaved ? "destructive" : "default"}
          >
            {isLoading ? (
              'Processing...'
            ) : isSaved ? (
              'Remove from Saved'
            ) : (
              'Save Community'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
