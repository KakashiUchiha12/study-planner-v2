'use client';

import Link from 'next/link';
import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { PostComposerSimple as PostComposer } from '@/components/social/PostComposerSimple';
import { FeedFilters } from '@/components/social/FeedFilters';
import { PostCardStub } from '@/components/social/PostCard.stub';
import { useSocialFeed } from '@/hooks/useSocialFeed';
import { SearchBar } from '@/components/search/SearchBar';
import { Loader2 } from 'lucide-react';

export default function SocialPage() {
  const [activeFilter, setActiveFilter] = useState('all');
  const [selectedCommunity, setSelectedCommunity] = useState<string | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const { posts, hasMore, loadMore, createPost } = useSocialFeed();
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  // Filter posts based on active filter and selected community
  const filteredPosts = posts.filter(post => {
    // Community filter
    if (selectedCommunity) {
      if (post.communityId !== selectedCommunity) {
        return false;
      }
    }

    // Content type filter
    switch (activeFilter) {
      case 'text':
        return post.type === 'TEXT';
      case 'images':
        return post.type === 'IMAGE';
      case 'files':
        return post.type === 'FILE';
      case 'all':
      default:
        return true;
    }
  });

  const handleFilterChange = (filter: string) => {
    setActiveFilter(filter);
  };

  const handleCommunityChange = (communityId: string | null) => {
    setSelectedCommunity(communityId);
  };

  // Handle loading more posts
  const handleLoadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore) return;
    
    setIsLoadingMore(true);
    try {
      await loadMore();
    } catch (error) {
      console.error('Error loading more posts:', error);
    } finally {
      setIsLoadingMore(false);
    }
  }, [isLoadingMore, hasMore, loadMore]);

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

  return (
    <div className="w-full md:container md:mx-auto md:max-w-3xl py-6 space-y-6">
      {/* Header with Title and Search */}
      <div className="px-4 md:px-0 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h1 className="text-2xl font-semibold tracking-tight">Social</h1>
          <div className="w-full sm:w-auto">
            <SearchBar 
              placeholder="Search posts, users, and more..."
              className="w-full sm:w-80"
            />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="px-4 md:px-0">
          <PostComposer />
        </div>
        
        <div className="mx-4 md:mx-0 rounded-lg border p-4">
          <FeedFilters 
            activeFilter={activeFilter}
            onFilterChange={handleFilterChange}
            selectedCommunity={selectedCommunity || undefined}
            onCommunityChange={handleCommunityChange}
          />
        </div>

        <div className="space-y-4">
          {filteredPosts.length === 0 ? (
            <div className="text-sm text-muted-foreground text-center py-8 px-4">
              {selectedCommunity ? (
                <>
                  No posts in this community yet. Be the first to share something!
                </>
              ) : activeFilter !== 'all' ? (
                <>
                  No {activeFilter} posts found. Try a different filter or share some content!
                </>
              ) : (
                <>
                  No posts yet. Be the first to share an update!
                </>
              )}
            </div>
          ) : (
            <>
              {filteredPosts.map((p) => <PostCardStub key={p.id} post={p} />)}
              
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
              {!hasMore && filteredPosts.length > 0 && (
                <div className="text-center py-8 text-sm text-muted-foreground">
                  You've reached the end of the feed
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}