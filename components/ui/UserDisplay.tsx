'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  name: string;
  username?: string;
  image?: string;
}

interface UserDisplayProps {
  user: User;
  showUsername?: boolean;
  size?: 'sm' | 'md' | 'lg';
  clickable?: boolean;
  className?: string;
}

export function UserDisplay({ 
  user, 
  showUsername = true, 
  size = 'md',
  clickable = true,
  className = ''
}: UserDisplayProps) {
  const router = useRouter();

  const sizeClasses = {
    sm: {
      avatar: 'h-6 w-6',
      name: 'text-xs',
      username: 'text-xs'
    },
    md: {
      avatar: 'h-8 w-8',
      name: 'text-sm',
      username: 'text-xs'
    },
    lg: {
      avatar: 'h-10 w-10',
      name: 'text-base',
      username: 'text-sm'
    }
  };

  const handleClick = () => {
    if (clickable) {
      router.push(`/profile/${user.id}`);
    }
  };

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <Avatar 
        className={`${sizeClasses[size].avatar} ${clickable ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}`}
        onClick={handleClick}
      >
        <AvatarImage src={user.image} />
        <AvatarFallback className={sizeClasses[size].name}>
          {user.name.charAt(0).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div 
          className={`${sizeClasses[size].name} font-medium truncate ${clickable ? 'cursor-pointer hover:underline' : ''}`}
          onClick={handleClick}
        >
          {user.name}
        </div>
        {showUsername && user.username && (
          <div className={`${sizeClasses[size].username} text-muted-foreground truncate hidden md:block`}>
            @{user.username}
          </div>
        )}
      </div>
    </div>
  );
}
