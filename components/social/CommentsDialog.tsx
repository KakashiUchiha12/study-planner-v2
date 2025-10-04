'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { X, Send } from 'lucide-react';

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

interface CommentsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  postId: string;
  commentsCount: number;
  onCommentAdded?: () => void;
}

export function CommentsDialog({ isOpen, onClose, postId, commentsCount, onCommentAdded }: CommentsDialogProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchComments();
    }
  }, [isOpen, postId]);

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
        fetchComments();
        onCommentAdded?.();
      }
    } catch (error) {
      console.error('Error posting comment:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUserClick = (userId: string) => {
    router.push(`/profile/${userId}`);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return `${Math.floor(diffInHours * 60)}m ago`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else {
      return `${Math.floor(diffInHours / 24)}d ago`;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Comments ({commentsCount})</span>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Comments List */}
          <div className="flex-1 overflow-y-auto space-y-4 pr-2">
            {comments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No comments yet. Be the first to comment!
              </div>
            ) : (
              comments.map((comment) => (
                <div key={comment.id} className="flex items-start gap-3">
                  <Avatar 
                    className="h-8 w-8 cursor-pointer hover:ring-2 hover:ring-primary transition-all"
                    onClick={() => handleUserClick(comment.user.id)}
                  >
                    <AvatarImage src={comment.user.image} alt={comment.user.name} />
                    <AvatarFallback>
                      {comment.user.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="bg-muted rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <span 
                          className="font-medium text-sm cursor-pointer hover:text-primary transition-colors"
                          onClick={() => handleUserClick(comment.user.id)}
                        >
                          {comment.user.name}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(comment.createdAt)}
                        </span>
                      </div>
                      <p className="text-sm">{comment.content}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Comment Form */}
          {session?.user?.id && (
            <form onSubmit={handleSubmitComment} className="mt-4 border-t pt-4">
              <div className="flex items-end gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={(session.user as any)?.image} alt={(session.user as any)?.name} />
                  <AvatarFallback>
                    {(session.user as any)?.name?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <Textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Write a comment..."
                  className="flex-1 min-h-[60px]"
                  rows={2}
                />
                <Button type="submit" disabled={!newComment.trim() || loading} size="sm">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
