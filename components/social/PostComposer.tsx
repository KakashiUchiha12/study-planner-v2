'use client';

import { useMemo, useRef, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { QuillWrapper } from '@/components/social/QuillWrapper';
import { Card, CardContent } from '@/components/ui/card';
import { useSocialFeed, MediaItem } from '@/hooks/useSocialFeed';
import { Users, X, Globe } from 'lucide-react';

interface Community {
  id: string;
  name: string;
  slug: string;
  avatar?: string;
  memberCount: number;
  visibility: 'public' | 'private' | 'restricted';
}

interface PostComposerProps {
  onPostCreated?: (post: any) => void;
  defaultCommunityId?: string;
}

export function PostComposer({ onPostCreated, defaultCommunityId }: PostComposerProps = {}) {
  const [text, setText] = useState('');
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [selectedCommunity, setSelectedCommunity] = useState<string>(defaultCommunityId || 'none');
  const [userCommunities, setUserCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { createPost, attachLocalFiles } = useSocialFeed();

  const canPost = useMemo(() => text.trim().length > 0 || media.length > 0, [text, media]);

  // Fetch user's communities
  useEffect(() => {
    let isMounted = true;
    
    const fetchUserCommunities = async () => {
      try {
        const response = await fetch('/api/communities/my');
        if (response.ok && isMounted) {
          const data = await response.json();
          setUserCommunities(data.communities || []);
        }
      } catch (error) {
        console.error('Error fetching user communities:', error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchUserCommunities();
    
    return () => {
      isMounted = false;
    };
  }, []);

  const handleFiles = async (files: FileList | File[]) => {
    const list = Array.from(files);
    // Upload to server to get permanent URLs
    const form = new FormData();
    list.forEach(f => form.append('files', f));
    try {
      const res = await fetch('/api/social/upload', { method: 'POST', body: form });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.media)) {
          const items: MediaItem[] = data.media.map((m: any) => ({
            id: m.id || Math.random().toString(36).slice(2),
            kind: m.kind,
            url: m.url,
            mimeType: m.mimeType,
            name: m.name,
            size: m.size,
            thumbnailUrl: m.thumbnailUrl,
          }));
          setMedia(prev => [...prev, ...items]);
          return;
        }
      }
    } catch {
      // fallback to local previews so the UI still works offline
      const items = await attachLocalFiles(files);
      setMedia(prev => [...prev, ...items]);
      return;
    }
    // if server failed without exception, fallback to local
    const items = await attachLocalFiles(files);
    setMedia(prev => [...prev, ...items]);
  };

  const onSubmit = () => {
    if (!canPost) return;
    const postData = { 
      content: text, 
      media,
      communityId: selectedCommunity === 'none' ? null : selectedCommunity || null
    };
    createPost(postData);
    
    // Call onPostCreated callback if provided
    if (onPostCreated) {
      onPostCreated(postData);
    }
    
    setText('');
    setMedia([]);
    setSelectedCommunity(defaultCommunityId || 'none');
  };

  const selectedCommunityData = selectedCommunity === 'none' ? null : userCommunities.find(c => c.id === selectedCommunity);

  // If not expanded, show minimalistic placeholder
  if (!isExpanded) {
    return (
      <Card className="border-dashed cursor-pointer hover:border-primary/50 transition-colors" onClick={() => setIsExpanded(true)}>
        <CardContent className="p-4">
          <div className="flex items-center space-x-3 text-muted-foreground">
            <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
              <span className="text-sm">👤</span>
            </div>
            <div className="flex-1">
              <p className="text-sm">Share something with the world...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Full expanded composer
  return (
    <Card className="border-dashed">
      <CardContent className="p-4 space-y-3">
        {/* Community Selection */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium">Share to:</span>
            <Select
              value={selectedCommunity}
              onValueChange={setSelectedCommunity}
            >
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Select community (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">
                  <div className="flex items-center space-x-2">
                    <Globe className="h-4 w-4" />
                    <span>Public Feed</span>
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
          </div>
          
          <div className="flex items-center space-x-2">
            {selectedCommunity && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedCommunity('')}
                title="Remove community selection"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(false)}
              title="Minimize composer"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Selected Community Display */}
        {selectedCommunity && (
          <div className="flex items-center space-x-2 p-2 bg-muted/50 rounded-lg">
            <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center">
              <span className="text-xs font-medium">
                {selectedCommunity === 'none' ? '🌐' : selectedCommunityData?.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <span className="font-medium text-sm">
                  {selectedCommunity === 'none' ? 'Public Feed' : selectedCommunityData?.name}
                </span>
                {selectedCommunityData && (
                  <Badge variant="outline" className="text-xs">
                    {selectedCommunityData.visibility}
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {selectedCommunity === 'none' ? 'Visible to everyone' : `${selectedCommunityData?.memberCount} members`}
              </p>
            </div>
          </div>
        )}

        {/* Post Content */}
        <QuillWrapper 
          value={text} 
          onChange={setText} 
          placeholder={
            selectedCommunity === 'none' 
              ? "Share something with everyone..."
              : selectedCommunityData 
                ? `Share something with ${selectedCommunityData.name}...`
                : "Share an update..."
          } 
          showPreview={true} 
        />
        
        {/* Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={(e) => e.target.files && handleFiles(e.target.files)}
            />
            <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
              Attach
            </Button>
            {media.length > 0 && <span>{media.length} file(s) attached</span>}
          </div>
          <Button onClick={onSubmit} disabled={!canPost}>
            {selectedCommunity === 'none' 
              ? 'Post to Public Feed' 
              : selectedCommunityData 
                ? `Post to ${selectedCommunityData.name}` 
                : 'Create Post'}
          </Button>
        </div>
        
        {/* Media Preview */}
        {media.length > 0 && (
          <div className="grid grid-cols-3 gap-2">
            {media.map(m => (
              <div key={m.id} className="relative">
                {m.kind === 'image' ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={m.url} alt={m.name || 'image'} className="h-24 w-full object-cover rounded" />
                ) : (
                  <div className="h-24 w-full flex items-center justify-center rounded border text-xs">
                    {m.name || 'file'}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
