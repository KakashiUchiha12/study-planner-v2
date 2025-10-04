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
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Clock, MapPin, Users } from 'lucide-react';

interface CreateEventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  communityId: string;
  onEventCreated: (event: any) => void;
}

export function CreateEventDialog({
  open,
  onOpenChange,
  communityId,
  onEventCreated,
}: CreateEventDialogProps) {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);

    try {
      const response = await fetch('/api/communities/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          communityId,
          maxAttendees: formData.maxAttendees ? parseInt(formData.maxAttendees) : null,
        }),
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-500" />
            <DialogTitle>Create Event</DialogTitle>
          </div>
          <DialogDescription>
            Create a new event for your community
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Event Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Enter event title"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe your event"
              rows={3}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="type">Event Type</Label>
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
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="time">Time</Label>
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
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="Event location or online meeting link"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="maxAttendees">Max Attendees (optional)</Label>
            <Input
              id="maxAttendees"
              type="number"
              value={formData.maxAttendees}
              onChange={(e) => setFormData({ ...formData, maxAttendees: e.target.value })}
              placeholder="Leave empty for unlimited"
              min="1"
            />
          </div>
          
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
