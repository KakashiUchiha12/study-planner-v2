'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface RichTextDescriptionProps {
  content: string;
  maxWords?: number;
  className?: string;
}

export function RichTextDescription({ 
  content, 
  maxWords = 50, 
  className = '' 
}: RichTextDescriptionProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Function to strip HTML tags and get plain text for word counting
  const getPlainText = (html: string) => {
    // Create a temporary div to parse HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    return tempDiv.textContent || tempDiv.innerText || '';
  };

  // Function to truncate HTML content while preserving structure
  const truncateHtmlContent = (html: string, maxWords: number) => {
    const plainText = getPlainText(html);
    const words = plainText.split(/\s+/).filter(word => word.trim() !== '');
    
    if (words.length <= maxWords) {
      return { content: html, needsTruncation: false };
    }

    // Find the position where we need to cut
    let wordCount = 0;
    let cutPosition = 0;
    
    // Walk through the HTML and count words
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    
    const walker = document.createTreeWalker(
      tempDiv,
      NodeFilter.SHOW_TEXT,
      null,
      false
    );
    
    let node;
    while (node = walker.nextNode()) {
      const text = node.textContent || '';
      const nodeWords = text.split(/\s+/).filter(word => word.trim() !== '');
      
      if (wordCount + nodeWords.length > maxWords) {
        // We need to cut in this text node
        const remainingWords = maxWords - wordCount;
        const wordsToKeep = nodeWords.slice(0, remainingWords);
        node.textContent = wordsToKeep.join(' ') + '...';
        break;
      }
      
      wordCount += nodeWords.length;
    }
    
    return { 
      content: tempDiv.innerHTML, 
      needsTruncation: true 
    };
  };

  const { content: displayContent, needsTruncation } = truncateHtmlContent(content, maxWords);
  const shouldShowButton = needsTruncation;

  return (
    <div className={className}>
      <div 
        className="prose prose-sm max-w-none rich-text-content"
        dangerouslySetInnerHTML={{ 
          __html: isExpanded ? content : displayContent 
        }}
        style={{
          lineHeight: '1.5',
          ...(needsTruncation && !isExpanded && {
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          })
        }}
      />
      
      {shouldShowButton && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="mt-2 h-auto p-0 text-primary hover:text-primary/80 font-medium text-sm transition-colors"
        >
          {isExpanded ? (
            <>
              <ChevronUp className="h-3 w-3 mr-1" />
              See less
            </>
          ) : (
            <>
              <ChevronDown className="h-3 w-3 mr-1" />
              See more
            </>
          )}
        </Button>
      )}
    </div>
  );
}
