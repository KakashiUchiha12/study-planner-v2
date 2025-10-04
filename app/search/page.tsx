"use client";

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Search, Users, FileText, BookOpen, File, ArrowLeft, HelpCircle, X, Calendar, User, MessageSquare, Heart, Eye, Download, ExternalLink, ThumbsUp, Users as CommunityIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Link from 'next/link';
import { MarkdownRenderer } from '@/components/social/MarkdownRenderer';
import { PostMediaGrid } from '@/components/social/PostMediaGrid';
import { ReactionSheet } from '@/components/social/ReactionSheet';
import { PostActions } from '@/components/social/PostActions';
import { CommentsThread } from '@/components/social/CommentsThread';
import { cn } from '@/lib/utils';
import { useSession } from 'next-auth/react';
import socketIOClient from '@/lib/socketio-client';
import { useCommunityMessageNotifications } from '@/lib/hooks/useCommunityMessageNotifications';
import { TagDisplay } from '@/lib/utils/tag-display';

const REACTIONS: { key: string; emoji: string }[] = [
  { key: "like", emoji: "👍" },
  { key: "heart", emoji: "❤️" },
  { key: "wow", emoji: "😮" },
  { key: "laugh", emoji: "😂" },
  { key: "sad", emoji: "😢" },
  { key: "fire", emoji: "🔥" },
];

interface SearchResult {
  id: string;
  type: 'user' | 'post' | 'subject' | 'document' | 'material' | 'community';
  name?: string;
  title?: string;
  content?: string;
  description?: string;
  user?: {
    id: string;
    name: string;
    image?: string;
  };
  [key: string]: any;
}

const TYPE_ICONS = {
  user: Users,
  post: FileText,
  subject: BookOpen,
  document: File,
  material: FileText,
  community: CommunityIcon,
  default: HelpCircle
};

const TYPE_LABELS = {
  user: 'Users',
  post: 'Posts',
  subject: 'Subjects',
  document: 'Documents',
  material: 'Materials',
  community: 'Communities',
  default: 'Other'
};

