import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { communityService } from '@/lib/database/community-service';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { fileService } from '@/lib/database/file-service';

// POST /api/communities/resources - Add new resources (supports multiple files and links)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const communityId = formData.get('communityId') as string;
    
    // Handle multiple files and links
    const files = formData.getAll('files') as File[];
    const fileTitles = formData.getAll('fileTitles') as string[];
    const links = formData.getAll('links') as string[];
    const linkTitles = formData.getAll('linkTitles') as string[];

    // Backward compatibility: check for single file/link
    const type = formData.get('type') as string;
    const url = formData.get('url') as string;
    const file = formData.get('file') as File;

    if (!title || !communityId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check if user is a member of the community
    const isMember = await communityService.isCommunityMember(communityId, session.user.id);
    if (!isMember) {
      return NextResponse.json(
        { error: 'You must be a member of this community to add resources' },
        { status: 403 }
      );
    }

    const createdResources = [];

    // Handle backward compatibility (single file/link)
    if (type && (file || url)) {
      let resourceData: any = {
        title,
        description,
        type,
        communityId,
        createdBy: session.user.id,
      };

      if (type === 'link' && url) {
        resourceData.url = url;
      } else if (type === 'file' && file) {
        // Handle file upload
        const ts = Date.now();
        const rand = Math.random().toString(36).substring(2, 15);
        const ext = path.extname(file.name);
        const fileName = `${ts}-${rand}${ext}`;
        
        // Create user-specific resource upload directory
        const uploadDir = path.join(process.cwd(), 'uploads', 'users', session.user.id, 'resources');
        await mkdir(uploadDir, { recursive: true });
        
        // Save file
        const filePath = path.join(uploadDir, fileName);
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        await writeFile(filePath, buffer);
        
        // Generate thumbnail for images and PDFs
        let thumbnailPath: string | null = null;
        if (file.type.startsWith('image/') || file.type === 'application/pdf') {
          try {
            thumbnailPath = await fileService.createThumbnail(
              filePath,
              fileName,
              'resources',
              session.user.id
            );
          } catch (thumbError) {
            console.error('Error creating thumbnail:', thumbError);
          }
        }
        
        // Create media array for the resource
        const mediaFiles = [{
          id: `${ts}-${rand}`,
          kind: file.type.startsWith('image/') ? 'image' : 'file',
          url: `/uploads/users/${session.user.id}/resources/${fileName}`,
          thumbnailUrl: thumbnailPath ? thumbnailPath.replace(process.cwd(), '').replace(/\\/g, '/') : undefined,
          mimeType: file.type,
          name: file.name,
          size: file.size,
        }];
        
        resourceData.fileName = file.name;
        resourceData.fileSize = file.size;
        resourceData.mimeType = file.type;
        resourceData.filePath = filePath;
        resourceData.media = JSON.stringify(mediaFiles);
      }

      const resource = await communityService.createResource(resourceData);
      return NextResponse.json({ resource }, { status: 201 });
    }

    // Handle multiple files and links as ONE resource
    const allMediaFiles = [];
    let totalFileSize = 0;
    let primaryFilePath = null;
    let primaryFileName = null;
    let primaryMimeType = null;

    // Process files
    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      const ts = Date.now();
      const rand = Math.random().toString(36).substring(2, 15);
      const ext = path.extname(file.name);
      const fileName = `${ts}-${rand}${ext}`;
      
      const uploadDir = path.join(process.cwd(), 'uploads', 'users', session.user.id, 'resources');
      await mkdir(uploadDir, { recursive: true });
      
      const filePath = path.join(uploadDir, fileName);
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      await writeFile(filePath, buffer);

      // Set primary file info (first file)
      if (i === 0) {
        primaryFilePath = filePath;
        primaryFileName = file.name;
        primaryMimeType = file.type;
      }

      totalFileSize += file.size;

      // Generate thumbnail for images and PDFs
      let thumbnailPath: string | null = null;
      if (file.type.startsWith('image/') || file.type === 'application/pdf') {
        try {
          thumbnailPath = await fileService.createThumbnail(
            filePath,
            fileName,
            'resources',
            session.user.id
          );
        } catch (thumbError) {
          console.error('Error creating thumbnail:', thumbError);
        }
      }

      const mediaFile = {
        id: `${ts}-${rand}`,
        kind: file.type.startsWith('image/') ? 'image' : 'file',
        url: `/uploads/users/${session.user.id}/resources/${fileName}`,
        thumbnailUrl: thumbnailPath ? thumbnailPath.replace(process.cwd(), '').replace(/\\/g, '/') : undefined,
        mimeType: file.type,
        name: file.name,
        size: file.size,
        filePath: filePath, // Store file path for downloads
      };

      allMediaFiles.push(mediaFile);
    }

    // Process links
    for (let i = 0; i < links.length; i++) {
      const url = links[i];
      const linkTitle = linkTitles[i] || 'Link';

      const linkFile = {
        id: `link-${Date.now()}-${i}`,
        kind: 'link',
        url: url,
        name: linkTitle,
        mimeType: 'text/html',
        size: 0,
      };

      allMediaFiles.push(linkFile);
    }

    // Create ONE resource with all files and links
    if (allMediaFiles.length > 0) {
      const resourceData = {
        title: title,
        description: description || null,
        type: links.length > 0 ? 'mixed' : 'file',
        communityId,
        createdBy: session.user.id,
        fileName: primaryFileName,
        fileSize: totalFileSize,
        mimeType: primaryMimeType,
        filePath: primaryFilePath,
        media: JSON.stringify(allMediaFiles),
      };

      const resource = await communityService.createResource(resourceData);
      createdResources.push(resource);
    }

    // If only one resource was created, return it directly for backward compatibility
    if (createdResources.length === 1) {
      return NextResponse.json({ resource: createdResources[0] }, { status: 201 });
    }

    return NextResponse.json({ resources: createdResources }, { status: 201 });
  } catch (error) {
    console.error('Error adding resources:', error);
    return NextResponse.json(
      { error: 'Failed to add resources' },
      { status: 500 }
    );
  }
}

// DELETE /api/communities/resources - Delete a resource
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const resourceId = searchParams.get('resourceId');
    
    if (!resourceId) {
      return NextResponse.json({ error: 'Resource ID is required' }, { status: 400 });
    }

    // Get the resource to check permissions
    const resource = await communityService.getResourceById(resourceId);
    if (!resource) {
      return NextResponse.json({ error: 'Resource not found' }, { status: 404 });
    }

    // Check if user is the creator of the resource
    const isCreator = resource.createdBy === session.user.id;
    
    if (!isCreator) {
      return NextResponse.json({ 
        error: 'You can only delete resources you created' 
      }, { status: 403 });
    }

    // Delete the resource (this will also delete associated files)
    await communityService.deleteResource(resourceId);

    return NextResponse.json({ message: 'Resource deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error deleting resource:', error);
    return NextResponse.json({ error: 'Failed to delete resource' }, { status: 500 });
  }
}

// GET /api/communities/resources - Get resources (with optional community filter)
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

    let resources;
    if (communityId) {
      resources = await communityService.getCommunityResources(communityId, limit, offset);
    } else {
      // Get resources from communities user is a member of
      resources = await communityService.getUserResources(session.user.id, limit, offset);
    }

    return NextResponse.json({ resources });
  } catch (error) {
    console.error('Error fetching resources:', error);
    return NextResponse.json(
      { error: 'Failed to fetch resources' },
      { status: 500 }
    );
  }
}
