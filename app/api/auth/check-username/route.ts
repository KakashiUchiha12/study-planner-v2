import { NextRequest, NextResponse } from 'next/server';
import { dbService } from '@/lib/database/database-service';

export async function POST(request: NextRequest) {
  try {
    const { username } = await request.json();

    if (!username) {
      return NextResponse.json(
        { error: 'Username is required' },
        { status: 400 }
      );
    }

    // Validate username format
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    if (!usernameRegex.test(username)) {
      return NextResponse.json(
        { 
          available: false, 
          message: 'Username must be 3-20 characters long and contain only letters, numbers, and underscores' 
        },
        { status: 200 }
      );
    }

    // Check if username exists
    const existingUser = await dbService.prisma.user.findUnique({
      where: { username },
      select: { id: true }
    });

    const available = !existingUser;

    return NextResponse.json({
      available,
      message: available 
        ? 'This username is available' 
        : 'This username is not available'
    });

  } catch (error) {
    console.error('Error checking username availability:', error);
    return NextResponse.json(
      { error: 'Failed to check username availability' },
      { status: 500 }
    );
  }
}
