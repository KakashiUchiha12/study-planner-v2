'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
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
  Plus,
  Play,
  CheckCircle,
  Circle,
  User,
  Calendar
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
}

export default function CoursesPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    if (session?.user) {
      fetchCourses();
    }
  }, [session]);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/courses');
      if (response.ok) {
        const data = await response.json();
        setCourses(data.courses || []);
      } else {
        console.error('Failed to fetch courses');
        setCourses([]);
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
      setCourses([]);
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async (courseId: string) => {
    try {
      const response = await fetch(`/api/courses/${courseId}/enroll`, {
        method: 'POST',
      });
      
      if (response.ok) {
        setCourses(prev => prev.map(course => 
          course.id === courseId 
            ? { ...course, isEnrolled: true, progress: 0 }
            : course
        ));
      } else {
        const errorData = await response.json();
        alert(`Failed to enroll: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Error enrolling in course:', error);
      alert('Failed to enroll in course. Please try again.');
    }
  };

  const handleLeave = async (courseId: string) => {
    try {
      const response = await fetch(`/api/courses/${courseId}/enroll`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        setCourses(prev => prev.map(course => 
          course.id === courseId 
            ? { ...course, isEnrolled: false, progress: 0 }
            : course
        ));
      } else {
        const errorData = await response.json();
        alert(`Failed to leave course: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Error leaving course:', error);
      alert('Failed to leave course. Please try again.');
    }
  };

  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         course.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         course.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    if (activeTab === 'enrolled') {
      return matchesSearch && course.isEnrolled;
    } else if (activeTab === 'available') {
      return matchesSearch && !course.isEnrolled;
    }
    return matchesSearch;
  });

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
        <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-4 sm:py-8">
          <div className="animate-pulse">
            <div className="h-6 sm:h-8 bg-gray-200 rounded w-1/4 mb-4 sm:mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="md:rounded-lg md:border md:bg-white p-4 sm:p-6">
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
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-4 sm:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center gap-3 mb-4">
            <BookOpen className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Courses</h1>
          </div>
          <p className="text-sm sm:text-base text-gray-600">Discover and enroll in courses to enhance your learning journey.</p>
        </div>

        {/* Search and Filters */}
        <div className="mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-4 sm:mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search courses, instructors, or topics..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button 
              className="flex items-center gap-2 w-full sm:w-auto"
              onClick={() => router.push('/courses/create')}
            >
              <Plus className="h-4 w-4" />
              Create Course
            </Button>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="all" className="text-xs sm:text-sm">All Courses</TabsTrigger>
              <TabsTrigger value="enrolled" className="text-xs sm:text-sm">My Courses</TabsTrigger>
              <TabsTrigger value="available" className="text-xs sm:text-sm">Available</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Courses Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {filteredCourses.map((course) => (
            <div key={course.id} className="md:rounded-lg md:border md:bg-white md:shadow-sm hover:shadow-lg transition-shadow overflow-hidden">
              <div className="relative">
                <img
                  src={course.thumbnail || '/api/placeholder/300/200'}
                  alt={course.title}
                  className="w-full h-48 object-cover cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={() => router.push(`/courses/${course.id}`)}
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

              <div className="p-4 sm:p-6 border-b md:border-b-0">
                <h3 className="text-base sm:text-lg font-semibold line-clamp-2 mb-2">{course.title}</h3>
                <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                  <Avatar className="h-5 w-5 sm:h-6 sm:w-6">
                    <AvatarImage src={course.instructor.image} />
                    <AvatarFallback>{course.instructor.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <span>{course.instructor.name}</span>
                </div>
              </div>

              <div className="p-4 sm:p-6 pt-0">
                <p className="text-sm text-gray-600 line-clamp-2 mb-4">
                  {course.description}
                </p>

                <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs text-gray-500 mb-4">
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

                {/* Progress Bar for Enrolled Courses */}
                {course.isEnrolled && (
                  <div className="mb-4">
                    <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                      <span>Progress</span>
                      <span>{course.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${course.progress}%` }}
                      ></div>
                    </div>
                  </div>
                )}

                {/* Tags */}
                <div className="flex flex-wrap gap-1 mb-4">
                  {course.tags.slice(0, 3).map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  {course.isEnrolled ? (
                    <>
                      <Button 
                        className="flex-1 text-xs sm:text-sm"
                        onClick={() => router.push(`/courses/${course.id}`)}
                      >
                        Continue Learning
                      </Button>
                      <Button 
                        variant="outline"
                        className="text-xs sm:text-sm"
                        onClick={() => handleLeave(course.id)}
                      >
                        Leave
                      </Button>
                    </>
                  ) : (
                    <Button 
                      className="flex-1 text-xs sm:text-sm"
                      onClick={() => handleEnroll(course.id)}
                    >
                      Enroll Now
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredCourses.length === 0 && (
          <div className="text-center py-12">
            <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No courses found</h3>
            <p className="text-gray-600">
              {searchQuery ? 'Try adjusting your search terms.' : 'No courses available at the moment.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
