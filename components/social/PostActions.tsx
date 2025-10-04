"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export function PostActions(props: { postId: string }) {
  const { postId } = props;
  const [showShare, setShowShare] = useState(false);
  const [showBookmark, setShowBookmark] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);

  return (
    <div className="flex items-center gap-2">
      <Button
        variant={bookmarked ? "default" : "ghost"}
        size="sm"
        onClick={async () => {
          try {
            if (bookmarked) {
              await fetch(`/api/social/bookmarks?postId=${encodeURIComponent(postId)}`, { method: 'DELETE' })
              setBookmarked(false)
            } else {
              await fetch('/api/social/bookmarks', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ postId }) })
              setBookmarked(true)
            }
          } catch {}
        }}
      >{bookmarked ? 'Bookmarked' : 'Bookmark'}</Button>
      <Button variant="ghost" size="sm" onClick={() => setShowShare(true)}>Share</Button>

      <Dialog open={showBookmark} onOpenChange={setShowBookmark}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bookmark post</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 text-sm">
            <p>Stub: This will save the post to your profile bookmarks.</p>
            <p>We will persist bookmarks and add a profile bookmarks tab later.</p>
            <div className="flex justify-end">
              <Button onClick={() => setShowBookmark(false)}>Done</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showShare} onOpenChange={setShowShare}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share post</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 text-sm">
            <div>
              <p className="mb-1 font-medium">Share link</p>
              <code className="block select-all break-all rounded bg-muted p-2 text-xs">{`${location.origin}/social?post=${postId}`}</code>
            </div>
            <div>
              <p className="mb-1 font-medium">Share to social</p>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm">WhatsApp</Button>
                <Button variant="outline" size="sm">Twitter/X</Button>
                <Button variant="outline" size="sm">Facebook</Button>
                <Button variant="outline" size="sm">Email</Button>
              </div>
            </div>
            <div>
              <p className="mb-1 font-medium">Share to a group</p>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" onClick={async () => {
                  await fetch('/api/social/shares', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ postId, target: 'group:stub', targetType: 'group' }) })
                  setShowShare(false)
                }}>Share to Group (stub)</Button>
              </div>
            </div>
            <div className="flex justify-end">
              <Button onClick={() => setShowShare(false)}>Close</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}


