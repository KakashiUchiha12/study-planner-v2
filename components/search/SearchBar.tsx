"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X, Users, FileText, BookOpen, File, Users as CommunityIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import SearchResultItem from './SearchResultItem';

interface SearchResult {
  id: string;
  type: 'user' | 'post' | 'subject' | 'document' | 'material' | 'community';
  name?: string;
  title?: string;
  content?: string;
  description?: string;
  user?: {
    id: string;
    name: string;
    image?: string;
  };
  [key: string]: any;
}

interface SearchBarProps {
  onResultClick?: (result: SearchResult) => void;
  placeholder?: string;
  className?: string;
}

const TYPE_ICONS = {
  user: Users,
  post: FileText,
  subject: BookOpen,
  document: File,
  material: FileText,
  community: CommunityIcon
};

const TYPE_LABELS = {
  user: 'Users',
  post: 'Posts',
  subject: 'Subjects',
  document: 'Documents',
  material: 'Materials',
  community: 'Communities'
};

export function SearchBar({ onResultClick, placeholder = "Search everything...", className }: SearchBarProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<string>('all');
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Search function with debouncing
  const performSearch = async (searchQuery: string, type: string = 'all') => {
    if (searchQuery.length < 1) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        q: searchQuery,
        type,
        limit: '10'
      });

      const response = await fetch(`/api/search?${params}`);
      const data = await response.json();

      if (data.results) {
        // Handle different result structures from API
        if (Array.isArray(data.results)) {
          setResults(data.results);
        } else {
          // If results is an object, flatten it into an array
          const flattenedResults: SearchResult[] = [];
          Object.values(data.results).forEach((typeResults: any) => {
            if (Array.isArray(typeResults)) {
              flattenedResults.push(...typeResults);
            }
          });
          setResults(flattenedResults);
        }
      }
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (query.length >= 1) {
        performSearch(query, selectedType);
        setIsOpen(true);
      } else {
        setResults([]);
        setIsOpen(false);
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(timeoutId);
  }, [query, selectedType]);

  // Handle input change
  const handleInputChange = (value: string) => {
    setQuery(value);
  };

  // Handle type filter change
  const handleTypeChange = (type: string) => {
    setSelectedType(type);
  };

  // Handle result click - Navigate to appropriate page
  const handleResultClick = (result: SearchResult) => {
    if (onResultClick) {
      onResultClick(result);
    } else {
      // Default navigation behavior
      switch (result.type) {
        case 'post':
          router.push(`/posts/${result.id}`);
          break;
        case 'user':
          router.push(`/profile/${result.id}`);
          break;
        case 'community':
          router.push(`/communities/${result.id}`);
          break;
        case 'subject':
          // Import the subject directly
          handleImportSubject(result);
          break;
        default:
          // For other types, navigate to search page with item selected
          router.push(`/search?q=${encodeURIComponent(query)}&type=${selectedType}&item=${result.id}`);
      }
    }
    setIsOpen(false);
    setQuery('');
    setResults([]);
  };

  // Handle subject import
  const handleImportSubject = async (subject: SearchResult) => {
    try {
      const response = await fetch('/api/subjects/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sourceSubjectId: subject.id
        }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Subject imported successfully:', result);
        alert('Subject imported successfully!');
      } else {
        const error = await response.json();
        console.error('Failed to import subject:', error);
        alert(`Failed to import subject: ${error.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error importing subject:', error);
      alert('Failed to import subject. Please try again.');
    }
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      inputRef.current?.blur();
    }
  };

  return (
    <div ref={searchRef} className={cn("relative w-full max-w-md", className)}>
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={(e) => handleInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => query.length >= 1 && setIsOpen(true)}
          className="pl-10 pr-10"
        />
        {query && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
            onClick={() => {
              setQuery('');
              setResults([]);
              setIsOpen(false);
            }}
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>

      {/* Search Results Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-hidden">
          {/* Type Filters */}
          {query.length >= 1 && (
            <div className="p-3 border-b border-gray-100">
              <div className="flex flex-wrap gap-1">
                {Object.entries(TYPE_LABELS).map(([key, label]) => (
                  <Badge
                    key={key}
                    variant={selectedType === key ? "default" : "outline"}
                    className="cursor-pointer text-xs"
                    onClick={() => handleTypeChange(key)}
                  >
                    {label}
                  </Badge>
                ))}
                <Badge
                  variant={selectedType === 'all' ? "default" : "outline"}
                  className="cursor-pointer text-xs"
                  onClick={() => handleTypeChange('all')}
                >
                  All
                </Badge>
              </div>
            </div>
          )}

          {/* Results */}
          <div className="max-h-64 overflow-y-auto">
            {isLoading ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                Searching...
              </div>
            ) : results.length > 0 ? (
              results.map((result) => (
                <div key={`${result.type}-${result.id}`} className="p-2">
                  <SearchResultItem
                    item={result}
                    type={result.resultType || result.type}
                    onClose={() => {
                      setIsOpen(false);
                      setQuery('');
                      setResults([]);
                    }}
                    onResultClick={handleResultClick}
                  />
                </div>
              ))
            ) : query.length >= 1 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                No results found for "{query}"
              </div>
            ) : null}
          </div>

          {/* View All Results Link */}
          {results.length > 0 && (
            <div className="p-3 border-t border-gray-100 bg-gray-50">
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-xs"
                onClick={() => {
                  // Navigate to full search results page
                  router.push(`/search?q=${encodeURIComponent(query)}&type=${selectedType}`);
                }}
              >
                View all results for "{query}"
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}