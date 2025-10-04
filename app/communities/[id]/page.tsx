'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  MessageSquare, 
  Calendar, 
  FileText, 
  Settings, 
  Plus,
  Globe,
  Lock,
  Eye,
  Bookmark,
  BookmarkCheck,
  UserPlus,
  UserMinus,
  MoreHorizontal,
  ArrowLeft,
  Tag
} from 'lucide-react';
import { CommunitySettingsDialog } from '@/components/communities/CommunitySettingsDialog';
import { CommunityDetailsDialog } from '@/components/communities/CommunityDetailsDialog';
import { CommunityLinks } from '@/components/communities/CommunityLinks';
import { CommunityPosts } from '@/components/communities/CommunityPosts';
import { CreateChannelDialog } from '@/components/communities/CreateChannelDialog';
import { CreatePostDialog } from '@/components/communities/CreatePostDialog';
import { RichTextDescription } from '@/components/ui/rich-text-description';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface Community {
  id: string;
  name: string;
  slug: string;
  description?: string;
  avatar?: string;
  banner?: string;
  category: string;
  visibility: 'PUBLIC' | 'PRIVATE';
  memberCount: number;
  isActive?: boolean;
  isVerified?: boolean;
  createdAt: string | Date;
  ownerId: string;
}

interface CommunityMember {
  id: string;
  userId: string;
  role: 'OWNER' | 'ADMIN' | 'MODERATOR' | 'MEMBER';
  joinedAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    image?: string;
  };
}

