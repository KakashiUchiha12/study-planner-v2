'use client';

import { useState, useRef, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { 
  Heart, 
  MessageCircle, 
  Share2, 
  Bookmark, 
  MoreHorizontal,
  Users,
  Eye,
  ThumbsUp,
  Smile,
  Frown,
  Angry,
  Laugh
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ReactionSheet } from '@/components/social/ReactionSheet';
import { CommentsThread } from '@/components/social/CommentsThread';
import { EnhancedCommentsThread } from '@/components/social/EnhancedCommentsThread';
import { PostActions } from '@/components/social/PostActions';
import { PostMediaGrid } from '@/components/social/PostMediaGrid';
import { MediaPreviewDialog } from '@/components/social/MediaPreviewDialog';
import { MarkdownRenderer } from '@/components/social/MarkdownRenderer';
import { ReactionsDialog } from '@/components/social/ReactionsDialog';
import { CommentsDialog } from '@/components/social/CommentsDialog';

interface Post {
  id: string;
  content: string;
  type: string;
  visibility: string;
  createdAt: number;
  updatedAt: number;
  user: {
    id: string;
    name: string;
    image?: string;
  };
  community?: {
    id: string;
    name: string;
    slug: string;
  };
  media?: Array<{
    id: string;
    kind: 'image' | 'file' | 'video';
    url: string;
    mimeType: string;
    name: string;
    size: number;
    thumbnailUrl?: string;
    thumbnail?: string;
  }>;
  reactions?: {
    [key: string]: Array<{
      id: string;
      name: string;
      image?: string;
    }>;
  };
  _count?: {
    comments: number;
    reactions: number;
  };
  tags?: string[];
}

interface PostCardStubProps {
  post: Post;
  showActions?: boolean;
}

const REACTIONS = [
  { key: 'like', emoji: '👍', label: 'Like' },
  { key: 'heart', emoji: '❤️', label: 'Love' },
  { key: 'laugh', emoji: '😂', label: 'Laugh' },
  { key: 'wow', emoji: '😮', label: 'Wow' },
  { key: 'sad', emoji: '😢', label: 'Sad' },
  { key: 'fire', emoji: '🔥', label: 'Fire' },
];

export function PostCardStub({ post, showActions = true }: PostCardStubProps) {
  const { data: session } = useSession();
  const [showReactionSheet, setShowReactionSheet] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [postReactions, setPostReactions] = useState(post.reactions || {});
  const [currentReactionEmoji, setCurrentReactionEmoji] = useState<string | null>(null);
  const [showReactionDialog, setShowReactionDialog] = useState(false);
  const [viewCount, setViewCount] = useState(0);
  const [selectedMedia, setSelectedMedia] = useState<any>(null);
  const [showMediaPreview, setShowMediaPreview] = useState(false);
  const [commentsCount, setCommentsCount] = useState(post._count?.comments || 0);
  const [reactionsCount, setReactionsCount] = useState(post._count?.reactions || 0);
  const [showReactionsDialog, setShowReactionsDialog] = useState(false);
  const [showCommentsDialog, setShowCommentsDialog] = useState(false);
  const postRef = useRef<HTMLDivElement>(null);

  const isOwnPost = (session?.user as any)?.id === post.user.id;

  // Track view count
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Increment view count
            setViewCount(prev => prev + 1);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.5 }
    );

    if (postRef.current) {
      observer.observe(postRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // Fetch real-time post data
  useEffect(() => {
    const fetchPostData = async () => {
      try {
        const response = await fetch(`/api/social/posts/${post.id}/stats`);
        if (response.ok) {
          const data = await response.json();
          setCommentsCount(data.commentsCount || 0);
          setReactionsCount(data.reactionsCount || 0);
          setPostReactions(data.reactions || {});
        }
      } catch (error) {
        console.error('Error fetching post stats:', error);
      }
    };

    // Fetch initial data
    fetchPostData();

    // Set up polling for real-time updates (every 30 seconds)
    const interval = setInterval(fetchPostData, 30000);

    return () => clearInterval(interval);
  }, [post.id]);

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else if (diffInHours < 168) {
      return `${Math.floor(diffInHours / 24)}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const handleReaction = async (emoji: string) => {
    try {
      const reactionKey = REACTIONS.find(r => r.emoji === emoji)?.key;
      if (!reactionKey) return;

      const response = await fetch('/api/social/reactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ postId: post.id, type: reactionKey }),
      });

      if (response.ok) {
        const data = await response.json();
        setPostReactions(data.reactions || {});
        setCurrentReactionEmoji(emoji);
        
        // Update real-time reaction count
        const totalReactions = Object.values(data.reactions || {}).reduce((total: number, users: any) => total + users.length, 0);
        setReactionsCount(totalReactions);
      }
    } catch (error) {
      console.error('Error adding reaction:', error);
    }
  };

  const handleEditPost = () => {
    setShowEditDialog(true);
  };

  const handleDeletePost = () => {
    setShowDeleteDialog(true);
  };

  const handleMediaClick = (media: any) => {
    setSelectedMedia(media);
    setShowMediaPreview(true);
  };

  // Post Content Truncator Component - Using MarkdownRenderer
  function PostContentTruncator({ content, maxWords = 50 }: { content: string; maxWords?: number }) {
    const [isExpanded, setIsExpanded] = useState(false);

    // Get plain text to count words (same approach as CommunityDescription)
    const getPlainText = (text: string) => {
      // For markdown content, we need to strip markdown syntax to count words
      const plainText = text.replace(/[#*_`\[\]()]/g, '').replace(/\n/g, ' ');
      return plainText;
    };

    const plainText = getPlainText(content);
    const words = plainText.split(' ').filter(word => word.trim() !== '');
    const needsTruncation = words.length > maxWords;
    
    // Simple approach: just show full content and use CSS to limit lines
    const displayText = content;

    return (
      <div>
        <div 
          className="prose prose-sm max-w-none rich-text-editor"
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
        >
          <MarkdownRenderer content={displayText} />
        </div>
        
        {needsTruncation && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="mt-2 h-auto p-0 text-primary hover:text-primary/80 font-medium text-sm transition-colors"
          >
            {isExpanded ? 'see less' : 'see more'}
          </Button>
        )}
      </div>
    );
  }

  return (
    <Card ref={postRef} className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
              {post.user.image ? (
                <img
                  src={post.user.image}
                  alt={post.user.name}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <span className="text-sm font-medium">
                  {post.user.name.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <div>
              <h3 className="font-semibold text-sm">{post.user.name}</h3>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>{formatDate(post.createdAt)}</span>
                {post.community ? (
                  <>
                    <span>•</span>
                    <div className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      <a href={`/communities/${post.community.slug}`} className="text-blue-600 hover:underline">
                        {post.community.name}
                      </a>
                    </div>
                  </>
                ) : (
                  <>
                    <span>•</span>
                    <div className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      <a href="https://freeMDCAT.com" className="text-blue-600 hover:underline">
                        freeMDCAT.com
                      </a>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
          
          {showActions && (
            <PostActions postId={post.id} />
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Post Content */}
        <div className="mb-4">
          <PostContentTruncator content={post.content} />
        </div>

        {/* Media */}
        {post.media && post.media.length > 0 && (
          <div className="mb-4">
            <PostMediaGrid
              media={post.media}
              onMediaClick={handleMediaClick}
            />
          </div>
        )}

        {/* Tags */}
        {post.tags && Array.isArray(post.tags) && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4">
            {post.tags.slice(0, 3).map((tag, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                #{tag}
              </Badge>
            ))}
            {post.tags.length > 3 && (
              <Badge variant="secondary" className="text-xs">
                +{post.tags.length - 3} more
              </Badge>
            )}
          </div>
        )}

        {/* Post Stats */}
        <div className="flex items-center justify-between text-sm text-muted-foreground mb-3">
          <div className="flex items-center gap-4">
            {/* Reactions Display */}
            {postReactions && Object.keys(postReactions).length > 0 && (
              <div 
                className="flex items-center gap-2 cursor-pointer hover:bg-gray-100 rounded-lg p-1 transition-colors"
                onClick={() => setShowReactionsDialog(true)}
              >
                <div className="flex items-center gap-1">
                  {Object.entries(postReactions).slice(0, 3).map(([reactionType, users]) => {
                    const reaction = REACTIONS.find(r => r.key === reactionType);
                    return (
                      <div key={reactionType} className="flex items-center gap-1">
                        <span className="text-sm">{reaction?.emoji}</span>
                        <span className="text-xs">{users.length}</span>
                      </div>
                    );
                  })}
                  {Object.keys(postReactions).length > 3 && (
                    <span className="text-xs">+{Object.keys(postReactions).length - 3}</span>
                  )}
                </div>
                <span className="text-xs">
                  {Object.values(postReactions).reduce((total, users) => total + users.length, 0)} reactions
                </span>
              </div>
            )}
            
            {/* Comments Count */}
            {commentsCount > 0 && (
              <div className="flex items-center gap-1">
                <MessageCircle className="h-3 w-3" />
                <span>{commentsCount} comments</span>
              </div>
            )}
            
            {/* Views Count */}
            {viewCount > 0 && (
              <div className="flex items-center gap-1">
                <Eye className="h-3 w-3" />
                <span>{viewCount} views</span>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between border-t pt-3">
          <div className="flex items-center gap-4">
            {/* React Button */}
            <ReactionSheet
              onReaction={handleReaction}
              currentReaction={currentReactionEmoji}
            />
            
            {/* Comment Button */}
            <Button
              variant="ghost"
              size="sm"
              className="flex items-center gap-1 text-black hover:text-black/80"
              onClick={() => setShowComments(!showComments)}
            >
              <MessageCircle className="h-4 w-4" />
              <span className="text-sm">Comment</span>
            </Button>

            {/* Bookmark Button */}
            <Button
              variant="ghost"
              size="sm"
              className="flex items-center gap-1 text-black hover:text-black/80"
              onClick={async () => {
                try {
                  // Toggle bookmark functionality
                  const response = await fetch('/api/social/bookmarks', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ postId: post.id })
                  });
                  if (response.ok) {
                    // Handle success - you might want to add state for bookmarked status
                    console.log('Post bookmarked');
                  }
                } catch (error) {
                  console.error('Error bookmarking post:', error);
                }
              }}
            >
              <Bookmark className="h-4 w-4" />
              <span className="text-sm">Bookmark</span>
            </Button>
          </div>
        </div>

        {/* Comments */}
        {showComments && (
          <EnhancedCommentsThread 
            postId={post.id} 
            onCommentAdded={() => setCommentsCount(prev => prev + 1)}
            onCommentDeleted={() => setCommentsCount(prev => Math.max(0, prev - 1))}
          />
        )}
      </CardContent>
      
      {/* Reaction Dialog */}
      {showReactionDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Reactions</h3>
              <button
                onClick={() => setShowReactionDialog(false)}
                className="text-gray-400 hover:text-gray-600 text-xl font-bold"
              >
                ✕
              </button>
            </div>
            <div className="space-y-4">
              {REACTIONS.map((reaction) => {
                const users = postReactions[reaction.key] || []
                if (users.length === 0) return null
                
                return (
                  <div key={reaction.key} className="space-y-2">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{reaction.emoji}</span>
                      <span className="font-medium">{reaction.key}</span>
                      <span className="text-sm text-gray-500">({users.length})</span>
                    </div>
                    <div className="ml-8 space-y-2">
                      {users.map((user, index) => (
                        <div key={user.id || index} className="flex items-center gap-3">
                          <div
                            className="w-8 h-8 rounded-full border-2 border-white overflow-hidden flex-shrink-0"
                            title={user.name || 'Unknown User'}
                          >
                            {user.image ? (
                              <img
                                src={user.image}
                                alt={user.name || 'User'}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full bg-gray-200 flex items-center justify-center text-sm font-medium">
                                {(user.name || 'U').charAt(0).toUpperCase()}
                              </div>
                            )}
                          </div>
                          <span className="text-sm font-medium text-gray-900">
                            {user.name || 'Unknown User'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
            <Button 
              variant="outline" 
              className="w-full mt-4"
              onClick={() => setShowReactionDialog(false)}
            >
              Close
            </Button>
          </div>
        </div>
      )}

      {/* Media Preview Dialog */}
      {showMediaPreview && selectedMedia && (
        <MediaPreviewDialog
          media={selectedMedia}
          mediaList={post.media || []}
          isOpen={showMediaPreview}
          onClose={() => setShowMediaPreview(false)}
        />
      )}

      {/* Reactions Dialog */}
      <ReactionsDialog
        isOpen={showReactionsDialog}
        onClose={() => setShowReactionsDialog(false)}
        postId={post.id}
        reactions={postReactions}
      />

      {/* Comments Dialog */}
      <CommentsDialog
        isOpen={showCommentsDialog}
        onClose={() => setShowCommentsDialog(false)}
        postId={post.id}
        commentsCount={commentsCount}
        onCommentAdded={() => setCommentsCount(prev => prev + 1)}
      />
    </Card>
  );
}
