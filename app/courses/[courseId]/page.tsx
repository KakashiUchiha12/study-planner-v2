'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BookOpen, 
  Users, 
  Clock, 
  Star, 
  Play,
  CheckCircle,
  Circle,
  User,
  Calendar,
  ArrowLeft,
  MessageSquare,
  FileText,
  HelpCircle,
  ChevronRight,
  ChevronDown,
  Edit
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';

interface Chapter {
  id: string;
  title: string;
  description: string;
  duration: string;
  isCompleted: boolean;
  topics: Topic[];
}

interface Topic {
  id: string;
  title: string;
  description?: string;
  type: 'video' | 'text' | 'quiz' | 'assignment';
  duration: string;
  isCompleted: boolean;
  youtubeUrl?: string;
  content?: string;
}

interface Course {
  id: string;
  title: string;
  description: string;
  instructor: {
    id: string;
    name: string;
    image?: string;
    bio: string;
  };
  thumbnail?: string;
  duration: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  rating: number;
  studentCount: number;
  isEnrolled: boolean;
  progress: number;
  chapters: Chapter[];
  createdAt: string;
  tags: string[];
}

export default function CoursePage() {
  const { data: session } = useSession();
  const router = useRouter();
  const params = useParams();
  const courseId = params.courseId as string;
  
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('course');
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [showChapters, setShowChapters] = useState(false);

  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  useEffect(() => {
    if (session?.user && courseId) {
      fetchCourse();
    }
  }, [session, courseId]);

  const fetchCourse = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/courses/${courseId}`);
      if (response.ok) {
        const courseData = await response.json();
        setCourse(courseData);
        if (courseData.chapters.length > 0) {
          setSelectedChapter(courseData.chapters[0]);
          if (courseData.chapters[0].topics.length > 0) {
            setSelectedTopic(courseData.chapters[0].topics[0]);
          }
        }
      } else {
        console.error('Failed to fetch course');
        setCourse(null);
      }
    } catch (error) {
      console.error('Error fetching course:', error);
      setCourse(null);
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async () => {
    if (!course) return;
    
    try {
      const response = await fetch(`/api/courses/${course.id}/enroll`, {
        method: 'POST',
      });
      
      if (response.ok) {
        setCourse(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            isEnrolled: true,
            progress: 0
          };
        });
      } else {
        const errorData = await response.json();
        alert(`Failed to enroll: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Error enrolling in course:', error);
      alert('Failed to enroll in course. Please try again.');
    }
  };

  const handleTopicComplete = async (topicId: string) => {
    if (!course) return;
    
    // Find the current topic to get its completion status
    let currentTopic = null;
    for (const chapter of course.chapters) {
      const topic = chapter.topics.find(t => t.id === topicId);
      if (topic) {
        currentTopic = topic;
        break;
      }
    }
    
    if (!currentTopic) return;
    
    const newCompletionStatus = !currentTopic.isCompleted;
    
    try {
      const response = await fetch(`/api/courses/${course.id}/progress`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topicId,
          isCompleted: newCompletionStatus
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        setCourse(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            progress: data.overallProgress,
            chapters: prev.chapters.map(chapter => {
              const updatedTopics = chapter.topics.map(topic => 
                topic.id === topicId 
                  ? { ...topic, isCompleted: newCompletionStatus }
                  : topic
              );
              
              // Calculate chapter completion based on updated topics
              const isChapterCompleted = updatedTopics.length > 0 && updatedTopics.every(topic => topic.isCompleted);
              
              return {
                ...chapter,
                isCompleted: isChapterCompleted,
                topics: updatedTopics
              };
            })
          };
        });
        
        // Update selectedTopic if it's the one being toggled
        if (selectedTopic?.id === topicId) {
          setSelectedTopic(prev => prev ? { ...prev, isCompleted: newCompletionStatus } : null);
        }
      } else {
        const errorData = await response.json();
        alert(`Failed to update progress: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Error updating progress:', error);
      alert('Failed to update progress. Please try again.');
    }
  };

  const getTopicIcon = (type: string) => {
    switch (type) {
      case 'video': return <Play className="h-4 w-4" />;
      case 'text': return <FileText className="h-4 w-4" />;
      case 'quiz': return <HelpCircle className="h-4 w-4" />;
      case 'assignment': return <FileText className="h-4 w-4" />;
      default: return <Circle className="h-4 w-4" />;
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

  const extractYouTubeId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1">
                <div className="h-96 bg-gray-200 rounded"></div>
              </div>
              <div className="lg:col-span-2">
                <div className="h-96 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-gray-50 pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <Button 
            variant="ghost" 
            onClick={() => router.push('/courses')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Courses
          </Button>
          
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <h1 className="text-3xl font-bold text-gray-900">{course.title}</h1>
                {(session?.user as any)?.id === course.instructor.id && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push(`/courses/${course.id}/edit`)}
                    className="flex items-center gap-2"
                  >
                    <Edit className="h-4 w-4" />
                    Edit Course
                  </Button>
                )}
              </div>
              <p className="text-gray-600 mb-4">{course.description}</p>
              
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-4">
                <div className="flex items-center gap-2">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={course.instructor.image} />
                    <AvatarFallback>{course.instructor.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <span>{course.instructor.name}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-current text-yellow-400" />
                  <span>{course.rating}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  <span>{course.studentCount} students</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>{course.duration}</span>
                </div>
                <Badge className={getLevelColor(course.level)}>
                  {course.level}
                </Badge>
              </div>

              {/* Progress Bar for Enrolled Users */}
              {course.isEnrolled && (
                <div className="mb-6">
                  <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                    <span>Course Progress</span>
                    <span>{course.progress}%</span>
                  </div>
                  <Progress value={course.progress} className="h-2" />
                </div>
              )}

              {/* Enroll Button for Non-Enrolled Users */}
              {!course.isEnrolled && (
                <div className="mb-6">
                  <Button 
                    size="lg" 
                    className="w-full md:w-auto"
                    onClick={() => handleEnroll()}
                  >
                    Enroll in Course
                  </Button>
                </div>
              )}
            </div>
            
            <div className="lg:w-80">
              <img
                src={course.thumbnail || '/api/placeholder/400/300'}
                alt={course.title}
                className="w-full h-48 object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => router.push(`/courses/${course.id}`)}
              />
            </div>
          </div>
        </div>

        {/* Mobile Chapter Toggle */}
        {isMobile && (
          <div className="mb-4">
            <Button
              variant="outline"
              onClick={() => setShowChapters(!showChapters)}
              className="w-full"
            >
              {showChapters ? <ChevronDown className="h-4 w-4 mr-2" /> : <ChevronRight className="h-4 w-4 mr-2" />}
              {showChapters ? 'Hide' : 'Show'} Chapters
            </Button>
          </div>
        )}

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chapters Sidebar */}
          <div className={`lg:col-span-1 ${isMobile ? (showChapters ? 'block' : 'hidden') : 'block'}`}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Course Content
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="space-y-1">
                  {course.chapters.map((chapter, index) => (
                    <div key={chapter.id} className="border-b border-gray-100 last:border-b-0">
                      <button
                        onClick={() => {
                          setSelectedChapter(chapter);
                          if (chapter.topics.length > 0) {
                            setSelectedTopic(chapter.topics[0]);
                          }
                          if (isMobile) {
                            setShowChapters(false);
                          }
                        }}
                        className={`w-full text-left p-4 hover:bg-gray-50 transition-colors ${
                          selectedChapter?.id === chapter.id ? 'bg-blue-50 border-r-2 border-blue-500' : ''
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {chapter.isCompleted ? (
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            ) : (
                              <Circle className="h-4 w-4 text-gray-400" />
                            )}
                            <span className="font-medium text-sm">
                              Chapter {index + 1}: {chapter.title}
                            </span>
                          </div>
                          <span className="text-xs text-gray-500">{chapter.duration}</span>
                        </div>
                        <p className="text-xs text-gray-600 ml-6">{chapter.description}</p>
                      </button>
                      
                      {/* Topics */}
                      {selectedChapter?.id === chapter.id && (
                        <div className="bg-gray-50">
                          {chapter.topics.map((topic) => (
                            <button
                              key={topic.id}
                              onClick={() => {
                                setSelectedTopic(topic);
                                if (isMobile) {
                                  setShowChapters(false);
                                }
                              }}
                              className={`w-full text-left p-3 pl-8 hover:bg-gray-100 transition-colors flex items-center justify-between ${
                                selectedTopic?.id === topic.id ? 'bg-blue-100' : ''
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                {getTopicIcon(topic.type)}
                                <div className="flex flex-col">
                                  <span className="text-sm">{topic.title}</span>
                                  {topic.description && (
                                    <span className="text-xs text-gray-500 line-clamp-1">{topic.description}</span>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-500">{topic.duration}</span>
                                {topic.isCompleted ? (
                                  <CheckCircle className="h-3 w-3 text-green-600" />
                                ) : (
                                  <Circle className="h-3 w-3 text-gray-400" />
                                )}
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Content Area */}
          <div className={`lg:col-span-2 ${isMobile && showChapters ? 'hidden' : 'block'}`}>
            {selectedTopic ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <span>{selectedTopic.title}</span>
                      {selectedTopic.description && (
                        <span className="text-sm text-gray-600 font-normal mt-1">{selectedTopic.description}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {getTopicIcon(selectedTopic.type)}
                      <span className="text-sm text-gray-500">{selectedTopic.duration}</span>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedTopic.type === 'video' && selectedTopic.youtubeUrl ? (
                    <div className="mb-6">
                      <div className="relative w-full h-0 pb-[56.25%] rounded-lg overflow-hidden">
                        <iframe
                          src={`https://www.youtube.com/embed/${extractYouTubeId(selectedTopic.youtubeUrl)}`}
                          title={selectedTopic.title}
                          className="absolute top-0 left-0 w-full h-full"
                          allowFullScreen
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="mb-6 p-8 text-center text-gray-500">
                      <FileText className="h-12 w-12 mx-auto mb-4" />
                      <p>Content coming soon...</p>
                    </div>
                  )}
                  
                  <div className="flex justify-between items-center">
                    <div className="text-sm text-gray-600">
                      {selectedTopic.isCompleted ? 'Completed' : 'Not completed'}
                    </div>
                    <Button
                      variant={selectedTopic.isCompleted ? "outline" : "default"}
                      onClick={() => handleTopicComplete(selectedTopic.id)}
                    >
                      {selectedTopic.isCompleted ? 'Mark as Incomplete' : 'Mark as Complete'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-12 text-center">
                  <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Select a topic to start learning</h3>
                  <p className="text-gray-600">Choose a chapter and topic from the sidebar to begin.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
