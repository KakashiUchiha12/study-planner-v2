"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { SearchBar } from "@/components/search/SearchBar";
import { NotificationBell } from "@/components/social/NotificationBell";
import { NotificationBadge } from "@/components/ui/notification-badge";
import { useMessageNotifications } from "@/lib/hooks/useMessageNotifications";
import { MessageCircle } from "lucide-react";

export function FeedHeader() {
  const { unreadCount: messageUnreadCount } = useMessageNotifications();
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">Social Feed</h1>
        <div className="flex items-center gap-2">
          <NotificationBell />
          <Link href="/messaging">
            <Button variant="outline" size="sm" className="relative">
              <MessageCircle className="h-4 w-4 mr-2" />
              Messages
              <NotificationBadge 
                count={messageUnreadCount}
                size="sm"
                position="top-right"
              />
            </Button>
          </Link>
          <Link href="/dashboard">
            <Button variant="secondary">Back to Dashboard</Button>
          </Link>
        </div>
      </div>
      
      {/* Search Bar */}
      <div className="flex justify-center">
        <SearchBar 
          placeholder="Search users, posts, subjects, documents..."
          className="w-full max-w-lg"
          onResultClick={(result) => {
            // Navigate to search page with the selected item
            const searchParams = new URLSearchParams({
              q: result.name || result.title || result.content || '',
              type: result.type,
              item: result.id
            });
            window.location.href = `/search?${searchParams.toString()}`;
          }}
        />
      </div>
    </div>
  );
}


