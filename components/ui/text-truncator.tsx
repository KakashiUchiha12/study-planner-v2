'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface TextTruncatorProps {
  text: string;
  maxWords?: number;
  className?: string;
  showSeeMore?: boolean;
  seeMoreText?: string;
  seeLessText?: string;
  preserveFormatting?: boolean;
}

export function TextTruncator({
  text,
  maxWords = 60,
  className,
  showSeeMore = true,
  seeMoreText = 'See more',
  seeLessText = 'See less',
  preserveFormatting = false,
}: TextTruncatorProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!text || text.trim() === '') {
    return null;
  }

  // Split text into words
  const words = text.trim().split(/\s+/);
  const needsTruncation = words.length > maxWords;
  
  const displayText = isExpanded || !needsTruncation 
    ? text 
    : words.slice(0, maxWords).join(' ') + '...';

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div className={cn("text-sm", className)}>
      {preserveFormatting ? (
        <div 
          className="prose prose-sm max-w-none rich-text-editor"
          dangerouslySetInnerHTML={{ __html: displayText }}
        />
      ) : (
        <p className="whitespace-pre-line leading-relaxed">
          {displayText}
        </p>
      )}
      
      {needsTruncation && showSeeMore && (
        <Button
          variant="link"
          size="sm"
          onClick={toggleExpanded}
          className="p-0 h-auto text-primary hover:text-primary/80 font-medium mt-1 transition-colors"
        >
          {isExpanded ? seeLessText : seeMoreText}
        </Button>
      )}
    </div>
  );
}
