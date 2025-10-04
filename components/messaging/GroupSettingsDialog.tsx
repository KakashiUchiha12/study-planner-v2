'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Users, 
  UserPlus, 
  UserMinus, 
  Settings, 
  MoreVertical,
  Crown,
  Shield,
  User
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
  participants: Participant[];
  createdBy: {
    id: string;
    name: string;
    image?: string;
  };
}

interface GroupSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conversation: Conversation | null;
  onUpdateConversation: (conversation: Conversation) => void;
}

export function GroupSettingsDialog({
  open,
  onOpenChange,
  conversation,
  onUpdateConversation,
}: GroupSettingsDialogProps) {
  const { data: session } = useSession();
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const currentUserId = (session?.user as any)?.id;
  const isCurrentUserAdmin = conversation?.participants.some(
    p => p.user.id === currentUserId && p.role === 'admin'
  );

  useEffect(() => {
    if (conversation) {
      setGroupName(conversation.name || '');
      setGroupDescription(conversation.description || '');
    }
  }, [conversation]);

  const handleSaveSettings = async () => {
    if (!conversation || !groupName.trim()) return;

    setIsSaving(true);
    try {
      const response = await fetch(`/api/messaging/conversations/${conversation.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: groupName.trim(),
          description: groupDescription.trim(),
        }),
      });

      if (response.ok) {
        const updatedConversation = await response.json();
        onUpdateConversation(updatedConversation);
        setIsEditing(false);
      } else {
        const errorData = await response.json();
        alert(`Failed to update group settings: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error updating group settings:', error);
      alert('Failed to update group settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddMember = async (userId: string) => {
    if (!conversation) return;

    try {
      const response = await fetch(`/api/messaging/conversations/${conversation.id}/participants`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });

      if (response.ok) {
        const updatedConversation = await response.json();
        onUpdateConversation(updatedConversation);
        setSearchQuery('');
        setSearchResults([]);
      } else {
        const errorData = await response.json();
        alert(`Failed to add member: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error adding member:', error);
      alert('Failed to add member');
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!conversation) return;

    try {
      const response = await fetch(`/api/messaging/conversations/${conversation.id}/participants/${userId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        const updatedConversation = await response.json();
        onUpdateConversation(updatedConversation);
      } else {
        const errorData = await response.json();
        alert(`Failed to remove member: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error removing member:', error);
      alert('Failed to remove member');
    }
  };

  const handleChangeRole = async (userId: string, newRole: string) => {
    if (!conversation) return;

    try {
      const response = await fetch(`/api/messaging/conversations/${conversation.id}/participants/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role: newRole }),
      });

      if (response.ok) {
        const updatedConversation = await response.json();
        onUpdateConversation(updatedConversation);
      } else {
        const errorData = await response.json();
        alert(`Failed to change role: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error changing role:', error);
      alert('Failed to change role');
    }
  };

  const searchUsers = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(`/api/messaging/search?q=${encodeURIComponent(query)}`);
      if (response.ok) {
        const data = await response.json();
        // Filter out users who are already participants
        const existingParticipantIds = conversation?.participants.map(p => p.user.id) || [];
        const filteredResults = data.filter((user: any) => 
          !existingParticipantIds.includes(user.id) && user.id !== currentUserId
        );
        setSearchResults(filteredResults);
      }
    } catch (error) {
      console.error('Error searching users:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Crown className="h-4 w-4 text-yellow-500" />;
      case 'moderator':
        return <Shield className="h-4 w-4 text-blue-500" />;
      default:
        return <User className="h-4 w-4" />;
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin':
        return 'default';
      case 'moderator':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  if (!conversation || conversation.type === 'direct') {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Group Settings
          </DialogTitle>
          <DialogDescription>
            Manage your group chat settings and members
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Group Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={conversation.avatar} />
                <AvatarFallback>
                  <Users className="h-8 w-8" />
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                {isEditing ? (
                  <div className="space-y-2">
                    <Label htmlFor="groupName">Group Name</Label>
                    <Input
                      id="groupName"
                      value={groupName}
                      onChange={(e) => setGroupName(e.target.value)}
                      placeholder="Enter group name"
                    />
                    <Label htmlFor="groupDescription">Description (Optional)</Label>
                    <Textarea
                      id="groupDescription"
                      value={groupDescription}
                      onChange={(e) => setGroupDescription(e.target.value)}
                      placeholder="Enter group description"
                      rows={3}
                    />
                  </div>
                ) : (
                  <div>
                    <h3 className="text-lg font-semibold">{conversation.name}</h3>
                    {conversation.description && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {conversation.description}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {isCurrentUserAdmin && (
              <div className="flex gap-2">
                {isEditing ? (
                  <>
                    <Button 
                      size="sm" 
                      onClick={handleSaveSettings}
                      disabled={isSaving || !groupName.trim()}
                    >
                      {isSaving ? 'Saving...' : 'Save'}
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => {
                        setIsEditing(false);
                        setGroupName(conversation.name || '');
                        setGroupDescription(conversation.description || '');
                      }}
                    >
                      Cancel
                    </Button>
                  </>
                ) : (
                  <Button size="sm" variant="outline" onClick={() => setIsEditing(true)}>
                    <Settings className="h-4 w-4 mr-2" />
                    Edit Group Info
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Add Members */}
          {isCurrentUserAdmin && (
            <div className="space-y-3">
              <Label>Add Members</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Search users to add..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    searchUsers(e.target.value);
                  }}
                />
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => searchUsers(searchQuery)}
                  disabled={isSearching}
                >
                  <UserPlus className="h-4 w-4" />
                </Button>
              </div>

              {searchResults.length > 0 && (
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {searchResults.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-2 border rounded">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={user.image} />
                          <AvatarFallback>
                            {user.name?.charAt(0)?.toUpperCase() || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-medium">{user.name}</span>
                      </div>
                      <Button 
                        size="sm" 
                        onClick={() => handleAddMember(user.id)}
                      >
                        Add
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Members List */}
          <div className="space-y-3">
            <Label>Members ({conversation.participants.length})</Label>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {conversation.participants.map((participant) => (
                <div key={participant.id} className="flex items-center justify-between p-3 border rounded">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={participant.user.image} />
                      <AvatarFallback>
                        {participant.user.name?.charAt(0)?.toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{participant.user.name}</span>
                        {participant.user.id === conversation.createdBy.id && (
                          <Badge variant="outline" className="text-xs">
                            Creator
                          </Badge>
                        )}
                        <Badge variant={getRoleBadgeVariant(participant.role)} className="text-xs">
                          {getRoleIcon(participant.role)}
                          <span className="ml-1 capitalize">{participant.role}</span>
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Joined {new Date(participant.joinedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {isCurrentUserAdmin && participant.user.id !== currentUserId && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {participant.role !== 'admin' && (
                          <DropdownMenuItem 
                            onClick={() => handleChangeRole(participant.user.id, 'admin')}
                          >
                            <Crown className="h-4 w-4 mr-2" />
                            Make Admin
                          </DropdownMenuItem>
                        )}
                        {participant.role !== 'moderator' && (
                          <DropdownMenuItem 
                            onClick={() => handleChangeRole(participant.user.id, 'moderator')}
                          >
                            <Shield className="h-4 w-4 mr-2" />
                            Make Moderator
                          </DropdownMenuItem>
                        )}
                        {participant.role !== 'member' && (
                          <DropdownMenuItem 
                            onClick={() => handleChangeRole(participant.user.id, 'member')}
                          >
                            <User className="h-4 w-4 mr-2" />
                            Make Member
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => handleRemoveMember(participant.user.id)}
                          className="text-red-600"
                        >
                          <UserMinus className="h-4 w-4 mr-2" />
                          Remove from Group
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
