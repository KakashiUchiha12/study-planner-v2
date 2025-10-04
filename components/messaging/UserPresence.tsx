'use client';

import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Circle } from 'lucide-react';

interface UserPresenceProps {
  userId: string;
  isOnline?: boolean;
  lastSeen?: string;
  showBadge?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function UserPresence({ 
  userId, 
  isOnline = false, 
  lastSeen, 
  showBadge = false,
  size = 'md'
}: UserPresenceProps) {
  const [presence, setPresence] = useState({
    isOnline,
    lastSeen: lastSeen || new Date().toISOString()
  });

  // Subscribe to presence updates
  useEffect(() => {
    // This would connect to your presence system (Pusher, Socket.io, etc.)
    // For now, we'll use the props
    setPresence({ isOnline, lastSeen: lastSeen || new Date().toISOString() });
  }, [isOnline, lastSeen]);

  const getStatusColor = () => {
    if (presence.isOnline) {
      return 'bg-green-500';
    }
    
    // Check if last seen was within last 5 minutes
    const lastSeenDate = new Date(presence.lastSeen);
    const now = new Date();
    const diffInMinutes = (now.getTime() - lastSeenDate.getTime()) / (1000 * 60);
    
    if (diffInMinutes <= 5) {
      return 'bg-yellow-500'; // Recently active
    } else if (diffInMinutes <= 60) {
      return 'bg-orange-500'; // Away
    } else {
      return 'bg-gray-400'; // Offline
    }
  };

  const getStatusText = () => {
    if (presence.isOnline) {
      return 'Online';
    }
    
    const lastSeenDate = new Date(presence.lastSeen);
    const now = new Date();
    const diffInMinutes = (now.getTime() - lastSeenDate.getTime()) / (1000 * 60);
    
    if (diffInMinutes <= 5) {
      return 'Recently active';
    } else if (diffInMinutes <= 60) {
      return `Active ${Math.round(diffInMinutes)}m ago`;
    } else {
      const diffInHours = Math.round(diffInMinutes / 60);
      if (diffInHours < 24) {
        return `Active ${diffInHours}h ago`;
      } else {
        const diffInDays = Math.round(diffInHours / 24);
        return `Active ${diffInDays}d ago`;
      }
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'w-2 h-2';
      case 'md':
        return 'w-3 h-3';
      case 'lg':
        return 'w-4 h-4';
      default:
        return 'w-3 h-3';
    }
  };

  if (showBadge) {
    return (
      <Badge 
        variant={presence.isOnline ? 'default' : 'secondary'}
        className={`text-xs ${presence.isOnline ? 'bg-green-500 hover:bg-green-600' : 'bg-gray-400 hover:bg-gray-500'}`}
      >
        <Circle className={`w-2 h-2 mr-1 ${getStatusColor()}`} />
        {getStatusText()}
      </Badge>
    );
  }

  return (
    <div className="relative">
      <Circle 
        className={`${getSizeClasses()} ${getStatusColor()} rounded-full`}
        title={getStatusText()}
      />
    </div>
  );
}
