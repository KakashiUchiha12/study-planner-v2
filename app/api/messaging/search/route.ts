import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { authOptions } from '@/lib/auth';
import { dbService } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const conversationId = searchParams.get('conversationId');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!query || query.trim().length < 2) {
      return NextResponse.json({ 
        results: [], 
        total: 0, 
        message: 'Query must be at least 2 characters long' 
      });
    }

    const prisma = dbService.getPrisma();

    // Build search conditions - search both message content and sender information
    const whereConditions: any = {
      OR: [
        {
          content: {
            contains: query,
          },
        },
        {
          sender: {
            OR: [
              { name: { contains: query } },
              { email: { contains: query } },
              { id: { contains: query } }
            ]
          }
        }
      ],
      deletedAt: null,
    };

    // If searching within a specific conversation
    if (conversationId) {
      whereConditions.AND = [
        { conversationId: conversationId }
      ];
      
      // Verify user has access to this conversation
      const participant = await prisma.conversationParticipant.findFirst({
        where: {
          conversationId: conversationId,
          userId: session.user.id,
          isActive: true,
        },
      });

      if (!participant) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
    } else {
      // If searching across all conversations, ensure user has access
      whereConditions.AND = [
        {
          conversation: {
            participants: {
              some: {
                userId: session.user.id,
                isActive: true,
              },
            },
          }
        }
      ];
    }

    // Search messages
    const messages = await prisma.message.findMany({
      where: whereConditions,
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        conversation: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
      skip: offset,
    });

    // Get total count for pagination
    const totalCount = await prisma.message.count({
      where: whereConditions,
    });

    // Transform results
    const results = messages.map(message => ({
      id: message.id,
      content: message.content,
      createdAt: message.createdAt,
      sender: message.sender,
      conversation: message.conversation,
    }));

    return NextResponse.json({
      results,
      total: totalCount,
      query,
      conversationId,
    });

  } catch (error) {
    console.error('Message search error:', error);
    return NextResponse.json(
      { error: 'Failed to search messages' },
      { status: 500 }
    );
  }
}
