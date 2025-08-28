'use client';

import { Post } from '@/types/posts';

export interface TrendingScore {
  postId: string;
  score: number;
  factors: {
    engagement: number;
    recency: number;
    velocity: number;
    diversity: number;
    quality: number;
  };
  rank: number;
  isTrending: boolean;
}

export interface TrendingMetrics {
  engagementRate: number;
  velocityScore: number;
  diversityScore: number;
  qualityScore: number;
  timeDecay: number;
}

export class TrendingAlgorithm {
  private static readonly ENGAGEMENT_WEIGHT = 0.35;
  private static readonly RECENCY_WEIGHT = 0.25;
  private static readonly VELOCITY_WEIGHT = 0.20;
  private static readonly DIVERSITY_WEIGHT = 0.15;
  private static readonly QUALITY_WEIGHT = 0.05;
  
  /**
   * Calculate trending score for a post
   */
  static calculateTrendingScore(post: Post, allPosts: Post[]): TrendingScore {
    const now = new Date();
    const timeDiff = now.getTime() - post.createdAt.getTime();
    const hoursSinceCreation = timeDiff / (1000 * 60 * 60);
    
    // Engagement score (likes, comments, shares, views)
    const engagementScore = this.calculateEngagementScore(post);
    
    // Recency score (newer posts get higher scores)
    const recencyScore = this.calculateRecencyScore(hoursSinceCreation);
    
    // Velocity score (how quickly engagement is growing)
    const velocityScore = this.calculateVelocityScore(post, allPosts);
    
    // Diversity score (different types of engagement)
    const diversityScore = this.calculateDiversityScore(post);
    
    // Quality score (based on content length, media, author reputation)
    const qualityScore = this.calculateQualityScore(post);
    
    // Calculate weighted final score
    const finalScore = (
      engagementScore * this.ENGAGEMENT_WEIGHT +
      recencyScore * this.RECENCY_WEIGHT +
      velocityScore * this.VELOCITY_WEIGHT +
      diversityScore * this.DIVERSITY_WEIGHT +
      qualityScore * this.QUALITY_WEIGHT
    );
    
    return {
      postId: post.id,
      score: finalScore,
      factors: {
        engagement: engagementScore,
        recency: recencyScore,
        velocity: velocityScore,
        diversity: diversityScore,
        quality: qualityScore
      },
      rank: 0, // Will be set when ranking
      isTrending: finalScore > 0.7
    };
  }
  
  /**
   * Calculate engagement score based on likes, comments, shares, and views
   */
  private static calculateEngagementScore(post: Post): number {
    const totalLikes = post.likes.length;
    const totalComments = post.comments.length;
    const totalShares = post.shares;
    const totalViews = post.views;
    
    // Weighted engagement calculation
    const weightedEngagement = (
      totalLikes * 1.0 +
      totalComments * 2.0 +
      totalShares * 3.0 +
      totalViews * 0.1
    );
    
    // Normalize to 0-1 scale using log scale
    return Math.min(1.0, Math.log(weightedEngagement + 1) / Math.log(100));
  }
  
  /**
   * Calculate recency score (newer posts get higher scores)
   */
  private static calculateRecencyScore(hoursSinceCreation: number): number {
    // Exponential decay: newer posts get exponentially higher scores
    const decayRate = 0.1;
    return Math.exp(-decayRate * hoursSinceCreation);
  }
  
  /**
   * Calculate velocity score (how quickly engagement is growing)
   */
  private static calculateVelocityScore(post: Post, allPosts: Post[]): number {
    // Find posts by the same author in the last 24 hours
    const recentAuthorPosts = allPosts.filter(p => 
      p.author.id === post.author.id &&
      p.createdAt > new Date(Date.now() - 24 * 60 * 60 * 1000)
    );
    
    if (recentAuthorPosts.length === 0) return 0.5;
    
    // Calculate average engagement for recent posts
    const avgEngagement = recentAuthorPosts.reduce((sum, p) => 
      sum + p.likes.length + p.comments.length + p.shares, 0
    ) / recentAuthorPosts.length;
    
    // Current post engagement
    const currentEngagement = post.likes.length + post.comments.length + post.shares;
    
    // Velocity is the ratio of current to average engagement
    const velocity = avgEngagement > 0 ? currentEngagement / avgEngagement : 1;
    
    // Normalize to 0-1 scale
    return Math.min(1.0, velocity / 5);
  }
  
