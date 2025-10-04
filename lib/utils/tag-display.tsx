'use client';

import { TagsDialog } from '@/components/ui/tags-dialog';

interface TagDisplayProps {
  tags: string[];
  maxVisible?: number;
  communityName?: string;
  className?: string;
}

export function TagDisplay({ tags, maxVisible = 2, communityName, className }: TagDisplayProps) {
  if (!tags || tags.length === 0) {
    return null;
  }

  const visibleTags = tags.slice(0, maxVisible);
  const remainingCount = tags.length - maxVisible;

  return (
    <div className={`flex flex-wrap items-center gap-1 ${className}`}>
      {visibleTags.map((tag, index) => (
        <span
          key={index}
          className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-800"
        >
          {tag}
        </span>
      ))}
      {remainingCount > 0 && (
        <TagsDialog
          tags={tags}
          triggerText={`+${remainingCount} more`}
          communityName={communityName}
        />
      )}
    </div>
  );
}
