'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Edit, 
  Save, 
  X, 
  Image, 
  Upload,
  Globe,
  Lock,
  Eye,
  Users,
  Tag,
  Calendar,
  AlertCircle,
  CheckCircle
} from 'lucide-react';

interface Community {
  id: string;
  name: string;
  slug: string;
  description?: string;
  avatar?: string;
  banner?: string;
  category: string;
  subcategory?: string;
  university?: string;
  program?: string;
  year?: string;
  tags: string | string[];
  visibility: 'public' | 'private' | 'restricted';
  joinType: 'open' | 'closed' | 'invite_only';
  memberCount: number;
  maxMembers?: number;
  isActive: boolean;
  isVerified: boolean;
  createdAt: string;
  createdByUser: {
    id: string;
    name: string;
    image?: string;
  };
}

interface CommunityDetailsDialogProps {
  community: Community;
  currentUserId: string;
  onUpdate: () => void;
}

const CATEGORIES = [
  { value: 'academic', label: 'Academic' },
  { value: 'social', label: 'Social' },
  { value: 'study', label: 'Study Groups' },
  { value: 'hobby', label: 'Hobbies' },
  { value: 'professional', label: 'Professional' },
  { value: 'sports', label: 'Sports' },
  { value: 'technology', label: 'Technology' },
  { value: 'arts', label: 'Arts & Culture' },
];

const SUBJECTS = [
  { value: 'computer-science', label: 'Computer Science' },
  { value: 'mathematics', label: 'Mathematics' },
  { value: 'physics', label: 'Physics' },
  { value: 'chemistry', label: 'Chemistry' },
  { value: 'biology', label: 'Biology' },
  { value: 'engineering', label: 'Engineering' },
  { value: 'business', label: 'Business' },
  { value: 'medicine', label: 'Medicine' },
  { value: 'law', label: 'Law' },
  { value: 'arts', label: 'Arts' },
  { value: 'psychology', label: 'Psychology' },
  { value: 'economics', label: 'Economics' },
];

const UNIVERSITIES = [
  'University of Karachi',
  'Lahore University of Management Sciences',
  'Aga Khan University',
  'Quaid-i-Azam University',
  'University of the Punjab',
  'National University of Sciences and Technology',
  'COMSATS University',
  'Bahria University',
  'Air University',
  'Other'
];

