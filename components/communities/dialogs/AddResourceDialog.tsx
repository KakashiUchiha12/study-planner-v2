'use client';

import { useState, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { QuillWrapper } from '@/components/social/QuillWrapper';
import { FileText, Upload, X, Link } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface MediaItem {
  id: string;
  kind: 'image' | 'file';
  url: string;
  mimeType: string;
  name: string;
  size: number;
  thumbnailUrl?: string;
}

interface AddResourceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  communityId: string;
  onResourceAdded: (resource: any) => void;
}

export function AddResourceDialog({
  open,
  onOpenChange,
  communityId,
  onResourceAdded,
}: AddResourceDialogProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [links, setLinks] = useState<{ id: string; url: string; title: string }[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    } catch (error) {
      console.error('Error uploading files:', error);
      // Fallback to local previews
      const items: MediaItem[] = list.map(file => ({
        id: Math.random().toString(36).slice(2),
        kind: file.type.startsWith('image/') ? 'image' : 'file',
        url: URL.createObjectURL(file),
        mimeType: file.type,
        name: file.name,
        size: file.size,
      }));
      setMedia(prev => [...prev, ...items]);
    }
  };

  const removeMedia = (id: string) => {
    setMedia(prev => prev.filter(m => m.id !== id));
  };

  const addLink = () => {
    setLinks(prev => [...prev, { id: Math.random().toString(36).slice(2), url: '', title: '' }]);
  };

  const removeLink = (id: string) => {
    setLinks(prev => prev.filter(l => l.id !== id));
  };

  const updateLink = (id: string, field: 'url' | 'title', value: string) => {
    setLinks(prev => prev.map(l => l.id === id ? { ...l, [field]: value } : l));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAdding(true);

    try {
      // Validate that we have at least one resource
      const hasValidResources = media.length > 0 || links.some(link => link.url.trim());

      if (!hasValidResources) {
        alert('Please add at least one file or link');
        setIsAdding(false);
        return;
      }

      const formDataToSend = new FormData();
      formDataToSend.append('title', title);
      formDataToSend.append('description', description);
      formDataToSend.append('communityId', communityId);
      
      // Add media files - we need to fetch the actual files from URLs
      for (const item of media) {
        try {
          const response = await fetch(item.url);
          const blob = await response.blob();
          const file = new File([blob], item.name, { type: item.mimeType });
          formDataToSend.append(`files`, file);
          formDataToSend.append(`fileTitles`, title || item.name);
        } catch (error) {
          console.error('Error fetching file:', error);
        }
      }

      // Add links
      links.forEach((link, index) => {
        if (link.url.trim()) {
          formDataToSend.append(`links`, link.url);
          formDataToSend.append(`linkTitles`, link.title || 'Link');
        }
      });

      const response = await fetch('/api/communities/resources', {
        method: 'POST',
        body: formDataToSend,
      });

      if (response.ok) {
        const result = await response.json();
        // If multiple resources were created, add them all
        if (result.resources) {
          result.resources.forEach((resource: any) => {
            onResourceAdded(resource);
          });
        } else {
          onResourceAdded(result);
        }
        onOpenChange(false);
        resetForm();
      } else {
        const error = await response.json();
        alert(`Failed to add resources: ${error.error}`);
      }
    } catch (error) {
      console.error('Error adding resources:', error);
      alert('An error occurred while adding the resources.');
    } finally {
      setIsAdding(false);
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setMedia([]);
    setLinks([]);
  };

  const canSubmit = title.trim().length > 0 && (media.length > 0 || links.some(link => link.url.trim()));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-green-500" />
            <DialogTitle>Add Resources</DialogTitle>
          </div>
          <DialogDescription>
            Share multiple files and links with your community
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Collection Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter a title for this resource collection"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <QuillWrapper
              value={description}
              onChange={setDescription}
              placeholder="Describe this resource collection (optional)"
              showPreview={true}
              minHeight={100}
            />
          </div>

          {/* File Upload Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Files</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2"
              >
                <Upload className="h-4 w-4" />
                Add Files
              </Button>
            </div>
            
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={(e) => e.target.files && handleFiles(e.target.files)}
              accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif,.mp4,.mp3,.zip,.rar"
            />

            {media.length > 0 && (
              <div className="grid grid-cols-2 gap-3">
                {media.map((item) => (
                  <div key={item.id} className="border rounded-lg p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline">File</Badge>
                        <span className="text-sm font-medium truncate">{item.name}</span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeMedia(item.id)}
                        className="h-6 w-6 p-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    {item.kind === 'image' ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img 
                        src={item.url} 
                        alt={item.name} 
                        className="h-20 w-full object-cover rounded" 
                      />
                    ) : (
                      <div className="h-20 w-full flex items-center justify-center rounded border text-xs bg-muted">
                        <FileText className="h-6 w-6 text-muted-foreground" />
                      </div>
                    )}
                    
                    <div className="text-xs text-muted-foreground">
                      {(item.size / 1024 / 1024).toFixed(2)} MB
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Links Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Links</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addLink}
                className="flex items-center gap-2"
              >
                <Link className="h-4 w-4" />
                Add Link
              </Button>
            </div>

            {links.length > 0 && (
              <div className="space-y-3">
                {links.map((link) => (
                  <div key={link.id} className="border rounded-lg p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline">Link</Badge>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeLink(link.id)}
                        className="h-6 w-6 p-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="space-y-2">
                      <Input
                        value={link.title}
                        onChange={(e) => updateLink(link.id, 'title', e.target.value)}
                        placeholder="Link title (optional)"
                      />
                      <Input
                        value={link.url}
                        onChange={(e) => updateLink(link.id, 'url', e.target.value)}
                        placeholder="https://example.com"
                        type="url"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isAdding}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isAdding || !canSubmit}>
              {isAdding ? 'Adding...' : 'Add Resources'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}