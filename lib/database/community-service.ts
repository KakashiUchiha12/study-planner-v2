import { dbService } from './database-service';

export interface Community {
  id: string;
  name: string;
  slug: string;
  description?: string;
  avatar?: string;
  category: string;
  visibility: 'PUBLIC' | 'PRIVATE';
  memberCount: number;
  createdAt: Date;
  updatedAt: Date;
  ownerId: string;
}

export interface CommunityMember {
  id: string;
  communityId: string;
  userId: string;
  role: 'OWNER' | 'ADMIN' | 'MODERATOR' | 'MEMBER';
  joinedAt: Date;
  user: {
    id: string;
    name: string;
    email: string;
    username?: string;
    image?: string;
  };
}

export interface CreateCommunityData {
  name: string;
  slug: string;
  description?: string;
  avatar?: string;
  category: string;
  visibility: 'PUBLIC' | 'PRIVATE';
  ownerId: string;
}

export interface UpdateCommunityData {
  name?: string;
  slug?: string;
  description?: string;
  avatar?: string;
  category?: string;
  visibility?: 'PUBLIC' | 'PRIVATE';
}

export class CommunityService {
  private prisma = dbService.getPrisma();

  // Get community by ID or slug
  async getCommunityByIdentifier(identifier: string): Promise<Community | null> {
    try {
      const community = await this.prisma.community.findFirst({
        where: {
          OR: [
            { id: identifier },
            { slug: identifier }
          ]
        },
        include: {
          _count: {
            select: {
              members: true
            }
          }
        }
      });

      if (!community) return null;

      // Debug logging
      console.log('Raw community data from DB:', {
        id: community.id,
        name: community.name,
        ownerId: community.ownerId,
        createdBy: (community as any).createdBy,
        createdById: (community as any).createdById,
        createdByUser: (community as any).createdByUser,
        hasOwnerId: 'ownerId' in community,
        allKeys: Object.keys(community)
      });

      // If ownerId is missing, try to get it from the members table
      let ownerId = community.ownerId;
      if (!ownerId) {
        console.log('ownerId is missing, trying to get from members table...');
        try {
          const ownerMember = await this.prisma.communityMember.findFirst({
            where: {
              communityId: community.id,
              role: 'OWNER'
            },
            select: { userId: true }
          });
          if (ownerMember) {
            ownerId = ownerMember.userId;
            console.log('Found owner from members table:', ownerId);
          } else {
            console.log('No owner found in members table, trying to get first member...');
            // If no owner found, try to get the first member (might be the creator)
            const firstMember = await this.prisma.communityMember.findFirst({
              where: {
                communityId: community.id
              },
              orderBy: {
                joinedAt: 'asc'
              },
              select: { userId: true }
            });
            if (firstMember) {
              ownerId = firstMember.userId;
              console.log('Using first member as owner:', ownerId);
            }
          }
        } catch (error) {
          console.error('Error fetching owner from members table:', error);
        }
      }

      return {
        id: community.id,
        name: community.name,
        slug: community.slug,
        description: community.description || undefined,
        avatar: community.avatar || undefined,
        banner: community.banner || undefined,
        category: community.category,
        visibility: community.visibility as 'PUBLIC' | 'PRIVATE',
        memberCount: community._count.members,
        createdAt: community.createdAt,
        updatedAt: community.updatedAt,
        ownerId: ownerId || ''
      };
    } catch (error) {
      console.error('Error fetching community by identifier:', error);
      throw error;
    }
  }

  // Get all communities with optional filters
  async getAllCommunities(options: {
    page?: number;
    limit?: number;
    search?: string;
    category?: string;
    subcategory?: string;
    university?: string;
  } = {}): Promise<Community[]> {
    try {
      const { page = 1, limit = 20, search, category, subcategory, university } = options;
      const skip = (page - 1) * limit;

      const where: any = {};

      // Add search filter
      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { slug: { contains: search, mode: 'insensitive' } }
        ];
      }

      // Add category filter
      if (category) {
        where.category = category;
      }

      // Add subcategory filter (if we have this field)
      if (subcategory) {
        where.subcategory = subcategory;
      }

      // Add university filter (if we have this field)
      if (university) {
        where.university = university;
      }

