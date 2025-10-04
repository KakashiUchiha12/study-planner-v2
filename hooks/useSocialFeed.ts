"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export type ReactionType = "like" | "heart" | "wow" | "laugh" | "sad" | "fire";

export type MediaItem = {
  id: string;
  kind: "image" | "file" | "video";
  url: string;
  mimeType: string;
  name?: string;
  size?: number;
  thumbnailUrl?: string;
  thumbnail?: string; // Alternative thumbnail property
  width?: number;
  height?: number;
  duration?: string; // Video duration
};

export type Comment = {
  id: string;
  postId: string;
  userId: string;
  content: string;
  parentCommentId?: string | null;
  createdAt: number;
};

export type Post = {
  id: string;
  userId: string;
  content?: string;
  type: "TEXT" | "IMAGE" | "FILE" | "MIXED";
  createdAt: number;
  tags: string[];
  communityId?: string | null;
  media: MediaItem[];
  reactions: { [reaction in ReactionType]?: Array<{ id: string; name: string; image?: string }> };
  user?: {
    id: string;
    name: string;
    username?: string;
    email: string;
    image?: string;
  };
  community?: {
    id: string;
    name: string;
    slug: string;
    avatar?: string;
    category?: string;
    visibility?: string;
  };
};

const STORAGE_KEY = "social:feed";

function generateId(prefix: string = "id"): string {
  return `${prefix}-${Math.random().toString(36).slice(2)}-${Date.now()}`;
}

export function useSocialFeed(currentUserId: string = "me") {
  const [posts, setPosts] = useState<Post[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const initialized = useRef(false);
  const syncing = useRef(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Post[];
        setPosts(parsed);
      }
    } catch {}
    initialized.current = true;
    // fetch initial from server (best-effort)
    ;(async () => {
      try {
        const res = await fetch('/api/social/posts', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.posts)) {
            setPosts(data.posts);
            setHasMore((data.posts || []).length >= 20);
            setCursor((data.posts || []).at(-1)?.createdAt?.toString() || null);
          }
        }
      } catch {}
    })();
  }, []);

  useEffect(() => {
    if (!initialized.current) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));
    } catch {}
  }, [posts]);

  const createPost = useCallback(
    (data: { content?: string; media?: MediaItem[]; tags?: string[]; communityId?: string | null }) => {
      const media = data.media ?? [];
      const type: Post["type"] = media.length === 0
        ? "TEXT"
        : media.every(m => m.kind === "image")
        ? "IMAGE"
        : media.every(m => m.kind === "file")
        ? "FILE"
        : "MIXED";

      const post: Post = {
        id: generateId("post"),
        userId: currentUserId,
        content: (data.content || "").trim() || undefined,
        type,
        createdAt: Date.now(),
        tags: data.tags ?? [],
        communityId: data.communityId ?? null,
        media,
        reactions: {},
      };
      setPosts(prev => [post, ...prev]);
      // sync to server (fire-and-forget)
      if (!syncing.current) {
        syncing.current = true;
        fetch('/api/social/posts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: post.content,
            tags: post.tags,
            communityId: post.communityId,
            media: post.media,
          }),
        }).then(async (res) => {
          if (res.ok) {
            const data = await res.json();
            if (data?.post?.id) {
              // Replace optimistic post with server post
              setPosts(prev => {
                const idx = prev.findIndex(p => p.id === post.id);
                if (idx === -1) return prev;
                const next = [...prev];
                next[idx] = data.post as Post;
                return next;
              });
            }
          }
        }).finally(() => {
          syncing.current = false;
        });
      }
      return post.id;
    },
    [currentUserId]
  );

  const addComment = useCallback(
    (postId: string, content: string, parentCommentId?: string | null) => {
      const comment: Comment = {
        id: generateId("cmt"),
        postId,
        userId: currentUserId,
        content: content.trim(),
        parentCommentId: parentCommentId ?? null,
        createdAt: Date.now(),
      };
      // Store comments alongside posts in-memory for now via a synthetic map
      // Minimal: we won't persist comments separately in this MVP; extend later
      // For UI, we can derive comments by scanning an in-memory list; here we keep it simple
      // CURSOR-TODO: Replace with backend comments table later
      setPosts(prev => prev.map(p => (p.id === postId ? { ...p } : p)));
      return comment;
    },
    [currentUserId]
  );

  const toggleReaction = useCallback(
    (postId: string, reaction: ReactionType) => {
      // Single reaction per user per post
      setPosts(prev =>
        prev.map(p => {
          if (p.id !== postId) return p;
          const current = p.reactions || {};
          // Remove user from all reaction arrays first
          const next: Post["reactions"] = {};
          (Object.keys(current) as ReactionType[]).forEach(key => {
            const list = current[key] ?? [];
            const filtered = list.filter(uid => uid !== currentUserId);
            if (filtered.length > 0) next[key] = filtered;
          });
          // Then add to the chosen reaction
          const after = next[reaction] ?? [];
          next[reaction] = [...after, currentUserId];
          return { ...p, reactions: next };
        })
      );
    },
    [currentUserId]
  );

  const removeReaction = useCallback(
    (postId: string) => {
      setPosts(prev =>
        prev.map(p => {
          if (p.id !== postId) return p;
          const current = p.reactions || {};
          const next: Post["reactions"] = {};
          (Object.keys(current) as ReactionType[]).forEach(key => {
            const list = current[key] ?? [];
            const filtered = list.filter(uid => uid !== currentUserId);
            if (filtered.length > 0) next[key] = filtered;
          });
          return { ...p, reactions: next };
        })
      );
    },
    [currentUserId]
  );

  const filtered = useCallback(
    (opts?: { type?: Post["type"]; tag?: string; communityId?: string | null; q?: string }) => {
      const { type, tag, communityId, q } = opts || {};
      return posts
        .filter(p => (type ? p.type === type : true))
        .filter(p => (tag ? p.tags.includes(tag) : true))
        .filter(p => (communityId !== undefined && communityId !== null ? p.communityId === communityId : true))
        .filter(p => (q ? (p.content || "").toLowerCase().includes(q.toLowerCase()) : true))
        .sort((a, b) => b.createdAt - a.createdAt);
    },
    [posts]
  );

  const attachLocalFiles = useCallback(async (files: FileList | File[]): Promise<MediaItem[]> => {
    const list = Array.from(files);
    const items: MediaItem[] = await Promise.all(
      list.map(async f => {
        const url = URL.createObjectURL(f);
        const kind: MediaItem["kind"] = f.type.startsWith("image/") ? "image" : "file";
        return {
          id: generateId("media"),
          kind,
          url,
          mimeType: f.type,
          name: f.name,
          size: f.size,
        };
      })
    );
    return items;
  }, []);

  return {
    posts,
    hasMore,
    async loadMore() {
      if (!hasMore) return;
      try {
        const url = cursor ? `/api/social/posts?cursor=${encodeURIComponent(cursor)}` : '/api/social/posts';
        const res = await fetch(url, { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          const list: Post[] = data.posts || [];
          setPosts(prev => [...prev, ...list]);
          setHasMore(list.length >= 20);
          setCursor(list.at(-1)?.createdAt?.toString() || null);
        }
      } catch {}
    },
    createPost,
    addComment,
    toggleReaction,
    removeReaction,
    filtered,
    attachLocalFiles,
  };
}


