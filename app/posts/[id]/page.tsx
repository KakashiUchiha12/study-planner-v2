"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, User, MessageSquare, Heart, Eye, Share2, Bookmark, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MarkdownRenderer } from '@/components/social/MarkdownRenderer';
import { PostMediaGrid } from '@/components/social/PostMediaGrid';
import { ReactionSheet } from '@/components/social/ReactionSheet';
import { PostActions } from '@/components/social/PostActions';
import { CommentsThread } from '@/components/social/CommentsThread';
import { useSession } from 'next-auth/react';
import { cn } from '@/lib/utils';

interface Post {
  id: string;
  content: string | null;
  type: string;
  tags: string;
  visibility: string;
  createdAt: string;
  updatedAt: string;
  communityId?: string | null;
  user: {
    id: string;
    name: string;
    image: string | null;
  };
  community?: {
    id: string;
    name: string;
    slug: string;
    avatar?: string;
    category?: string;
    visibility?: string;
  };
  media: Array<{
    id: string;
    type: string;
    url: string;
    thumbnailUrl?: string;
    name?: string;
    size?: number;
  }>;
  _count: {
    comments: number;
    reactions: number;
    views: number;
  };
}

const REACTIONS: { key: string; emoji: string }[] = [
  { key: "like", emoji: "👍" },
  { key: "heart", emoji: "❤️" },
  { key: "wow", emoji: "😮" },
  { key: "laugh", emoji: "😂" },
  { key: "sad", emoji: "😢" },
  { key: "fire", emoji: "🔥" },
];

export default function PostDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const postId = params.id as string;
  
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentReaction, setCurrentReaction] = useState<string | null>(null);
  const [showReactionDialog, setShowReactionDialog] = useState(false);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        setLoading(true);
        console.log('🔍 Fetching post with ID:', postId);
        
        const response = await fetch(`/api/social/posts/${postId}`);
        console.log('🔍 Response status:', response.status);
        
        if (response.ok) {
          const data = await response.json();
          console.log('🔍 Post data:', data);
          setPost(data.post);
        } else {
          const errorData = await response.json();
          console.error('Failed to fetch post:', errorData);
          setError('Post not found');
        }
      } catch (error) {
        console.error('Error fetching post:', error);
        setError('Failed to load post');
      } finally {
        setLoading(false);
      }
    };

    if (postId) {
      fetchPost();
    }
  }, [postId]);

  const handleReaction = async (reactionType: string) => {
    if (!session?.user || !post) return;

    try {
      const response = await fetch(`/api/social/posts/${post.id}/reactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ type: reactionType }),
      });

      if (response.ok) {
        setCurrentReaction(reactionType);
        // Refresh post data to get updated reaction count
        const updatedPost = await fetch(`/api/social/posts/${postId}`).then(r => r.json());
        setPost(updatedPost.post);
      }
    } catch (error) {
      console.error('Error adding reaction:', error);
    }
  };

  const handleShare = async () => {
    if (!post) return;

    try {
      if (navigator.share) {
        await navigator.share({
          title: `Post by ${post.user.name}`,
          text: post.content || '',
          url: window.location.href,
        });
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(window.location.href);
        // You could show a toast notification here
        console.log('Link copied to clipboard');
      }
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="space-y-6">
          <div className="h-8 bg-muted animate-pulse rounded w-32" />
          <div className="h-64 bg-muted animate-pulse rounded-lg" />
          <div className="h-32 bg-muted animate-pulse rounded-lg" />
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Post Not Found</h1>
          <p className="text-muted-foreground mb-6">
            {error || "The post you're looking for doesn't exist or you don't have permission to view it."}
          </p>
          <Button onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  const totalReactions = post._count.reactions;
  const commentCount = post._count.comments;
  const viewCount = post._count.views;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-semibold">Post</h1>
            <p className="text-sm text-muted-foreground">
              Posted by {post.user.name} • {new Date(post.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Post Content */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <button 
                onClick={() => router.push(`/profile/${post.user.id}`)}
                className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-colors"
              >
                {post.user.image ? (
                  <img 
                    src={post.user.image} 
                    alt={post.user.name} 
                    className="h-12 w-12 rounded-full object-cover" 
                  />
                ) : (
                  <User className="h-6 w-6 text-primary" />
                )}
              </button>
              <div className="flex-1">
                <button 
                  onClick={() => router.push(`/profile/${post.user.id}`)}
                  className="text-left hover:underline"
                >
                  <h3 className="font-semibold">{post.user.name}</h3>
                  {post.user.username && (
                    <p className="text-sm text-muted-foreground hidden md:block">@{post.user.username}</p>
                  )}
                </button>
                <p className="text-sm text-muted-foreground">
                  {new Date(post.createdAt).toLocaleDateString()} at {new Date(post.createdAt).toLocaleTimeString()}
                  {post.community && (
                    <span className="ml-2">
                      · <a 
                        href={`/communities/${post.community.slug}`}
                        className="hover:underline text-blue-600 hover:text-blue-800"
                      >
                        {post.community.name}
                      </a>
                    </span>
                  )}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{post.type}</Badge>
                <Button variant="ghost" size="sm">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {/* Post Content */}
            {post.content && (
              <div className="prose prose-sm max-w-none">
                <MarkdownRenderer content={post.content} />
              </div>
            )}

            {/* Post Media */}
            {post.media && post.media.length > 0 && (
              <PostMediaGrid media={post.media.map((media: any) => ({
                id: media.id,
                kind: media.kind?.toLowerCase() as "image" | "file" | "video",
                url: media.url,
                mimeType: media.mimeType,
                name: media.name,
                size: media.size,
                thumbnailUrl: media.thumbnailUrl?.replace(/\\/g, '/'),
                thumbnail: media.thumbnailUrl?.replace(/\\/g, '/'), // Alternative thumbnail property
              }))} />
            )}

            {/* Tags */}
            {post.tags && post.tags !== '[]' && (
              <div className="flex flex-wrap gap-2">
                {JSON.parse(post.tags).map((tag: string, index: number) => (
                  <Badge key={index} variant="outline">
                    #{tag}
                  </Badge>
                ))}
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-2 flex-wrap pt-4 border-t">
              <ReactionSheet 
                onReaction={handleReaction}
                currentReaction={currentReaction}
                postId={post.id}
              />
              <PostActions postId={post.id} />
              <Button variant="ghost" size="sm" onClick={handleShare}>
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
              <Button variant="ghost" size="sm">
                <Bookmark className="h-4 w-4 mr-2" />
                Save
              </Button>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span 
                className={totalReactions > 0 ? "cursor-pointer hover:underline" : ""}
                onClick={totalReactions > 0 ? () => setShowReactionDialog(true) : undefined}
              >
                {totalReactions} reactions
              </span>
              <span>—</span>
              <span>{commentCount} comments</span>
              <span>—</span>
              <span className="flex items-center gap-1">
                <Eye className="h-3 w-3" />
                {viewCount} views
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Comments */}
        <Card>
          <CardHeader>
            <h3 className="font-semibold flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Comments ({commentCount})
            </h3>
          </CardHeader>
          <CardContent>
            <CommentsThread postId={post.id} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
