'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { PostComposer } from '@/components/social/PostComposer';
import { PostCardStub } from '@/components/social/PostCard.stub';
import { Plus, MessageSquare, Loader2 } from 'lucide-react';

interface Post {
  id: string;
  userId: string;
  content?: string;
  type: "TEXT" | "IMAGE" | "FILE" | "MIXED";
  createdAt: number;
  tags: string[];
  communityId?: string | null;
  media: any[];
  reactions: { [key: string]: any[] };
  user?: {
    id: string;
    name: string;
    email: string;
    image?: string;
  };
  community?: {
    id: string;
    name: string;
    slug: string;
    avatar?: string;
    category: string;
    visibility: string;
  } | null;
  _count?: {
    comments: number;
    reactions: number;
  };
}

interface CommunityPostsProps {
  communityId: string;
}

export function CommunityPosts({ communityId }: CommunityPostsProps) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [showComposer, setShowComposer] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [cursor, setCursor] = useState<string | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  const fetchPosts = useCallback(async (isLoadMore = false) => {
    try {
      if (isLoadMore) {
        setIsLoadingMore(true);
      } else {
        setLoading(true);
      }

      const url = isLoadMore && cursor 
        ? `/api/communities/${communityId}/posts?cursor=${encodeURIComponent(cursor)}`
        : `/api/communities/${communityId}/posts`;

      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        const newPosts = data.posts || [];
        
        if (isLoadMore) {
          setPosts(prev => [...prev, ...newPosts]);
        } else {
          setPosts(newPosts);
        }
        
        setHasMore(newPosts.length >= 20);
        setCursor(newPosts.length > 0 ? newPosts[newPosts.length - 1].createdAt.toString() : null);
      } else {
        console.error('Failed to fetch community posts');
      }
    } catch (error) {
      console.error('Error fetching community posts:', error);
    } finally {
      setLoading(false);
      setIsLoadingMore(false);
    }
  }, [communityId, cursor]);

  useEffect(() => {
    fetchPosts();
  }, [communityId]);

  const handleLoadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore) return;
    await fetchPosts(true);
  }, [isLoadingMore, hasMore, fetchPosts]);

  // Set up intersection observer for infinite scroll
  useEffect(() => {
    if (!loadMoreRef.current) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        const target = entries[0];
        if (target.isIntersecting && hasMore && !isLoadingMore) {
          handleLoadMore();
        }
      },
      {
        threshold: 0.1,
        rootMargin: '100px',
      }
    );

    observerRef.current.observe(loadMoreRef.current);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [hasMore, isLoadingMore, handleLoadMore]);

  const handlePostCreated = (newPost: Post) => {
    setPosts(prev => [newPost, ...prev]);
    setShowComposer(false);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg border p-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 bg-muted animate-pulse rounded-full" />
                <div className="space-y-2">
                  <div className="h-4 w-32 bg-muted animate-pulse rounded" />
                  <div className="h-3 w-24 bg-muted animate-pulse rounded" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-4 w-full bg-muted animate-pulse rounded" />
                <div className="h-4 w-3/4 bg-muted animate-pulse rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Post Composer */}
      {showComposer ? (
        <div className="bg-white rounded-lg border p-6">
          <PostComposer 
            onPostCreated={handlePostCreated}
            defaultCommunityId={communityId}
          />
        </div>
      ) : (
        <div className="bg-white rounded-lg border p-6">
          <Button 
            onClick={() => setShowComposer(true)}
            className="w-full"
            variant="outline"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create a post
          </Button>
        </div>
      )}

      {/* Posts */}
      {posts.length === 0 ? (
        <div className="bg-white rounded-lg border p-8 text-center">
          <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No posts yet</h3>
          <p className="text-muted-foreground mb-4">
            Be the first to share something with this community!
          </p>
          <Button onClick={() => setShowComposer(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create First Post
          </Button>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {posts.map((post) => (
              <div key={post.id} className="bg-white rounded-lg border">
                <PostCardStub post={post} />
              </div>
            ))}
          </div>
          
          {/* Infinite scroll trigger */}
          {hasMore && (
            <div ref={loadMoreRef} className="flex justify-center py-8">
              {isLoadingMore ? (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Loading more posts...</span>
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">
                  Scroll down to load more posts
                </div>
              )}
            </div>
          )}
          
          {/* End of feed indicator */}
          {!hasMore && posts.length > 0 && (
            <div className="text-center py-8 text-sm text-muted-foreground">
              You've reached the end of the posts
            </div>
          )}
        </>
      )}
    </div>
  );
}