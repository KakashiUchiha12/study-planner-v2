'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Settings, 
  Users, 
  Shield, 
  Image, 
  Save, 
  X, 
  Crown, 
  UserCheck, 
  UserX,
  MoreHorizontal,
  Edit,
  Trash2,
  Globe,
  Lock,
  Eye,
  Palette,
  Upload,
  AlertTriangle,
  Bell,
  BellOff,
  UserPlus,
  Download,
  Upload as UploadIcon,
  BarChart3,
  Filter,
  Zap,
  Link,
  Database,
  History,
  Mail,
  MessageSquare,
  Calendar,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  Search,
  Plus,
  Minus
} from 'lucide-react';
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
    username?: string;
    email: string;
    image?: string;
  };
}

interface CommunitySettingsDialogProps {
  community: Community;
  members: CommunityMember[];
  currentUserId: string;
  onUpdate: () => void;
}

export function CommunitySettingsDialog({ 
  community, 
  members, 
  currentUserId, 
  onUpdate 
}: CommunitySettingsDialogProps) {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  const [loading, setLoading] = useState(false);
  
  // General settings
  const [name, setName] = useState(community.name);
  const [slug, setSlug] = useState(community.slug);
  const [description, setDescription] = useState(community.description || '');
  const [category, setCategory] = useState(community.category);
  const [visibility, setVisibility] = useState(community.visibility);
  
  // Appearance settings
  const [avatar, setAvatar] = useState(community.avatar || '');
  const [banner, setBanner] = useState(community.banner || '');
  const [primaryColor, setPrimaryColor] = useState('#3b82f6');
  const [accentColor, setAccentColor] = useState('#1d4ed8');
  
  // Advanced settings
  const [allowMemberPosts, setAllowMemberPosts] = useState(true);
  const [requireApproval, setRequireApproval] = useState(false);
  const [enableNotifications, setEnableNotifications] = useState(true);
  const [maxMembers, setMaxMembers] = useState(1000);
  
  // Notification settings
  const [notifyNewMembers, setNotifyNewMembers] = useState(true);
  const [notifyNewPosts, setNotifyNewPosts] = useState(true);
  const [notifyComments, setNotifyComments] = useState(true);
  const [notifyMentions, setNotifyMentions] = useState(true);
  const [notifyEvents, setNotifyEvents] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(false);
  const [pushNotifications, setPushNotifications] = useState(true);
  
  // Moderation settings
  const [autoModeration, setAutoModeration] = useState(false);
  const [profanityFilter, setProfanityFilter] = useState(true);
  const [spamFilter, setSpamFilter] = useState(true);
  const [requireApprovalForNewMembers, setRequireApprovalForNewMembers] = useState(false);
  const [maxPostsPerDay, setMaxPostsPerDay] = useState(10);
  
  // Privacy settings
  const [showMemberList, setShowMemberList] = useState(true);
  const [allowMemberSearch, setAllowMemberSearch] = useState(true);
  const [dataRetentionDays, setDataRetentionDays] = useState(365);
  const [allowDataExport, setAllowDataExport] = useState(true);
  
  // External Links
  const [externalLinks, setExternalLinks] = useState([
    { text: '', url: '' },
    { text: '', url: '' },
    { text: '', url: '' },
    { text: '', url: '' },
    { text: '', url: '' }
  ]);
  
  // Member management
  const [memberList, setMemberList] = useState(members);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);

  const isOwner = community.ownerId === currentUserId;
  const currentUserMember = members.find(m => m.userId === currentUserId);
  const isAdmin = currentUserMember?.role === 'ADMIN' || isOwner;

  const handleSaveGeneral = async () => {
    setLoading(true);
    try {
      console.log('Saving community with data:', {
        name,
        slug,
        description,
        category,
        visibility,
      });

      const response = await fetch(`/api/communities/${community.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          slug,
          description,
          category,
          visibility,
        }),
      });

      console.log('Save response status:', response.status);

      if (response.ok) {
        const result = await response.json();
        console.log('Save successful:', result);
        onUpdate();
        setOpen(false);
      } else {
        const error = await response.json();
        console.error('Save failed:', error);
        alert(`Failed to save: ${error.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error updating community:', error);
      alert('Failed to save community settings');
    } finally {
      setLoading(false);
    }
  };

  const updateExternalLink = (index: number, field: 'text' | 'url', value: string) => {
    const newLinks = [...externalLinks];
    newLinks[index] = { ...newLinks[index], [field]: value };
    setExternalLinks(newLinks);
  };

  const handleRoleChange = async (memberId: string, newRole: string) => {
    try {
      const response = await fetch(`/api/communities/${community.id}/members/${memberId}/role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role: newRole }),
      });

      if (response.ok) {
        setMemberList(prev => 
          prev.map(member => 
            member.id === memberId 
              ? { ...member, role: newRole as any }
              : member
          )
        );
        onUpdate();
      }
    } catch (error) {
      console.error('Error updating member role:', error);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    try {
      const response = await fetch(`/api/communities/${community.id}/members/${memberId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setMemberList(prev => prev.filter(member => member.id !== memberId));
        onUpdate();
      }
    } catch (error) {
      console.error('Error removing member:', error);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'OWNER':
        return <Crown className="h-4 w-4 text-yellow-500" />;
      case 'ADMIN':
        return <Shield className="h-4 w-4 text-red-500" />;
      case 'MODERATOR':
        return <UserCheck className="h-4 w-4 text-blue-500" />;
      default:
        return <Users className="h-4 w-4 text-gray-500" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'OWNER':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'ADMIN':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'MODERATOR':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  // Show settings for all members, but with different permissions
  if (!currentUserId) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings className="h-4 w-4 mr-2" />
          Settings
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Community Settings
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full flex flex-col flex-1 min-h-0">
          <TabsList className="flex w-full overflow-x-auto mb-4">
            <TabsTrigger value="general" className="flex items-center gap-2 text-xs min-w-fit whitespace-nowrap">
              <Settings className="h-3 w-3" />
              General
            </TabsTrigger>
            <TabsTrigger value="appearance" className="flex items-center gap-2 text-xs min-w-fit whitespace-nowrap">
              <Palette className="h-3 w-3" />
              Appearance
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2 text-xs min-w-fit whitespace-nowrap">
              <Bell className="h-3 w-3" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="privacy" className="flex items-center gap-2 text-xs min-w-fit whitespace-nowrap">
              <Lock className="h-3 w-3" />
              Privacy
            </TabsTrigger>
            {isAdmin && (
              <>
                <TabsTrigger value="members" className="flex items-center gap-2 text-xs min-w-fit whitespace-nowrap">
                  <Users className="h-3 w-3" />
                  Members
                </TabsTrigger>
                <TabsTrigger value="moderation" className="flex items-center gap-2 text-xs min-w-fit whitespace-nowrap">
                  <Filter className="h-3 w-3" />
                  Moderation
                </TabsTrigger>
                <TabsTrigger value="integrations" className="flex items-center gap-2 text-xs min-w-fit whitespace-nowrap">
                  <Link className="h-3 w-3" />
                  Integrations
                </TabsTrigger>
                <TabsTrigger value="analytics" className="flex items-center gap-2 text-xs min-w-fit whitespace-nowrap">
                  <BarChart3 className="h-3 w-3" />
                  Analytics
                </TabsTrigger>
              </>
            )}
          </TabsList>

          <TabsContent value="general" className="space-y-6 overflow-y-auto flex-1 min-h-0 p-1 p-1">
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Community Name</Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Enter community name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="slug">URL Slug</Label>
                    <Input
                      id="slug"
                      value={slug}
                      onChange={(e) => setSlug(e.target.value)}
                      placeholder="community-url"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <RichTextEditor
                    value={description}
                    onChange={setDescription}
                    placeholder="Describe your community with rich text formatting..."
                    rows={4}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="category">Category</Label>
                    <Select value={category} onValueChange={setCategory}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="academic">Academic</SelectItem>
                        <SelectItem value="social">Social</SelectItem>
                        <SelectItem value="hobby">Hobby</SelectItem>
                        <SelectItem value="professional">Professional</SelectItem>
                        <SelectItem value="sports">Sports</SelectItem>
                        <SelectItem value="technology">Technology</SelectItem>
                        <SelectItem value="arts">Arts</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="visibility">Visibility</Label>
                    <Select value={visibility} onValueChange={(value) => setVisibility(value as 'PUBLIC' | 'PRIVATE')}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select visibility" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PUBLIC">Public</SelectItem>
                        <SelectItem value="PRIVATE">Private</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

              </CardContent>
            </Card>
          </TabsContent>

          {isAdmin && (
            <TabsContent value="members" className="space-y-6 overflow-y-auto flex-1 min-h-0 p-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Member Management ({memberList.length} members)
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <UserPlus className="h-4 w-4 mr-2" />
                      Invite Members
                    </Button>
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Export
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          placeholder="Search members..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </div>
                    {selectedMembers.length > 0 && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500">
                          {selectedMembers.length} selected
                        </span>
                        <Button variant="outline" size="sm">
                          <UserX className="h-4 w-4 mr-2" />
                          Remove Selected
                        </Button>
                      </div>
                    )}
                  </div>
                  {memberList
                    .filter(member => 
                      searchTerm === '' || 
                      member.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      member.user.email.toLowerCase().includes(searchTerm.toLowerCase())
                    )
                    .map((member) => (
                    <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={selectedMembers.includes(member.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedMembers(prev => [...prev, member.id]);
                            } else {
                              setSelectedMembers(prev => prev.filter(id => id !== member.id));
                            }
                          }}
                          className="h-4 w-4 rounded border-gray-300"
                        />
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={member.user.image} alt={member.user.name} />
                          <AvatarFallback>
                            {member.user.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{member.user.name}</p>
                          <p className="text-sm text-gray-500">
                            @{member.user.username || member.user.email.split('@')[0]}
                          </p>
                          <p className="text-xs text-gray-400">
                            Joined {new Date(member.joinedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <Badge className={`${getRoleColor(member.role)} flex items-center gap-1`}>
                          {getRoleIcon(member.role)}
                          {member.role}
                        </Badge>
                        
                        {member.userId !== currentUserId && member.role !== 'OWNER' && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleRoleChange(member.id, 'ADMIN')}>
                                <Shield className="h-4 w-4 mr-2" />
                                Make Admin
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleRoleChange(member.id, 'MODERATOR')}>
                                <UserCheck className="h-4 w-4 mr-2" />
                                Make Moderator
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleRoleChange(member.id, 'MEMBER')}>
                                <Users className="h-4 w-4 mr-2" />
                                Make Member
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleRemoveMember(member.id)}
                                className="text-red-600"
                              >
                                <UserX className="h-4 w-4 mr-2" />
                                Remove Member
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            </TabsContent>
          )}

          <TabsContent value="appearance" className="space-y-6 overflow-y-auto flex-1 min-h-0 p-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Image className="h-5 w-5" />
                  Community Appearance
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <Label>Community Avatar</Label>
                    <div className="mt-2 flex items-center gap-4">
                      <Avatar className="h-16 w-16">
                        <AvatarImage src={community.avatar} alt={community.name} />
                        <AvatarFallback className="text-lg">
                          {community.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4 mr-2" />
                        Change Avatar
                      </Button>
                    </div>
                  </div>
                  
                  <div>
                    <Label>Banner Image</Label>
                    <div className="mt-2">
                      {community.banner ? (
                        <div className="relative h-20 w-full rounded-lg overflow-hidden border">
                          <img
                            src={community.banner}
                            alt="Banner"
                            className="w-full h-full object-cover"
                          />
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="absolute top-2 right-2"
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Change
                          </Button>
                        </div>
                      ) : (
                        <div className="h-20 w-full border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                          <Button variant="outline" size="sm">
                            <Image className="h-4 w-4 mr-2" />
                            Add Banner
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6 overflow-y-auto flex-1 min-h-0 p-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Notification Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base font-medium">New Member Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Get notified when new members join
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={notifyNewMembers}
                      onChange={(e) => setNotifyNewMembers(e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base font-medium">New Post Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Get notified when members create new posts
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={notifyNewPosts}
                      onChange={(e) => setNotifyNewPosts(e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base font-medium">Comment Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Get notified when someone comments on posts
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={notifyComments}
                      onChange={(e) => setNotifyComments(e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base font-medium">Mention Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Get notified when someone mentions you
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={notifyMentions}
                      onChange={(e) => setNotifyMentions(e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base font-medium">Event Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Get notified about community events
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={notifyEvents}
                      onChange={(e) => setNotifyEvents(e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-medium mb-3">Delivery Methods</h4>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-base font-medium">Email Notifications</Label>
                        <p className="text-sm text-muted-foreground">
                          Receive notifications via email
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        checked={emailNotifications}
                        onChange={(e) => setEmailNotifications(e.target.checked)}
                        className="h-4 w-4 rounded border-gray-300"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-base font-medium">Push Notifications</Label>
                        <p className="text-sm text-muted-foreground">
                          Receive push notifications in browser
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        checked={pushNotifications}
                        onChange={(e) => setPushNotifications(e.target.checked)}
                        className="h-4 w-4 rounded border-gray-300"
                      />
                    </div>
                  </div>
                </div>

              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="privacy" className="space-y-6 overflow-y-auto flex-1 min-h-0 p-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5" />
                  Privacy & Data Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base font-medium">Show Member List</Label>
                      <p className="text-sm text-muted-foreground">
                        Allow members to see who else is in the community
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={showMemberList}
                      onChange={(e) => setShowMemberList(e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base font-medium">Allow Member Search</Label>
                      <p className="text-sm text-muted-foreground">
                        Allow members to search for other members
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={allowMemberSearch}
                      onChange={(e) => setAllowMemberSearch(e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base font-medium">Allow Data Export</Label>
                      <p className="text-sm text-muted-foreground">
                        Allow members to export their data
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={allowDataExport}
                      onChange={(e) => setAllowDataExport(e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                  </div>

                  <div>
                    <Label htmlFor="dataRetention">Data Retention (Days)</Label>
                    <Input
                      id="dataRetention"
                      type="number"
                      value={dataRetentionDays}
                      onChange={(e) => setDataRetentionDays(parseInt(e.target.value) || 365)}
                      className="mt-1"
                      min="30"
                      max="2555"
                    />
                    <p className="text-sm text-muted-foreground mt-1">
                      How long to keep deleted posts and comments (30-2555 days)
                    </p>
                  </div>
                </div>

              </CardContent>
            </Card>
          </TabsContent>

          {isAdmin && (
            <>
            <TabsContent value="advanced" className="space-y-6 overflow-y-auto flex-1 min-h-0 p-1">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Advanced Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-base font-medium">Allow Member Posts</Label>
                        <p className="text-sm text-muted-foreground">
                          Let community members create posts
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        checked={allowMemberPosts}
                        onChange={(e) => setAllowMemberPosts(e.target.checked)}
                        className="h-4 w-4 rounded border-gray-300"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-base font-medium">Require Post Approval</Label>
                        <p className="text-sm text-muted-foreground">
                          Review posts before they appear publicly
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        checked={requireApproval}
                        onChange={(e) => setRequireApproval(e.target.checked)}
                        className="h-4 w-4 rounded border-gray-300"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-base font-medium">Enable Notifications</Label>
                        <p className="text-sm text-muted-foreground">
                          Send notifications for community activity
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        checked={enableNotifications}
                        onChange={(e) => setEnableNotifications(e.target.checked)}
                        className="h-4 w-4 rounded border-gray-300"
                      />
                    </div>

                    <div>
                      <Label htmlFor="maxMembers">Maximum Members</Label>
                      <Input
                        id="maxMembers"
                        type="number"
                        value={maxMembers}
                        onChange={(e) => setMaxMembers(parseInt(e.target.value) || 1000)}
                        className="mt-1"
                        min="1"
                        max="10000"
                      />
                      <p className="text-sm text-muted-foreground mt-1">
                        Set a limit on community membership
                      </p>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <div className="flex items-center gap-2 text-red-600 mb-2">
                      <AlertTriangle className="h-4 w-4" />
                      <Label className="text-base font-medium">Danger Zone</Label>
                    </div>
                    <div className="space-y-2">
                      <Button variant="destructive" size="sm">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Community
                      </Button>
                      <p className="text-xs text-muted-foreground">
                        This action cannot be undone. All posts, members, and data will be permanently deleted.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="moderation" className="space-y-6 overflow-y-auto flex-1 min-h-0 p-1">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Filter className="h-5 w-5" />
                    Moderation Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-base font-medium">Auto Moderation</Label>
                        <p className="text-sm text-muted-foreground">
                          Automatically moderate content using AI
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        checked={autoModeration}
                        onChange={(e) => setAutoModeration(e.target.checked)}
                        className="h-4 w-4 rounded border-gray-300"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-base font-medium">Profanity Filter</Label>
                        <p className="text-sm text-muted-foreground">
                          Automatically filter profanity in posts and comments
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        checked={profanityFilter}
                        onChange={(e) => setProfanityFilter(e.target.checked)}
                        className="h-4 w-4 rounded border-gray-300"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-base font-medium">Spam Filter</Label>
                        <p className="text-sm text-muted-foreground">
                          Detect and prevent spam content
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        checked={spamFilter}
                        onChange={(e) => setSpamFilter(e.target.checked)}
                        className="h-4 w-4 rounded border-gray-300"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-base font-medium">Require Approval for New Members</Label>
                        <p className="text-sm text-muted-foreground">
                          Review new member requests before approval
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        checked={requireApprovalForNewMembers}
                        onChange={(e) => setRequireApprovalForNewMembers(e.target.checked)}
                        className="h-4 w-4 rounded border-gray-300"
                      />
                    </div>

                    <div>
                      <Label htmlFor="maxPostsPerDay">Maximum Posts Per Day</Label>
                      <Input
                        id="maxPostsPerDay"
                        type="number"
                        value={maxPostsPerDay}
                        onChange={(e) => setMaxPostsPerDay(parseInt(e.target.value) || 10)}
                        className="mt-1"
                        min="1"
                        max="100"
                      />
                      <p className="text-sm text-muted-foreground mt-1">
                        Limit how many posts each member can create per day
                      </p>
                    </div>
                  </div>

                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="integrations" className="space-y-6 overflow-y-auto flex-1 min-h-0 p-1">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Link className="h-5 w-5" />
                    External Links
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Add up to 5 external links that will be displayed in your community header.
                    </p>
                    
                    {externalLinks.map((link, index) => (
                      <div key={index} className="grid grid-cols-2 gap-4 p-4 border rounded-lg">
                        <div>
                          <Label htmlFor={`link-text-${index}`}>Link Text</Label>
                          <Input
                            id={`link-text-${index}`}
                            value={link.text}
                            onChange={(e) => updateExternalLink(index, 'text', e.target.value)}
                            placeholder="e.g., Website, Discord, YouTube"
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label htmlFor={`link-url-${index}`}>URL</Label>
                          <Input
                            id={`link-url-${index}`}
                            value={link.url}
                            onChange={(e) => updateExternalLink(index, 'url', e.target.value)}
                            placeholder="https://example.com"
                            className="mt-1"
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="analytics" className="space-y-6 overflow-y-auto flex-1 min-h-0 p-1">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Community Analytics
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="border rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Users className="h-4 w-4 text-blue-500" />
                        <span className="font-medium">Total Members</span>
                      </div>
                      <p className="text-2xl font-bold">{community.memberCount}</p>
                      <p className="text-sm text-muted-foreground">+12 this week</p>
                    </div>

                    <div className="border rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <MessageSquare className="h-4 w-4 text-green-500" />
                        <span className="font-medium">Total Posts</span>
                      </div>
                      <p className="text-2xl font-bold">1,234</p>
                      <p className="text-sm text-muted-foreground">+45 this week</p>
                    </div>

                    <div className="border rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Calendar className="h-4 w-4 text-purple-500" />
                        <span className="font-medium">Active Members</span>
                      </div>
                      <p className="text-2xl font-bold">89</p>
                      <p className="text-sm text-muted-foreground">Last 30 days</p>
                    </div>

                    <div className="border rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <FileText className="h-4 w-4 text-orange-500" />
                        <span className="font-medium">Engagement Rate</span>
                      </div>
                      <p className="text-2xl font-bold">67%</p>
                      <p className="text-sm text-muted-foreground">+5% this month</p>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <h4 className="font-medium mb-3">Export Data</h4>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-2" />
                        Export Members
                      </Button>
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-2" />
                        Export Posts
                      </Button>
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-2" />
                        Export Analytics
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            </>
          )}
        </Tabs>
        
        {/* Sticky Footer */}
        <div className="border-t bg-background p-4 flex justify-end gap-2 sticky bottom-0">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSaveGeneral} disabled={loading}>
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
