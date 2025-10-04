import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { communityService } from '@/lib/database/community-service';
import { readFile } from 'fs/promises';
import path from 'path';

// GET /api/communities/resources/[id]/download - Download a resource
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    
    // Get the resource from database
    const resource = await communityService.getResourceById(id);
    if (!resource) {
      return NextResponse.json({ error: 'Resource not found' }, { status: 404 });
    }

    console.log('Download request for resource:', {
      id: resource.id,
      type: resource.type,
      filePath: resource.filePath,
      url: resource.url,
      fileName: resource.fileName
    });

    // Check if user has access to this resource (is member of the community)
    const isMember = await communityService.isCommunityMember(resource.communityId, session.user.id);
    if (!isMember) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Handle file downloads - check if there's a specific file requested
    const url = new URL(request.url);
    const fileId = url.searchParams.get('fileId');
    
    // If fileId is specified, download that specific file
    if (fileId && resource.media && Array.isArray(resource.media)) {
      const mediaItem = resource.media.find((item: any) => item.id === fileId);
      if (mediaItem) {
        if (mediaItem.kind === 'link') {
          // For links, redirect to the URL
          console.log('Incrementing download count for link resource:', id);
          await communityService.incrementResourceDownloadCount(id);
          console.log('Download count incremented successfully for link resource:', id);
          return NextResponse.redirect(mediaItem.url);
        } else if (mediaItem.filePath) {
          // For files with filePath, serve the file
          try {
            const fileBuffer = await readFile(mediaItem.filePath);
            console.log('Incrementing download count for media file resource:', id);
            await communityService.incrementResourceDownloadCount(id);
            console.log('Download count incremented successfully for media file resource:', id);
            
            const headers = new Headers();
            headers.set('Content-Type', mediaItem.mimeType || 'application/octet-stream');
            headers.set('Content-Disposition', `attachment; filename="${mediaItem.name || 'download'}"`);
            headers.set('Content-Length', fileBuffer.length.toString());
            
            return new NextResponse(fileBuffer, {
              status: 200,
              headers,
            });
          } catch (fileError) {
            console.error('Error reading file:', fileError);
            return NextResponse.json({ error: 'File not found' }, { status: 404 });
          }
        } else if (mediaItem.url && mediaItem.url.startsWith('/uploads/')) {
          // Fallback: construct file path from URL
          try {
            const filePath = path.join(process.cwd(), mediaItem.url);
            const fileBuffer = await readFile(filePath);
            console.log('Incrementing download count for fallback file resource:', id);
            await communityService.incrementResourceDownloadCount(id);
            console.log('Download count incremented successfully for fallback file resource:', id);
            
            const headers = new Headers();
            headers.set('Content-Type', mediaItem.mimeType || 'application/octet-stream');
            headers.set('Content-Disposition', `attachment; filename="${mediaItem.name || 'download'}"`);
            headers.set('Content-Length', fileBuffer.length.toString());
            
            return new NextResponse(fileBuffer, {
              status: 200,
              headers,
            });
          } catch (fileError) {
            console.error('Error reading file:', fileError);
            return NextResponse.json({ error: 'File not found' }, { status: 404 });
          }
        }
      }
    }
    
    // For backward compatibility: download the primary file
    let filePath = resource.filePath;
    
    // If filePath is not available, try to construct it from media URL
    if (!filePath && resource.media && Array.isArray(resource.media) && resource.media.length > 0) {
      const mediaItem = resource.media.find((item: any) => item.kind !== 'link');
      if (mediaItem && mediaItem.url && mediaItem.url.startsWith('/uploads/')) {
        // Convert URL path to file system path
        filePath = path.join(process.cwd(), mediaItem.url);
      }
    }
    
    if (filePath) {
      try {
        // Read the file from disk
        const fileBuffer = await readFile(filePath);
        
        // Update download count
        console.log('Incrementing download count for resource:', id);
        await communityService.incrementResourceDownloadCount(id);
        console.log('Download count incremented successfully for resource:', id);
        
        // Set appropriate headers for file download
        const headers = new Headers();
        headers.set('Content-Type', resource.mimeType || 'application/octet-stream');
        headers.set('Content-Disposition', `attachment; filename="${resource.fileName || 'download'}"`);
        headers.set('Content-Length', fileBuffer.length.toString());
        
        return new NextResponse(fileBuffer, {
          status: 200,
          headers,
        });
      } catch (fileError) {
        console.error('Error reading file:', fileError);
        return NextResponse.json({ error: 'File not found' }, { status: 404 });
      }
    }

    // For link resources, redirect to the URL
    if (resource.url) {
      // Update download count
      console.log('Incrementing download count for direct link resource:', id);
      await communityService.incrementResourceDownloadCount(id);
      console.log('Download count incremented successfully for direct link resource:', id);
      
      return NextResponse.redirect(resource.url);
    }

    return NextResponse.json({ error: 'Resource has no downloadable content' }, { status: 400 });
  } catch (error) {
    console.error('Error downloading resource:', error);
    return NextResponse.json(
      { error: 'Failed to download resource' },
      { status: 500 }
    );
  }
}
