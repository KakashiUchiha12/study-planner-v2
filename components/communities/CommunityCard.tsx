'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Users, 
  Lock, 
  Globe, 
  Eye, 
  Bookmark, 
  BookmarkCheck, 
  UserPlus, 
  UserMinus,
  MoreHorizontal,
  Calendar,
  Tag
} from 'lucide-react';
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
}

interface CommunityCardProps {
  community: Community;
  isMember: boolean;
  isSaved: boolean;
  onJoin: (communityId: string) => void;
  onLeave: (communityId: string) => void;
  onView: () => void;
  onSave: (communityId: string) => void;
  onUnsave: (communityId: string) => void;
}

export function CommunityCard({
  community,
  isMember,
  isSaved,
  onJoin,
  onLeave,
  onView,
  onSave,
  onUnsave,
}: CommunityCardProps) {
  const [isJoining, setIsJoining] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showAllTags, setShowAllTags] = useState(false);

  const handleJoin = async () => {
    setIsJoining(true);
    try {
      await onJoin(community.id);
    } finally {
      setIsJoining(false);
    }
  };

  const handleLeave = async () => {
    setIsLeaving(true);
    try {
      await onLeave(community.id);
    } finally {
      setIsLeaving(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (isSaved) {
        await onUnsave(community.id);
      } else {
        await onSave(community.id);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const getVisibilityIcon = () => {
    switch (community.visibility) {
      case 'private':
        return <Lock className="h-3 w-3" />;
      case 'restricted':
        return <Eye className="h-3 w-3" />;
      default:
        return <Globe className="h-3 w-3" />;
    }
  };

  const getJoinTypeColor = () => {
    switch (community.joinType) {
      case 'open':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'closed':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'invite_only':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getVisibilityColor = () => {
    switch (community.visibility) {
      case 'public':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'private':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'restricted':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const formatTags = (tags: string | string[]) => {
    if (typeof tags === 'string') {
      try {
        // Try to parse as JSON first
        const parsed = JSON.parse(tags);
        if (Array.isArray(parsed)) {
          return parsed.map(tag => typeof tag === 'string' ? tag.trim() : String(tag).trim());
        }
        return [parsed];
      } catch {
        // If JSON parsing fails, try to clean up the string
        // Handle cases like ["MDCAT","Study","MBBS","BDS","Medical Dream","Biology"]
        let cleanTags = tags.trim();
        
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
    return Array.isArray(tags) ? tags.map(tag => String(tag).trim()) : [];
  };

  const tags = formatTags(community.tags);
  
  const handleBannerClick = () => {
    onView();
  };

  const handleNameClick = () => {
    onView();
  };

  return (
    <Card className="group hover:shadow-lg transition-all duration-200 border-border/50 hover:border-border overflow-hidden">
      {/* Community Banner */}
      {community.banner && (
        <div 
          className="relative h-32 w-full overflow-hidden cursor-pointer"
          onClick={handleBannerClick}
        >
          <img
            src={community.banner}
            alt={`${community.name} banner`}
            className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
        </div>
      )}
      
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={community.avatar} alt={community.name} />
              <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                {community.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 
                  className="font-semibold text-lg truncate cursor-pointer hover:text-primary transition-colors"
                  onClick={handleNameClick}
                >
                  {community.name}
                </h3>
                {community.isVerified && (
                  <Badge variant="secondary" className="text-xs">
                    Verified
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground truncate">
                {community.category}
                {community.subcategory && ` • ${community.subcategory}`}
              </p>
            </div>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleSave} disabled={isSaving}>
                {isSaved ? (
                  <>
                    <BookmarkCheck className="h-4 w-4 mr-2" />
                    Unsave
                  </>
                ) : (
                  <>
                    <Bookmark className="h-4 w-4 mr-2" />
                    Save
                  </>
                )}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="pb-3">
        <div className="mb-3">
          <RichTextDescription 
            content={community.shortDescription || community.description || 'No description available'}
            maxWords={50}
            className="text-sm text-muted-foreground"
          />
        </div>

        {/* Tags */}
        {tags && (() => {
          // Use the already formatted tags
          const tagsArray = Array.isArray(tags) ? tags : [];
          
          return tagsArray.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {(showAllTags ? tagsArray : tagsArray.slice(0, 3)).map((tag, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  <Tag className="h-3 w-3 mr-1" />
                  {tag}
                </Badge>
              ))}
              {tagsArray.length > 3 && !showAllTags && (
                <Badge 
                  variant="outline" 
                  className="text-xs cursor-pointer hover:bg-muted transition-colors"
                  onClick={() => setShowAllTags(true)}
                >
                  +{tagsArray.length - 3} more
                </Badge>
              )}
              {showAllTags && tagsArray.length > 3 && (
                <Badge 
                  variant="outline" 
                  className="text-xs cursor-pointer hover:bg-muted transition-colors"
                  onClick={() => setShowAllTags(false)}
                >
                  Show less
                </Badge>
              )}
            </div>
          );
        })()}

        {/* Community Info */}
        <div className="flex items-center justify-between text-sm text-muted-foreground mb-3">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              <span>{community.memberCount.toLocaleString()}</span>
              {community.maxMembers && (
                <span>/ {community.maxMembers.toLocaleString()}</span>
              )}
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <span>{new Date(community.createdAt).toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'short', 
                day: 'numeric' 
              })}</span>
            </div>
          </div>
        </div>

        {/* Badges */}
        <div className="flex flex-wrap gap-2">
          <Badge className={`text-xs ${getVisibilityColor()}`}>
            {getVisibilityIcon()}
            <span className="ml-1 capitalize">{community.visibility}</span>
          </Badge>
          <Badge className={`text-xs ${getJoinTypeColor()}`}>
            <span className="capitalize">{community.joinType?.replace('_', ' ') || 'open'}</span>
          </Badge>
        </div>
      </CardContent>

      <CardFooter className="pt-0">
        <div className="flex w-full gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onView}
            className="flex-1"
          >
            View Details
          </Button>
          
          {isMember ? (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleLeave}
              disabled={isLeaving}
              className="flex-1"
            >
              <UserMinus className="h-4 w-4 mr-2" />
              {isLeaving ? 'Leaving...' : 'Leave'}
            </Button>
          ) : (
            <Button
              variant="default"
              size="sm"
              onClick={handleJoin}
              disabled={isJoining || community.joinType === 'closed'}
              className="flex-1"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              {isJoining ? 'Joining...' : 'Join'}
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}
