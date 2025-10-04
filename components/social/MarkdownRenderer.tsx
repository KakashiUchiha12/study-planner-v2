'use client';

import { cn } from '@/lib/utils';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
  if (!content) return null;

  // Simple markdown-like rendering
  const renderContent = (text: string) => {
    // Convert markdown-style formatting to HTML
    let html = text
      // Bold text **text** or __text__
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/__(.*?)__/g, '<strong>$1</strong>')
      // Italic text *text* or _text_
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/_(.*?)_/g, '<em>$1</em>')
      // Code `code`
      .replace(/`(.*?)`/g, '<code class="bg-muted px-1 py-0.5 rounded text-sm">$1</code>')
      // Links [text](url)
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">$1</a>')
      // Line breaks
      .replace(/\n/g, '<br>');

    return html;
  };

  return (
    <div
      className={cn("prose prose-sm max-w-none", className)}
      dangerouslySetInnerHTML={{ __html: renderContent(content) }}
    />
  );
}
