'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Users, X } from 'lucide-react';

interface Community {
  id: string;
  name: string;
  slug: string;
  avatar?: string;
  memberCount: number;
}

interface FeedFiltersProps {
  activeFilter: string;
  onFilterChange: (filter: string) => void;
  selectedCommunity?: string;
  onCommunityChange: (communityId: string | null) => void;
}

export function FeedFilters({ 
  activeFilter, 
  onFilterChange, 
  selectedCommunity,
  onCommunityChange 
}: FeedFiltersProps) {
  const [userCommunities, setUserCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch user's communities
  useEffect(() => {
    const fetchUserCommunities = async () => {
      try {
        const response = await fetch('/api/communities/my');
        if (response.ok) {
          const data = await response.json();
          setUserCommunities(data.communities || []);
        }
      } catch (error) {
        console.error('Error fetching user communities:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserCommunities();
  }, []);

  const filters = [
    { id: 'all', label: 'All', description: 'All posts' },
    { id: 'text', label: 'Text', description: 'Text posts only' },
    { id: 'images', label: 'Images', description: 'Image posts only' },
    { id: 'files', label: 'Files', description: 'File posts only' },
  ];

  const selectedCommunityData = userCommunities.find(c => c.id === selectedCommunity);

  return (
    <div className="space-y-4">
      {/* Filter Buttons */}
      <div className="flex flex-wrap items-center gap-2">
        {filters.map((filter) => (
          <Button
            key={filter.id}
            variant={activeFilter === filter.id ? 'default' : 'outline'}
            size="sm"
            onClick={() => onFilterChange(filter.id)}
            title={filter.description}
          >
            {filter.label}
          </Button>
        ))}
        
        {/* Communities Dropdown */}
        <div className="flex items-center gap-2">
          <Select
            value={selectedCommunity || 'all'}
            onValueChange={(value) => onCommunityChange(value === 'all' ? null : value || null)}
          >
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Communities" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4" />
                  <span>All Communities</span>
                </div>
              </SelectItem>
              {loading ? (
                <SelectItem value="loading" disabled>
                  Loading communities...
                </SelectItem>
              ) : userCommunities.length === 0 ? (
                <SelectItem value="none" disabled>
                  No communities joined
                </SelectItem>
              ) : (
                userCommunities.map((community) => (
                  <SelectItem key={community.id} value={community.id}>
                    <div className="flex items-center space-x-2">
                      <div className="h-4 w-4 rounded-full bg-primary/20 flex items-center justify-center">
                        <span className="text-xs font-medium">
                          {community.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <span className="truncate">{community.name}</span>
                      <Badge variant="secondary" className="text-xs">
                        {community.memberCount}
                      </Badge>
                    </div>
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
          
          {/* Clear Community Filter */}
          {selectedCommunity && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onCommunityChange(null)}
              title="Clear community filter"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Active Filters Display */}
      {(activeFilter !== 'all' || selectedCommunity) && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">Active filters:</span>
          
          {activeFilter !== 'all' && (
            <Badge variant="secondary" className="flex items-center space-x-1">
              <span>{filters.find(f => f.id === activeFilter)?.label}</span>
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
                onClick={() => onFilterChange('all')}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}
          
          {selectedCommunity && selectedCommunityData && (
            <Badge variant="secondary" className="flex items-center space-x-1">
              <Users className="h-3 w-3" />
              <span>{selectedCommunityData.name}</span>
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
                onClick={() => onCommunityChange(null)}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}
