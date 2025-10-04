'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import { 
  Home, 
  MessageSquare, 
  User, 
  Bell,
  Users,
  Globe,
  BookOpen,
  Search,
  Plus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { NotificationBadge } from '@/components/ui/notification-badge';
import { GlobalNotificationBell } from '@/components/notifications/GlobalNotificationBell';
import { useRealtimeNotifications } from '@/lib/hooks/useRealtimeNotifications';
import { useMessageNotifications } from '@/lib/hooks/useMessageNotifications';
import { useCommunityMessageNotifications } from '@/lib/hooks/useCommunityMessageNotifications';
import { POLLING_CONFIG, getPollingInterval } from '@/lib/config/polling-config';
import { startGlobalNavPolling, pollingManager } from '@/lib/utils/polling-manager';

export function GlobalNavigationBar() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [isMobile, setIsMobile] = useState(false);
  const [isMobileNavVisible, setIsMobileNavVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const { unreadCount: generalUnreadCount } = useRealtimeNotifications();
  const { unreadCount: messageUnreadCount, pollingActive: messagePollingActive } = useMessageNotifications();
  const { totalUnreadCount: communityUnreadCount, pollingActive: communityPollingActive, refreshNotifications: refreshCommunityNotifications } = useCommunityMessageNotifications();
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Check if user is authenticated and determine device type
  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      const checkIsMobile = () => {
        const isMobileDevice = window.innerWidth < 1024; // lg breakpoint
        setIsMobile(isMobileDevice);
      };

      checkIsMobile();
      window.addEventListener('resize', checkIsMobile);

      return () => window.removeEventListener('resize', checkIsMobile);
    }
  }, [status, session]);

  // Refresh community notifications when component becomes visible
  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      // Refresh notifications when component mounts
      refreshCommunityNotifications();
      
      // Set up periodic refresh for better real-time updates
      startGlobalNavPolling(refreshCommunityNotifications, (error) => {
        console.error('Global nav polling error:', error);
      });

      // Listen for community messages read events
      const handleCommunityMessagesRead = () => {
        refreshCommunityNotifications();
      };

      window.addEventListener('community-messages-read', handleCommunityMessagesRead);

      return () => {
        pollingManager.stopPolling('global-nav');
        window.removeEventListener('community-messages-read', handleCommunityMessagesRead);
      };
    }
  }, [status, session]);

  // Handle scroll behavior for mobile navigation
  useEffect(() => {
    if (!isMobile) return;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Clear existing timeout
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }

      // Show/hide navigation based on scroll direction
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        // Scrolling down - hide navigation
        setIsMobileNavVisible(false);
      } else {
        // Scrolling up - show navigation
        setIsMobileNavVisible(true);
      }

      setLastScrollY(currentScrollY);

      // Set timeout to show navigation after scrolling stops
      scrollTimeoutRef.current = setTimeout(() => {
        setIsMobileNavVisible(true);
      }, 1500);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [isMobile, lastScrollY]);

  // Don't render if user is not authenticated
  if (status !== 'authenticated' || !session?.user) {
    return null;
  }

  const navigationItems = [
    {
      name: 'Social',
      href: '/social',
      icon: Globe,
      isActive: pathname.startsWith('/social')
    },
    {
      name: 'Communities',
      href: '/communities',
      icon: Users,
      isActive: pathname.startsWith('/communities'),
      badge: communityUnreadCount > 0 ? communityUnreadCount : undefined
    },
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: Home,
      isActive: pathname === '/dashboard'
    },
    {
      name: 'Messages',
      href: '/messaging',
      icon: MessageSquare,
      isActive: pathname.startsWith('/messaging'),
      badge: messageUnreadCount > 0 ? messageUnreadCount : undefined
    },
    {
      name: 'Courses',
      href: '/courses',
      icon: BookOpen,
      isActive: pathname.startsWith('/courses')
    },
    {
      name: 'Profile',
      href: '/profile',
      icon: User,
      isActive: pathname.startsWith('/profile')
    }
  ];

  const handleNavigation = (href: string) => {
    // Refresh notifications before navigation
    refreshCommunityNotifications();
    router.push(href);
  };

  const handleSearchNavigation = () => {
    // Refresh notifications before navigation
    refreshCommunityNotifications();
    router.push('/search');
    // Hide mobile search after navigation
    setShowMobileSearch(false);
  };

  // Desktop Navigation (Top Bar)
  if (!isMobile) {
    return (
      <nav className="fixed top-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-sm border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo/Brand */}
            <div className="flex items-center">
              <button
                onClick={() => router.push('/dashboard')}
                className="text-xl font-bold text-blue-600 hover:text-blue-700 transition-colors"
              >
                StudyHi
              </button>
            </div>

            {/* Desktop Navigation */}
            <div className="flex items-center space-x-1">
              {/* Search Button */}
              <Button
                variant={pathname === '/search' ? "default" : "ghost"}
                size="sm"
                onClick={handleSearchNavigation}
                className="relative flex items-center gap-2"
              >
                <Search className="h-4 w-4" />
                <span>Search</span>
              </Button>
              
              {navigationItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Button
                    key={item.name}
                    variant={item.isActive ? "default" : "ghost"}
                    size="sm"
                    onClick={() => handleNavigation(item.href)}
                    className="relative flex items-center gap-2"
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.name}</span>
                    {item.badge && (
                      <NotificationBadge 
                        count={item.badge}
                        size="sm"
                        position="top-right"
                        className="ml-1"
                      />
                    )}
                  </Button>
                );
              })}
            </div>

            {/* Right side - Notifications */}
            <div className="flex items-center space-x-2">
              <GlobalNotificationBell 
                size="sm"
                variant="ghost"
              />
              {(messagePollingActive || communityPollingActive) && (
                <div className="flex items-center space-x-1 text-xs text-green-600">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span>Live</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>
    );
  }

  // Mobile Navigation (Bottom Bar)
  return (
    <nav 
      className={`fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-t border-gray-200 shadow-lg transition-transform duration-300 ease-in-out ${
        isMobileNavVisible ? 'translate-y-0' : 'translate-y-full'
      }`}
    >
      <div className="flex items-center justify-around h-16 px-2">
        {/* Live indicator for mobile */}
        {(messagePollingActive || communityPollingActive) && (
          <div className="absolute top-1 right-1 flex items-center space-x-1 text-xs text-green-600">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
            <span>Live</span>
          </div>
        )}
        
        {/* Mobile Search Toggle Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowMobileSearch(!showMobileSearch)}
          className={`relative flex flex-col items-center justify-center h-12 w-12 p-0 ${
            showMobileSearch 
              ? 'text-blue-600' 
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Plus className="h-5 w-5" />
        </Button>

        {/* Mobile Search Button - appears when expanded */}
        {showMobileSearch && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSearchNavigation}
            className={`relative flex flex-col items-center justify-center h-12 w-12 p-0 ${
              pathname === '/search' 
                ? 'text-blue-600' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Search className="h-5 w-5" />
          </Button>
        )}

        {navigationItems.map((item) => {
          const Icon = item.icon;
          return (
            <Button
              key={item.name}
              variant="ghost"
              size="sm"
              onClick={() => handleNavigation(item.href)}
              className={`relative flex flex-col items-center justify-center h-12 w-12 p-0 ${
                item.isActive 
                  ? 'text-blue-600' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Icon className="h-5 w-5" />
              {item.badge && (
                <NotificationBadge 
                  count={item.badge}
                  size="sm"
                  position="top-right"
                />
              )}
            </Button>
          );
        })}
      </div>
    </nav>
  );
}
