import React from 'react';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  User, 
  FileText, 
  BookOpen, 
  File, 
  Target, 
  CheckSquare,
  Lock,
  Globe
} from 'lucide-react';

interface SearchResultItemProps {
  item: any;
  type: string;
  onClose: () => void;
  onResultClick?: (result: any) => void;
}

const SearchResultItem: React.FC<SearchResultItemProps> = ({ item, type, onClose, onResultClick }) => {
  const router = useRouter();

  const getIcon = () => {
    switch (type) {
      case 'user': return <User className="w-4 h-4" />;
      case 'post': return <FileText className="w-4 h-4" />;
      case 'subject': return <BookOpen className="w-4 h-4" />;
      case 'document': return <File className="w-4 h-4" />;
      case 'material': return <FileText className="w-4 h-4" />;
      case 'task': return <CheckSquare className="w-4 h-4" />;
      case 'goal': return <Target className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const getTitle = () => {
    switch (type) {
      case 'user': return item.name || item.email;
      case 'post': return item.content?.substring(0, 50) + '...' || 'Post';
      case 'subject': return item.name;
      case 'document': return item.name || item.originalName;
      case 'material': return item.title;
      case 'task': return item.title;
      case 'goal': return item.title;
      default: return 'Result';
    }
  };

  const getSubtitle = () => {
    switch (type) {
      case 'user': 
        return item.profile?.fullName || item.email;
      case 'post': 
        return `By ${item.user?.name || 'Unknown'}`;
      case 'subject': 
        return `${item.code} - ${item.instructor}`;
      case 'document': 
        return `${item.type} • ${item.user?.name || 'Unknown'}`;
      case 'material': 
        return `${item.type} • ${item.subject?.name || 'Unknown Subject'}`;
      case 'task': 
        return `${item.category} • ${item.user?.name || 'Unknown'}`;
      case 'goal': 
        return `${item.category} • ${item.user?.name || 'Unknown'}`;
      default: return '';
    }
  };

  const renderSubtitleWithUserLink = () => {
    const subtitle = getSubtitle();
    
    // Check if subtitle contains user information that should be clickable
    if ((type === 'post' || type === 'document' || type === 'task' || type === 'goal') && item.user?.id) {
      const parts = subtitle.split(' • ');
      if (parts.length === 2) {
        return (
          <span className="text-xs text-gray-600">
            {parts[0]} • 
            <button 
              onClick={handleUserProfileClick}
              className="text-blue-600 hover:text-blue-800 hover:underline ml-1"
            >
              {parts[1]}
            </button>
          </span>
        );
      } else if (subtitle.startsWith('By ')) {
        return (
          <span className="text-xs text-gray-600">
            By 
            <button 
              onClick={handleUserProfileClick}
              className="text-blue-600 hover:text-blue-800 hover:underline ml-1"
            >
              {subtitle.replace('By ', '')}
            </button>
          </span>
        );
      }
    }
    
    return <p className="text-xs text-gray-600">{subtitle}</p>;
  };

  const handleClick = () => {
    if (onResultClick) {
      // Use the custom click handler if provided
      onResultClick(item);
    } else {
      // Default behavior: Navigate to search page with the selected item
      const searchParams = new URLSearchParams({
        q: item.name || item.title || item.content || '',
        type: type,
        item: item.id
      });
      router.push(`/search?${searchParams.toString()}`);
    }
    onClose();
  };

  const handleUserProfileClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent the card click from firing
    if (item.user?.id) {
      router.push(`/profile/${item.user.id}`);
      onClose();
    }
  };

  const isPublic = item.visibility === 'public' || item.isPublic === true;
  const isPrivate = item.visibility === 'private' || item.isPrivate === true;

  return (
    <Card 
      className="cursor-pointer hover:bg-gray-50 transition-colors"
      onClick={handleClick}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getIcon()}
            <CardTitle className="text-sm font-medium">
              {getTitle()}
            </CardTitle>
          </div>
          <div className="flex items-center gap-1">
            {isPublic && (
              <Badge variant="secondary" className="text-xs">
                <Globe className="w-3 h-3 mr-1" />
                Public
              </Badge>
            )}
            {isPrivate && (
              <Badge variant="outline" className="text-xs">
                <Lock className="w-3 h-3 mr-1" />
                Private
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {renderSubtitleWithUserLink()}
        {type === 'user' && item.profile && (
          <div className="mt-2 text-xs text-gray-500">
            {item.profile.university && (
              <span>{item.profile.university}</span>
            )}
            {item.profile.program && (
              <span className="ml-2">{item.profile.program}</span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SearchResultItem;
