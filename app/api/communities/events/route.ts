import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { communityService } from '@/lib/database/community-service';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { fileService } from '@/lib/database/file-service';

// POST /api/communities/events - Create a new event
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const date = formData.get('date') as string;
    const time = formData.get('time') as string;
    const location = formData.get('location') as string;
    const maxAttendees = formData.get('maxAttendees') as string;
    const communityId = formData.get('communityId') as string;
    const type = formData.get('type') as string;
    const isOnline = formData.get('isOnline') === 'true';
    
    // Handle media files
    const mediaFiles: any[] = [];
    let mediaIndex = 0;
    while (formData.has(`media_${mediaIndex}`)) {
      const file = formData.get(`media_${mediaIndex}`) as File;
      
      if (file) {
        try {
          // Validate file size (max 250MB per file)
          const maxSize = 250 * 1024 * 1024;
          if (file.size > maxSize) {
            console.error(`File ${file.name} exceeds 250MB`);
            mediaIndex++;
            continue;
          }

          // Create upload directory
          const uploadDir = path.join(process.cwd(), 'uploads', 'users', session.user.id, 'events');
          await mkdir(uploadDir, { recursive: true });

          // Generate unique filename
          const ts = Date.now();
          const rand = Math.random().toString(36).slice(2);
          const ext = path.extname(file.name);
          const fileName = `${ts}-${rand}${ext}`;
          const filePath = path.join(uploadDir, fileName);
          
          // Save file
          const buf = Buffer.from(await file.arrayBuffer());
          await writeFile(filePath, buf);

          // Create thumbnail if it's an image or PDF
          let thumbnailPath: string | null = null;
          if (file.type.startsWith('image/') || file.type === 'application/pdf') {
            try {
              thumbnailPath = await fileService.createThumbnail(filePath, fileName, 'events', session.user.id);
            } catch (thumbError) {
              console.error('Error creating thumbnail:', thumbError);
            }
          }

          // Add to media files
          mediaFiles.push({
            id: `${ts}-${rand}`, // Use the same ID as filename for consistency
            kind: file.type.startsWith('image/') ? 'image' : 'file',
            url: `/uploads/users/${session.user.id}/events/${fileName}`,
            thumbnailUrl: thumbnailPath ? thumbnailPath.replace(process.cwd(), '').replace(/\\/g, '/') : undefined,
            mimeType: file.type,
            name: file.name,
            size: file.size,
          });
        } catch (uploadError) {
          console.error('Error uploading media file:', uploadError);
          // Continue without this file
        }
      }
      
      mediaIndex++;
    }
    
    console.log('🔍 Event creation data:', { title, description, date, time, location, maxAttendees, communityId, type, isOnline, mediaCount: mediaFiles.length });

    // Validate required fields
    if (!title || !date || !time || !location || !communityId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if user is a member of the community
    const isMember = await communityService.isCommunityMember(communityId, session.user.id);
    if (!isMember) {
      return NextResponse.json(
        { error: 'You must be a member of this community to create events' },
        { status: 403 }
      );
    }

    const event = await communityService.createEvent({
      title,
      description,
      startTime: new Date(`${date}T${time}`),
      location,
      maxAttendees: maxAttendees ? parseInt(maxAttendees) : null,
      communityId,
      createdBy: session.user.id,
      type: type || 'meetup',
      isOnline,
      media: mediaFiles,
    });

    return NextResponse.json({ event }, { status: 201 });
  } catch (error) {
    console.error('Error creating event:', error);
    return NextResponse.json(
      { error: 'Failed to create event' },
      { status: 500 }
    );
  }
}

// GET /api/communities/events - Get events (with optional community filter)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const communityId = searchParams.get('communityId');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    let events;
    if (communityId) {
      events = await communityService.getCommunityEvents(communityId, limit, offset);
    } else {
      // Get events from communities user is a member of
      events = await communityService.getUserEvents(session.user.id, limit, offset);
    }

    return NextResponse.json({ events });
  } catch (error) {
    console.error('Error fetching events:', error);
    return NextResponse.json(
      { error: 'Failed to fetch events' },
      { status: 500 }
    );
  }
}
