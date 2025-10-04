import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { dbService } from '@/lib/database';

// GET /api/communities/notifications/messages - Get user's community message notifications
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's communities with unread message counts
    const communities = await dbService.getPrisma().community.findMany({
      where: {
        members: {
          some: {
            userId: session.user.id,
            status: 'active'
          }
        }
      },
      take: 20, // Limit to 20 communities to save memory
      include: {
        channels: {
          take: 5, // Limit to 5 channels per community
          include: {
            messages: {
              where: {
                isDeleted: false,
                authorId: {
                  not: session.user.id // Exclude user's own messages
                },
                createdAt: {
                  gt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days only
                }
              },
              orderBy: {
                createdAt: 'desc'
              },
              take: 1,
              include: {
                author: {
                  select: {
                    id: true,
                    name: true,
                    image: true
                  }
                }
              }
            }
          }
        }
      }
    });

    // Found communities for user

    // Calculate unread counts for each community
    const communitiesWithNotifications = await Promise.all(
      communities.map(async (community) => {
        let totalUnreadCount = 0;
        let lastMessage = null;

    // Try to get user's last read timestamps for each channel
    let readMap = new Map();
    try {
      const lastReadTimestamps = await dbService.getPrisma().communityMessageRead.findMany({
        where: {
          userId: session.user.id,
          channel: {
            communityId: community.id
          }
        },
        select: {
          channelId: true,
          lastReadAt: true
        }
      });

      readMap = new Map(
        lastReadTimestamps.map(rt => [rt.channelId, rt.lastReadAt])
      );
    } catch (error) {
      console.log('CommunityMessageRead table not available, using fallback method');
      // Fallback: assume user has read messages from 24 hours ago to show only recent unread messages
      const fallbackTime = new Date(Date.now() - 24 * 60 * 60 * 1000);
      for (const channel of community.channels) {
        readMap.set(channel.id, fallbackTime);
      }
    }

    // Calculate unread count for each channel
    const channelsWithUnreadCounts = [];
    for (const channel of community.channels) {
      const lastReadAt = readMap.get(channel.id);
      
      // Only count messages that are truly unread (not from the user and after last read time)
      const unreadMessages = await dbService.getPrisma().communityMessage.count({
        where: {
          channelId: channel.id,
          isDeleted: false,
          authorId: {
            not: session.user.id
          },
          ...(lastReadAt ? {
            createdAt: {
              gt: lastReadAt
            }
          } : {
            // If no read timestamp, only count messages from last 24 hours
            createdAt: {
              gt: new Date(Date.now() - 24 * 60 * 60 * 1000)
            }
          })
        }
      });

      // Channel unread count calculated
      totalUnreadCount += unreadMessages;

      // Store channel with its unread count
      channelsWithUnreadCounts.push({
        id: channel.id,
        name: channel.name,
        type: channel.type,
        unreadCount: unreadMessages
      });

      // Get the most recent message for this community
      if (channel.messages.length > 0 && !lastMessage) {
        const message = channel.messages[0];
        lastMessage = {
          content: message.content,
          author: {
            name: message.author.name,
            image: message.author.image
          },
          createdAt: message.createdAt.toISOString()
        };
      }
    }

        // Community unread count calculated
        
        return {
          id: community.id,
          name: community.name,
          slug: community.slug,
          totalUnreadCount,
          lastMessage,
          channels: channelsWithUnreadCounts
        };
      })
    );

    // Return all communities with their unread counts (including 0)
    const response = {
      communities: communitiesWithNotifications,
      totalUnreadCount: communitiesWithNotifications.reduce((sum, community) => sum + community.totalUnreadCount, 0)
    };
    
    // Returning community notifications
    
    return NextResponse.json(response);

  } catch (error) {
    console.error('Error fetching community message notifications:', error);
    // Return empty result instead of error to prevent fetch failures
    return NextResponse.json({ 
      communities: [], 
      totalUnreadCount: 0 
    });
  }
}