      const communities = await this.prisma.community.findMany({
        where,
        include: {
          _count: {
            select: {
              members: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip,
        take: limit
      });

      return communities.map(community => ({
        id: community.id,
        name: community.name,
        slug: community.slug,
        description: community.description || undefined,
        shortDescription: community.description || undefined,
        avatar: community.avatar || undefined,
        banner: (community as any).banner || undefined,
        category: community.category,
        subcategory: (community as any).subcategory || undefined,
        university: (community as any).university || undefined,
        program: (community as any).program || undefined,
        year: (community as any).year || undefined,
        tags: (community as any).tags || '',
        visibility: community.visibility.toLowerCase() as 'public' | 'private' | 'restricted',
        joinType: (community as any).joinType || 'open',
        memberCount: community._count.members,
        maxMembers: (community as any).maxMembers || undefined,
        isActive: (community as any).isActive !== false,
        isVerified: (community as any).isVerified || false,
        createdAt: community.createdAt.toISOString(),
        createdByUser: {
          id: community.ownerId,
          name: 'Community Owner', // We'll need to fetch this from user data
          image: undefined
        }
      }));
    } catch (error) {
      console.error('Error fetching all communities:', error);
      throw error;
    }
  }

  // Get user's communities
  async getUserCommunities(userId: string): Promise<Community[]> {
    try {
      const userCommunities = await this.prisma.communityMember.findMany({
        where: { userId },
        include: {
          community: {
            include: {
              _count: {
                select: {
                  members: true
                }
              }
            }
          }
        },
        orderBy: {
          joinedAt: 'desc'
        }
      });

      return userCommunities.map(member => ({
        id: member.community.id,
        name: member.community.name,
        slug: member.community.slug,
        description: member.community.description || undefined,
        avatar: member.community.avatar || undefined,
        category: member.community.category,
        visibility: member.community.visibility as 'PUBLIC' | 'PRIVATE',
        memberCount: member.community._count.members,
        createdAt: member.community.createdAt,
        updatedAt: member.community.updatedAt,
        ownerId: member.community.ownerId
      }));
    } catch (error) {
      console.error('Error fetching user communities:', error);
      throw error;
    }
  }

  // Get community members
  async getCommunityMembers(communityId: string, limit: number = 50, offset: number = 0): Promise<CommunityMember[]> {
    try {
      const members = await this.prisma.communityMember.findMany({
        where: { communityId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              username: true,
              image: true
            }
          }
        },
        orderBy: [
          { role: 'asc' }, // Owners first, then admins, etc.
          { joinedAt: 'asc' }
        ],
        take: limit,
        skip: offset
      });

      return members.map(member => ({
        id: member.id,
        communityId: member.communityId,
        userId: member.userId,
        role: member.role as 'OWNER' | 'ADMIN' | 'MODERATOR' | 'MEMBER',
        joinedAt: member.joinedAt,
        user: {
          id: member.user.id,
          name: member.user.name,
          email: member.user.email,
          username: member.user.username || undefined,
          image: member.user.image || undefined
        }
      }));
    } catch (error) {
      console.error('Error fetching community members:', error);
      throw error;
    }
  }

  // Check if user is a community member
  async isCommunityMember(communityId: string, userId: string): Promise<boolean> {
    try {
      const member = await this.prisma.communityMember.findFirst({
        where: {
          communityId,
          userId
        }
      });
      return !!member;
    } catch (error) {
      console.error('Error checking community membership:', error);
      throw error;
    }
  }

  // Get user's role in community
  async getUserRole(communityId: string, userId: string): Promise<string | null> {
    try {
      const member = await this.prisma.communityMember.findFirst({
        where: {
          communityId,
          userId
        }
      });
      return member?.role || null;
    } catch (error) {
      console.error('Error getting user role:', error);
      throw error;
    }
  }

  // Create community
  async createCommunity(data: CreateCommunityData): Promise<Community> {
    try {
      const community = await this.prisma.$transaction(async (tx) => {
        // Create the community
        const created = await tx.community.create({
          data: {
            name: data.name,
            slug: data.slug,
            description: data.description,
            avatar: data.avatar,
            category: data.category,
            visibility: data.visibility,
            ownerId: data.ownerId
          }
        });

        // Add the owner as a member
        await tx.communityMember.create({
          data: {
            communityId: created.id,
            userId: data.ownerId,
            role: 'OWNER'
          }
        });

        return created;
      });

      return {
        id: community.id,
        name: community.name,
        slug: community.slug,
        description: community.description || undefined,
        avatar: community.avatar || undefined,
        category: community.category,
        visibility: community.visibility as 'PUBLIC' | 'PRIVATE',
        memberCount: 1, // Owner is the first member
        createdAt: community.createdAt,
        updatedAt: community.updatedAt,
        ownerId: community.ownerId
      };
    } catch (error) {
      console.error('Error creating community:', error);
      throw error;
    }
  }

  // Update community
  async updateCommunity(communityId: string, userId: string, data: UpdateCommunityData): Promise<Community> {
    try {
      // Check if user has permission to update
      const member = await this.prisma.communityMember.findFirst({
        where: {
          communityId,
          userId,
          role: {
            in: ['OWNER', 'ADMIN']
          }
        }
      });

      if (!member) {
        throw new Error('Insufficient permissions to update community');
      }

      const updated = await this.prisma.community.update({
        where: { id: communityId },
        data: {
          ...data,
          updatedAt: new Date()
        },
        include: {
          _count: {
            select: {
              members: true
            }
          }
        }
      });

      return {
        id: updated.id,
        name: updated.name,
        slug: updated.slug,
        description: updated.description || undefined,
        avatar: updated.avatar || undefined,
        category: updated.category,
        visibility: updated.visibility as 'PUBLIC' | 'PRIVATE',
        memberCount: updated._count.members,
        createdAt: updated.createdAt,
        updatedAt: updated.updatedAt,
        ownerId: updated.ownerId
      };
    } catch (error) {
      console.error('Error updating community:', error);
      throw error;
    }
  }

  // Delete community
  async deleteCommunity(communityId: string, userId: string): Promise<void> {
    try {
      // Check if user is the owner
      const community = await this.prisma.community.findUnique({
        where: { id: communityId }
      });

      if (!community) {
        throw new Error('Community not found');
      }

      if (community.ownerId !== userId) {
        throw new Error('Only the community owner can delete the community');
      }

      // Delete the community (cascade will handle members, posts, etc.)
      await this.prisma.community.delete({
        where: { id: communityId }
      });
    } catch (error) {
      console.error('Error deleting community:', error);
      throw error;
    }
  }

  // Add member to community
  async addMember(communityId: string, userId: string, role: 'MEMBER' | 'MODERATOR' | 'ADMIN' = 'MEMBER'): Promise<void> {
    try {
      // Check if user is already a member
      const existingMember = await this.prisma.communityMember.findFirst({
        where: {
          communityId,
          userId
        }
      });

      if (existingMember) {
        throw new Error('User is already a member of this community');
      }

      // Add user as member
      await this.prisma.communityMember.create({
        data: {
          communityId,
          userId,
          role
        }
      });
    } catch (error) {
      console.error('Error adding member to community:', error);
      throw error;
    }
  }

  // Remove member from community
  async removeMember(communityId: string, userId: string): Promise<void> {
    try {
      // Check if user is a member
      const member = await this.prisma.communityMember.findFirst({
        where: {
          communityId,
          userId
        }
      });

      if (!member) {
        throw new Error('User is not a member of this community');
      }

      // Don't allow owner to leave (they need to delete the community or transfer ownership)
      if (member.role === 'OWNER') {
        throw new Error('Community owner cannot leave the community');
      }

      // Remove user from community
      await this.prisma.communityMember.delete({
        where: {
          id: member.id
        }
      });
    } catch (error) {
      console.error('Error removing member from community:', error);
      throw error;
    }
  }

  // Join community (alias for addMember)
  async joinCommunity(communityId: string, userId: string): Promise<void> {
    return this.addMember(communityId, userId, 'MEMBER');
  }

  // Leave community
  async leaveCommunity(communityId: string, userId: string): Promise<void> {
    try {
      // Check if user is the owner
      const community = await this.prisma.community.findUnique({
        where: { id: communityId }
      });

      if (community?.ownerId === userId) {
        throw new Error('Community owner cannot leave the community');
      }

      // Remove user from community
      await this.prisma.communityMember.deleteMany({
        where: {
          communityId,
          userId
        }
      });
    } catch (error) {
      console.error('Error leaving community:', error);
      throw error;
    }
  }

  // Update member role
  async updateMemberRole(communityId: string, memberId: string, newRole: string, requesterId: string): Promise<void> {
    try {
      // Check if requester has permission
      const requester = await this.prisma.communityMember.findFirst({
        where: {
          communityId,
          userId: requesterId,
          role: {
            in: ['OWNER', 'ADMIN']
          }
        }
      });

      if (!requester) {
        throw new Error('Insufficient permissions to update member role');
      }

      // Update member role
      await this.prisma.communityMember.update({
        where: { id: memberId },
        data: { role: newRole }
      });
    } catch (error) {
      console.error('Error updating member role:', error);
      throw error;
    }
  }

  // Remove member from community
  async removeMember(communityId: string, memberId: string, requesterId: string): Promise<void> {
    try {
      // Check if requester has permission
      const requester = await this.prisma.communityMember.findFirst({
        where: {
          communityId,
          userId: requesterId,
          role: {
            in: ['OWNER', 'ADMIN']
          }
        }
      });

      if (!requester) {
        throw new Error('Insufficient permissions to remove member');
      }

      // Remove member
      await this.prisma.communityMember.delete({
        where: { id: memberId }
      });
    } catch (error) {
      console.error('Error removing member:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const communityService = new CommunityService();