export function CommunityDetailsDialog({ 
  community, 
  currentUserId, 
  onUpdate 
}: CommunityDetailsDialogProps) {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  const [loading, setLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  
  // Basic Information
  const [name, setName] = useState(community.name);
  const [slug, setSlug] = useState(community.slug);
  const [description, setDescription] = useState(community.description || '');
  const [category, setCategory] = useState(community.category);
  const [subcategory, setSubcategory] = useState(community.subcategory || '');
  
  // Academic Information
  const [university, setUniversity] = useState(community.university || '');
  const [program, setProgram] = useState(community.program || '');
  const [year, setYear] = useState(community.year || '');
  
  // Community Settings
  const [visibility, setVisibility] = useState(community.visibility);
  const [joinType, setJoinType] = useState(community.joinType);
  const [maxMembers, setMaxMembers] = useState(community.maxMembers || 1000);
  
  // Tags
  const [tags, setTags] = useState<string[]>(() => {
    if (typeof community.tags === 'string') {
      try {
        // Try to parse as JSON first
        const parsed = JSON.parse(community.tags);
        if (Array.isArray(parsed)) {
          return parsed.map(tag => typeof tag === 'string' ? tag.trim() : String(tag).trim());
        }
        return [parsed];
      } catch {
        // If JSON parsing fails, try to clean up the string
        // Handle cases like ["MDCAT","Study","MBBS","BDS","Medical Dream","Biology"]
        let cleanTags = community.tags.trim();
        
        // Remove outer brackets if present
        if (cleanTags.startsWith('[') && cleanTags.endsWith(']')) {
          cleanTags = cleanTags.slice(1, -1);
        }
        
        // Split by comma, but be careful with commas inside quotes
        const tagMatches = cleanTags.match(/"([^"]*)"|'([^']*)'|([^,]+)/g);
        if (tagMatches) {
          return tagMatches
            .map(tag => tag.replace(/^["']|["']$/g, '').trim()) // Remove quotes
            .filter(tag => tag.length > 0);
        }
        
        // Fallback: simple comma split
        return cleanTags.split(',')
          .map(tag => tag.replace(/^["']|["']$/g, '').trim()) // Remove quotes
          .filter(tag => tag.length > 0);
      }
    }
    return Array.isArray(community.tags) ? community.tags.map(tag => String(tag).trim()) : [];
  });
  const [newTag, setNewTag] = useState('');

  const isOwner = community.createdByUser?.id === currentUserId;

  // Track changes
  useEffect(() => {
    const hasBasicChanges = 
      name !== community.name ||
      slug !== community.slug ||
      description !== (community.description || '') ||
      category !== community.category ||
      subcategory !== (community.subcategory || '');
    
    const hasAcademicChanges = 
      university !== (community.university || '') ||
      program !== (community.program || '') ||
      year !== (community.year || '');
    
    const hasSettingsChanges = 
      visibility !== community.visibility ||
      joinType !== community.joinType ||
      maxMembers !== (community.maxMembers || 1000);
    
    const hasTagChanges = JSON.stringify(tags) !== JSON.stringify(
      typeof community.tags === 'string' 
        ? (() => {
            try { return JSON.parse(community.tags); } 
            catch { return community.tags.split(',').map(tag => tag.trim()).filter(tag => tag); }
          })()
        : (Array.isArray(community.tags) ? community.tags : [])
    );
    
    setHasChanges(hasBasicChanges || hasAcademicChanges || hasSettingsChanges || hasTagChanges);
  }, [name, slug, description, category, subcategory, university, program, year, visibility, joinType, maxMembers, tags, community]);

  const handleSave = async () => {
    if (!hasChanges) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/communities/${community.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          slug,
          description,
          category,
          subcategory,
          university,
          program,
          year,
          visibility,
          joinType,
          maxMembers,
          tags,
        }),
      });

      if (response.ok) {
        onUpdate();
        setOpen(false);
        setHasChanges(false);
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to update community');
      }
    } catch (error) {
      console.error('Error updating community:', error);
      alert('Failed to update community');
    } finally {
      setLoading(false);
    }
  };

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  };

  if (!isOwner) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Edit className="h-4 w-4 mr-2" />
          Edit Details
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5" />
            Edit Community Details
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="basic" className="flex items-center gap-2">
              <Edit className="h-4 w-4" />
              Basic Info
            </TabsTrigger>
            <TabsTrigger value="academic" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Academic
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                      placeholder="community-url-slug"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe your community..."
                    rows={6}
                    className="resize-none"
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    You can use HTML tags for rich formatting
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="category">Category</Label>
                    <Select value={category} onValueChange={setCategory}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map((cat) => (
                          <SelectItem key={cat.value} value={cat.value}>
                            {cat.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="subcategory">Subject/Subcategory</Label>
                    <Select value={subcategory} onValueChange={setSubcategory}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select subject" />
                      </SelectTrigger>
                      <SelectContent>
                        {SUBJECTS.map((subject) => (
                          <SelectItem key={subject.value} value={subject.value}>
                            {subject.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="tags">Tags</Label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {tags.map((tag, index) => (
                      <Badge key={index} variant="secondary" className="flex items-center gap-1">
                        <Tag className="h-3 w-3" />
                        {tag}
                        <button
                          onClick={() => removeTag(tag)}
                          className="ml-1 hover:text-red-500"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Add a tag"
                    />
                    <Button onClick={addTag} size="sm">
                      Add
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="academic" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Academic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="university">University/Institution</Label>
                  <Select value={university} onValueChange={setUniversity}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select university" />
                    </SelectTrigger>
                    <SelectContent>
                      {UNIVERSITIES.map((uni) => (
                        <SelectItem key={uni} value={uni}>
                          {uni}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="program">Program/Degree</Label>
                    <Input
                      id="program"
                      value={program}
                      onChange={(e) => setProgram(e.target.value)}
                      placeholder="e.g., Computer Science, MBA"
                    />
                  </div>
                  <div>
                    <Label htmlFor="year">Academic Year</Label>
                    <Input
                      id="year"
                      value={year}
                      onChange={(e) => setYear(e.target.value)}
                      placeholder="e.g., 2024, 1st Year"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Community Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="visibility">Visibility</Label>
                    <Select value={visibility} onValueChange={setVisibility}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="public">
                          <div className="flex items-center gap-2">
                            <Globe className="h-4 w-4" />
                            Public
                          </div>
                        </SelectItem>
                        <SelectItem value="private">
                          <div className="flex items-center gap-2">
                            <Lock className="h-4 w-4" />
                            Private
                          </div>
                        </SelectItem>
                        <SelectItem value="restricted">
                          <div className="flex items-center gap-2">
                            <Eye className="h-4 w-4" />
                            Restricted
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="joinType">Join Type</Label>
                    <Select value={joinType} onValueChange={setJoinType}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="open">Open</SelectItem>
                        <SelectItem value="closed">Closed</SelectItem>
                        <SelectItem value="invite_only">Invite Only</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="maxMembers">Maximum Members</Label>
                  <Input
                    id="maxMembers"
                    type="number"
                    value={maxMembers}
                    onChange={(e) => setMaxMembers(parseInt(e.target.value) || 1000)}
                    min="1"
                    max="10000"
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Set a limit on community membership (current: {community.memberCount} members)
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex items-center justify-between pt-4 border-t">
          <div className="flex items-center gap-2">
            {hasChanges ? (
              <>
                <AlertCircle className="h-4 w-4 text-amber-500" />
                <span className="text-sm text-amber-600">You have unsaved changes</span>
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm text-green-600">All changes saved</span>
              </>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!hasChanges || loading}>
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
