'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  BookOpen, 
  Plus,
  Trash2,
  Save,
  ArrowLeft,
  Upload,
  X,
  ChevronDown,
  ChevronRight,
  Play,
  FileText,
  HelpCircle,
  Edit3
} from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Chapter {
  id: string;
  title: string;
  description: string;
  topics: Topic[];
}

interface Topic {
  id: string;
  title: string;
  description?: string;
  type: 'video' | 'text' | 'quiz' | 'assignment';
  youtubeUrl?: string;
  content?: string;
  duration?: string;
}

interface CourseFormData {
  title: string;
  description: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  category: string;
  thumbnail?: string;
  chapters: Chapter[];
}

export default function CreateCoursePage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(new Set());
  
  const [formData, setFormData] = useState<CourseFormData>({
    title: '',
    description: '',
    level: 'Beginner',
    category: '',
    chapters: []
  });

  const categories = [
    'Web Development',
    'Data Science',
    'Mobile Development',
    'Design',
    'Business',
    'Marketing',
    'Photography',
    'Music',
    'Health & Fitness',
    'Language Learning',
    'Programming',
    'Other'
  ];

  const topicTypes = [
    { value: 'video', label: 'Video', icon: Play },
    { value: 'text', label: 'Text Content', icon: FileText },
    { value: 'quiz', label: 'Quiz', icon: HelpCircle },
    { value: 'assignment', label: 'Assignment', icon: Edit3 }
  ];

  const generateId = () => Math.random().toString(36).substr(2, 9);

  const addChapter = () => {
    const newChapter: Chapter = {
      id: generateId(),
      title: '',
      description: '',
      topics: []
    };
    setFormData(prev => ({
      ...prev,
      chapters: [...prev.chapters, newChapter]
    }));
    setExpandedChapters(prev => new Set(prev).add(newChapter.id));
  };

  const updateChapter = (chapterId: string, field: keyof Chapter, value: string) => {
    setFormData(prev => ({
      ...prev,
      chapters: prev.chapters.map(chapter =>
        chapter.id === chapterId ? { ...chapter, [field]: value } : chapter
      )
    }));
  };

  const deleteChapter = (chapterId: string) => {
    setFormData(prev => ({
      ...prev,
      chapters: prev.chapters.filter(chapter => chapter.id !== chapterId)
    }));
    setExpandedChapters(prev => {
      const newSet = new Set(prev);
      newSet.delete(chapterId);
      return newSet;
    });
  };

  const addTopic = (chapterId: string) => {
    const newTopic: Topic = {
      id: generateId(),
      title: '',
      description: '',
      type: 'video',
      youtubeUrl: '',
      content: '',
      duration: ''
    };
    setFormData(prev => ({
      ...prev,
      chapters: prev.chapters.map(chapter =>
        chapter.id === chapterId
          ? { ...chapter, topics: [...chapter.topics, newTopic] }
          : chapter
      )
    }));
  };

  const updateTopic = (chapterId: string, topicId: string, field: keyof Topic, value: string) => {
    setFormData(prev => ({
      ...prev,
      chapters: prev.chapters.map(chapter =>
        chapter.id === chapterId
          ? {
              ...chapter,
              topics: chapter.topics.map(topic =>
                topic.id === topicId ? { ...topic, [field]: value } : topic
              )
            }
          : chapter
      )
    }));
  };

  const deleteTopic = (chapterId: string, topicId: string) => {
    setFormData(prev => ({
      ...prev,
      chapters: prev.chapters.map(chapter =>
        chapter.id === chapterId
          ? { ...chapter, topics: chapter.topics.filter(topic => topic.id !== topicId) }
          : chapter
      )
    }));
  };

  const toggleChapterExpansion = (chapterId: string) => {
    setExpandedChapters(prev => {
      const newSet = new Set(prev);
      if (newSet.has(chapterId)) {
        newSet.delete(chapterId);
      } else {
        newSet.add(chapterId);
      }
      return newSet;
    });
  };

  const handleSave = async () => {
    if (!formData.title.trim() || !formData.description.trim()) {
      alert('Please fill in the course title and description');
      return;
    }

    if (formData.chapters.length === 0) {
      alert('Please add at least one chapter');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch('/api/courses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const course = await response.json();
        router.push(`/courses/${course.id}`);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create course');
      }
    } catch (error) {
      console.error('Error creating course:', error);
      alert(`Failed to create course: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setSaving(false);
    }
  };

  const getTopicIcon = (type: string) => {
    const topicType = topicTypes.find(t => t.value === type);
    return topicType ? topicType.icon : Play;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="space-y-4">
              <div className="h-32 bg-gray-200 rounded"></div>
              <div className="h-48 bg-gray-200 rounded"></div>
            </div>
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
            onClick={() => router.push('/courses')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Courses
          </Button>
          
          <div className="flex items-center gap-3 mb-4">
            <BookOpen className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Create New Course</h1>
          </div>
          <p className="text-gray-600">Build and structure your course content for students.</p>
        </div>

        <div className="space-y-8">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Course Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="title">Course Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter course title"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="description">Course Description *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe what students will learn in this course"
                  rows={4}
                  className="mt-1"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="level">Difficulty Level</Label>
                  <Select
                    value={formData.level}
                    onValueChange={(value: 'Beginner' | 'Intermediate' | 'Advanced') =>
                      setFormData(prev => ({ ...prev, level: value }))
                    }
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Beginner">Beginner</SelectItem>
                      <SelectItem value="Intermediate">Intermediate</SelectItem>
                      <SelectItem value="Advanced">Advanced</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(category => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="thumbnail">Course Thumbnail URL</Label>
                <Input
                  id="thumbnail"
                  value={formData.thumbnail || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, thumbnail: e.target.value }))}
                  placeholder="https://example.com/image.jpg"
                  className="mt-1"
                />
              </div>
            </CardContent>
          </Card>

          {/* Course Content */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Course Content</CardTitle>
                <Button onClick={addChapter} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Chapter
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {formData.chapters.length === 0 ? (
                <div className="text-center py-12">
                  <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No chapters yet</h3>
                  <p className="text-gray-600 mb-4">Add your first chapter to start building your course.</p>
                  <Button onClick={addChapter}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add First Chapter
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {formData.chapters.map((chapter, chapterIndex) => (
                    <div key={chapter.id} className="border border-gray-200 rounded-lg">
                      <div className="p-4 bg-gray-50 border-b border-gray-200">
                        <div className="flex items-center justify-between">
                          <button
                            onClick={() => toggleChapterExpansion(chapter.id)}
                            className="flex items-center gap-2 text-left flex-1"
                          >
                            {expandedChapters.has(chapter.id) ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                            <span className="font-medium">
                              Chapter {chapterIndex + 1}: {chapter.title || 'Untitled Chapter'}
                            </span>
                          </button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteChapter(chapter.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      {expandedChapters.has(chapter.id) && (
                        <div className="p-4 space-y-4">
                          <div>
                            <Label>Chapter Title</Label>
                            <Input
                              value={chapter.title}
                              onChange={(e) => updateChapter(chapter.id, 'title', e.target.value)}
                              placeholder="Enter chapter title"
                              className="mt-1"
                            />
                          </div>

                          <div>
                            <Label>Chapter Description</Label>
                            <Textarea
                              value={chapter.description}
                              onChange={(e) => updateChapter(chapter.id, 'description', e.target.value)}
                              placeholder="Describe what this chapter covers"
                              rows={2}
                              className="mt-1"
                            />
                          </div>

                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <Label>Topics</Label>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => addTopic(chapter.id)}
                              >
                                <Plus className="h-4 w-4 mr-2" />
                                Add Topic
                              </Button>
                            </div>

                            {chapter.topics.length === 0 ? (
                              <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                                <p className="text-gray-500 mb-2">No topics yet</p>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => addTopic(chapter.id)}
                                >
                                  <Plus className="h-4 w-4 mr-2" />
                                  Add First Topic
                                </Button>
                              </div>
                            ) : (
                              <div className="space-y-3">
                                {chapter.topics.map((topic, topicIndex) => {
                                  const TopicIcon = getTopicIcon(topic.type);
                                  return (
                                    <div key={topic.id} className="border border-gray-200 rounded-lg p-4">
                                      <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-2">
                                          <TopicIcon className="h-4 w-4" />
                                          <span className="font-medium">
                                            Topic {topicIndex + 1}: {topic.title || 'Untitled Topic'}
                                          </span>
                                        </div>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => deleteTopic(chapter.id, topic.id)}
                                          className="text-red-600 hover:text-red-700"
                                        >
                                          <X className="h-4 w-4" />
                                        </Button>
                                      </div>

                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                          <Label>Topic Title</Label>
                                          <Input
                                            value={topic.title}
                                            onChange={(e) => updateTopic(chapter.id, topic.id, 'title', e.target.value)}
                                            placeholder="Enter topic title"
                                            className="mt-1"
                                          />
                                        </div>

                                        <div>
                                          <Label>Topic Type</Label>
                                          <Select
                                            value={topic.type}
                                            onValueChange={(value: 'video' | 'text' | 'quiz' | 'assignment') =>
                                              updateTopic(chapter.id, topic.id, 'type', value)
                                            }
                                          >
                                            <SelectTrigger className="mt-1">
                                              <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                              {topicTypes.map(type => (
                                                <SelectItem key={type.value} value={type.value}>
                                                  <div className="flex items-center gap-2">
                                                    <type.icon className="h-4 w-4" />
                                                    {type.label}
                                                  </div>
                                                </SelectItem>
                                              ))}
                                            </SelectContent>
                                          </Select>
                                        </div>
                                      </div>

                                      <div className="mt-4">
                                        <Label>Topic Description</Label>
                                        <Textarea
                                          value={topic.description || ''}
                                          onChange={(e) => updateTopic(chapter.id, topic.id, 'description', e.target.value)}
                                          placeholder="Describe what this topic covers..."
                                          rows={2}
                                          className="mt-1"
                                        />
                                      </div>

                                      {topic.type === 'video' && (
                                        <div className="mt-4">
                                          <Label>YouTube URL</Label>
                                          <Input
                                            value={topic.youtubeUrl || ''}
                                            onChange={(e) => updateTopic(chapter.id, topic.id, 'youtubeUrl', e.target.value)}
                                            placeholder="https://www.youtube.com/watch?v=..."
                                            className="mt-1"
                                          />
                                        </div>
                                      )}

                                      {(topic.type === 'text' || topic.type === 'quiz' || topic.type === 'assignment') && (
                                        <div className="mt-4">
                                          <Label>Content</Label>
                                          <Textarea
                                            value={topic.content || ''}
                                            onChange={(e) => updateTopic(chapter.id, topic.id, 'content', e.target.value)}
                                            placeholder="Enter content, questions, or instructions..."
                                            rows={3}
                                            className="mt-1"
                                          />
                                        </div>
                                      )}

                                      <div className="mt-4">
                                        <Label>Duration (optional)</Label>
                                        <Input
                                          value={topic.duration || ''}
                                          onChange={(e) => updateTopic(chapter.id, topic.id, 'duration', e.target.value)}
                                          placeholder="e.g., 15 min, 1 hour"
                                          className="mt-1"
                                        />
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end gap-4">
            <Button
              variant="outline"
              onClick={() => router.push('/courses')}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving || !formData.title.trim() || !formData.description.trim()}
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creating...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Create Course
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