  /**
   * Calculate diversity score (different types of engagement)
   */
  private static calculateDiversityScore(post: Post): number {
    const hasLikes = post.likes.length > 0;
    const hasComments = post.comments.length > 0;
    const hasShares = post.shares > 0;
    const hasBookmarks = post.bookmarks.length > 0;
    const hasMedia = (post.images && post.images.length > 0) || 
                     (post.documents && post.documents.length > 0);
    
    // Count different types of engagement
    const engagementTypes = [hasLikes, hasComments, hasShares, hasBookmarks, hasMedia]
      .filter(Boolean).length;
    
    // Normalize to 0-1 scale (5 types max)
    return engagementTypes / 5;
  }
  
  /**
   * Calculate quality score based on content and author
   */
  private static calculateQualityScore(post: Post): number {
    let score = 0.5; // Base score
    
    // Content length bonus
    if (post.content.length > 100) score += 0.1;
    if (post.content.length > 300) score += 0.1;
    
    // Media content bonus
    if (post.images && post.images.length > 0) score += 0.1;
    if (post.documents && post.documents.length > 0) score += 0.1;
    
    // Author verification bonus
    if (post.author.verified) score += 0.1;
    
    // Tags bonus (more relevant tags = higher quality)
    if (post.tags.length > 0) score += Math.min(0.1, post.tags.length * 0.02);
    
    return Math.min(1.0, score);
  }
  
  /**
   * Get trending posts sorted by score
   */
  static getTrendingPosts(posts: Post[], limit: number = 20): Post[] {
    const postsWithScores = posts.map(post => ({
      post,
      score: this.calculateTrendingScore(post, posts)
    }));
    
    // Sort by trending score
    const sorted = postsWithScores.sort((a, b) => b.score.score - a.score.score);
    
    // Add ranks
    sorted.forEach((item, index) => {
      item.score.rank = index + 1;
    });
    
    return sorted.slice(0, limit).map(item => item.post);
  }
  
  /**
   * Get trending posts by category
   */
  static getTrendingPostsByCategory(
    posts: Post[], 
    category: string, 
    limit: number = 10
  ): Post[] {
    const categoryPosts = posts.filter(post => post.category === category);
    return this.getTrendingPosts(categoryPosts, limit);
  }
  
  /**
   * Get trending posts by hashtag
   */
  static getTrendingPostsByHashtag(
    posts: Post[], 
    hashtag: string, 
    limit: number = 10
  ): Post[] {
    const hashtagPosts = posts.filter(post => 
      post.tags.some(tag => tag.toLowerCase() === hashtag.toLowerCase())
    );
    return this.getTrendingPosts(hashtagPosts, limit);
  }
  
  /**
   * Get trending posts for a specific user
   */
  static getTrendingPostsForUser(
    posts: Post[], 
    userId: string, 
    limit: number = 10
  ): Post[] {
    const userPosts = posts.filter(post => post.author.id === userId);
    return this.getTrendingPosts(userPosts, limit);
  }
  
  /**
   * Calculate trending metrics for analytics
   */
  static calculateTrendingMetrics(posts: Post[]): TrendingMetrics {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    const recentPosts = posts.filter(post => post.createdAt > oneDayAgo);
    const olderPosts = posts.filter(post => post.createdAt <= oneDayAgo);
    
    // Engagement rate
    const totalEngagement = posts.reduce((sum, post) => 
      sum + post.likes.length + post.comments.length + post.shares, 0
    );
    const engagementRate = posts.length > 0 ? totalEngagement / posts.length : 0;
    
    // Velocity score (comparing recent vs older engagement)
    const recentEngagement = recentPosts.reduce((sum, post) => 
      sum + post.likes.length + post.comments.length + post.shares, 0
    );
    const olderEngagement = olderPosts.reduce((sum, post) => 
      sum + post.likes.length + post.comments.length + post.shares, 0
    );
    
    const velocityScore = olderEngagement > 0 ? recentEngagement / olderEngagement : 1;
    
    // Diversity score (posts with multiple engagement types)
    const diversePosts = posts.filter(post => {
      const types = [
        post.likes.length > 0,
        post.comments.length > 0,
        post.shares > 0,
        post.bookmarks.length > 0
      ].filter(Boolean).length;
      return types >= 3;
    });
    const diversityScore = posts.length > 0 ? diversePosts.length / posts.length : 0;
    
    // Quality score (posts with media and longer content)
    const qualityPosts = posts.filter(post => 
      post.content.length > 100 || 
      (post.images && post.images.length > 0) || 
      (post.documents && post.documents.length > 0)
    );
    const qualityScore = posts.length > 0 ? qualityPosts.length / posts.length : 0;
    
    // Time decay (how much recent posts dominate)
    const timeDecay = recentPosts.length / posts.length;
    
    return {
      engagementRate,
      velocityScore,
      diversityScore,
      qualityScore,
      timeDecay
    };
  }
}
