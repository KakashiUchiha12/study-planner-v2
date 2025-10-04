'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Image, FileText, Link, Hash } from 'lucide-react';

interface CreatePostDialogProps {
  communityId: string;
  onPostCreated: () => void;
}

export function CreatePostDialog({ communityId, onPostCreated }: CreatePostDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    type: 'text',
    tags: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`/api/communities/${communityId}/posts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setFormData({ title: '', content: '', type: 'text', tags: '' });
        setOpen(false);
        onPostCreated();
      } else {
        const error = await response.json();
        console.error('Error creating post:', error);
      }
    } catch (error) {
      console.error('Error creating post:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPostTypeIcon = (type: string) => {
    switch (type) {
      case 'image':
        return <Image className="h-4 w-4" />;
      case 'link':
        return <Link className="h-4 w-4" />;
      case 'poll':
        return <Hash className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Create Post
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Create Post
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Post Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="What's on your mind?"
              required
            />
          </div>

          <div>
            <Label htmlFor="type">Post Type</Label>
            <Select value={formData.type} onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="text">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Text Post
                  </div>
                </SelectItem>
                <SelectItem value="image">
                  <div className="flex items-center gap-2">
                    <Image className="h-4 w-4" />
                    Image Post
                  </div>
                </SelectItem>
                <SelectItem value="link">
                  <div className="flex items-center gap-2">
                    <Link className="h-4 w-4" />
                    Link Post
                  </div>
                </SelectItem>
                <SelectItem value="poll">
                  <div className="flex items-center gap-2">
                    <Hash className="h-4 w-4" />
                    Poll
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="content">Content</Label>
            <Textarea
              id="content"
              value={formData.content}
              onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
              placeholder="Share your thoughts, ideas, or questions..."
              rows={6}
              required
            />
          </div>

          {formData.type === 'image' && (
            <div>
              <Label htmlFor="image">Upload Image</Label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                <div className="space-y-1 text-center">
                  <Image className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="flex text-sm text-gray-600">
                    <label htmlFor="image" className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
                      <span>Upload a file</span>
                      <input id="image" name="image" type="file" className="sr-only" />
                    </label>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
                </div>
              </div>
            </div>
          )}

          {formData.type === 'link' && (
            <div>
              <Label htmlFor="url">Link URL</Label>
              <Input
                id="url"
                type="url"
                placeholder="https://example.com"
                onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
              />
            </div>
          )}

          <div>
            <Label htmlFor="tags">Tags (Optional)</Label>
            <Input
              id="tags"
              value={formData.tags}
              onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
              placeholder="study, homework, help (comma separated)"
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !formData.title.trim() || !formData.content.trim()}>
              {loading ? 'Creating...' : 'Create Post'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
