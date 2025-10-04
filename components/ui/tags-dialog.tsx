'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tag } from 'lucide-react';

interface TagsDialogProps {
  tags: string[];
  triggerText: string;
  communityName?: string;
  className?: string;
}

export function TagsDialog({ tags, triggerText, communityName, className }: TagsDialogProps) {
  const [open, setOpen] = useState(false);

  if (!tags || tags.length === 0) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={`h-auto p-1 text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-50 ${className}`}
        >
          {triggerText}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5" />
            {communityName ? `Tags for ${communityName}` : 'All Tags'}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="text-sm text-gray-600">
            {tags.length} tag{tags.length !== 1 ? 's' : ''} total
          </div>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag, index) => (
              <Badge
                key={index}
                variant="secondary"
                className="px-3 py-1 text-sm font-medium"
              >
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
