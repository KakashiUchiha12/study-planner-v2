'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Send } from 'lucide-react';

interface PostComposerSimpleProps {
  onPostCreated?: (post: any) => void;
}

export function PostComposerSimple({ onPostCreated }: PostComposerSimpleProps = {}) {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || loading) return;

    setLoading(true);
    try {
      const response = await fetch('/api/social/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: text.trim(),
          type: 'text',
          visibility: 'public',
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setText('');
        onPostCreated?.(data.post);
      }
    } catch (error) {
      console.error('Error creating post:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-dashed">
      <CardContent className="p-4">
        <form onSubmit={handleSubmit} className="space-y-3">
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="What's on your mind?"
            className="min-h-[100px] resize-none"
            rows={3}
          />
          <div className="flex justify-end">
            <Button 
              type="submit" 
              disabled={!text.trim() || loading}
              size="sm"
            >
              <Send className="h-4 w-4 mr-2" />
              {loading ? 'Posting...' : 'Post'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

