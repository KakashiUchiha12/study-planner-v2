'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  User, 
  Globe,
  X,
  Edit,
  Share2,
  Heart
} from 'lucide-react';
import { format } from 'date-fns';
import { PostMediaGrid } from '@/components/social/PostMediaGrid';

interface Event {
  id: string;
  title: string;
  description?: string;
  type?: string;
  startTime?: string;
  endTime?: string;
  location?: string;
  isOnline?: boolean;
  maxAttendees?: number;
  createdBy?: string;
  media?: any[];
  createdByUser?: {
    id: string;
    name: string;
    image?: string;
  };
  _count?: {
    attendees: number;
  };
  userAttendance?: {
    id: string;
    status: string;
  } | null;
}

interface EventDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: Event | null;
  onJoinEvent?: (event: Event, isAttending: boolean) => void;
  onEditEvent?: (event: Event) => void;
  onShareEvent?: (event: Event) => void;
  onSaveEvent?: (event: Event) => void;
}

export function EventDetailDialog({
  open,
  onOpenChange,
  event,
  onJoinEvent,
  onEditEvent,
  onShareEvent,
  onSaveEvent,
}: EventDetailDialogProps) {
  const [isJoining, setIsJoining] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isAttending, setIsAttending] = useState(event?.userAttendance?.status === 'going' || false);

  // Update attendance state when event changes
  useEffect(() => {
    setIsAttending(event?.userAttendance?.status === 'going' || false);
  }, [event?.userAttendance?.status]);

  if (!event) return null;

  const handleJoinEvent = async () => {
    if (isAttending) {
      // Leave event
      setIsLeaving(true);
      try {
        const response = await fetch(`/api/communities/events/${event.id}/join`, {
          method: 'DELETE',
        });
        if (response.ok) {
          setIsAttending(false);
          // Update the event prop if onJoinEvent is provided
          if (onJoinEvent) {
            onJoinEvent(event, false);
          }
        } else {
          const error = await response.json();
          alert(`Failed to leave event: ${error.error}`);
        }
      } catch (error) {
        console.error('Error leaving event:', error);
        alert('An error occurred while leaving the event.');
      } finally {
        setIsLeaving(false);
      }
    } else {
      // Join event
      setIsJoining(true);
      try {
        const response = await fetch(`/api/communities/events/${event.id}/join`, {
          method: 'POST',
        });
        if (response.ok) {
          setIsAttending(true);
          // Update the event prop if onJoinEvent is provided
          if (onJoinEvent) {
            onJoinEvent(event, true);
          }
        } else {
          const error = await response.json();
          alert(`Failed to join event: ${error.error}`);
        }
      } catch (error) {
        console.error('Error joining event:', error);
        alert('An error occurred while joining the event.');
      } finally {
        setIsJoining(false);
      }
    }
  };

  const handleSaveEvent = () => {
    setIsSaved(!isSaved);
    // TODO: Implement save to user's saved events
    console.log('Saving event:', event.id, isSaved ? 'unsaved' : 'saved');
  };

  const handleShareEvent = () => {
    if (navigator.share) {
      navigator.share({
        title: event.title,
        text: event.description,
        url: window.location.href,
      });
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      alert('Event link copied to clipboard!');
    }
  };

  const handleEditEvent = () => {
    onEditEvent?.(event);
  };

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'study_session':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'meetup':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'workshop':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'social':
        return 'bg-pink-100 text-pink-800 border-pink-200';
      case 'exam_prep':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <DialogTitle className="text-2xl font-bold mb-2">
                {event.title}
              </DialogTitle>
              <div className="flex items-center gap-2 mb-4">
                <Badge 
                  variant="outline" 
                  className={getEventTypeColor(event.type || 'other')}
                >
                  {(event.type || 'other').replace('_', ' ')}
                </Badge>
                {event.isOnline && (
                  <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
                    <Globe className="h-3 w-3 mr-1" />
                    Online
                  </Badge>
                )}
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Event Description */}
          {event.description && (
            <div className="space-y-2">
              <h3 className="font-semibold text-lg">Description</h3>
              <div 
                className="prose prose-sm max-w-none text-muted-foreground"
                dangerouslySetInnerHTML={{ __html: event.description }}
              />
            </div>
          )}

          {/* Event Media */}
          {event.media && event.media.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-semibold text-lg">Attachments</h3>
              <PostMediaGrid media={event.media} />
            </div>
          )}

          {/* Event Details */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Event Details</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Date & Time */}
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Date & Time</p>
                    <p className="text-sm text-muted-foreground">
                      {event.startTime && !isNaN(new Date(event.startTime).getTime()) ? (
                        <>
                          {format(new Date(event.startTime), 'EEEE, MMMM d, yyyy')}
                          <br />
                          {format(new Date(event.startTime), 'h:mm a')}
                          {event.endTime && !isNaN(new Date(event.endTime).getTime()) && (
                            <> - {format(new Date(event.endTime), 'h:mm a')}</>
                          )}
                        </>
                      ) : (
                        'Date TBD'
                      )}
                    </p>
                  </div>
                </div>

                {/* Location */}
                {event.location && (
                  <div className="flex items-center space-x-3">
                    {event.isOnline ? (
                      <Globe className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <MapPin className="h-5 w-5 text-muted-foreground" />
                    )}
                    <div>
                      <p className="font-medium">
                        {event.isOnline ? 'Online Location' : 'Location'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {event.location}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Attendees */}
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <Users className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Attendees</p>
                    <p className="text-sm text-muted-foreground">
                      {event._count?.attendees || 0} attending
                      {event.maxAttendees && ` / ${event.maxAttendees} max`}
                    </p>
                  </div>
                </div>

                {/* Creator */}
                {event.createdByUser && (
                  <div className="flex items-center space-x-3">
                    <User className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Created by</p>
                      <div className="flex items-center space-x-2">
                        <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center">
                          <span className="text-xs">
                            {event.createdByUser.name?.charAt(0).toUpperCase() || '?'}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {event.createdByUser.name || 'Unknown'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2 pt-4 border-t">
            <Button 
              onClick={handleJoinEvent}
              disabled={isJoining || isLeaving}
              className="flex-1 min-w-[120px]"
            >
              {isJoining ? 'Joining...' : isLeaving ? 'Leaving...' : isAttending ? 'Leave Event' : 'Join Event'}
            </Button>
            
            <Button
              variant="outline"
              onClick={handleSaveEvent}
              className="flex items-center gap-2"
            >
              <Heart className={`h-4 w-4 ${isSaved ? 'fill-red-500 text-red-500' : ''}`} />
              {isSaved ? 'Saved' : 'Save'}
            </Button>
            
            <Button
              variant="outline"
              onClick={handleShareEvent}
              className="flex items-center gap-2"
            >
              <Share2 className="h-4 w-4" />
              Share
            </Button>
            
            <Button
              variant="outline"
              onClick={handleEditEvent}
              className="flex items-center gap-2"
            >
              <Edit className="h-4 w-4" />
              Edit
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
