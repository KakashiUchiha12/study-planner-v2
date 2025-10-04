'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BookOpen, 
  Users, 
  Clock, 
  Star, 
  Search,
  Filter,
  ArrowLeft,
  Play,
  CheckCircle,
  Circle
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface Course {
  id: string;
  title: string;
  description: string;
  instructor: {
    id: string;
    name: string;
    image?: string;
  };
  thumbnail?: string;
  duration: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  rating: number;
  studentCount: number;
  isEnrolled: boolean;
  progress: number;
  chapters: number;
  createdAt: string;
  tags: string[];
  category: string;
}

export default function CoursesSearchPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedLevel, setSelectedLevel] = useState('all');
  const [sortBy, setSortBy] = useState('relevance');

  const categories = [
    'all',
    'Web Development',
    'Data Science',
    'Mobile Development',
    'Design',
    'Business',
    'Marketing',
    'Photography',
    'Music',
    'Health & Fitness'
  ];

  const levels = ['all', 'Beginner', 'Intermediate', 'Advanced'];

  const sortOptions = [
    { value: 'relevance', label: 'Most Relevant' },
    { value: 'rating', label: 'Highest Rated' },
    { value: 'students', label: 'Most Popular' },
    { value: 'newest', label: 'Newest' },
    { value: 'duration', label: 'Duration' }
  ];

  useEffect(() => {
    if (session?.user) {
      fetchCourses();
    }
  }, [session, searchQuery, selectedCategory, selectedLevel, sortBy]);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      // TODO: Replace with actual API call
      const mockCourses: Course[] = [
        {
          id: '1',
          title: 'Complete Web Development Bootcamp',
          description: 'Learn HTML, CSS, JavaScript, React, Node.js and more in this comprehensive course.',
          instructor: {
            id: 'instructor1',
            name: 'Dr. Sarah Johnson',
            image: '/api/placeholder/40/40'
          },
          thumbnail: '/api/placeholder/300/200',
          duration: '40 hours',
          level: 'Beginner',
          rating: 4.8,
          studentCount: 1250,
          isEnrolled: false,
          progress: 0,
          chapters: 12,
          createdAt: '2024-01-15',
          tags: ['Web Development', 'JavaScript', 'React'],
          category: 'Web Development'
        },
        {
          id: '2',
          title: 'Advanced Data Science with Python',
          description: 'Master machine learning, data analysis, and statistical modeling using Python.',
          instructor: {
            id: 'instructor2',
            name: 'Prof. Michael Chen',
            image: '/api/placeholder/40/40'
          },
          thumbnail: '/api/placeholder/300/200',
          duration: '60 hours',
          level: 'Advanced',
          rating: 4.9,
          studentCount: 890,
          isEnrolled: false,
          progress: 0,
          chapters: 18,
          createdAt: '2024-02-01',
          tags: ['Data Science', 'Python', 'Machine Learning'],
          category: 'Data Science'
        },
        {
          id: '3',
          title: 'Mobile App Development with Flutter',
          description: 'Build cross-platform mobile applications using Flutter and Dart.',
          instructor: {
            id: 'instructor3',
            name: 'Alex Rodriguez',
            image: '/api/placeholder/40/40'
          },
          thumbnail: '/api/placeholder/300/200',
          duration: '35 hours',
          level: 'Intermediate',
          rating: 4.7,
          studentCount: 650,
          isEnrolled: false,
          progress: 0,
          chapters: 10,
          createdAt: '2024-01-20',
          tags: ['Mobile Development', 'Flutter', 'Dart'],
          category: 'Mobile Development'
        },
        {
          id: '4',
          title: 'UI/UX Design Fundamentals',
          description: 'Learn the principles of user interface and user experience design.',
          instructor: {
            id: 'instructor4',
            name: 'Emma Wilson',
            image: '/api/placeholder/40/40'
          },
          thumbnail: '/api/placeholder/300/200',
          duration: '25 hours',
          level: 'Beginner',
          rating: 4.6,
          studentCount: 420,
          isEnrolled: false,
          progress: 0,
          chapters: 8,
          createdAt: '2024-01-10',
          tags: ['Design', 'UI/UX', 'Figma'],
          category: 'Design'
        },
        {
          id: '5',
          title: 'Digital Marketing Masterclass',
          description: 'Comprehensive guide to digital marketing strategies and tools.',
          instructor: {
            id: 'instructor5',
            name: 'David Kim',
            image: '/api/placeholder/40/40'
          },
          thumbnail: '/api/placeholder/300/200',
          duration: '30 hours',
          level: 'Intermediate',
          rating: 4.5,
          studentCount: 780,
          isEnrolled: false,
          progress: 0,
          chapters: 15,
          createdAt: '2024-01-25',
          tags: ['Marketing', 'SEO', 'Social Media'],
          category: 'Marketing'
        }
      ];

      // Filter courses based on search and filters
      let filteredCourses = mockCourses;

      if (searchQuery) {
        filteredCourses = filteredCourses.filter(course =>
          course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          course.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          course.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())) ||
          course.instructor.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }

      if (selectedCategory !== 'all') {
        filteredCourses = filteredCourses.filter(course => course.category === selectedCategory);
      }

      if (selectedLevel !== 'all') {
        filteredCourses = filteredCourses.filter(course => course.level === selectedLevel);
      }

      // Sort courses
      filteredCourses.sort((a, b) => {
        switch (sortBy) {
          case 'rating':
            return b.rating - a.rating;
          case 'students':
            return b.studentCount - a.studentCount;
          case 'newest':
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          case 'duration':
            return parseInt(a.duration) - parseInt(b.duration);
          default:
            return 0;
        }
      });

      setCourses(filteredCourses);
    } catch (error) {
      console.error('Error fetching courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchCourses();
  };

  const handleEnroll = async (courseId: string) => {
    try {
      // TODO: Implement enrollment API call
      setCourses(prev => prev.map(course => 
        course.id === courseId 
          ? { ...course, isEnrolled: true, progress: 0 }
          : course
      ));
    } catch (error) {
      console.error('Error enrolling in course:', error);
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'Beginner': return 'bg-green-100 text-green-800';
      case 'Intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'Advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="bg-white rounded-lg p-6">
                  <div className="h-48 bg-gray-200 rounded mb-4"></div>
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

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button 
            variant="ghost" 
            onClick={() => router.push('/courses')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Courses
          </Button>
          
          <div className="flex items-center gap-3 mb-4">
            <Search className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Search Courses</h1>
          </div>
          <p className="text-gray-600">Find the perfect course to advance your skills.</p>
        </div>

        {/* Search and Filters */}
        <div className="mb-8">
          <form onSubmit={handleSearch} className="mb-6">
            <div className="flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search courses, instructors, or topics..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button type="submit">Search</Button>
            </div>
          </form>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category === 'all' ? 'All Categories' : category}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Level</label>
              <select
                value={selectedLevel}
                onChange={(e) => setSelectedLevel(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {levels.map(level => (
                  <option key={level} value={level}>
                    {level === 'all' ? 'All Levels' : level}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {sortOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="mb-4">
          <p className="text-gray-600">
            {courses.length} course{courses.length !== 1 ? 's' : ''} found
            {searchQuery && ` for "${searchQuery}"`}
          </p>
        </div>

        {/* Courses Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <Card key={course.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="relative">
                <img
                  src={course.thumbnail || '/api/placeholder/300/200'}
                  alt={course.title}
                  className="w-full h-48 object-cover"
                />
                <div className="absolute top-3 left-3">
                  <Badge className={getLevelColor(course.level)}>
                    {course.level}
                  </Badge>
                </div>
                <div className="absolute top-3 right-3">
                  <div className="flex items-center gap-1 bg-black/70 text-white px-2 py-1 rounded text-sm">
                    <Star className="h-3 w-3 fill-current" />
                    <span>{course.rating}</span>
                  </div>
                </div>
              </div>

              <CardHeader className="pb-3">
                <CardTitle className="text-lg line-clamp-2">{course.title}</CardTitle>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={course.instructor.image} />
                    <AvatarFallback>{course.instructor.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <span>{course.instructor.name}</span>
                </div>
              </CardHeader>

              <CardContent className="pt-0">
                <p className="text-sm text-gray-600 line-clamp-2 mb-4">
                  {course.description}
                </p>

                <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>{course.duration}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Play className="h-3 w-3" />
                    <span>{course.chapters} chapters</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    <span>{course.studentCount}</span>
                  </div>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-1 mb-4">
                  {course.tags.slice(0, 3).map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>

                {/* Action Button */}
                <Button 
                  className="w-full"
                  onClick={() => handleEnroll(course.id)}
                >
                  {course.isEnrolled ? 'Enrolled' : 'Enroll Now'}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {courses.length === 0 && (
          <div className="text-center py-12">
            <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No courses found</h3>
            <p className="text-gray-600">
              Try adjusting your search terms or filters to find more courses.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
