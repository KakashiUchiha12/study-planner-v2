'use client';

import { useState } from 'react';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Clock, MapPin, Users, Upload, X, FileText, Image, Link } from 'lucide-react';
import { QuillWrapper } from '@/components/social/QuillWrapper';

interface CreateEventDialogQuillProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  communityId: string;
  onEventCreated: (event: any) => void;
}

interface MediaFile {
  id: string;
  file: File;
  type: 'image' | 'file';
  preview?: string;
}

export function CreateEventDialogQuill({
  open,
  onOpenChange,
  communityId,
  onEventCreated,
}: CreateEventDialogQuillProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    location: '',
    maxAttendees: '',
    type: 'meetup',
    isOnline: false,
  });
  const [richDescription, setRichDescription] = useState('');
  const [media, setMedia] = useState<MediaFile[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('title', formData.title);
      formDataToSend.append('description', richDescription || formData.description);
      formDataToSend.append('date', formData.date);
      formDataToSend.append('time', formData.time);
      formDataToSend.append('location', formData.location);
      formDataToSend.append('type', formData.type);
      formDataToSend.append('communityId', communityId);
      formDataToSend.append('maxAttendees', formData.maxAttendees || '');
      formDataToSend.append('isOnline', formData.isOnline.toString());
      
      // Add media files
      media.forEach((mediaFile, index) => {
        formDataToSend.append(`media_${index}`, mediaFile.file);
        formDataToSend.append(`media_type_${index}`, mediaFile.type);
      });

      const response = await fetch('/api/communities/events', {
        method: 'POST',
        body: formDataToSend,
      });

      if (response.ok) {
        const event = await response.json();
        onEventCreated(event);
        onOpenChange(false);
        setFormData({
          title: '',
          description: '',
          date: '',
          time: '',
          location: '',
          maxAttendees: '',
          type: 'meetup',
          isOnline: false,
        });
        setRichDescription('');
        setMedia([]);
      } else {
        const error = await response.json();
        alert(`Failed to create event: ${error.error}`);
      }
    } catch (error) {
      console.error('Error creating event:', error);
      alert('An error occurred while creating the event.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    files.forEach(file => {
      const isImage = file.type.startsWith('image/');
      const mediaFile: MediaFile = {
        id: Math.random().toString(36).substr(2, 9),
        file,
        type: isImage ? 'image' : 'file',
      };

      if (isImage) {
        const reader = new FileReader();
        reader.onload = (e) => {
          mediaFile.preview = e.target?.result as string;
          setMedia(prev => [...prev, mediaFile]);
        };
        reader.readAsDataURL(file);
      } else {
        setMedia(prev => [...prev, mediaFile]);
      }
    });
  };

  const removeMedia = (id: string) => {
    setMedia(prev => prev.filter(m => m.id !== id));
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <Image className="h-4 w-4" />;
    if (type.includes('pdf')) return <FileText className="h-4 w-4" />;
    return <FileText className="h-4 w-4" />;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-500" />
            <DialogTitle>Create Event</DialogTitle>
          </div>
          <DialogDescription>
            Create a new event for your community with rich content and attachments
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Event Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Enter event title"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="type">Event Type *</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => setFormData({ ...formData, type: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select event type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="meetup">Meetup</SelectItem>
                  <SelectItem value="study_session">Study Session</SelectItem>
                  <SelectItem value="workshop">Workshop</SelectItem>
                  <SelectItem value="social">Social Event</SelectItem>
                  <SelectItem value="exam_prep">Exam Prep</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Event Description</Label>
            <QuillWrapper
              value={richDescription}
              onChange={setRichDescription}
              placeholder="Describe your event in detail with rich formatting..."
              minHeight={200}
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Date *</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="time">Time *</Label>
              <Input
                id="time"
                type="time"
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                required
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="location">Location *</Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="Event location or online meeting link"
              required
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="maxAttendees">Max Attendees</Label>
              <Input
                id="maxAttendees"
                type="number"
                value={formData.maxAttendees}
                onChange={(e) => setFormData({ ...formData, maxAttendees: e.target.value })}
                placeholder="Leave empty for unlimited"
                min="1"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Event Type</Label>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isOnline"
                  checked={formData.isOnline}
                  onChange={(e) => setFormData({ ...formData, isOnline: e.target.checked })}
                  className="rounded"
                />
                <Label htmlFor="isOnline" className="text-sm">Online Event</Label>
              </div>
            </div>
          </div>

          {/* File Upload Section */}
          <div className="space-y-2">
            <Label>Attachments</Label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
              <div className="text-center">
                <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                <Label htmlFor="file-upload" className="cursor-pointer">
                  <span className="text-sm text-gray-600">
                    Click to upload files or drag and drop
                  </span>
                </Label>
                <Input
                  id="file-upload"
                  type="file"
                  multiple
                  accept="image/*,.pdf,.doc,.docx,.txt,.zip"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Images, PDFs, documents up to 10MB each
                </p>
              </div>
            </div>
          </div>

          {/* Media Preview */}
          {media.length > 0 && (
            <div className="space-y-2">
              <Label>Attached Files</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {media.map((mediaFile) => (
                  <div key={mediaFile.id} className="relative border rounded-lg p-2">
                    <div className="flex items-center space-x-2">
                      {mediaFile.type === 'image' && mediaFile.preview ? (
                        <img
                          src={mediaFile.preview}
                          alt="Preview"
                          className="w-8 h-8 object-cover rounded"
                        />
                      ) : (
                        getFileIcon(mediaFile.file.type)
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs truncate">{mediaFile.file.name}</p>
                        <p className="text-xs text-gray-500">
                          {(mediaFile.file.size / 1024 / 1024).toFixed(1)}MB
                        </p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute top-1 right-1 h-6 w-6 p-0"
                      onClick={() => removeMedia(mediaFile.id)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isCreating}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isCreating}>
              {isCreating ? 'Creating...' : 'Create Event'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
