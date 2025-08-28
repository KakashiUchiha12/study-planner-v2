export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  university: string;
  program: string;
  year: number;
  verified: boolean;
  reputation?: number;
}

export interface PostFile {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  thumbnail?: string;
  preview?: string;
}

export interface Comment {
  id: string;
  author: User;
  content: string;
  createdAt: Date;
  likes: string[];
  replies: Comment[];
  parentId?: string;
}

export interface Post {
  id: string;
  author: User;
  content: string;
  images?: string[];
  documents?: PostFile[];
  likes: string[];
  comments: Comment[];
  shares: number;
  bookmarks: string[];
  createdAt: Date;
  tags: string[];
  isPublic: boolean;
  category: "study" | "question" | "achievement" | "resource";
  location?: string;
  views: number;
}

export interface HashtagStats {
  tag: string;
  count: number;
  recentPosts: number;
  trendingScore: number;
  lastUsed: Date;
  relatedTags: string[];
}

export interface TrendingHashtag extends HashtagStats {
  growth: number;
  category: string;
  isHot: boolean;
}

export interface SharedPost {
  id: string;
  originalPost: Post;
  sharedBy: User;
  sharedAt: Date;
  customMessage: string;
  shareType: 'public' | 'private' | 'group';
  targetAudience?: string[];
  isRepost: boolean;
  engagement: {
    likes: string[];
    comments: Comment[];
    shares: number;
  };
  metadata: {
    originalShareCount: number;
    reach: number;
    clickThroughRate: number;
  };
}

export interface ModerationResult {
  isApproved: boolean;
  confidence: number;
  flags: ModerationFlag[];
  suggestions: string[];
  requiresReview: boolean;
  autoAction: 'none' | 'hide' | 'flag' | 'delete';
}

export interface ModerationFlag {
  type: 'spam' | 'inappropriate' | 'harassment' | 'copyright' | 'misinformation' | 'academic' | 'other';
  severity: 'low' | 'medium' | 'high' | 'critical';
  reason: string;
  evidence: string[];
  confidence: number;
}

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
