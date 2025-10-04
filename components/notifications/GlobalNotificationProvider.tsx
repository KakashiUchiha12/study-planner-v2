'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { GlobalNotificationBell } from './GlobalNotificationBell';

export function GlobalNotificationProvider() {
  const { data: session, status } = useSession();
  const [isVisible, setIsVisible] = useState(false);

  // Only show notification bell for authenticated users
  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  }, [status, session]);

  // Don't render anything if user is not authenticated
  if (!isVisible) {
    return null;
  }

  return (
    <div className="fixed top-20 right-4 z-50 lg:hidden">
      <GlobalNotificationBell 
        size="md"
        variant="ghost"
        className="bg-white/90 backdrop-blur-sm border border-gray-200 shadow-lg hover:bg-white/95"
      />
    </div>
  );
}
