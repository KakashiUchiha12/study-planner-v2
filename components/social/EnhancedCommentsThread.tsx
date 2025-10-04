'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from '@/components/ui/dialog';
import { 
  Send, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Reply, 
  Heart, 
  ThumbsUp, 
  Smile,
  Flag,
  User
} from 'lucide-react';

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  updatedAt?: string;
  user: {
    id: string;
    name: string;
    image?: string;
  };
  parentId?: string;
  replies?: Comment[];
  reactions?: { [key: string]: Array<{ id: string; name: string; image?: string }> };
  _count?: {
    replies: number;
    reactions: number;
  };
}

interface EnhancedCommentsThreadProps {
  postId: string;
  onCommentAdded?: () => void;
  onCommentDeleted?: () => void;
}

const COMMENT_REACTIONS = [
  { key: 'like', emoji: '👍', label: 'Like' },
  { key: 'heart', emoji: '❤️', label: 'Love' },
  { key: 'laugh', emoji: '😂', label: 'Laugh' },
  { key: 'wow', emoji: '😮', label: 'Wow' },
];

export function EnhancedCommentsThread({ 
  postId, 
  onCommentAdded, 
  onCommentDeleted 
}: EnhancedCommentsThreadProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState<string | null>(null);
  const [showReportDialog, setShowReportDialog] = useState<string | null>(null);
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set());
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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
          parentId: replyingTo || undefined,
        }),
      });

      if (response.ok) {
        setNewComment('');
        setReplyingTo(null);
        fetchComments();
        onCommentAdded?.();
      }
    } catch (error) {
      console.error('Error posting comment:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditComment = async (commentId: string) => {
    if (!editContent.trim()) return;

    try {
      const response = await fetch(`/api/social/comments/${commentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: editContent.trim(),
        }),
      });

      if (response.ok) {
        setEditingComment(null);
        setEditContent('');
        fetchComments();
      }
    } catch (error) {
      console.error('Error editing comment:', error);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      const response = await fetch(`/api/social/comments/${commentId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setShowDeleteDialog(null);
        fetchComments();
        onCommentDeleted?.();
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
    }
  };

  const handleCommentReaction = async (commentId: string, reactionType: string) => {
    try {
      const response = await fetch('/api/social/comment-reactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          commentId,
          type: reactionType,
        }),
      });

      if (response.ok) {
        fetchComments();
      }
    } catch (error) {
      console.error('Error adding comment reaction:', error);
    }
  };

  const handleReportComment = async (commentId: string, reason: string) => {
    try {
      const response = await fetch('/api/social/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          commentId,
          reason,
          type: 'comment',
        }),
      });

      if (response.ok) {
        setShowReportDialog(null);
        // Show success message
      }
    } catch (error) {
      console.error('Error reporting comment:', error);
    }
  };

  const toggleReplies = (commentId: string) => {
    const newExpanded = new Set(expandedReplies);
    if (newExpanded.has(commentId)) {
      newExpanded.delete(commentId);
    } else {
      newExpanded.add(commentId);
    }
    setExpandedReplies(newExpanded);
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

  const renderComment = (comment: Comment, isReply = false) => {
    const isOwnComment = (session?.user as any)?.id === comment.user.id;
    const isEditing = editingComment === comment.id;
    const hasReplies = comment.replies && comment.replies.length > 0;
    const isExpanded = expandedReplies.has(comment.id);

    return (
      <div key={comment.id} className={`${isReply ? 'ml-12 mt-3' : 'mt-4'}`}>
        <div className="flex items-start gap-3">
          <Avatar 
            className="h-8 w-8 cursor-pointer hover:ring-2 hover:ring-primary transition-all"
            onClick={() => router.push(`/profile/${comment.user.id}`)}
          >
            <AvatarImage src={comment.user.image} alt={comment.user.name} />
            <AvatarFallback>
              {comment.user.name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <div className="bg-muted rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <span 
                  className="font-medium text-sm cursor-pointer hover:text-primary transition-colors"
                  onClick={() => router.push(`/profile/${comment.user.id}`)}
                >
                  {comment.user.name}
                </span>
                <span className="text-xs text-muted-foreground">
                  {formatDate(comment.createdAt)}
                  {comment.updatedAt && comment.updatedAt !== comment.createdAt && (
                    <span className="ml-1">(edited)</span>
                  )}
                </span>
              </div>
              
              {isEditing ? (
                <div className="space-y-2">
                  <Textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="min-h-[60px]"
                    rows={2}
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      onClick={() => handleEditComment(comment.id)}
                      disabled={!editContent.trim()}
                    >
                      Save
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => {
                        setEditingComment(null);
                        setEditContent('');
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="text-sm whitespace-pre-wrap">{comment.content}</p>
                  
                  {/* Comment Actions */}
                  <div className="flex items-center gap-4 mt-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs"
                      onClick={() => handleCommentReaction(comment.id, 'like')}
                    >
                      👍 Like
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs"
                      onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                    >
                      <Reply className="h-3 w-3 mr-1" />
                      Reply
                    </Button>
                    
                    {hasReplies && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-xs"
                        onClick={() => toggleReplies(comment.id)}
                      >
                        {isExpanded ? 'Hide' : 'Show'} {comment._count?.replies || comment.replies?.length} replies
                      </Button>
                    )}
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                          <MoreHorizontal className="h-3 w-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {isOwnComment && (
                          <>
                            <DropdownMenuItem onClick={() => {
                              setEditingComment(comment.id);
                              setEditContent(comment.content);
                            }}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => setShowDeleteDialog(comment.id)}
                              className="text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </>
                        )}
                        {!isOwnComment && (
                          <DropdownMenuItem onClick={() => setShowReportDialog(comment.id)}>
                            <Flag className="h-4 w-4 mr-2" />
                            Report
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
        
        {/* Replies */}
        {hasReplies && isExpanded && (
          <div className="mt-2">
            {comment.replies?.map((reply) => renderComment(reply, true))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="mt-4 border-t pt-4">
      <div className="space-y-3">
        {comments.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <MessageCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No comments yet. Be the first to comment!</p>
          </div>
        ) : (
          comments.map((comment) => renderComment(comment))
        )}
      </div>

      {/* Comment Form */}
      {session?.user?.id && (
        <form onSubmit={handleSubmitComment} className="mt-6">
          <div className="flex items-start gap-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src={(session.user as any)?.image} alt={(session.user as any)?.name} />
              <AvatarFallback>
                {(session.user as any)?.name?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-2">
              {replyingTo && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Reply className="h-3 w-3" />
                  <span>Replying to {comments.find(c => c.id === replyingTo)?.user.name}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0"
                    onClick={() => setReplyingTo(null)}
                  >
                    ×
                  </Button>
                </div>
              )}
              <Textarea
                ref={textareaRef}
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder={replyingTo ? "Write a reply..." : "Write a comment..."}
                className="min-h-[60px] resize-none"
                rows={2}
              />
              <div className="flex justify-end">
                <Button 
                  type="submit" 
                  disabled={!newComment.trim() || loading}
                  size="sm"
                >
                  <Send className="h-4 w-4 mr-2" />
                  {replyingTo ? 'Reply' : 'Comment'}
                </Button>
              </div>
            </div>
          </div>
        </form>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!showDeleteDialog} onOpenChange={() => setShowDeleteDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Comment</DialogTitle>
          </DialogHeader>
          <p>Are you sure you want to delete this comment? This action cannot be undone.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(null)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => showDeleteDialog && handleDeleteComment(showDeleteDialog)}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Report Dialog */}
      <Dialog open={!!showReportDialog} onOpenChange={() => setShowReportDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Report Comment</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <p>Why are you reporting this comment?</p>
            <div className="space-y-2">
              {['Spam', 'Harassment', 'Inappropriate content', 'Hate speech', 'Other'].map((reason) => (
                <Button
                  key={reason}
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => showReportDialog && handleReportComment(showReportDialog, reason)}
                >
                  {reason}
                </Button>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReportDialog(null)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