export default function SearchPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: session } = useSession();
  const { getCommunityNotificationCount, refreshNotifications } = useCommunityMessageNotifications();

  // Note: Removed clearAllNotifications - notifications should only be cleared when user actually reads messages
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [selectedType, setSelectedType] = useState(searchParams.get('type') || 'all');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [selectedItem, setSelectedItem] = useState<SearchResult | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [downloadingResources, setDownloadingResources] = useState<Set<string>>(new Set());

  // Perform search
  const performSearch = async (searchQuery: string, type: string = 'all') => {
    if (searchQuery.length < 1) {
      setResults([]);
      setTotal(0);
      return;
    }

    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        q: searchQuery,
        type,
        limit: '50'
      });

      const response = await fetch(`/api/search?${params}`);
      const data = await response.json();

      if (data.results) {
        // Handle different result structures from API
        if (Array.isArray(data.results)) {
          setResults(data.results);
        } else {
          // If results is an object, flatten it into an array
          const flattenedResults: SearchResult[] = [];
          Object.values(data.results).forEach((typeResults: any) => {
            if (Array.isArray(typeResults)) {
              flattenedResults.push(...typeResults);
            }
          });
          setResults(flattenedResults);
        }
        setTotal(data.total);
      }
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
      setTotal(0);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch individual item by ID
  const fetchItemById = async (id: string, type: string) => {
    try {
      const params = new URLSearchParams({
        q: id,
        type,
        limit: '1'
      });

      const response = await fetch(`/api/search?${params}`);
      const data = await response.json();

      if (data.results) {
        // Handle different result structures from API
        let searchResults: SearchResult[] = [];
        if (Array.isArray(data.results)) {
          searchResults = data.results;
        } else {
          // If results is an object, flatten it into an array
          Object.values(data.results).forEach((typeResults: any) => {
            if (Array.isArray(typeResults)) {
              searchResults.push(...typeResults);
            }
          });
        }
        
        const item = searchResults.find((result: SearchResult) => result.id === id);
        if (item) {
          setSelectedItem(item);
          setShowDetail(true);
          return item;
        }
      }
    } catch (error) {
      console.error('Error fetching item:', error);
    }
    return null;
  };

  // Handle URL parameters
  useEffect(() => {
    const itemId = searchParams.get('item');
    if (itemId && !selectedItem) {
      // First try to find in current results
      if (results.length > 0) {
        const item = results.find(result => result.id === itemId);
        if (item) {
          setSelectedItem(item);
          setShowDetail(true);
        }
      } else {
        // Try all types if type is 'all'
        const types = ['user', 'post', 'subject', 'document', 'material', 'community'];
        for (const type of types) {
          fetchItemById(itemId, type).then(item => {
            if (item) return; // Found it, stop searching
          });
        }
      }
    }
  }, [searchParams, results, selectedItem]);

  // Initial search
  useEffect(() => {
    if (query.length >= 1) {
      performSearch(query, selectedType);
    }
  }, [query, selectedType]);

  // Handle search input change
  const handleSearchChange = (newQuery: string) => {
    setQuery(newQuery);
    if (newQuery.length >= 1) {
      performSearch(newQuery, selectedType);
    } else {
      setResults([]);
      setTotal(0);
    }
  };

  // Handle type change
  const handleTypeChange = (type: string) => {
    setSelectedType(type);
    if (query.length >= 1) {
      performSearch(query, type);
    }
  };

  // Handle item click - Navigate to appropriate page
  const handleItemClick = (item: SearchResult) => {
    switch (item.type) {
      case 'post':
        // Navigate to post detail page
        router.push(`/posts/${item.id}`);
        break;
      case 'user':
        // Navigate to user profile
        router.push(`/profile/${item.id}`);
        break;
      case 'community':
        // Navigate to community page
        router.push(`/communities/${item.id}`);
        break;
      case 'subject':
        // Import the subject
        handleImportSubject(item);
        break;
      case 'document':
      case 'material':
        // For now, show detail view (could navigate to appropriate page later)
        setSelectedItem(item);
        setShowDetail(true);
        break;
      default:
        setSelectedItem(item);
        setShowDetail(true);
    }
  };

  // Handle subject import
  const handleMediaDownload = async (mediaItem: any) => {
    try {
      // Add to downloading set
      setDownloadingResources(prev => new Set(prev).add(mediaItem.resourceId || 'unknown'));

      // Call the download API to increment the count
      const downloadUrl = `/api/communities/resources/${mediaItem.resourceId}/download?fileId=${mediaItem.id}`;
      const response = await fetch(downloadUrl);
      
      if (response.ok) {
        // Get the filename from the response headers or use the media item filename
        const contentDisposition = response.headers.get('content-disposition');
        let filename = mediaItem.name || 'download';
        
        if (contentDisposition) {
          const filenameMatch = contentDisposition.match(/filename="(.+)"/);
          if (filenameMatch) {
            filename = filenameMatch[1];
          }
        }

        // Create blob and download
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        // Wait a moment for the download to complete, then refetch
        setTimeout(async () => {
          try {
            const refreshResponse = await fetch(`/api/search?q=${encodeURIComponent(query)}&type=${selectedType}&limit=20&offset=0`);
            if (refreshResponse.ok) {
              const refreshData = await refreshResponse.json();
              setResults(refreshData.results || []);
            }
          } catch (error) {
            console.error('Error refetching search results:', error);
          }
        }, 1000);
      } else {
        // If API call fails, fallback to direct download
        const a = document.createElement('a');
        a.href = mediaItem.url;
        a.download = mediaItem.name || 'download';
        document.body.appendChild(a);
        a.click();
        a.remove();
        console.error('Failed to increment download count for media item');
      }
    } catch (error) {
      console.error('Error downloading media item:', error);
      // Fallback to direct download
      const a = document.createElement('a');
      a.href = mediaItem.url;
      a.download = mediaItem.name || 'download';
      document.body.appendChild(a);
      a.click();
      a.remove();
    } finally {
      // Remove from downloading set
      setDownloadingResources(prev => {
        const newSet = new Set(prev);
        newSet.delete(mediaItem.resourceId || 'unknown');
        return newSet;
      });
    }
  };

  const handleImportSubject = async (subject: SearchResult) => {
    if (!session?.user) {
      console.error('User not authenticated');
      return;
    }

    try {
      const response = await fetch('/api/subjects/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sourceSubjectId: subject.id
        }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Subject imported successfully:', result);
        // You could show a success toast here
        alert('Subject imported successfully!');
      } else {
        const error = await response.json();
        console.error('Failed to import subject:', error);
        alert(`Failed to import subject: ${error.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error importing subject:', error);
      alert('Failed to import subject. Please try again.');
    }
  };

  // Handle resource download
  const handleDownload = async (resource: SearchResult, fileId?: string) => {
    try {
      // Add to downloading set
      setDownloadingResources(prev => new Set(prev).add(resource.id));

      // For links, call download API first to increment count
      if (resource.materialType === 'link' && resource.url) {
        const downloadUrl = `/api/communities/resources/${resource.id}/download`;
        const response = await fetch(downloadUrl);
        
        if (response.ok) {
          // Open link in new tab
          window.open(resource.url, '_blank', 'noopener,noreferrer');

          // Wait a moment for the download to complete, then refetch
          setTimeout(async () => {
            try {
              const refreshResponse = await fetch(`/api/search?q=${encodeURIComponent(query)}&type=${selectedType}&limit=20&offset=0`);
              if (refreshResponse.ok) {
                const refreshData = await refreshResponse.json();
                setResults(refreshData.results || []);
              }
            } catch (error) {
              console.error('Error refetching search results:', error);
            }
          }, 1000);
        } else {
          // If API call fails, still open the link but don't increment count
          window.open(resource.url, '_blank', 'noopener,noreferrer');
          console.error('Failed to increment download count for link');
        }
        return;
      }

      // For files, trigger download
      const downloadUrl = fileId 
        ? `/api/communities/resources/${resource.id}/download?fileId=${fileId}`
        : `/api/communities/resources/${resource.id}/download`;
      
      const response = await fetch(downloadUrl);
      
      if (response.ok) {
        // Get the filename from the response headers or use the resource filename
        const contentDisposition = response.headers.get('content-disposition');
        let filename = resource.fileName || 'download';
        
        if (contentDisposition) {
          const filenameMatch = contentDisposition.match(/filename="(.+)"/);
          if (filenameMatch) {
            filename = filenameMatch[1];
          }
        }

        // Create blob and download
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        // Wait a moment for the download to complete, then refetch
        setTimeout(async () => {
          try {
            const refreshResponse = await fetch(`/api/search?q=${encodeURIComponent(query)}&type=${selectedType}&limit=20&offset=0`);
            if (refreshResponse.ok) {
              const refreshData = await refreshResponse.json();
              setResults(refreshData.results || []);
            }
          } catch (error) {
            console.error('Error refetching search results:', error);
          }
        }, 1000);
      } else {
        const errorData = await response.json();
        console.error('Download failed:', errorData.error);
        alert(`Download failed: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Error downloading resource:', error);
      alert('Failed to download resource. Please try again.');
    } finally {
      // Remove from downloading set
      setDownloadingResources(prev => {
        const newSet = new Set(prev);
        newSet.delete(resource.id);
        return newSet;
      });
    }
  };

  // Group results by type and filter based on selected type
  const groupedResults = results.reduce((acc, result) => {
    // If a specific type is selected, only include results of that type
    if (selectedType !== 'all' && result.type !== selectedType) {
      return acc;
    }
    
    if (!acc[result.type]) {
      acc[result.type] = [];
    }
    acc[result.type].push(result);
    return acc;
  }, {} as Record<string, SearchResult[]>);

  // Render detailed view
  const renderDetailView = (item: SearchResult) => {
    const Icon = TYPE_ICONS[item.type as keyof typeof TYPE_ICONS] || TYPE_ICONS.default;

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowDetail(false)}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Results
          </Button>
          <div className="flex items-center gap-2">
            <Icon className="h-5 w-5" />
            <span className="font-medium">{TYPE_LABELS[item.type as keyof typeof TYPE_LABELS] || TYPE_LABELS.default}</span>
          </div>
        </div>

        {/* Content based on type */}
        {renderItemDetail(item)}
      </div>
    );
  };

  // Render item detail based on type
  const renderItemDetail = (item: SearchResult) => {
    switch (item.type) {
      case 'user':
        return (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                  {item.image ? (
                    <img src={item.image} alt={item.name} className="h-16 w-16 rounded-full object-cover" />
                  ) : (
                    <User className="h-8 w-8 text-primary" />
                  )}
                </div>
                <div>
                  <h2 className="text-xl font-semibold">{item.name}</h2>
                  {item.bio && <p className="text-muted-foreground">{item.bio}</p>}
                  {item.university && (
                    <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                      <span>{item.university}</span>
                      {item.program && <span>• {item.program}</span>}
                    </div>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-6 text-sm">
                <div>
                  <span className="font-medium">{item.postsCount || 0}</span>
                  <span className="text-muted-foreground ml-1">Posts</span>
                </div>
                <div>
                  <span className="font-medium">{item.subjectsCount || 0}</span>
                  <span className="text-muted-foreground ml-1">Subjects</span>
                </div>
              </div>
              <div className="mt-4">
                <Button asChild>
                  <Link href={`/profile/${item.id}`}>
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View Profile
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        );

      case 'post':
        return (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  {item.user?.image ? (
                    <img src={item.user.image} alt={item.user.name} className="h-10 w-10 rounded-full object-cover" />
                  ) : (
                    <User className="h-5 w-5 text-primary" />
                  )}
                </div>
                <div>
                  <p className="font-medium">{item.user?.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(item.createdAt).toLocaleDateString()}
                    {item.community && (
                      <span className="ml-2">
                        · <a 
                          href={`/communities/${item.community.slug}`}
                          className="hover:underline text-blue-600 hover:text-blue-800"
                        >
                          {item.community.name}
                        </a>
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {item.content && (
                <div className="prose prose-sm max-w-none">
                  <MarkdownRenderer content={item.content} />
                </div>
              )}
              {item.media && item.media.length > 0 && (
                <PostMediaGrid 
                  media={item.media.map((media: any) => ({
                    id: media.id,
                    kind: media.kind?.toLowerCase() as "image" | "file" | "video",
                    url: media.url,
                    mimeType: media.mimeType,
                    name: media.name,
                    size: media.size,
                    thumbnailUrl: media.thumbnailUrl?.replace(/\\/g, '/'),
                    thumbnail: media.thumbnailUrl?.replace(/\\/g, '/'), // Alternative thumbnail property
                    resourceId: item.id
                  }))} 
                  onDownload={handleMediaDownload}
                />
              )}
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <MessageSquare className="h-4 w-4" />
                  <span>{item.commentsCount || 0}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Heart className="h-4 w-4" />
                  <span>{item.reactionsCount || 0}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Eye className="h-4 w-4" />
                  <span>{item.viewsCount || 0}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button asChild>
                  <Link href={`/posts/${item.id}`}>
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View Full Post
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        );

      case 'subject':
        return (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-4">
                <div 
                  className="h-12 w-12 rounded-lg flex items-center justify-center text-white font-semibold"
                  style={{ backgroundColor: item.color || '#3b82f6' }}
                >
                  {item.name?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-xl font-semibold">{item.name}</h2>
                  {item.code && <p className="text-muted-foreground">{item.code}</p>}
                  {item.instructor && <p className="text-sm text-muted-foreground">Instructor: {item.instructor}</p>}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {item.description && (
                <p className="text-muted-foreground">{item.description}</p>
              )}
              <div className="flex items-center gap-6 text-sm">
                <span>{item.chaptersCount || 0} Chapters</span>
                <span>{item.materialsCount || 0} Materials</span>
                <span>{item.tasksCount || 0} Tasks</span>
              </div>
              {item.progress !== undefined && (
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Progress</span>
                    <span>{item.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full transition-all"
                      style={{ width: `${item.progress}%` }}
                    />
                  </div>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Button onClick={() => handleImportSubject(item)}>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Import Subject
                </Button>
              </div>
            </CardContent>
          </Card>
        );

      case 'document':
        return (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <File className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold">{item.originalName || item.name}</h2>
                  <p className="text-muted-foreground">{item.fileType}</p>
                  {item.size && (
                    <p className="text-sm text-muted-foreground">
                      {(item.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {item.tags && (
                <TagDisplay
                  tags={item.tags.split(',').map((tag: string) => tag.trim())}
                  maxVisible={3}
                  communityName={item.title}
                />
              )}
              <div className="flex items-center gap-2">
                <Button>
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
                <Button variant="outline">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View Details
                </Button>
              </div>
            </CardContent>
          </Card>
        );

      case 'material':
        return (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  {item.user?.image ? (
                    <img src={item.user.image} alt={item.user.name} className="h-10 w-10 rounded-full object-cover" />
                  ) : (
                    <User className="h-5 w-5 text-primary" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-semibold">{item.title}</h2>
                    <Badge variant="outline">{item.materialType}</Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>by {item.user?.name}</span>
                    <span>•</span>
                    <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                    {item.community && (
                      <>
                        <span>•</span>
                        <span>Community: {item.community.name}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {item.content && (
                <div className="prose prose-sm max-w-none">
                  <MarkdownRenderer content={item.content} />
                </div>
              )}
              
              {/* Media preview if available */}
              {item.media && (() => {
                let mediaArray: any[] = [];
                try {
                  if (Array.isArray(item.media)) {
                    mediaArray = item.media;
                  } else if (typeof item.media === 'string') {
                    mediaArray = JSON.parse(item.media || '[]');
                  }
                } catch (error) {
                  console.error('Error parsing media:', error);
                  mediaArray = [];
                }
                
                return mediaArray.length > 0 && (
                  <div className="mt-3">
                    <PostMediaGrid 
                      media={mediaArray.map(item => ({ ...item, resourceId: item.id }))} 
                      onDownload={handleMediaDownload}
                    />
                  </div>
                );
              })()}

              {/* File preview if available */}
              {item.fileUrl && (
                <div className="mt-3">
                  <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{item.fileName || 'Attached File'}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.materialType} • {item.fileSize ? `${(item.fileSize / 1024 / 1024).toFixed(2)} MB` : 'Unknown size'}
                      </p>
                    </div>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleDownload(item)}
                      disabled={downloadingResources.has(item.id)}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      {downloadingResources.has(item.id) ? 'Downloading...' : 'Download'}
                    </Button>
                  </div>
                </div>
              )}

              {/* Link preview if available */}
              {item.url && (
                <div className="mt-3">
                  <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                    <ExternalLink className="h-5 w-5 text-muted-foreground" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">External Link</p>
                      <p className="text-xs text-muted-foreground truncate">{item.url}</p>
                    </div>
                    <Button size="sm" variant="outline" asChild>
                      <a href={item.url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Open
                      </a>
                    </Button>
                  </div>
                </div>
              )}

              {/* Tags */}
              {item.tags && item.tags !== '[]' && (
                <TagDisplay
                  tags={JSON.parse(item.tags)}
                  maxVisible={3}
                  communityName={item.title}
                />
              )}

              {/* Stats */}
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                {item.downloadCount > 0 && (
                  <div className="flex items-center gap-1">
                    <Download className="h-4 w-4" />
                    <span>{item.downloadCount} downloads</span>
                  </div>
                )}
                {item.isPinned && (
                  <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200">
                    Pinned
                  </Badge>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Button>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View Material
                </Button>
                {item.fileUrl && (
                  <Button 
                    variant="outline"
                    onClick={() => handleDownload(item)}
                    disabled={downloadingResources.has(item.id)}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    {downloadingResources.has(item.id) ? 'Downloading...' : 'Download'}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        );

      case 'community':
        return (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  {item.avatar ? (
                    <img src={item.avatar} alt={item.name} className="h-12 w-12 rounded-full object-cover" />
                  ) : (
                    <CommunityIcon className="h-6 w-6 text-primary" />
                  )}
                </div>
                <div>
                  <h2 className="text-xl font-semibold">{item.name}</h2>
                  <p className="text-muted-foreground">{item.category}</p>
                  {item.university && (
                    <p className="text-sm text-muted-foreground">
                      {item.university} • {item.program}
                    </p>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {item.description && (
                <p className="text-muted-foreground">{item.description}</p>
              )}
              <div className="flex items-center gap-6 text-sm">
                <div>
                  <span className="font-medium">{item.membersCount || 0}</span>
                  <span className="text-muted-foreground ml-1">Members</span>
                </div>
                <div>
                  <span className="font-medium">{item.postsCount || 0}</span>
                  <span className="text-muted-foreground ml-1">Posts</span>
                </div>
                <div>
                  <span className="font-medium">{item.eventsCount || 0}</span>
                  <span className="text-muted-foreground ml-1">Events</span>
                </div>
              </div>
              {item.tags && (
                <TagDisplay
                  tags={item.tags.split(',').map((tag: string) => tag.trim())}
                  maxVisible={3}
                  communityName={item.name}
                />
              )}
              <div className="flex items-center gap-2">
                <Button asChild>
                  <Link href={`/communities/${item.id}`}>
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View Community
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        );

      default:
        return (
          <Card>
            <CardContent className="p-6 text-center">
              <HelpCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Unknown item type</p>
            </CardContent>
          </Card>
        );
    }
  };

  // Render result item
  const renderResultItem = (result: SearchResult) => {
    const Icon = TYPE_ICONS[result.type as keyof typeof TYPE_ICONS] || TYPE_ICONS.default;

    switch (result.type) {
      case 'user':
        return (
          <Card key={result.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(`/profile/${result.id}`);
                  }}
                  className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-colors"
                >
                  {result.image ? (
                    <img src={result.image} alt={result.name} className="h-10 w-10 rounded-full object-cover" />
                  ) : (
                    <User className="h-5 w-5 text-primary" />
                  )}
                </button>
                <div className="flex-1">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/profile/${result.id}`);
                    }}
                    className="text-left hover:underline"
                  >
                    <h3 className="font-medium">{result.name}</h3>
                  </button>
                  {result.bio && <p className="text-sm text-muted-foreground line-clamp-1">{result.bio}</p>}
                  {result.university && (
                    <p className="text-xs text-muted-foreground">{result.university}</p>
                  )}
                </div>
                <Button 
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(`/profile/${result.id}`);
                  }}
                >
                  View Profile
                </Button>
              </div>
            </CardContent>
          </Card>
        );

      case 'post':
        return (
          <Card key={result.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => handleItemClick(result)}>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    if (result.user?.id) {
                      router.push(`/profile/${result.user.id}`);
                    }
                  }}
                  className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-colors"
                >
                  {result.user?.image ? (
                    <img src={result.user.image} alt={result.user.name} className="h-8 w-8 rounded-full object-cover" />
                  ) : (
                    <User className="h-4 w-4 text-primary" />
                  )}
                </button>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        if (result.user?.id) {
                          router.push(`/profile/${result.user.id}`);
                        }
                      }}
                      className="font-medium text-sm hover:underline"
                    >
                      {result.user?.name}
                    </button>
                    <span className="text-xs text-muted-foreground">
                      {new Date(result.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  {result.content && (
                    <p className="text-sm text-muted-foreground line-clamp-2">{result.content}</p>
                  )}
                  
                  {/* Media preview */}
                  {result.media && result.media.length > 0 && (
                    <div className="mt-2">
                      <PostMediaGrid 
                        media={result.media.map((media: any) => ({
                          id: media.id,
                          kind: media.kind?.toLowerCase() as "image" | "file" | "video",
                          url: media.url,
                          mimeType: media.mimeType,
                          name: media.name,
                          resourceId: result.id,
                          size: media.size,
                          thumbnailUrl: media.thumbnailUrl?.replace(/\\/g, '/'),
                          thumbnail: media.thumbnailUrl?.replace(/\\/g, '/'), // Alternative thumbnail property
                        }))} 
                        onDownload={handleMediaDownload}
                      />
                    </div>
                  )}
                  
                  <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                    <span>{result.commentsCount || 0} comments</span>
                    <span>{result.reactionsCount || 0} reactions</span>
                    {result.viewsCount && <span>{result.viewsCount} views</span>}
                  </div>
                </div>
                <Button size="sm">View Post</Button>
              </div>
            </CardContent>
          </Card>
        );

      case 'subject':
        return (
          <Card key={result.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => handleItemClick(result)}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div 
                  className="h-10 w-10 rounded-lg flex items-center justify-center text-white font-semibold"
                  style={{ backgroundColor: result.color || '#3b82f6' }}
                >
                  {result.name?.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <h3 className="font-medium">{result.name}</h3>
                  {result.code && <p className="text-sm text-muted-foreground">{result.code}</p>}
                  {result.instructor && <p className="text-xs text-muted-foreground">Instructor: {result.instructor}</p>}
                </div>
                <Button size="sm">Import Subject</Button>
              </div>
            </CardContent>
          </Card>
        );

      case 'document':
        return (
          <Card key={result.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => handleItemClick(result)}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <File className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium">{result.originalName || result.name}</h3>
                  <p className="text-sm text-muted-foreground">{result.fileType}</p>
                  {result.size && (
                    <p className="text-xs text-muted-foreground">
                      {(result.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  )}
                </div>
                <Button size="sm">Download</Button>
              </div>
            </CardContent>
          </Card>
        );

      case 'material':
        return (
          <Card key={result.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => handleItemClick(result)}>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                  {result.user?.image ? (
                    <img src={result.user.image} alt={result.user.name} className="h-8 w-8 rounded-full object-cover" />
                  ) : (
                    <User className="h-4 w-4 text-primary" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium text-sm">{result.title}</h3>
                    <Badge variant="outline" className="text-xs">{result.materialType}</Badge>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                    <span>by {result.user?.name}</span>
                    <span>•</span>
                    <span>{new Date(result.createdAt).toLocaleDateString()}</span>
                    {result.community && (
                      <>
                        <span>•</span>
                        <span>{result.community.name}</span>
                      </>
                    )}
                  </div>
                  {result.content && (
                    <p className="text-sm text-muted-foreground line-clamp-2">{result.content}</p>
                  )}
                  
                  {/* Media preview */}
                  {result.media && (() => {
                    let mediaArray: any[] = [];
                    try {
                      if (Array.isArray(result.media)) {
                        mediaArray = result.media;
                      } else if (typeof result.media === 'string') {
                        mediaArray = JSON.parse(result.media || '[]');
                      }
                    } catch (error) {
                      console.error('Error parsing media:', error);
                      mediaArray = [];
                    }
                    
                    return mediaArray.length > 0 && (
                      <div className="mt-2">
                        <PostMediaGrid 
                          media={mediaArray.map(item => ({ ...item, resourceId: result.id }))} 
                          onDownload={handleMediaDownload}
                        />
                      </div>
                    );
                  })()}
                  
                  {(result.fileUrl || result.url) && (
                    <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                      {result.fileUrl ? (
                        <>
                          <FileText className="h-3 w-3" />
                          <span>File attached</span>
                          {result.fileSize && <span>• {(result.fileSize / 1024 / 1024).toFixed(1)} MB</span>}
                        </>
                      ) : (
                        <>
                          <ExternalLink className="h-3 w-3" />
                          <span>Link attached</span>
                        </>
                      )}
                      {result.downloadCount > 0 && <span>• {result.downloadCount} downloads</span>}
                      {result.isPinned && <span>• Pinned</span>}
                    </div>
                  )}
                </div>
                <Button size="sm">View Material</Button>
              </div>
            </CardContent>
          </Card>
        );

      case 'community':
        return (
          <Card key={result.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => handleItemClick(result)}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="relative h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  {result.avatar ? (
                    <img src={result.avatar} alt={result.name} className="h-10 w-10 rounded-full object-cover" />
                  ) : (
                    <CommunityIcon className="h-5 w-5 text-primary" />
                  )}
                  {/* Notification badge for community messages */}
                  {getCommunityNotificationCount(result.id) > 0 && (
                    <div className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-medium">
                      {getCommunityNotificationCount(result.id) > 9 ? '9+' : getCommunityNotificationCount(result.id)}
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium">{result.name}</h3>
                    {/* Notification badge next to community name */}
                    {getCommunityNotificationCount(result.id) > 0 && (
                      <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse"></div>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{result.category}</p>
                  {result.university && (
                    <p className="text-xs text-muted-foreground">
                      {result.university} • {result.program}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-xs text-muted-foreground">
                    {result.membersCount || 0} members
                  </div>
                  <Button size="sm">View Community</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        );

      default:
        return (
          <Card key={result.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => handleItemClick(result)}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Icon className="h-5 w-5 text-muted-foreground" />
                <div className="flex-1">
                  <h3 className="font-medium">{result.name || result.title}</h3>
                  <p className="text-sm text-muted-foreground">{result.description}</p>
                </div>
                <Button size="sm">View</Button>
              </div>
            </CardContent>
          </Card>
        );
    }
  };

  if (showDetail && selectedItem) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {renderDetailView(selectedItem)}
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">Search Results</h1>
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search everything..."
              value={query}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>
          {query && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setQuery('');
                setResults([]);
                setTotal(0);
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        {query && (
          <p className="text-muted-foreground mt-2">
            {isLoading ? 'Searching...' : `${total} results for "${query}"`}
          </p>
        )}
      </div>

      {/* Results */}
      {query.length >= 1 && (
        <>
          <Tabs value={selectedType} onValueChange={handleTypeChange} className="mb-6">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="all">All</TabsTrigger>
              {Object.entries(TYPE_LABELS).map(([key, label]) => (
                <TabsTrigger key={key} value={key}>
                  {label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          {isLoading ? (
            <div className="text-center py-8">
              <div className="text-muted-foreground">Searching...</div>
            </div>
          ) : results.length > 0 ? (
            <div className="space-y-4">
              {Object.keys(groupedResults).length > 0 ? (
                Object.entries(groupedResults).map(([type, typeResults]) => {
                  const Icon = TYPE_ICONS[type as keyof typeof TYPE_ICONS] || TYPE_ICONS.default;
                  return (
                    <div key={type}>
                      <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                        <Icon className="h-5 w-5" />
                        {TYPE_LABELS[type as keyof typeof TYPE_LABELS] || TYPE_LABELS.default}
                        <Badge variant="secondary">{typeResults.length}</Badge>
                      </h2>
                      <div className="grid gap-4">
                        {typeResults.map(renderResultItem)}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8">
                  <div className="text-muted-foreground">
                    No {selectedType === 'all' ? '' : TYPE_LABELS[selectedType as keyof typeof TYPE_LABELS]?.toLowerCase() + ' '}results found for "{query}"
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-muted-foreground">
                No results found for "{query}"
              </div>
            </div>
          )}
        </>
      )}

      {/* No Search Query */}
      {query.length < 1 && (
        <div className="text-center py-16">
          <Search className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Search Everything</h2>
          <p className="text-muted-foreground">
            Find users, posts, subjects, documents, materials, and communities
          </p>
        </div>
      )}
    </div>
  );
}