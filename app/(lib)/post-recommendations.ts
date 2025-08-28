'use client';

import { Post, User } from '@/types/posts';

export interface RecommendationScore {
  postId: string;
  score: number;
  factors: {
    interestMatch: number;
    contentSimilarity: number;
    socialProof: number;
    recency: number;
    diversity: number;
  };
  reason: string;
}

export interface UserInterests {
  userId: string;
  subjects: string[];
  skills: string[];
  categories: string[];
  hashtags: string[];
  authors: string[];
  engagementHistory: {
    likedPosts: string[];
    commentedPosts: string[];
    sharedPosts: string[];
    bookmarkedPosts: string[];
    viewedPosts: string[];
  };
  preferences: {
    preferredContentLength: 'short' | 'medium' | 'long';
    mediaPreference: 'text' | 'image' | 'document' | 'mixed';
    timeOfDay: 'morning' | 'afternoon' | 'evening' | 'any';
    academicLevel: 'beginner' | 'intermediate' | 'advanced';
  };
}

export interface RecommendationSettings {
  maxRecommendations: number;
  diversityWeight: number;
  recencyWeight: number;
  socialProofWeight: number;
  interestMatchWeight: number;
  contentSimilarityWeight: number;
  excludeViewedPosts: boolean;
  excludeLikedPosts: boolean;
  includeTrendingPosts: boolean;
  categoryBoost: { [category: string]: number };
}

export class PostRecommendationSystem {
  private static readonly DEFAULT_SETTINGS: RecommendationSettings = {
    maxRecommendations: 20,
    diversityWeight: 0.15,
    recencyWeight: 0.20,
    socialProofWeight: 0.25,
    interestMatchWeight: 0.30,
    contentSimilarityWeight: 0.10,
    excludeViewedPosts: true,
    excludeLikedPosts: false,
    includeTrendingPosts: true,
    categoryBoost: {
      'study': 1.2,
      'achievement': 1.1,
      'question': 1.3,
      'resource': 1.4,

    }
  };

  /**
   * Get personalized post recommendations for a user
   */
  static async getRecommendations(
    user: User,
    allPosts: Post[],
    userInterests: UserInterests,
    settings: Partial<RecommendationSettings> = {}
  ): Promise<Post[]> {
    const finalSettings = { ...this.DEFAULT_SETTINGS, ...settings };
    
    // Filter posts based on user preferences
    const candidatePosts = this.filterCandidatePosts(
      allPosts,
      user,
      userInterests,
      finalSettings
    );

    // Calculate recommendation scores
    const postsWithScores = candidatePosts.map(post => ({
      post,
      score: this.calculateRecommendationScore(post, user, userInterests, finalSettings)
    }));

    // Sort by score and apply diversity
    const sorted = postsWithScores.sort((a, b) => b.score.score - a.score.score);
    const diverseRecommendations = this.applyDiversityFilter(
      sorted.map(item => item.post),
      finalSettings.maxRecommendations
    );

    return diverseRecommendations;
  }

  /**
   * Get recommendations based on a specific post
   */
  static async getRelatedPosts(
    post: Post,
    allPosts: Post[],
    limit: number = 10
  ): Promise<Post[]> {
    const relatedPosts = allPosts
      .filter(p => p.id !== post.id)
      .map(p => ({
        post: p,
        similarity: this.calculateContentSimilarity(post, p)
      }))
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit)
      .map(item => item.post);

