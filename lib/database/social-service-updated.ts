import { dbService } from './database-service';

export type SocialMediaItem = {
  id: string;
  kind: 'image' | 'file';
  url: string;
  thumbnailUrl?: string;
  mimeType: string;
  name?: string;
  size?: number;
}

export class SocialService {
  private prisma = dbService.getPrisma();

  async createPost(params: {
    userId: string;
    content?: string | null;
    tags?: string[];
    communityId?: string | null;
    media?: SocialMediaItem[];
  }) {
    const post = await this.prisma.$transaction(async (tx) => {
      const created = await tx.post.create({
        data: {
          userId: params.userId,
          content: params.content || null,
          tags: JSON.stringify(params.tags || []),
          communityId: params.communityId || null,
          type: (() => {
            const m = params.media || [];
            if (m.length === 0) return 'TEXT';
            if (m.every(i => i.kind === 'image')) return 'IMAGE';
            if (m.every(i => i.kind === 'file')) return 'FILE';
            return 'MIXED';
          })(),
        }
      });

      for (const m of params.media || []) {
        await tx.postMedia.create({
          data: {
            postId: created.id,
            kind: m.kind.toUpperCase(),
            url: m.url,
            thumbnailUrl: m.thumbnailUrl || null,
            mimeType: m.mimeType,
            name: m.name || null,
            size: m.size ? Math.round(m.size) : null,
          } as any
        });
      }

      return created;
    });

    return post;
  }

  async listPosts(params?: { 
    type?: string; 
    tag?: string; 
    communityId?: string | null; 
    q?: string;
    limit?: number;
    offset?: number;
  }) {
    const { limit = 20, offset = 0 } = params || {};

    const posts = await this.prisma.post.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true
          }
        },
        // Include community information if communityId exists
        community: {
          select: {
            id: true,
            name: true,
            slug: true,
            avatar: true,
            category: true,
            visibility: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });

    // Attach media
    const ids = posts.map(p => p.id);
    const media = await this.prisma.postMedia.findMany({ 
      where: { postId: { in: ids } } 
    });

    // Attach reactions
    const reactions = await this.prisma.reaction.findMany({
      where: { postId: { in: ids } },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true
          }
        }
      }
    });

    const byPost: Record<string, any[]> = {};
    media.forEach(m => {
      byPost[m.postId] = byPost[m.postId] || [];
      byPost[m.postId].push(m);
    });

    const reactionsByPost: Record<string, any[]> = {};
    reactions.forEach(r => {
      reactionsByPost[r.postId] = reactionsByPost[r.postId] || [];
      reactionsByPost[r.postId].push(r);
    });

    let data = posts.map(p => {
      const postReactions = reactionsByPost[p.id] || [];
      const groupedReactions = postReactions.reduce((acc, reaction) => {
        if (!acc[reaction.type]) {
          acc[reaction.type] = [];
        }
        acc[reaction.type].push({
          id: reaction.user.id,
          name: reaction.user.name,
          image: reaction.user.image
        });
        return acc;
      }, {} as Record<string, any[]>);

      return {
        ...p,
        tags: JSON.parse(p.tags as unknown as string || '[]'),
        reactions: groupedReactions,
        media: (byPost[p.id] || []).map(m => ({
          id: m.id,
          kind: (m.kind.toLowerCase() as 'image' | 'file'),
          url: m.url,
          thumbnailUrl: m.thumbnailUrl || undefined,
          mimeType: m.mimeType,
          name: (m as any).name || undefined,
          size: (m as any).size || undefined,
        })),
        // Include community information
        community: p.community ? {
          id: p.community.id,
          name: p.community.name,
          slug: p.community.slug,
          avatar: p.community.avatar,
          category: p.community.category,
          visibility: p.community.visibility,
        } : null,
      };
    });

    // Apply filters
    if (params?.type) data = data.filter(p => p.type === params.type);
    if (params?.tag) data = data.filter(p => (p.tags || []).includes(params.tag as string));
    if (params && 'communityId' in params && params.communityId !== undefined) {
      data = data.filter(p => p.communityId === params.communityId);
    }
    if (params?.q) {
      data = data.filter(p => 
        (p.content || '').toLowerCase().includes((params.q as string).toLowerCase())
      );
    }

    return data;
  }

  // Get posts for a specific community
  async getCommunityPosts(communityId: string, params?: {
    type?: string;
    tag?: string;
    q?: string;
    limit?: number;
    offset?: number;
  }) {
    return this.listPosts({
      ...params,
      communityId,
    });
  }

  // Get posts from user's communities
  async getUserCommunityPosts(userId: string, params?: {
    type?: string;
    tag?: string;
    q?: string;
    limit?: number;
    offset?: number;
  }) {
    // First get user's communities
    const userCommunities = await this.prisma.communityMember.findMany({
      where: {
        userId,
        status: 'active',
      },
      select: {
        communityId: true,
      },
    });

    const communityIds = userCommunities.map(uc => uc.communityId);

    // Get posts from these communities
    const posts = await this.prisma.post.findMany({
      where: {
        communityId: {
          in: communityIds,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true
          }
        },
        community: {
          select: {
            id: true,
            name: true,
            slug: true,
            avatar: true,
            category: true,
            visibility: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: params?.limit || 20,
      skip: params?.offset || 0,
    });

    // Process posts similar to listPosts
    const ids = posts.map(p => p.id);
    const media = await this.prisma.postMedia.findMany({ 
      where: { postId: { in: ids } } 
    });

    const reactions = await this.prisma.reaction.findMany({
      where: { postId: { in: ids } },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true
          }
        }
      }
    });

    const byPost: Record<string, any[]> = {};
    media.forEach(m => {
      byPost[m.postId] = byPost[m.postId] || [];
      byPost[m.postId].push(m);
    });

    const reactionsByPost: Record<string, any[]> = {};
    reactions.forEach(r => {
      reactionsByPost[r.postId] = reactionsByPost[r.postId] || [];
      reactionsByPost[r.postId].push(r);
    });

    let data = posts.map(p => {
      const postReactions = reactionsByPost[p.id] || [];
      const groupedReactions = postReactions.reduce((acc, reaction) => {
        if (!acc[reaction.type]) {
          acc[reaction.type] = [];
        }
        acc[reaction.type].push({
          id: reaction.user.id,
          name: reaction.user.name,
          image: reaction.user.image
        });
        return acc;
      }, {} as Record<string, any[]>);

      return {
        ...p,
        tags: JSON.parse(p.tags as unknown as string || '[]'),
        reactions: groupedReactions,
        media: (byPost[p.id] || []).map(m => ({
          id: m.id,
          kind: (m.kind.toLowerCase() as 'image' | 'file'),
          url: m.url,
          thumbnailUrl: m.thumbnailUrl || undefined,
          mimeType: m.mimeType,
          name: (m as any).name || undefined,
          size: (m as any).size || undefined,
        })),
        community: p.community ? {
          id: p.community.id,
          name: p.community.name,
          slug: p.community.slug,
          avatar: p.community.avatar,
          category: p.community.category,
          visibility: p.community.visibility,
        } : null,
      };
    });

    // Apply filters
    if (params?.type) data = data.filter(p => p.type === params.type);
    if (params?.tag) data = data.filter(p => (p.tags || []).includes(params.tag as string));
    if (params?.q) {
      data = data.filter(p => 
        (p.content || '').toLowerCase().includes((params.q as string).toLowerCase())
      );
    }

    return data;
  }
}

export const socialService = new SocialService();
