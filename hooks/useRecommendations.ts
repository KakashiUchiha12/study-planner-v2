import { useState, useEffect, useCallback } from 'react';
import { Post, UserInterests } from '@/types/posts';

export type RecommendationType = 'personalized' | 'trending' | 'hashtag' | 'program';

export interface RecommendationParams {
  type: RecommendationType;
  userId?: string;
  limit?: number;
  category?: string;
  hashtags?: string[];
  program?: string;
}

export interface RecommendationResponse {
  success: boolean;
  data: Post[];
  metadata: {
    type: RecommendationType;
    limit: number;
    total: number;
    timestamp: string;
  };
}

export interface UseRecommendationsReturn {
  recommendations: Post[];
  loading: boolean;
  error: string | null;
  metadata: RecommendationResponse['metadata'] | null;
  refetch: () => Promise<void>;
  updateInterests: (action: 'like' | 'comment' | 'share' | 'bookmark' | 'view', postId: string, post: Post) => Promise<void>;
}

export function useRecommendations(params: RecommendationParams): UseRecommendationsReturn {
  const [recommendations, setRecommendations] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<RecommendationResponse['metadata'] | null>(null);

  const fetchRecommendations = useCallback(async () => {
    if (params.type === 'personalized' && !params.userId) {
      setError('userId is required for personalized recommendations');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const searchParams = new URLSearchParams({
        type: params.type,
        limit: (params.limit || 20).toString(),
      });

      if (params.userId) {
        searchParams.append('userId', params.userId);
      }

      if (params.category) {
        searchParams.append('category', params.category);
      }

      if (params.hashtags && params.hashtags.length > 0) {
        searchParams.append('hashtags', params.hashtags.join(','));
      }

      if (params.program) {
        searchParams.append('program', params.program);
      }

      const response = await fetch(`/api/recommendations?${searchParams.toString()}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: RecommendationResponse = await response.json();
      
      if (result.success) {
        setRecommendations(result.data);
        setMetadata(result.metadata);
      } else {
        throw new Error('Failed to fetch recommendations');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('Error fetching recommendations:', err);
    } finally {
      setLoading(false);
    }
  }, [params]);

  const updateInterests = useCallback(async (
    action: 'like' | 'comment' | 'share' | 'bookmark' | 'view',
    postId: string,
    post: Post
  ) => {
    if (!params.userId) {
      console.warn('Cannot update interests: userId not provided');
      return;
    }

    try {
      const response = await fetch('/api/recommendations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: params.userId,
          action,
          postId,
          post,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        // Optionally refetch recommendations to get updated results
        // await fetchRecommendations();
      } else {
        console.warn('Failed to update user interests');
      }
    } catch (err) {
      console.error('Error updating user interests:', err);
    }
  }, [params.userId]);

  // Fetch recommendations when params change
  useEffect(() => {
    fetchRecommendations();
  }, [fetchRecommendations]);

  return {
    recommendations,
    loading,
    error,
    metadata,
    refetch: fetchRecommendations,
    updateInterests,
  };
}

// Specialized hooks for common use cases
export function usePersonalizedRecommendations(userId: string, limit: number = 20) {
  return useRecommendations({
    type: 'personalized',
    userId,
    limit,
  });
}

export function useTrendingRecommendations(limit: number = 10) {
  return useRecommendations({
    type: 'trending',
    limit,
  });
}

export function useHashtagRecommendations(hashtags: string[], limit: number = 15) {
  return useRecommendations({
    type: 'hashtag',
    hashtags,
    limit,
  });
}

export function useProgramRecommendations(program: string, limit: number = 15) {
  return useRecommendations({
    type: 'program',
    program,
    limit,
  });
}
