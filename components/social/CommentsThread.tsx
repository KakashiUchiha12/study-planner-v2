'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Send } from 'lucide-react';

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    image?: string;
  };
}

interface CommentsThreadProps {
  postId: string;
  onCommentAdded?: () => void;
}

export function CommentsThread({ postId, onCommentAdded }: CommentsThreadProps) {
  const { data: session } = useSession();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchComments();
  }, [postId]);

  const fetchComments = async () => {
    try {
      const response = await fetch(`/api/social/comments?postId=${postId}`);
      if (response.ok) {
        const data = await response.json();
        setComments(data.comments || []);
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !session?.user?.id) return;

    setLoading(true);
    try {
      const response = await fetch('/api/social/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          postId,
          content: newComment.trim(),
        }),
      });

      if (response.ok) {
        setNewComment('');
        fetchComments(); // Refresh comments
        onCommentAdded?.(); // Notify parent component
      }
    } catch (error) {
      console.error('Error posting comment:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-4 border-t pt-4">
      <div className="space-y-3">
        {comments.map((comment) => (
          <div key={comment.id} className="flex items-start space-x-3">
            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
              {comment.user.image ? (
                <img
                  src={comment.user.image}
                  alt={comment.user.name}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <span className="text-xs font-medium">
                  {comment.user.name.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <div className="flex-1">
              <div className="bg-muted rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-sm">{comment.user.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(comment.createdAt).toLocaleTimeString()}
                  </span>
                </div>
                <p className="text-sm">{comment.content}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {session?.user?.id && (
        <form onSubmit={handleSubmitComment} className="mt-4">
          <div className="flex items-end space-x-2">
            <Textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Write a comment..."
              className="flex-1 min-h-[60px]"
              rows={2}
            />
            <Button type="submit" disabled={!newComment.trim() || loading}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
