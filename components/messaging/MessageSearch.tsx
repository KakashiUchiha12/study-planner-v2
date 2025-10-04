'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  Search, 
  X, 
  MessageCircle,
  Calendar,
  User
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';

interface SearchResult {
  id: string;
  content: string;
  createdAt: string;
  sender: {
    id: string;
    name: string;
    image?: string;
  };
  conversation: {
    id: string;
    name?: string;
    type: string;
  };
  isUserResult?: boolean;
}

interface MessageSearchProps {
  conversationId: string;
  onMessageSelect?: (messageId: string) => void;
}

export function MessageSearch({ conversationId, onMessageSelect }: MessageSearchProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;

    setLoading(true);
    setHasSearched(true);
    
    try {
      // Search both messages and users
      const [messageResponse, userResponse] = await Promise.all([
        fetch(`/api/messaging/search?conversationId=${conversationId}&q=${encodeURIComponent(query)}&limit=20`),
        fetch(`/api/search?q=${encodeURIComponent(query)}&type=users&limit=10`)
      ]);
      
      const messageData = messageResponse.ok ? await messageResponse.json() : { results: [] };
      const userData = userResponse.ok ? await userResponse.json() : { results: { users: [] } };
      
      // Combine results - messages first, then users
      const combinedResults = [
        ...(messageData.results || []),
        ...(userData.results?.users || []).map((user: any) => ({
          id: `user-${user.id}`,
          content: `User: ${user.name || user.email}`,
          createdAt: new Date().toISOString(), // Current time for user results
          sender: {
            id: user.id,
            name: user.name || user.email,
            image: user.image
          },
          conversation: {
            id: 'user-search',
            name: 'User Search Result',
            type: 'user'
          },
          isUserResult: true
        }))
      ];
      
      setResults(combinedResults);
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch();
    }
  };

  const handleMessageClick = (result: SearchResult) => {
    if (result.isUserResult) {
      // For user results, we could navigate to their profile or start a conversation
      // For now, we'll just close the dialog
      console.log('User selected:', result.sender);
      setOpen(false);
    } else {
      // For message results, call the onMessageSelect callback
      if (onMessageSelect) {
        onMessageSelect(result.id);
      }
      setOpen(false);
    }
  };

  const getDisplayName = (user: any) => {
    return user.name || 'Unknown';
  };

  const getUserInitials = (user: any) => {
    const name = getDisplayName(user);
    return name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const highlightText = (text: string, query: string) => {
    if (!query.trim()) return text;
    
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-200 dark:bg-yellow-800 px-1 rounded">
          {part}
        </mark>
      ) : part
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <Search className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Search className="h-5 w-5" />
            <span>Search Messages</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 flex-1 overflow-hidden">
          {/* Search Input */}
          <div className="flex space-x-2">
            <Input
              placeholder="Search messages, users, or user IDs..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1"
            />
            <Button onClick={handleSearch} disabled={loading || !query.trim()}>
              {loading ? 'Searching...' : 'Search'}
            </Button>
          </div>

          {/* Search Results */}
          <div className="flex-1 overflow-y-auto space-y-2">
            {hasSearched && !loading && results.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No messages found for "{query}"</p>
              </div>
            )}

            {results.map((result) => (
              <Card 
                key={result.id} 
                className="cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => handleMessageClick(result)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start space-x-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={result.sender.image} />
                      <AvatarFallback>
                        {getUserInitials(result.sender)}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="font-medium text-sm">
                          {getDisplayName(result.sender)}
                        </span>
                        <Badge variant={result.isUserResult ? "default" : "outline"} className="text-xs">
                          {result.isUserResult ? "User" : result.conversation.type}
                        </Badge>
                        {!result.isUserResult && (
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(result.createdAt), { addSuffix: true })}
                          </span>
                        )}
                      </div>
                      
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {result.isUserResult ? (
                          <span className="text-blue-600 dark:text-blue-400">
                            {highlightText(result.content, query)}
                          </span>
                        ) : (
                          highlightText(result.content, query)
                        )}
                      </p>
                      
                      {!result.isUserResult && (
                        <div className="flex items-center space-x-4 mt-2 text-xs text-muted-foreground">
                          <div className="flex items-center space-x-1">
                            <Calendar className="h-3 w-3" />
                            <span>{format(new Date(result.createdAt), 'MMM d, yyyy h:mm a')}</span>
                          </div>
                          {result.conversation.name && (
                            <div className="flex items-center space-x-1">
                              <User className="h-3 w-3" />
                              <span>{result.conversation.name}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
