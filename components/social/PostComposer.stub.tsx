"use client";

import { useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { QuillWrapper } from "@/components/social/QuillWrapper";
import { Card, CardContent } from "@/components/ui/card";
import { useSocialFeed, MediaItem } from "@/hooks/useSocialFeed";

export function PostComposer() {
  const [text, setText] = useState("");
  const [media, setMedia] = useState<MediaItem[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { createPost, attachLocalFiles } = useSocialFeed();

  const canPost = useMemo(() => text.trim().length > 0 || media.length > 0, [text, media]);

  const handleFiles = async (files: FileList | File[]) => {
    const list = Array.from(files);
    // Upload to server to get permanent URLs
    const form = new FormData();
    list.forEach(f => form.append('files', f));
    try {
      const res = await fetch('/api/social/upload', { method: 'POST', body: form });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.media)) {
          const items: MediaItem[] = data.media.map((m: any) => ({
            id: m.id || Math.random().toString(36).slice(2),
            kind: m.kind,
            url: m.url,
            mimeType: m.mimeType,
            name: m.name,
            size: m.size,
            thumbnailUrl: m.thumbnailUrl,
          }));
          setMedia(prev => [...prev, ...items]);
          return;
        }
      }
    } catch {
      // fallback to local previews so the UI still works offline
      const items = await attachLocalFiles(files);
      setMedia(prev => [...prev, ...items]);
      return;
    }
    // if server failed without exception, fallback to local
    const items = await attachLocalFiles(files);
    setMedia(prev => [...prev, ...items]);
  };

  const onSubmit = () => {
    if (!canPost) return;
    createPost({ content: text, media });
    setText("");
    setMedia([]);
  };

  return (
    <Card className="border-dashed">
      <CardContent className="p-4 space-y-3">
        <QuillWrapper value={text} onChange={setText} placeholder="Share an update…" showPreview={true} />
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={(e) => e.target.files && handleFiles(e.target.files)}
            />
            <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
              Attach
            </Button>
            {media.length > 0 && <span>{media.length} file(s) attached</span>}
          </div>
          <Button onClick={onSubmit} disabled={!canPost}>Create Post</Button>
        </div>
        {media.length > 0 && (
          <div className="grid grid-cols-3 gap-2">
            {media.map(m => (
              <div key={m.id} className="relative">
                {m.kind === "image" ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={m.url} alt={m.name || "image"} className="h-24 w-full object-cover rounded" />
                ) : (
                  <div className="h-24 w-full flex items-center justify-center rounded border text-xs">
                    {m.name || "file"}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}


