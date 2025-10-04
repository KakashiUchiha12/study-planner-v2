'use client';

import { useState, useEffect } from 'react';
import { useCommunityMessageNotifications } from '@/lib/hooks/useCommunityMessageNotifications';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { CommunityCard } from './CommunityCard';
import { CreateCommunityDialog } from './CreateCommunityDialog';
import { Search, Plus, Filter, Grid, List } from 'lucide-react';

interface Community {
  id: string;
  name: string;
  slug: string;
  description?: string;
  shortDescription?: string;
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
  _count?: {
    members: number;
    posts: number;
  };
}

interface CommunityDiscoveryProps {
  onCommunitySelect?: (community: Community) => void;
  showCreateButton?: boolean;
}

const CATEGORIES = [
  { value: 'academic', label: 'Academic' },
  { value: 'social', label: 'Social' },
  { value: 'study', label: 'Study Groups' },
  { value: 'hobby', label: 'Hobbies' },
  { value: 'professional', label: 'Professional' },
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
];

export function CommunityDiscovery({ 
  onCommunitySelect, 
  showCreateButton = true 
}: CommunityDiscoveryProps) {
  const handleViewCommunity = (community: Community) => {
    if (onCommunitySelect) {
      onCommunitySelect(community);
    } else {
      // Default behavior: navigate to community detail page
      window.location.href = `/communities/${community.id}`;
    }
  };
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [selectedUniversity, setSelectedUniversity] = useState<string>('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [userMemberships, setUserMemberships] = useState<Set<string>>(new Set());
  const [savedCommunities, setSavedCommunities] = useState<Set<string>>(new Set());
  const [showSavedOnly, setShowSavedOnly] = useState(false);
  
  // Get community notification count function
  const { getCommunityNotificationCount, refreshNotifications } = useCommunityMessageNotifications();

  // Note: Removed clearAllNotifications - notifications should only be cleared when user actually reads messages

  // Fetch communities
  const fetchCommunities = async () => {
    try {
      setLoading(true);
      
      if (showSavedOnly) {
        // Fetch saved communities
        const response = await fetch('/api/communities/saved');
        if (response.ok) {
          const data = await response.json();
          setCommunities(data.communities || []);
        }
      } else {
        // Fetch all communities with filters
        const params = new URLSearchParams();
        
        if (searchQuery) params.append('search', searchQuery);
        if (selectedCategory && selectedCategory !== 'all') params.append('category', selectedCategory);
        if (selectedSubject && selectedSubject !== 'all') params.append('subcategory', selectedSubject);
        if (selectedUniversity) params.append('university', selectedUniversity);
        
        const response = await fetch(`/api/communities?${params.toString()}`);
        if (response.ok) {
          const data = await response.json();
          setCommunities(data.communities || []);
        }
      }
    } catch (error) {
      console.error('Error fetching communities:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch user's memberships
  const fetchUserMemberships = async () => {
    try {
      const response = await fetch('/api/communities/my');
      if (response.ok) {
        const data = await response.json();
        const membershipIds = new Set(data.communities.map((c: Community) => c.id));
        setUserMemberships(membershipIds);
      }
    } catch (error) {
      console.error('Error fetching user memberships:', error);
    }
  };

  // Fetch user's saved communities
  const fetchSavedCommunities = async () => {
    try {
      const response = await fetch('/api/communities/saved');
      if (response.ok) {
        const data = await response.json();
        const savedIds = new Set(data.communities.map((c: Community) => c.id));
        setSavedCommunities(savedIds);
      }
    } catch (error) {
      console.error('Error fetching saved communities:', error);
    }
  };

  useEffect(() => {
    fetchCommunities();
    fetchUserMemberships();
    fetchSavedCommunities();
    // Refresh notifications when component mounts
    refreshNotifications();
  }, [searchQuery, selectedCategory, selectedSubject, selectedUniversity, showSavedOnly, refreshNotifications]);

  const handleJoin = async (communityId: string) => {
    try {
      const response = await fetch(`/api/communities/${communityId}/join`, {
        method: 'POST',
      });
      
      if (response.ok) {
        const data = await response.json();
        setUserMemberships(prev => new Set([...prev, communityId]));
        // Refresh communities to update member count
        fetchCommunities();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to join community');
      }
    } catch (error) {
      console.error('Error joining community:', error);
      alert('Failed to join community');
    }
  };

  const handleLeave = async (communityId: string) => {
    try {
      const response = await fetch(`/api/communities/${communityId}/join`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        setUserMemberships(prev => {
          const newSet = new Set(prev);
          newSet.delete(communityId);
          return newSet;
        });
        // Refresh communities to update member count
        fetchCommunities();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to leave community');
      }
    } catch (error) {
      console.error('Error leaving community:', error);
      alert('Failed to leave community');
    }
  };

  const handleCreateCommunity = () => {
    setShowCreateDialog(true);
  };

  const handleCommunityCreated = (community: Community) => {
    setCommunities(prev => [community, ...prev]);
    setUserMemberships(prev => new Set([...prev, community.id]));
    setShowCreateDialog(false);
  };

  const handleSave = async (communityId: string) => {
    try {
      const response = await fetch(`/api/communities/${communityId}/save`, {
        method: 'POST',
      });
      
      if (response.ok) {
        setSavedCommunities(prev => new Set([...prev, communityId]));
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to save community');
      }
    } catch (error) {
      console.error('Error saving community:', error);
      alert('Failed to save community');
    }
  };

  const handleUnsave = async (communityId: string) => {
    try {
      const response = await fetch(`/api/communities/${communityId}/save`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        setSavedCommunities(prev => {
          const newSet = new Set(prev);
          newSet.delete(communityId);
          return newSet;
        });
        // If showing saved only, remove from the list
        if (showSavedOnly) {
          setCommunities(prev => prev.filter(c => c.id !== communityId));
        }
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to unsave community');
      }
    } catch (error) {
      console.error('Error unsaving community:', error);
      alert('Failed to unsave community');
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('');
    setSelectedSubject('');
    setSelectedUniversity('');
    setShowSavedOnly(false);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Discover Communities</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Find and join communities that match your interests
          </p>
        </div>
        {showCreateButton && (
          <Button onClick={handleCreateCommunity} className="w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            Create Community
          </Button>
        )}
      </div>

      {/* Search and Filters */}
      <div className="space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search communities..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Filters */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Filters:</span>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <Button
              variant={showSavedOnly ? "default" : "outline"}
              onClick={() => setShowSavedOnly(!showSavedOnly)}
              className="w-full"
            >
              {showSavedOnly ? "Show All" : "Saved Communities"}
            </Button>

            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {CATEGORIES.map((category) => (
                  <SelectItem key={category.value} value={category.value}>
                    {category.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedSubject} onValueChange={setSelectedSubject}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Subject" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Subjects</SelectItem>
                {SUBJECTS.map((subject) => (
                  <SelectItem key={subject.value} value={subject.value}>
                    {subject.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input
              placeholder="University"
              className="w-full"
              value={selectedUniversity}
              onChange={(e) => setSelectedUniversity(e.target.value)}
            />

            <Button variant="outline" onClick={clearFilters} className="w-full">
              Clear Filters
            </Button>
          </div>
        </div>
      </div>

      {/* View Mode Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="text-sm text-muted-foreground">
          {communities.length} communities found
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('grid')}
            className="flex-1 sm:flex-none"
          >
            <Grid className="h-4 w-4" />
            <span className="ml-2 sm:hidden">Grid</span>
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('list')}
            className="flex-1 sm:flex-none"
          >
            <List className="h-4 w-4" />
            <span className="ml-2 sm:hidden">List</span>
          </Button>
        </div>
      </div>

      {/* Communities Grid/List */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-48 sm:h-64 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      ) : communities.length === 0 ? (
        <div className="text-center py-8 sm:py-12">
          <div className="text-muted-foreground mb-4 text-sm sm:text-base">
            No communities found matching your criteria
          </div>
          <Button variant="outline" onClick={clearFilters} className="w-full sm:w-auto">
            Clear Filters
          </Button>
        </div>
      ) : (
        <div className={
          viewMode === 'grid' 
            ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8'
            : 'space-y-4 sm:space-y-6'
        }>
          {communities.map((community) => (
            <CommunityCard
              key={community.id}
              community={community}
              isMember={userMemberships.has(community.id)}
              isSaved={savedCommunities.has(community.id)}
              onJoin={handleJoin}
              onLeave={handleLeave}
              onView={() => handleViewCommunity(community)}
              onSave={handleSave}
              onUnsave={handleUnsave}
            />
          ))}
        </div>
      )}

      {/* Create Community Dialog */}
      {showCreateDialog && (
        <CreateCommunityDialog
          open={showCreateDialog}
          onOpenChange={setShowCreateDialog}
          onCommunityCreated={handleCommunityCreated}
        />
      )}
    </div>
  );
}