export default function CommunityPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const [community, setCommunity] = useState<Community | null>(null);
  const [members, setMembers] = useState<CommunityMember[]>([]);
  const [isMember, setIsMember] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('posts');
  const [channels, setChannels] = useState([]);

  const communityId = params.id as string;

  useEffect(() => {
    if (communityId) {
      fetchCommunity();
      fetchMembers();
      checkMembership();
      fetchChannels();
    }
  }, [communityId, session]);

  const fetchCommunity = async () => {
    try {
      console.log('Fetching community:', communityId);
      const response = await fetch(`/api/communities/${communityId}`);
      console.log('Response status:', response.status);
      if (response.ok) {
        const data = await response.json();
        console.log('Community data:', data);
        console.log('Banner URL:', data.community?.banner);
        setCommunity(data.community);
      } else {
        console.error('Response not ok:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Error fetching community:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMembers = async () => {
    try {
      const response = await fetch(`/api/communities/${communityId}/members`);
      if (response.ok) {
        const data = await response.json();
        setMembers(data.members || []);
      }
    } catch (error) {
      console.error('Error fetching members:', error);
    }
  };

  const checkMembership = async () => {
    if (!session?.user?.id) return;
    
    try {
      const response = await fetch(`/api/communities/${communityId}/members/me`);
      if (response.ok) {
        const data = await response.json();
        setIsMember(data.isMember || false);
      }
    } catch (error) {
      console.error('Error checking membership:', error);
    }
  };

  const fetchChannels = async () => {
    try {
      const response = await fetch(`/api/communities/${communityId}/channels`);
      if (response.ok) {
        const data = await response.json();
        setChannels(data.channels || []);
      }
    } catch (error) {
      console.error('Error fetching channels:', error);
    }
  };

  const refreshData = () => {
    fetchCommunity();
    fetchMembers();
    fetchChannels();
  };

  const handleJoin = async () => {
    try {
      const response = await fetch(`/api/communities/${communityId}/join`, {
        method: 'POST',
      });
      
      if (response.ok) {
        setIsMember(true);
        await fetchMembers(); // Refresh member count
      }
    } catch (error) {
      console.error('Error joining community:', error);
    }
  };

  const handleLeave = async () => {
    try {
      const response = await fetch(`/api/communities/${communityId}/leave`, {
        method: 'POST',
      });
      
      if (response.ok) {
        setIsMember(false);
        await fetchMembers(); // Refresh member count
      }
    } catch (error) {
      console.error('Error leaving community:', error);
    }
  };

  const handleSave = async () => {
    try {
      const response = await fetch(`/api/communities/${communityId}/save`, {
        method: 'POST',
      });
      
      if (response.ok) {
        setIsSaved(!isSaved);
      }
    } catch (error) {
      console.error('Error saving community:', error);
    }
  };

  const getVisibilityIcon = () => {
    if (!community) return null;
    
    switch (community.visibility) {
      case 'PRIVATE':
        return <Lock className="h-4 w-4" />;
      case 'PUBLIC':
      default:
        return <Globe className="h-4 w-4" />;
    }
  };

  const getVisibilityColor = () => {
    if (!community) return '';
    
    switch (community.visibility) {
      case 'PUBLIC':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'PRIVATE':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (!community) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Community Not Found</h1>
          <p className="text-gray-600 mb-6">The community you're looking for doesn't exist or has been removed.</p>
          <Button onClick={() => router.push('/communities')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Communities
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Community Header */}
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden mb-6">
          {/* Banner Image */}
          {community.banner && (
            <div className="relative h-64 w-full overflow-hidden">
              <img
                src={community.banner}
                alt={`${community.name} banner`}
                className="w-full h-full object-cover"
                onError={(e) => {
                  console.error('Banner image failed to load:', community.banner);
                  e.currentTarget.style.display = 'none';
                }}
                onLoad={() => {
                  console.log('Banner image loaded successfully:', community.banner);
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
            </div>
          )}
          
          <div className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={community.avatar} alt={community.name} />
                <AvatarFallback className="bg-primary/10 text-primary font-semibold text-lg">
                  {community.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <h1 className="text-2xl font-bold text-gray-900">
                    {community.name}
                  </h1>
                  {community.isVerified && (
                    <Badge variant="secondary" className="text-xs">
                      Verified
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    <span>{community.memberCount.toLocaleString()} members</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {getVisibilityIcon()}
                    <span className="capitalize">{community.visibility}</span>
                  </div>
                  <Badge className={`text-xs ${getVisibilityColor()}`}>
                    {community.category}
                  </Badge>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSave}
                className="flex items-center gap-2"
              >
                {isSaved ? (
                  <>
                    <BookmarkCheck className="h-4 w-4" />
                    Saved
                  </>
                ) : (
                  <>
                    <Bookmark className="h-4 w-4" />
                    Save
                  </>
                )}
              </Button>
              
              {isMember ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLeave}
                  className="flex items-center gap-2"
                >
                  <UserMinus className="h-4 w-4" />
                  Leave
                </Button>
              ) : (
                <Button
                  size="sm"
                  onClick={handleJoin}
                  className="flex items-center gap-2"
                >
                  <UserPlus className="h-4 w-4" />
                  Join
                </Button>
              )}
              
              {/* Debug Info - Remove this after debugging */}
              {process.env.NODE_ENV === 'development' && (
                <div className="text-xs text-gray-500 p-2 bg-gray-100 rounded">
                  Debug: ownerId={community?.ownerId}, userId={session?.user?.id}, isOwner={community?.ownerId === session?.user?.id}
                </div>
              )}

              {/* Settings Button - Only visible for admins/owners */}
              {(() => {
                const isOwner = community.ownerId === session?.user?.id;
                const isAdmin = isMember && members.find(m => m.userId === session?.user?.id)?.role === 'ADMIN';
                
                // Temporary workaround: if ownerId is missing, check if user is the first member (likely owner)
                let isLikelyOwner = false;
                if (!community.ownerId && members.length > 0) {
                  const firstMember = members[0];
                  isLikelyOwner = firstMember.userId === session?.user?.id && firstMember.role === 'OWNER';
                }
                
                const canAccessSettings = isOwner || isAdmin || isLikelyOwner;
                
                if (process.env.NODE_ENV === 'development') {
                  console.log('Settings Debug:', { 
                    isOwner, 
                    isAdmin, 
                    isLikelyOwner,
                    canAccessSettings, 
                    ownerId: community.ownerId, 
                    userId: session?.user?.id,
                    membersCount: members.length,
                    firstMember: members[0]
                  });
                }
                
                return canAccessSettings;
              })() && (
                <CommunitySettingsDialog 
                  community={community}
                  members={members}
                  currentUserId={session?.user?.id || ''}
                  onUpdate={refreshData}
                />
              )}

              {/* Temporary fallback for debugging - Remove this */}
              {process.env.NODE_ENV === 'development' && !(() => {
                const isOwner = community.ownerId === session?.user?.id;
                const isAdmin = isMember && members.find(m => m.userId === session?.user?.id)?.role === 'ADMIN';
                
                // Temporary workaround: if ownerId is missing, check if user is the first member (likely owner)
                let isLikelyOwner = false;
                if (!community.ownerId && members.length > 0) {
                  const firstMember = members[0];
                  isLikelyOwner = firstMember.userId === session?.user?.id && firstMember.role === 'OWNER';
                }
                
                return isOwner || isAdmin || isLikelyOwner;
              })() && (
                <Button variant="outline" size="sm" className="bg-red-100">
                  <Settings className="h-4 w-4 mr-2" />
                  Settings (Debug)
                </Button>
              )}
              
              {/* Edit Details Button - Only for owner */}
              {community.ownerId === session?.user?.id && (
                <CommunityDetailsDialog 
                  community={community}
                  currentUserId={session?.user?.id || ''}
                  onUpdate={refreshData}
                />
              )}
              
              {/* Fallback settings button for non-members */}
              {!isMember && (
                <Button variant="outline" size="sm" disabled>
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </Button>
              )}
            </div>
          </div>
          
            {community.description && (
              <div className="mt-4">
                <RichTextDescription 
                  content={community.description}
                  maxWords={50}
                  className="text-gray-700"
                />
              </div>
            )}

            {/* Community Tags */}
            {community.tags && (() => {
              const formatTags = (tags: string | string[]) => {
                if (typeof tags === 'string') {
                  try {
                    const parsed = JSON.parse(tags);
                    if (Array.isArray(parsed)) {
                      return parsed.map(tag => typeof tag === 'string' ? tag.trim() : String(tag).trim());
                    }
                    return [parsed];
                  } catch {
                    let cleanTags = tags.trim();
                    if (cleanTags.startsWith('[') && cleanTags.endsWith(']')) {
                      cleanTags = cleanTags.slice(1, -1);
                    }
                    const tagMatches = cleanTags.match(/"([^"]*)"|'([^']*)'|([^,]+)/g);
                    if (tagMatches) {
                      return tagMatches
                        .map(tag => tag.replace(/^["']|["']$/g, '').trim())
                        .filter(tag => tag.length > 0);
                    }
                    return cleanTags.split(',')
                      .map(tag => tag.replace(/^["']|["']$/g, '').trim())
                      .filter(tag => tag.length > 0);
                  }
                }
                return Array.isArray(tags) ? tags.map(tag => String(tag).trim()) : [];
              };

              const tagsArray = formatTags(community.tags);
              return tagsArray.length > 0 && (
                <div className="mt-4">
                  <div className="flex flex-wrap gap-2">
                    {tagsArray.slice(0, 5).map((tag, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        <Tag className="h-3 w-3 mr-1" />
                        {tag}
                      </Badge>
                    ))}
                    {tagsArray.length > 5 && (
                      <Badge variant="outline" className="text-xs">
                        +{tagsArray.length - 5} more
                      </Badge>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* Community Links */}
            <CommunityLinks 
              links={[
                { text: 'Website', url: 'https://example.com' },
                { text: 'Discord', url: 'https://discord.gg/example' },
                { text: 'GitHub', url: 'https://github.com/example' }
              ]}
              isOwner={community.ownerId === session?.user?.id}
            />
          </div>
        </div>

        {/* Main Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2">
            {/* Community Content Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="posts" className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Posts
                </TabsTrigger>
                <TabsTrigger value="events" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Events
                </TabsTrigger>
                <TabsTrigger value="resources" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Resources
                </TabsTrigger>
                <TabsTrigger value="chat" className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Chat
                </TabsTrigger>
              </TabsList>

              <TabsContent value="posts" className="space-y-4">
                <CommunityPosts communityId={communityId} />
              </TabsContent>


              <TabsContent value="events" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      Community Events
                      <Button size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        Create Event
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8 text-gray-500">
                      <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No events scheduled. Create the first event!</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="resources" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      Community Resources
                      <Button size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Resource
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8 text-gray-500">
                      <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No resources shared yet. Add the first resource!</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="chat" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      Community Chat ({channels.length} channels)
                      <CreateChannelDialog 
                        communityId={communityId}
                        onChannelCreated={fetchChannels}
                      />
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {channels.length > 0 ? (
                        <div className="grid gap-3">
                          {channels.map((channel: any) => (
                            <div key={channel.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                              <div className="flex items-center space-x-3">
                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                <span className="font-medium">#{channel.name}</span>
                                <span className="text-sm text-gray-500">{channel.description}</span>
                              </div>
                              <Badge variant="secondary" className="text-xs">
                                {channel.memberCount || 0} members
                              </Badge>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                          <p>No channels yet. Create the first channel to start chatting!</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Right Column - Members Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Members ({members.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {members.slice(0, 10).map((member) => (
                    <div key={member.id} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={member.user.image} alt={member.user.name} />
                        <AvatarFallback className="text-xs">
                          {member.user.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{member.user.name}</p>
                        <p className="text-xs text-gray-500 truncate">{member.user.email}</p>
                      </div>
                      <Badge variant={member.role === 'OWNER' ? 'default' : 'secondary'} className="text-xs">
                        {member.role}
                      </Badge>
                    </div>
                  ))}
                  {members.length > 10 && (
                    <div className="text-center py-2">
                      <Button variant="ghost" size="sm" className="text-xs">
                        View all {members.length} members
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
