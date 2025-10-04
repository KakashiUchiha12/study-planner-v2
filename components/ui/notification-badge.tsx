'use client';

import { cn } from '@/lib/utils';

interface NotificationBadgeProps {
  count: number;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

export function NotificationBadge({ 
  count, 
  className, 
  size = 'md',
  position = 'top-right'
}: NotificationBadgeProps) {
  if (count <= 0) return null;

  const sizeClasses = {
    sm: 'h-4 w-4 text-xs',
    md: 'h-5 w-5 text-xs',
    lg: 'h-6 w-6 text-sm'
  };

  const positionClasses = {
    'top-right': '-top-1 -right-1',
    'top-left': '-top-1 -left-1',
    'bottom-right': '-bottom-1 -right-1',
    'bottom-left': '-bottom-1 -left-1'
  };

  const displayCount = count > 9 ? '+9' : count.toString();

  return (
    <div
      className={cn(
        'absolute flex items-center justify-center rounded-full bg-red-500 text-white font-medium shadow-sm',
        sizeClasses[size],
        positionClasses[position],
        className
      )}
    >
      {displayCount}
    </div>
  );
}
