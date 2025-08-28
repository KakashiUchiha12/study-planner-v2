import { NextRequest, NextResponse } from 'next/server';
import { PostRecommendationSystem } from '@/app/(lib)/post-recommendations';
import { Post, User, UserInterests } from '@/types/posts';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const type = searchParams.get('type') || 'personalized';
    const limit = parseInt(searchParams.get('limit') || '20');
    const _category = searchParams.get('category');
    const hashtags = searchParams.get('hashtags')?.split(',') || [];
    const program = searchParams.get('program');

    if (!userId && type === 'personalized') {
      return NextResponse.json(
        { error: 'userId is required for personalized recommendations' },
        { status: 400 }
      );
    }

    // TODO: Replace with actual database calls
    // For now, using mock data
    const mockPosts: Post[] = [];
    const mockUser: User = {
      id: userId || 'mock-user',
      name: 'Mock User',
      email: 'mock@example.com',
      avatar: '/placeholder-user.jpg',
      university: 'Mock University',
      program: 'Computer Science',
      year: 3,
      verified: true
    };

    const mockUserInterests: UserInterests = {
      userId: userId || 'mock-user',
      subjects: ['computer-science', 'mathematics', 'programming'],
      skills: ['javascript', 'python', 'algorithms'],
      categories: ['study', 'resource', 'question'],
      hashtags: ['#coding', '#study', '#programming'],
      authors: [],
      engagementHistory: {
        likedPosts: [],
        commentedPosts: [],
        sharedPosts: [],
        bookmarkedPosts: [],
        viewedPosts: []
      },
      preferences: {
        preferredContentLength: 'medium',
        mediaPreference: 'mixed',
        timeOfDay: 'any',
        academicLevel: 'intermediate'
      }
    };

    let recommendations: Post[] = [];

    switch (type) {
      case 'personalized':
        recommendations = await PostRecommendationSystem.getRecommendations(
          mockUser,
          mockPosts,
          mockUserInterests,
          { maxRecommendations: limit }
        );
        break;

      case 'trending':
        recommendations = await PostRecommendationSystem.getTrendingRecommendations(
          mockPosts,
          limit
        );
        break;

      case 'hashtag':
        if (hashtags.length === 0) {
          return NextResponse.json(
            { error: 'hashtags parameter is required for hashtag recommendations' },
            { status: 400 }
          );
        }
        recommendations = await PostRecommendationSystem.getHashtagRecommendations(
          hashtags,
          mockPosts,
          limit
        );
        break;

      case 'program':
        if (!program) {
          return NextResponse.json(
            { error: 'program parameter is required for program recommendations' },
            { status: 400 }
          );
        }
        recommendations = await PostRecommendationSystem.getProgramRecommendations(
          program,
          mockPosts,
          limit
        );
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid recommendation type' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      data: recommendations,
      metadata: {
        type,
        limit,
        total: recommendations.length,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Recommendation API error:', error);
    return NextResponse.json(
      { error: 'Failed to get recommendations' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, action, postId, post } = body;

    if (!userId || !action || !postId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Update user interests based on engagement
    await PostRecommendationSystem.updateUserInterests(userId, action, postId, post);

    return NextResponse.json({
      success: true,
      message: 'User interests updated successfully'
    });

  } catch (error) {
    console.error('Update interests error:', error);
    return NextResponse.json(
      { error: 'Failed to update user interests' },
      { status: 500 }
    );
  }
}
