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
import { AlertTriangle } from 'lucide-react';

interface LeaveCommunityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  communityName: string;
  onConfirm: () => void;
  isOwner?: boolean;
}

export function LeaveCommunityDialog({
  open,
  onOpenChange,
  communityName,
  onConfirm,
  isOwner = false,
}: LeaveCommunityDialogProps) {
  const [isLeaving, setIsLeaving] = useState(false);

  const handleConfirm = async () => {
    setIsLeaving(true);
    try {
      await onConfirm();
      onOpenChange(false);
    } finally {
      setIsLeaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            <DialogTitle>Leave Community</DialogTitle>
          </div>
          <DialogDescription>
            {isOwner ? (
              <>
                As the owner of <strong>{communityName}</strong>, you cannot leave the community. 
                You can either delete the community or transfer ownership to another member.
              </>
            ) : (
              <>
                Are you sure you want to leave <strong>{communityName}</strong>? 
                You will lose access to all community content and discussions.
              </>
            )}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLeaving}
          >
            Cancel
          </Button>
          {!isOwner && (
            <Button
              variant="destructive"
              onClick={handleConfirm}
              disabled={isLeaving}
            >
              {isLeaving ? 'Leaving...' : 'Leave Community'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
