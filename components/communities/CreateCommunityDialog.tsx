'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  Globe, 
  Lock, 
  Eye, 
  Plus, 
  X, 
  Upload,
  Hash,
  BookOpen,
  GraduationCap,
  Building,
  Calendar
} from 'lucide-react';

interface CreateCommunityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCommunityCreated: (community: any) => void;
}

const CATEGORIES = [
  'Academic',
  'Professional',
  'Hobby',
  'Technology',
  'Science',
  'Arts',
  'Sports',
  'Gaming',
  'Music',
  'Literature',
  'Other'
];

const SUB_CATEGORIES = {
  'Academic': ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'Computer Science', 'Engineering', 'Medicine', 'Law', 'Business', 'Other'],
  'Professional': ['Software Development', 'Design', 'Marketing', 'Sales', 'Finance', 'Healthcare', 'Education', 'Consulting', 'Other'],
  'Hobby': ['Photography', 'Cooking', 'Gardening', 'Crafts', 'Collecting', 'DIY', 'Other'],
  'Technology': ['Programming', 'AI/ML', 'Web Development', 'Mobile Development', 'DevOps', 'Cybersecurity', 'Other'],
  'Science': ['Research', 'Astronomy', 'Environmental', 'Psychology', 'Other'],
  'Arts': ['Visual Arts', 'Performing Arts', 'Digital Arts', 'Writing', 'Other'],
  'Sports': ['Football', 'Basketball', 'Tennis', 'Swimming', 'Running', 'Other'],
  'Gaming': ['PC Gaming', 'Console Gaming', 'Mobile Gaming', 'Board Games', 'Other'],
  'Music': ['Classical', 'Rock', 'Jazz', 'Electronic', 'Hip-Hop', 'Other'],
  'Literature': ['Fiction', 'Non-fiction', 'Poetry', 'Academic Writing', 'Other'],
  'Other': ['General Discussion', 'Local Community', 'Support Group', 'Other']
};

export function CreateCommunityDialog({
  open,
  onOpenChange,
  onCommunityCreated,
}: CreateCommunityDialogProps) {
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    shortDescription: '',
    category: '',
    subcategory: '',
    university: '',
    program: '',
    year: '',
    tags: [] as string[],
    visibility: 'public' as 'public' | 'private' | 'restricted',
    joinType: 'open' as 'open' | 'closed' | 'invite_only',
    maxMembers: '',
    avatar: '',
  });

  const [newTag, setNewTag] = useState('');

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const handleNameChange = (name: string) => {
    setFormData(prev => ({
      ...prev,
      name,
      slug: generateSlug(name)
    }));
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleSubmit = async () => {
    setIsCreating(true);
    try {
      const response = await fetch('/api/communities', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          maxMembers: formData.maxMembers ? parseInt(formData.maxMembers) : null,
        }),
      });

      if (response.ok) {
        const community = await response.json();
        onCommunityCreated(community);
        onOpenChange(false);
        router.push(`/communities/${community.id}`);
      } else {
        const error = await response.json();
        console.error('Error creating community:', error);
      }
    } catch (error) {
      console.error('Error creating community:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const nextStep = () => {
    if (currentStep < 2) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 0:
        return formData.name.trim() && formData.slug.trim() && formData.category;
      case 1:
        return formData.description.trim();
      case 2:
        return true;
      default:
        return false;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-blue-500" />
            Create New Community
          </DialogTitle>
          <DialogDescription>
            Build a space for like-minded people to connect and share knowledge.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={currentStep.toString()} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="0">Basic Info</TabsTrigger>
            <TabsTrigger value="1">Description</TabsTrigger>
            <TabsTrigger value="2">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="0" className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Community Name *</Label>
                <Input
                  id="name"
                  placeholder="Enter community name"
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="slug">URL Slug *</Label>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">studyhi.com/communities/</span>
                  <Input
                    id="slug"
                    placeholder="community-slug"
                    value={formData.slug}
                    onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                    className="flex-1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value, subcategory: '' }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subcategory">Subcategory</Label>
                  <Select value={formData.subcategory} onValueChange={(value) => setFormData(prev => ({ ...prev, subcategory: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select subcategory" />
                    </SelectTrigger>
                    <SelectContent>
                      {formData.category && SUB_CATEGORIES[formData.category as keyof typeof SUB_CATEGORIES]?.map((sub) => (
                        <SelectItem key={sub} value={sub}>
                          {sub}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="university">University</Label>
                  <Input
                    id="university"
                    placeholder="University name"
                    value={formData.university}
                    onChange={(e) => setFormData(prev => ({ ...prev, university: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="program">Program</Label>
                  <Input
                    id="program"
                    placeholder="Program name"
                    value={formData.program}
                    onChange={(e) => setFormData(prev => ({ ...prev, program: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="year">Year</Label>
                  <Input
                    id="year"
                    placeholder="2024"
                    value={formData.year}
                    onChange={(e) => setFormData(prev => ({ ...prev, year: e.target.value }))}
                  />
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="1" className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="shortDescription">Short Description</Label>
                <Input
                  id="shortDescription"
                  placeholder="Brief one-line description"
                  value={formData.shortDescription}
                  onChange={(e) => setFormData(prev => ({ ...prev, shortDescription: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Full Description *</Label>
                <Textarea
                  id="description"
                  placeholder="Describe your community, its purpose, and what members can expect..."
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={6}
                />
              </div>

              <div className="space-y-2">
                <Label>Tags</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Add a tag"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addTag()}
                  />
                  <Button type="button" variant="outline" onClick={addTag}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                      <Hash className="h-3 w-3" />
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="2" className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Visibility</Label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: 'public', label: 'Public', icon: Globe, desc: 'Anyone can find and join' },
                    { value: 'restricted', label: 'Restricted', icon: Eye, desc: 'Anyone can find, approval required' },
                    { value: 'private', label: 'Private', icon: Lock, desc: 'Invite only' }
                  ].map(({ value, label, icon: Icon, desc }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, visibility: value as any }))}
                      className={`p-3 border rounded-lg text-left transition-colors ${
                        formData.visibility === value
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Icon className="h-4 w-4" />
                        <span className="font-medium">{label}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">{desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Join Type</Label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: 'open', label: 'Open', desc: 'Anyone can join immediately' },
                    { value: 'closed', label: 'Closed', desc: 'No new members' },
                    { value: 'invite_only', label: 'Invite Only', desc: 'Invitation required' }
                  ].map(({ value, label, desc }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, joinType: value as any }))}
                      className={`p-3 border rounded-lg text-left transition-colors ${
                        formData.joinType === value
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <div className="font-medium mb-1">{label}</div>
                      <p className="text-xs text-muted-foreground">{desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxMembers">Maximum Members (Optional)</Label>
                <Input
                  id="maxMembers"
                  type="number"
                  placeholder="Leave empty for unlimited"
                  value={formData.maxMembers}
                  onChange={(e) => setFormData(prev => ({ ...prev, maxMembers: e.target.value }))}
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-between pt-4">
          <Button
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 0}
          >
            Previous
          </Button>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            {currentStep < 2 ? (
              <Button onClick={nextStep} disabled={!isStepValid()}>
                Next
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={!isStepValid() || isCreating}>
                {isCreating ? 'Creating...' : 'Create Community'}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
