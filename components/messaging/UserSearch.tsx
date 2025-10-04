'use client';

import { useState, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  MessageCircle, 
  Users,
  User
} from 'lucide-react';

interface User {
  id: string;
  name: string;
  image?: string;
  email: string;
  profile?: {
    university?: string;
    program?: string;
  };
}

interface UserSearchProps {
  onUserSelect: (user: User) => void;
  placeholder?: string;
  className?: string;
}

export function UserSearch({ 
  onUserSelect, 
  placeholder = "Search users to message...",
  className = ""
}: UserSearchProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [recentUsers, setRecentUsers] = useState<User[]>([]);

  useEffect(() => {
    if (searchQuery.length >= 2) {
      searchUsers();
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  useEffect(() => {
    loadRecentUsers();
  }, []);

  const searchUsers = async () => {
    setIsSearching(true);
    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}&type=users&limit=20`);
      if (response.ok) {
        const data = await response.json();
        console.log('Search API response:', data); // Debug log
        
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

  const loadRecentUsers = async () => {
    try {
      // Load recent conversations to show recent contacts
      const response = await fetch('/api/messaging/conversations');
      if (response.ok) {
        const conversations = await response.json();
        const recentContacts = conversations
          .filter((conv: any) => conv.type === 'direct')
          .slice(0, 5)
          .map((conv: any) => {
            const otherParticipant = conv.participants.find((p: any) => p.user.id !== conv.createdBy.id);
            return otherParticipant?.user;
          })
          .filter(Boolean);
        
        setRecentUsers(recentContacts);
      }
    } catch (error) {
      console.error('Error loading recent users:', error);
    }
  };

  const handleUserSelect = (user: User) => {
    onUserSelect(user);
    setOpen(false);
    setSearchQuery('');
    setSearchResults([]);
  };

  const getDisplayName = (user: User) => {
    return user.name || user.email.split('@')[0];
  };

  const getUserInitials = (user: User) => {
    const name = getDisplayName(user);
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="outline" 
          className={`justify-start text-left font-normal ${className}`}
        >
          <Search className="h-4 w-4 mr-2" />
          {placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start">
        <Command>
          <CommandInput
            placeholder="Search users..."
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
          <CommandList>
            <CommandEmpty>
              {isSearching ? 'Searching...' : 'No users found'}
            </CommandEmpty>
            
            {/* Recent Users */}
            {searchQuery.length < 2 && recentUsers.length > 0 && (
              <CommandGroup heading="Recent Contacts">
                {recentUsers.map((user) => (
                  <CommandItem
                    key={user.id}
                    onSelect={() => handleUserSelect(user)}
                    className="flex items-center space-x-3 p-3"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.image} />
                      <AvatarFallback>
                        {getUserInitials(user)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{getDisplayName(user)}</p>
                      <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                      {user.profile?.university && (
                        <p className="text-xs text-muted-foreground truncate">
                          {user.profile.university}
                        </p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                    >
                      <MessageCircle className="h-3 w-3" />
                    </Button>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {/* Search Results */}
            {searchResults.length > 0 && (
              <CommandGroup heading={searchQuery.length >= 2 ? "Search Results" : ""}>
                {searchResults.map((user) => (
                  <CommandItem
                    key={user.id}
                    onSelect={() => handleUserSelect(user)}
                    className="flex items-center space-x-3 p-3"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.image} />
                      <AvatarFallback>
                        {getUserInitials(user)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{getDisplayName(user)}</p>
                      <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                      {user.profile?.university && (
                        <p className="text-xs text-muted-foreground truncate">
                          {user.profile.university}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center space-x-1">
                      {user.profile?.program && (
                        <Badge variant="outline" className="text-xs">
                          {user.profile.program}
                        </Badge>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                      >
                        <MessageCircle className="h-3 w-3" />
                      </Button>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
