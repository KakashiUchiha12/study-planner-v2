'use client';

export interface HashtagStats {
  tag: string;
  count: number;
  recentPosts: number;
  trendingScore: number;
  lastUsed: Date;
  relatedTags: string[];
}

export interface TrendingHashtag extends HashtagStats {
  growth: number; // Percentage change from previous period
  category: string;
  isHot: boolean; // Trending rapidly
}

export class HashtagProcessor {
  private static hashtagRegex = /#[\w\u0590-\u05ff]+/g;
  
  /**
   * Extract hashtags from text content
   */
  static extractHashtags(content: string): string[] {
    const matches = content.match(this.hashtagRegex);
    if (!matches) return [];
    
    return [...new Set(matches.map(tag => 
      tag.toLowerCase().replace('#', '')
    ))].filter(tag => tag.length > 0);
  }
  
  /**
   * Calculate trending score for a hashtag
   * Based on: recent usage, growth rate, engagement
   */
  static calculateTrendingScore(
    currentCount: number,
    previousCount: number,
    recentPosts: number,
    totalEngagement: number,
    timeDecay: number = 0.95
  ): number {
    const growth = previousCount > 0 ? (currentCount - previousCount) / previousCount : 0;
    const engagementScore = Math.log(totalEngagement + 1) / Math.log(10);
    const recencyBonus = recentPosts * timeDecay;
    
    return (growth * 0.4) + (engagementScore * 0.3) + (recencyBonus * 0.3);
  }
  
  /**
   * Categorize hashtags based on content
   */
  static categorizeHashtag(tag: string): string {
    const tagLower = tag.toLowerCase();
    
    // Academic subjects
    if (['math', 'mathematics', 'algebra', 'calculus', 'geometry', 'statistics'].includes(tagLower)) {
      return 'mathematics';
    }
    if (['physics', 'chemistry', 'biology', 'science', 'lab'].includes(tagLower)) {
      return 'sciences';
    }
    if (['programming', 'coding', 'python', 'javascript', 'java', 'webdev'].includes(tagLower)) {
      return 'programming';
    }
    if (['history', 'literature', 'english', 'philosophy', 'arts'].includes(tagLower)) {
      return 'humanities';
    }
    
    // Study activities
    if (['study', 'studying', 'homework', 'assignment', 'exam', 'test'].includes(tagLower)) {
      return 'study';
    }
    if (['group', 'collaboration', 'teamwork', 'project'].includes(tagLower)) {
      return 'collaboration';
    }
    if (['achievement', 'success', 'graduation', 'award'].includes(tagLower)) {
      return 'achievement';
    }
    if (['question', 'help', 'doubt', 'confused'].includes(tagLower)) {
      return 'help';
    }
    
    // University life
    if (['university', 'college', 'campus', 'student', 'academic'].includes(tagLower)) {
      return 'university';
    }
    if (['library', 'lab', 'classroom', 'lecture'].includes(tagLower)) {
      return 'facilities';
    }
    
    return 'general';
  }
  
  /**
   * Find related hashtags based on co-occurrence
   */
  static findRelatedTags(
    tag: string,
    allPosts: Array<{ tags: string[] }>,
    minCoOccurrence: number = 2
  ): string[] {
    const related: { [key: string]: number } = {};
    
    allPosts.forEach(post => {
      if (post.tags.includes(tag)) {
        post.tags.forEach(otherTag => {
          if (otherTag !== tag) {
            related[otherTag] = (related[otherTag] || 0) + 1;
          }
        });
      }
    });
    
    return Object.entries(related)
      .filter(([_, count]) => count >= minCoOccurrence)
      .sort(([_, a], [__, b]) => b - a)
      .slice(0, 10)
      .map(([tag, _]) => tag);
  }
  
  /**
   * Generate hashtag suggestions based on content
   */
  static suggestHashtags(content: string, existingTags: string[] = []): string[] {
    const suggestions: string[] = [];
    const contentLower = content.toLowerCase();
    
    // Subject-based suggestions
    if (contentLower.includes('math') || contentLower.includes('equation')) {
      suggestions.push('mathematics', 'algebra', 'calculus');
    }
    if (contentLower.includes('code') || contentLower.includes('programming')) {
      suggestions.push('programming', 'coding', 'webdev');
    }
    if (contentLower.includes('study') || contentLower.includes('homework')) {
      suggestions.push('study', 'homework', 'assignment');
    }
    if (contentLower.includes('group') || contentLower.includes('collaborate')) {
      suggestions.push('collaboration', 'group', 'teamwork');
    }
    if (contentLower.includes('question') || contentLower.includes('help')) {
      suggestions.push('question', 'help', 'doubt');
    }
    
    // Remove existing tags and duplicates
    return [...new Set(suggestions)].filter(tag => 
      !existingTags.includes(tag) && !contentLower.includes(tag)
    ).slice(0, 5);
  }
  
  /**
   * Format hashtag for display
   */
  static formatHashtag(tag: string): string {
    return `#${tag.charAt(0).toUpperCase() + tag.slice(1)}`;
  }
  
  /**
   * Validate hashtag format
   */
  static isValidHashtag(tag: string): boolean {
    return /^[a-zA-Z0-9\u0590-\u05ff]+$/.test(tag) && tag.length >= 2 && tag.length <= 30;
  }
}

export interface HashtagAnalytics {
  totalPosts: number;
  totalEngagement: number;
  uniqueUsers: number;
  topContributors: Array<{ userId: string; posts: number; engagement: number }>;
  growthRate: number;
  peakUsage: Date;
  categoryDistribution: { [category: string]: number };
}
