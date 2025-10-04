'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  MessageSquare, 
  ArrowLeft,
  Send,
  ThumbsUp,
  Reply,
  MoreHorizontal,
  Pin,
  BookOpen,
  Users,
  Clock
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

interface DiscussionPost {
  id: string;
  title: string;
  content: string;
  author: {
    id: string;
    name: string;
    image?: string;
  };
  createdAt: string;
  isPinned: boolean;
  likes: number;
  replies: number;
  isLiked: boolean;
  chapterId?: string;
  topicId?: string;
}

interface Reply {
  id: string;
  content: string;
  author: {
    id: string;
    name: string;
    image?: string;
  };
  createdAt: string;
  likes: number;
  isLiked: boolean;
}

interface Course {
  id: string;
  title: string;
  instructor: {
    id: string;
    name: string;
    image?: string;
  };
}

export default function CourseDiscussionPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const params = useParams();
  const courseId = params.courseId as string;
  
  const [course, setCourse] = useState<Course | null>(null);
  const [posts, setPosts] = useState<DiscussionPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [newPostTitle, setNewPostTitle] = useState('');
  const [newPostContent, setNewPostContent] = useState('');
  const [showNewPost, setShowNewPost] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');

  useEffect(() => {
    if (session?.user && courseId) {
      fetchCourseAndPosts();
    }
  }, [session, courseId]);

  const fetchCourseAndPosts = async () => {
    try {
      setLoading(true);
      // TODO: Replace with actual API calls
      const mockCourse: Course = {
        id: courseId,
        title: 'Complete Web Development Bootcamp',
        instructor: {
          id: 'instructor1',
          name: 'Dr. Sarah Johnson',
          image: '/api/placeholder/40/40'
        }
      };

      const mockPosts: DiscussionPost[] = [
        {
          id: '1',
          title: 'Question about CSS Grid vs Flexbox',
          content: 'I\'m working on the CSS chapter and I\'m confused about when to use CSS Grid vs Flexbox. Can someone explain the main differences and use cases?',
          author: {
            id: 'user1',
            name: 'John Doe',
            image: '/api/placeholder/40/40'
          },
          createdAt: '2024-01-20T10:30:00Z',
          isPinned: true,
          likes: 12,
          replies: 5,
          isLiked: false,
          chapterId: '2',
          topicId: '2-3'
        },
        {
          id: '2',
          title: 'JavaScript Array Methods Help',
          content: 'I\'m struggling with the array methods in JavaScript. Can someone provide some examples of map, filter, and reduce?',
          author: {
            id: 'user2',
            name: 'Jane Smith',
            image: '/api/placeholder/40/40'
          },
          createdAt: '2024-01-19T15:45:00Z',
          isPinned: false,
          likes: 8,
          replies: 3,
          isLiked: true,
          chapterId: '3',
          topicId: '3-1'
        },
        {
          id: '3',
          title: 'React State Management Best Practices',
          content: 'What are the best practices for managing state in React applications? Should I use useState, useReducer, or a state management library?',
          author: {
            id: 'user3',
            name: 'Mike Johnson',
            image: '/api/placeholder/40/40'
          },
          createdAt: '2024-01-18T09:15:00Z',
          isPinned: false,
          likes: 15,
          replies: 7,
          isLiked: false
        }
      ];

      setCourse(mockCourse);
      setPosts(mockPosts);
    } catch (error) {
      console.error('Error fetching course and posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePost = async () => {
    if (!newPostTitle.trim() || !newPostContent.trim()) return;

    try {
      // TODO: Implement API call to create post
      const newPost: DiscussionPost = {
        id: Date.now().toString(),
        title: newPostTitle,
        content: newPostContent,
        author: {
          id: session?.user?.id || '',
          name: session?.user?.name || 'Anonymous',
          image: session?.user?.image
        },
        createdAt: new Date().toISOString(),
        isPinned: false,
        likes: 0,
        replies: 0,
        isLiked: false
      };

      setPosts(prev => [newPost, ...prev]);
      setNewPostTitle('');
      setNewPostContent('');
      setShowNewPost(false);
    } catch (error) {
      console.error('Error creating post:', error);
    }
  };

  const handleLikePost = async (postId: string) => {
    try {
      // TODO: Implement API call to like/unlike post
      setPosts(prev => prev.map(post => 
        post.id === postId 
          ? { 
              ...post, 
              isLiked: !post.isLiked,
              likes: post.isLiked ? post.likes - 1 : post.likes + 1
            }
          : post
      ));
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };

  const handleReply = async (postId: string) => {
    if (!replyContent.trim()) return;

    try {
      // TODO: Implement API call to create reply
      setPosts(prev => prev.map(post => 
        post.id === postId 
          ? { ...post, replies: post.replies + 1 }
          : post
      ));
      setReplyContent('');
      setReplyingTo(null);
    } catch (error) {
      console.error('Error creating reply:', error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`;
    return date.toLocaleDateString();
  };

  const filteredPosts = posts.filter(post => {
    if (activeTab === 'pinned') return post.isPinned;
    if (activeTab === 'my-posts') return post.author.id === session?.user?.id;
    return true;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-white rounded-lg p-6">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-gray-50 pt-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Course not found</h1>
            <Button onClick={() => router.push('/courses')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Courses
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button 
            variant="ghost" 
            onClick={() => router.push(`/courses/${courseId}`)}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Course
          </Button>
          
          <div className="flex items-center gap-3 mb-4">
            <MessageSquare className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Course Discussion</h1>
              <p className="text-gray-600">{course.title}</p>
            </div>
          </div>
        </div>

        {/* New Post Form */}
        {!showNewPost ? (
          <div className="mb-6">
            <Button onClick={() => setShowNewPost(true)} className="w-full">
              Start a new discussion
            </Button>
          </div>
        ) : (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Create New Post</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title
                </label>
                <input
                  type="text"
                  value={newPostTitle}
                  onChange={(e) => setNewPostTitle(e.target.value)}
                  placeholder="What's your question or topic?"
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Content
                </label>
                <Textarea
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value)}
                  placeholder="Describe your question or share your thoughts..."
                  rows={4}
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleCreatePost}>
                  <Send className="h-4 w-4 mr-2" />
                  Post
                </Button>
                <Button variant="outline" onClick={() => setShowNewPost(false)}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="all">All Posts</TabsTrigger>
            <TabsTrigger value="pinned">Pinned</TabsTrigger>
            <TabsTrigger value="my-posts">My Posts</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Posts */}
        <div className="space-y-4">
          {filteredPosts.map((post) => (
            <Card key={post.id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={post.author.image} />
                      <AvatarFallback>{post.author.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{post.author.name}</h3>
                        {post.isPinned && (
                          <Badge variant="secondary" className="text-xs">
                            <Pin className="h-3 w-3 mr-1" />
                            Pinned
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">{formatDate(post.createdAt)}</p>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem>Report</DropdownMenuItem>
                      {post.author.id === session?.user?.id && (
                        <DropdownMenuItem>Edit</DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                <h4 className="font-semibold text-lg mb-2">{post.title}</h4>
                <p className="text-gray-700 mb-4 whitespace-pre-wrap">{post.content}</p>
                
                {/* Actions */}
                <div className="flex items-center gap-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleLikePost(post.id)}
                    className={post.isLiked ? 'text-blue-600' : ''}
                  >
                    <ThumbsUp className={`h-4 w-4 mr-1 ${post.isLiked ? 'fill-current' : ''}`} />
                    {post.likes}
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setReplyingTo(replyingTo === post.id ? null : post.id)}
                  >
                    <Reply className="h-4 w-4 mr-1" />
                    {post.replies}
                  </Button>
                </div>

                {/* Reply Form */}
                {replyingTo === post.id && (
                  <div className="mt-4 pt-4 border-t">
                    <div className="flex gap-2">
                      <Textarea
                        value={replyContent}
                        onChange={(e) => setReplyContent(e.target.value)}
                        placeholder="Write a reply..."
                        rows={2}
                        className="flex-1"
                      />
                      <Button onClick={() => handleReply(post.id)}>
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredPosts.length === 0 && (
          <div className="text-center py-12">
            <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No discussions yet</h3>
            <p className="text-gray-600">
              {activeTab === 'my-posts' 
                ? "You haven't started any discussions yet."
                : "Be the first to start a discussion in this course."
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