    return relatedPosts;
  }

  /**
   * Get recommendations based on hashtags
   */
  static async getHashtagRecommendations(
    hashtags: string[],
    allPosts: Post[],
    limit: number = 15
  ): Promise<Post[]> {
    const hashtagPosts = allPosts
      .filter(post => 
        post.tags.some(tag => 
          hashtags.some(hashtag => 
            tag.toLowerCase().includes(hashtag.toLowerCase())
          )
        )
      )
      .map(post => ({
        post,
        hashtagMatch: this.calculateHashtagMatch(post, hashtags)
      }))
      .sort((a, b) => b.hashtagMatch - a.hashtagMatch)
      .slice(0, limit)
      .map(item => item.post);

    return hashtagPosts;
  }

  /**
   * Get recommendations based on user's academic program
   */
  static async getProgramRecommendations(
    program: string,
    allPosts: Post[],
    limit: number = 15
  ): Promise<Post[]> {
    const programPosts = allPosts
      .filter(post => 
        post.author.program.toLowerCase().includes(program.toLowerCase()) ||
        post.tags.some(tag => 
          tag.toLowerCase().includes(program.toLowerCase())
        )
      )
      .map(post => ({
        post,
        programRelevance: this.calculateProgramRelevance(post, program)
      }))
      .sort((a, b) => b.programRelevance - a.programRelevance)
      .slice(0, limit)
      .map(item => item.post);

    return programPosts;
  }

  /**
   * Filter candidate posts based on user preferences
   */
  private static filterCandidatePosts(
    allPosts: Post[],
    user: User,
    userInterests: UserInterests,
    settings: RecommendationSettings
  ): Post[] {
    return allPosts.filter(post => {
      // Exclude posts by the user themselves
      if (post.author.id === user.id) return false;

      // Exclude viewed posts if setting is enabled
      if (settings.excludeViewedPosts && 
          userInterests.engagementHistory.viewedPosts.includes(post.id)) {
        return false;
      }

      // Exclude liked posts if setting is enabled
      if (settings.excludeLikedPosts && 
          userInterests.engagementHistory.likedPosts.includes(post.id)) {
        return false;
      }

      // Only include public posts
      if (!post.isPublic) return false;

      return true;
    });
  }

  /**
   * Calculate recommendation score for a post
   */
  private static calculateRecommendationScore(
    post: Post,
    user: User,
    userInterests: UserInterests,
    settings: RecommendationSettings
  ): RecommendationScore {
    const interestMatch = this.calculateInterestMatch(post, userInterests);
    const contentSimilarity = this.calculateContentSimilarityScore(post, userInterests);
    const socialProof = this.calculateSocialProof(post);
    const recency = this.calculateRecencyScore(post);
    const diversity = this.calculateDiversityScore(post, userInterests);

    // Apply category boost
    const categoryBoost = settings.categoryBoost[post.category] || 1.0;

    const finalScore = (
      interestMatch * settings.interestMatchWeight +
      contentSimilarity * settings.contentSimilarityWeight +
      socialProof * settings.socialProofWeight +
      recency * settings.recencyWeight +
      diversity * settings.diversityWeight
    ) * categoryBoost;

    return {
      postId: post.id,
      score: finalScore,
      factors: {
        interestMatch,
        contentSimilarity,
        socialProof,
        recency,
        diversity
      },
      reason: this.generateRecommendationReason(post, userInterests, finalScore)
    };
  }

  /**
   * Calculate interest match score
   */
  private static calculateInterestMatch(post: Post, userInterests: UserInterests): number {
    let score = 0;
    let totalFactors = 0;

    // Subject match
    if (userInterests.subjects.length > 0) {
      const subjectMatch = userInterests.subjects.some(subject =>
        post.tags.some(tag => 
          tag.toLowerCase().includes(subject.toLowerCase())
        )
      );
      score += subjectMatch ? 1 : 0;
      totalFactors++;
    }

    // Skill match
    if (userInterests.skills.length > 0) {
      const skillMatch = userInterests.skills.some(skill =>
        post.tags.some(tag => 
          tag.toLowerCase().includes(skill.toLowerCase())
        )
      );
      score += skillMatch ? 1 : 0;
      totalFactors++;
    }

    // Category match
    if (userInterests.categories.includes(post.category)) {
      score += 1;
      totalFactors++;
    }

    // Hashtag match
    const hashtagMatches = post.tags.filter(tag =>
      userInterests.hashtags.includes(tag)
    ).length;
    score += Math.min(1, hashtagMatches / 3);
    totalFactors++;

    // Author preference
    if (userInterests.authors.includes(post.author.id)) {
      score += 1;
      totalFactors++;
    }

    return totalFactors > 0 ? score / totalFactors : 0;
  }

  /**
   * Calculate content similarity score
   */
  private static calculateContentSimilarityScore(post: Post, userInterests: UserInterests): number {
    // Calculate similarity based on engagement history
    const likedPosts = userInterests.engagementHistory.likedPosts;
    const commentedPosts = userInterests.engagementHistory.commentedPosts;
    const bookmarkedPosts = userInterests.engagementHistory.bookmarkedPosts;

    const allEngagedPosts = [...new Set([...likedPosts, ...commentedPosts, ...bookmarkedPosts])];
    
    if (allEngagedPosts.length === 0) return 0.5;

    // This is a simplified similarity calculation
    // In a real app, you'd use more sophisticated NLP techniques
    let similarityScore = 0;

    // Category similarity
    const categoryEngagement = allEngagedPosts.filter(postId => {
      // This would require looking up the actual post data
      // For now, return a base score
      return true;
    }).length;

    similarityScore += categoryEngagement / allEngagedPosts.length * 0.5;

    // Tag similarity
    const tagEngagement = userInterests.hashtags.length > 0 ? 
      post.tags.filter(tag => userInterests.hashtags.includes(tag)).length / userInterests.hashtags.length : 0;
    
    similarityScore += tagEngagement * 0.5;

    return Math.min(1, similarityScore);
  }

  /**
   * Calculate social proof score
   */
  private static calculateSocialProof(post: Post): number {
    const totalEngagement = post.likes.length + post.comments.length + post.shares + post.bookmarks.length;
    const views = post.views;
    
    if (views === 0) return 0;
    
    const engagementRate = totalEngagement / views;
    const normalizedEngagement = Math.min(1, engagementRate * 100); // Scale up for better differentiation
    
    return normalizedEngagement;
  }

  /**
   * Calculate recency score
   */
  private static calculateRecencyScore(post: Post): number {
    const now = new Date();
    const timeDiff = now.getTime() - post.createdAt.getTime();
    const hoursSinceCreation = timeDiff / (1000 * 60 * 60);
    
    // Exponential decay: newer posts get exponentially higher scores
    const decayRate = 0.05;
    return Math.exp(-decayRate * hoursSinceCreation);
  }

  /**
   * Calculate diversity score
   */
  private static calculateDiversityScore(post: Post, userInterests: UserInterests): number {
    // Encourage diversity by giving higher scores to posts that are different
    // from what the user typically engages with
    
    const typicalCategories = userInterests.categories;
    const typicalHashtags = userInterests.hashtags;
    
    let diversityScore = 0.5; // Base score
    
    // Category diversity
    if (!typicalCategories.includes(post.category)) {
      diversityScore += 0.3;
    }
    
    // Hashtag diversity
    const newHashtags = post.tags.filter(tag => !typicalHashtags.includes(tag));
    if (newHashtags.length > 0) {
      diversityScore += Math.min(0.2, newHashtags.length * 0.1);
    }
    
    return Math.min(1, diversityScore);
  }

  /**
   * Calculate content similarity between two posts
   */
  private static calculateContentSimilarity(post1: Post, post2: Post): number {
    // Simple similarity based on tags and category
    let similarity = 0;
    
    // Category similarity
    if (post1.category === post2.category) {
      similarity += 0.4;
    }
    
    // Tag similarity
    const commonTags = post1.tags.filter(tag => post2.tags.includes(tag));
    const tagSimilarity = commonTags.length / Math.max(post1.tags.length, post2.tags.length);
    similarity += tagSimilarity * 0.6;
    
    return similarity;
  }

  /**
   * Calculate hashtag match score
   */
  private static calculateHashtagMatch(post: Post, hashtags: string[]): number {
    const matches = post.tags.filter(tag =>
      hashtags.some(hashtag => 
        tag.toLowerCase().includes(hashtag.toLowerCase())
      )
    ).length;
    
    return matches / hashtags.length;
  }

  /**
   * Calculate program relevance score
   */
  private static calculateProgramRelevance(post: Post, program: string): number {
    let relevance = 0;
    
    // Author program match
    if (post.author.program.toLowerCase().includes(program.toLowerCase())) {
      relevance += 0.6;
    }
    
    // Tag relevance
    const programTags = post.tags.filter(tag =>
      tag.toLowerCase().includes(program.toLowerCase())
    );
    relevance += Math.min(0.4, programTags.length * 0.2);
    
    return relevance;
  }

  /**
   * Apply diversity filter to recommendations
   */
  private static applyDiversityFilter(posts: Post[], maxCount: number): Post[] {
    const result: Post[] = [];
    const usedCategories = new Set<string>();
    const usedAuthors = new Set<string>();
    
    for (const post of posts) {
      if (result.length >= maxCount) break;
      
      // Check if this post adds diversity
      const categoryDiversity = !usedCategories.has(post.category);
      const authorDiversity = !usedAuthors.has(post.author.id);
      
      if (categoryDiversity || authorDiversity) {
        result.push(post);
        usedCategories.add(post.category);
        usedAuthors.add(post.author.id);
      }
    }
    
    // Fill remaining slots if needed
    if (result.length < maxCount) {
      const remaining = posts.filter(post => !result.includes(post));
      result.push(...remaining.slice(0, maxCount - result.length));
    }
    
    return result;
  }

  /**
   * Generate recommendation reason
   */
  private static generateRecommendationReason(
    post: Post,
    userInterests: UserInterests,
    score: number
  ): string {
    const reasons: string[] = [];
    
    if (score > 0.8) {
      reasons.push('Highly relevant to your interests');
    } else if (score > 0.6) {
      reasons.push('Matches your academic focus');
    } else if (score > 0.4) {
      reasons.push('Related to subjects you study');
    } else {
      reasons.push('Popular in your field');
    }
    
    if (post.tags.some(tag => userInterests.hashtags.includes(tag))) {
      reasons.push('Uses hashtags you follow');
    }
    
    if (post.category === 'achievement') {
      reasons.push('Inspiring achievement post');
    } else if (post.category === 'resource') {
      reasons.push('Useful study resource');
    } else if (post.category === 'question') {
      reasons.push('Interesting academic question');
    }
    
    return reasons.join(' • ');
  }

  /**
   * Update user interests based on engagement
   */
  static async updateUserInterests(
    userId: string,
    action: 'like' | 'comment' | 'share' | 'bookmark' | 'view',
    _postId: string,
    _post: Post
  ): Promise<void> {
    // In a real app, this would update the user's interest profile
    // based on their engagement behavior
    console.log(`Updating interests for user ${userId} based on ${action}`);
  }

  /**
   * Get trending recommendations
   */
  static async getTrendingRecommendations(
    allPosts: Post[],
    limit: number = 10
  ): Promise<Post[]> {
    // Sort by engagement and recency
    const trendingPosts = allPosts
      .map(post => ({
        post,
        trendingScore: (post.likes.length + post.comments.length + post.shares) * 
                       Math.exp(-0.01 * (Date.now() - post.createdAt.getTime()) / (1000 * 60 * 60))
      }))
      .sort((a, b) => b.trendingScore - a.trendingScore)
      .slice(0, limit)
      .map(item => item.post);

    return trendingPosts;
  }
}
