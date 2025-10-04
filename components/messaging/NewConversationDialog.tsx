'use client';

import { useState, useEffect } from 'react';
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
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Users, 
  User, 
  Search,
  X
} from 'lucide-react';

interface User {
  id: string;
  name: string;
  image?: string;
  email: string;
}

interface NewConversationDialogProps {
  onConversationCreated: (conversationId: string) => void;
  trigger?: React.ReactNode;
}

export function NewConversationDialog({ 
  onConversationCreated, 
  trigger 
}: NewConversationDialogProps) {
  const [open, setOpen] = useState(false);
  const [conversationType, setConversationType] = useState<'direct' | 'group' | 'study_group'>('direct');
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    if (searchQuery.length >= 2) {
      searchUsers();
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  const searchUsers = async () => {
    setIsSearching(true);
    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}&type=users&limit=10`);
      if (response.ok) {
        const data = await response.json();
        console.log('NewConversationDialog search response:', data); // Debug log
        
        // Handle both response structures for backward compatibility
        let users = [];
        if (Array.isArray(data.results)) {
          // New structure: results is directly an array
          users = data.results;
        } else if (data.results?.users) {
          // Old structure: results.users is an array
          users = data.results.users;
        }
        
        setSearchResults(users);
      } else {
        console.error('Search API error:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Error searching users:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const addUser = (user: User) => {
    if (!selectedUsers.find(u => u.id === user.id)) {
      setSelectedUsers([...selectedUsers, user]);
    }
    setSearchQuery('');
    setSearchResults([]);
  };

  const removeUser = (userId: string) => {
    setSelectedUsers(selectedUsers.filter(u => u.id !== userId));
  };

  const createConversation = async () => {
    if (conversationType === 'direct' && selectedUsers.length !== 1) {
      return;
    }
    
    if (conversationType !== 'direct' && !groupName.trim()) {
      return;
    }

    setIsCreating(true);
    try {
      const response = await fetch('/api/messaging/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: conversationType,
          name: conversationType !== 'direct' ? groupName.trim() : undefined,
          description: conversationType !== 'direct' ? groupDescription.trim() : undefined,
          participantIds: selectedUsers.map(u => u.id),
        }),
      });

      if (response.ok) {
        const conversation = await response.json();
        onConversationCreated(conversation.id);
        setOpen(false);
        resetForm();
      } else {
        let errorMessage = 'Unknown error';
        
        // Read the response body once
        const contentType = response.headers.get('content-type');
        const isJson = contentType && contentType.includes('application/json');
        
        try {
          if (isJson) {
            const errorData = await response.json();
            errorMessage = errorData.error || errorData.details || 'Unknown error';
            console.error('Failed to create conversation:', errorData);
          } else {
            const errorText = await response.text();
            console.error('Failed to create conversation - non-JSON response:', errorText);
            errorMessage = `Server error (${response.status}): ${errorText || 'No error message'}`;
          }
        } catch (bodyError) {
          console.error('Failed to create conversation - no response body:', bodyError);
          errorMessage = `Server error (${response.status}): No response body`;
        }
        
        alert(`Failed to create conversation: ${errorMessage}`);
      }
    } catch (error) {
      console.error('Error creating conversation:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const resetForm = () => {
    setConversationType('direct');
    setGroupName('');
    setGroupDescription('');
    setSelectedUsers([]);
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      resetForm();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Conversation
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Start New Conversation</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Conversation Type */}
          <div className="space-y-2">
            <Label>Conversation Type</Label>
            <Select value={conversationType} onValueChange={(value: any) => setConversationType(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="direct">
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4" />
                    <span>Direct Message</span>
                  </div>
                </SelectItem>
                <SelectItem value="group">
                  <div className="flex items-center space-x-2">
                    <Users className="h-4 w-4" />
                    <span>Group Chat</span>
                  </div>
                </SelectItem>
                <SelectItem value="study_group">
                  <div className="flex items-center space-x-2">
                    <Users className="h-4 w-4" />
                    <span>Study Group</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Group Name (for group conversations) */}
          {conversationType !== 'direct' && (
            <div className="space-y-2">
              <Label>Group Name</Label>
              <Input
                placeholder="Enter group name"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
              />
            </div>
          )}

          {/* Group Description (for group conversations) */}
          {conversationType !== 'direct' && (
            <div className="space-y-2">
              <Label>Description (Optional)</Label>
              <Textarea
                placeholder="Enter group description"
                value={groupDescription}
                onChange={(e) => setGroupDescription(e.target.value)}
                rows={3}
              />
            </div>
          )}

          {/* User Search */}
          <div className="space-y-2">
            <Label>Add Participants</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            {/* Search Results */}
            {searchQuery.length >= 2 && (
              <div className="border rounded-md max-h-48 overflow-y-auto">
                <Command>
                  <CommandList>
                    {isSearching ? (
                      <div className="p-3 text-center text-muted-foreground">
                        Searching...
                      </div>
                    ) : searchResults.length === 0 ? (
                      <div className="p-3 text-center text-muted-foreground">
                        No users found
                      </div>
                    ) : (
                      <CommandGroup>
                        {searchResults.map((user) => (
                          <CommandItem
                            key={user.id}
                            onSelect={() => addUser(user)}
                            className="flex items-center space-x-3 p-3 cursor-pointer"
                          >
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={user.image} />
                              <AvatarFallback>
                                {user.name.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <p className="font-medium">{user.name}</p>
                              <p className="text-sm text-muted-foreground">{user.email}</p>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    )}
                  </CommandList>
                </Command>
              </div>
            )}
          </div>

          {/* Selected Users */}
          {selectedUsers.length > 0 && (
            <div className="space-y-2">
              <Label>Selected Participants</Label>
              <div className="flex flex-wrap gap-2">
                {selectedUsers.map((user) => (
                  <Badge key={user.id} variant="secondary" className="flex items-center space-x-2">
                    <Avatar className="h-4 w-4">
                      <AvatarImage src={user.image} />
                      <AvatarFallback className="text-xs">
                        {user.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span>{user.name}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
                      onClick={() => removeUser(user.id)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Create Button */}
          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={createConversation}
              disabled={
                isCreating ||
                (conversationType === 'direct' && selectedUsers.length !== 1) ||
                (conversationType !== 'direct' && (!groupName.trim() || selectedUsers.length === 0))
              }
            >
              {isCreating ? 'Creating...' : 'Create Conversation'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
