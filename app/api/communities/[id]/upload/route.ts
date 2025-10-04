import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { communityService } from '@/lib/database/community-service';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

// POST /api/communities/[id]/upload - Upload community avatar or banner
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: communityId } = await params;
    
    // Check if user has permission to update community
    const userRole = await communityService.getUserRole(communityId, session.user.id);
    if (!userRole || !['owner', 'admin'].includes(userRole)) {
      return NextResponse.json(
        { error: 'You do not have permission to update this community' },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const type = formData.get('type') as string; // 'avatar' or 'banner'

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!type || !['avatar', 'banner'].includes(type)) {
      return NextResponse.json({ error: 'Invalid type. Must be avatar or banner' }, { status: 400 });
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'File must be an image' }, { status: 400 });
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size must be less than 5MB' }, { status: 400 });
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), 'public', 'uploads', 'communities', communityId);
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const fileExtension = file.name.split('.').pop();
    const filename = `${type}-${timestamp}.${fileExtension}`;
    const filepath = join(uploadsDir, filename);

    // Save file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filepath, buffer);

    // Generate public URL
    const publicUrl = `/uploads/communities/${communityId}/${filename}`;

    // Update community with new image URL
    const updateData = type === 'avatar' ? { avatar: publicUrl } : { banner: publicUrl };
    await communityService.updateCommunity(communityId, session.user.id, updateData);

    return NextResponse.json({ 
      success: true, 
      url: publicUrl,
      type 
    }, { status: 200 });

  } catch (error) {
    console.error('Error uploading community image:', error);
    return NextResponse.json(
      { error: 'Failed to upload image' },
      { status: 500 }
    );
  }
}
