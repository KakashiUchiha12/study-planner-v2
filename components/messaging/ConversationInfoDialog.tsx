'use client';

import { useState, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { 
  Info, 
  Users, 
  User, 
  Settings, 
  Trash2, 
  Edit,
  MoreVertical,
  Crown,
  UserPlus,
  UserMinus
} from 'lucide-react';

interface Participant {
  id: string;
  role: string;
  joinedAt: string;
  lastReadAt?: string;
  user: {
    id: string;
    name: string;
    image?: string;
  };
}

interface Conversation {
  id: string;
  type: string;
  name?: string;
  description?: string;
  avatar?: string;
  createdAt: string;
  participants: Participant[];
  createdBy: {
    id: string;
    name: string;
    image?: string;
  };
}

interface ConversationInfoDialogProps {
  conversation: Conversation | null;
  currentUserId: string;
  onConversationUpdate: (conversation: Conversation) => void;
  onDeleteConversation: () => void;
  trigger?: React.ReactNode;
}

export function ConversationInfoDialog({
  conversation,
  currentUserId,
  onConversationUpdate,
  onDeleteConversation,
  trigger
}: ConversationInfoDialogProps) {
  const [open, setOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (conversation) {
      setEditName(conversation.name || '');
      setEditDescription(conversation.description || '');
    }
  }, [conversation]);

  if (!conversation) return null;

  const isCurrentUserAdmin = conversation.participants.some(
    p => p.user.id === currentUserId && p.role === 'admin'
  );

  const isCurrentUserCreator = conversation.createdBy.id === currentUserId;

  const handleUpdateConversation = async () => {
    if (!isCurrentUserAdmin) return;

    setIsUpdating(true);
    try {
      const response = await fetch(`/api/messaging/conversations/${conversation.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: editName.trim(),
          description: editDescription.trim(),
        }),
      });

      if (response.ok) {
        const updatedConversation = await response.json();
        onConversationUpdate(updatedConversation);
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Error updating conversation:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteConversation = async () => {
    if (!isCurrentUserAdmin) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/messaging/conversations/${conversation.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        onDeleteConversation();
        setOpen(false);
      }
    } catch (error) {
      console.error('Error deleting conversation:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleRemoveParticipant = async (participantId: string) => {
    try {
      const response = await fetch(
        `/api/messaging/conversations/${conversation.id}/participants?userId=${participantId}`,
        { method: 'DELETE' }
      );

      if (response.ok) {
        // Refresh conversation data
        const updatedResponse = await fetch(`/api/messaging/conversations/${conversation.id}`);
        if (updatedResponse.ok) {
          const updatedConversation = await updatedResponse.json();
          onConversationUpdate(updatedConversation);
        }
      }
    } catch (error) {
      console.error('Error removing participant:', error);
    }
  };

  const getConversationDisplayName = () => {
    if (conversation.name) return conversation.name;
    
    if (conversation.type === 'direct') {
      const otherParticipant = conversation.participants.find(
        p => p.user.id !== currentUserId
      );
      return otherParticipant?.user.name || 'Unknown User';
    }
    
    return 'Group Chat';
  };

  const getConversationAvatar = () => {
    if (conversation.avatar) return conversation.avatar;
    
    if (conversation.type === 'direct') {
      const otherParticipant = conversation.participants.find(
        p => p.user.id !== currentUserId
      );
      return otherParticipant?.user.image;
    }
    
    return null;
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Unknown date';
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="sm">
            <Info className="h-4 w-4" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Info className="h-5 w-5" />
            <span>Conversation Info</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Conversation Header */}
          <div className="flex items-center space-x-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={getConversationAvatar()} />
              <AvatarFallback>
                {conversation.type === 'direct' ? (
                  <User className="h-8 w-8" />
                ) : (
                  <Users className="h-8 w-8" />
                )}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              {isEditing ? (
                <div className="space-y-2">
                  <Input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="Conversation name"
                  />
                  <Textarea
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    placeholder="Description (optional)"
                    rows={2}
                  />
                  <div className="flex space-x-2">
                    <Button size="sm" onClick={handleUpdateConversation} disabled={isUpdating}>
                      {isUpdating ? 'Saving...' : 'Save'}
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setIsEditing(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div>
                  <h3 className="text-lg font-semibold">{getConversationDisplayName()}</h3>
                  {conversation.description && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {conversation.description}
                    </p>
                  )}
                  <div className="flex items-center space-x-2 mt-2">
                    <Badge variant="secondary">
                      {conversation.type === 'direct' ? 'Direct Message' : 
                       conversation.type === 'study_group' ? 'Study Group' : 'Group Chat'}
                    </Badge>
                    {isCurrentUserAdmin && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsEditing(true)}
                        className="h-6 px-2"
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Conversation Details */}
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Details</h4>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div>Created: {formatDate(conversation.createdAt)}</div>
                <div>Created by: {conversation.createdBy.name}</div>
                <div>Participants: {conversation.participants.length}</div>
              </div>
            </div>

            {/* Participants */}
            <div>
              <h4 className="font-medium mb-2">Participants</h4>
              <div className="space-y-2">
                {conversation.participants.map((participant) => (
                  <div
                    key={participant.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-muted/50"
                  >
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={participant.user.image} />
                        <AvatarFallback>
                          {participant.user.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-sm">{participant.user.name}</p>
                        <p className="text-xs text-muted-foreground">
                          Joined {formatDate(participant.joinedAt)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {participant.role === 'admin' && (
                        <Badge variant="outline" className="text-xs">
                          <Crown className="h-3 w-3 mr-1" />
                          Admin
                        </Badge>
                      )}
                      {isCurrentUserAdmin && participant.user.id !== currentUserId && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                              <MoreVertical className="h-3 w-3" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => handleRemoveParticipant(participant.user.id)}
                              className="text-destructive"
                            >
                              <UserMinus className="h-4 w-4 mr-2" />
                              Remove
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Actions */}
          {isCurrentUserAdmin && (
            <div className="flex justify-end space-x-2 pt-4 border-t">
              <Button
                variant="destructive"
                onClick={handleDeleteConversation}
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Delete Conversation'}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
