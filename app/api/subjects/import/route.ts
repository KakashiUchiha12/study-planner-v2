import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { dbService } from '@/lib/database';
import fs from 'fs/promises';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { sourceSubjectId } = body;

    if (!sourceSubjectId) {
      return NextResponse.json({ error: 'Source subject ID is required' }, { status: 400 });
    }

    // Check if user is trying to import their own subject
    const sourceSubject = await dbService.prisma.subject.findUnique({
      where: { id: sourceSubjectId },
      select: { userId: true }
    });

    if (!sourceSubject) {
      return NextResponse.json({ error: 'Source subject not found' }, { status: 404 });
    }

    if (sourceSubject.userId === session.user.id) {
      return NextResponse.json({ error: 'Cannot import your own subject' }, { status: 400 });
    }

    // Check if the source subject is public
    const sourceSubjectWithData = await dbService.prisma.subject.findUnique({
      where: { id: sourceSubjectId },
      include: {
        chapters: {
          include: {
            materials: true
          }
        },
        files: true // Subject files are related directly to Subject, not Material
      }
    });

    if (!sourceSubjectWithData) {
      return NextResponse.json({ error: 'Source subject not found' }, { status: 404 });
    }

    if (sourceSubjectWithData.visibility !== 'public') {
      return NextResponse.json({ error: 'Cannot import private subject' }, { status: 403 });
    }

    // Check for duplicate subject (same name, code, and instructor)
    const existingSubject = await dbService.prisma.subject.findFirst({
      where: {
        userId: session.user.id,
        name: sourceSubjectWithData.name,
        code: sourceSubjectWithData.code,
        instructor: sourceSubjectWithData.instructor,
      }
    });

    if (existingSubject) {
      return NextResponse.json({ 
        error: 'You already have a subject with the same name, code, and instructor' 
      }, { status: 400 });
    }

    // Helper function to copy files
    const copySubjectFile = async (sourcePath: string, targetPath: string): Promise<boolean> => {
      try {
        console.log('🔍 Copying file from:', sourcePath, 'to:', targetPath);
        
        // Ensure target directory exists
        const targetDir = path.dirname(targetPath);
        await fs.mkdir(targetDir, { recursive: true });
        
        // Check if source file exists
        if (!fs.existsSync(sourcePath)) {
          console.log('❌ Source file does not exist:', sourcePath);
          return false;
        }
        
        // Copy the file
        await fs.copyFile(sourcePath, targetPath);
        console.log('✅ File copied successfully');
        return true;
      } catch (error) {
        console.error('❌ Error copying file:', error);
        return false;
      }
    };

    // Helper function to copy thumbnail files
    const copyThumbnailFile = async (sourcePath: string, targetPath: string): Promise<boolean> => {
      try {
        console.log('🔍 Copying thumbnail from:', sourcePath, 'to:', targetPath);
        
        if (!fs.existsSync(sourcePath)) {
          console.log('❌ Source thumbnail does not exist:', sourcePath);
          return false;
        }
        
        // Ensure target directory exists
        const targetDir = path.dirname(targetPath);
        await fs.mkdir(targetDir, { recursive: true });
        
        // Copy the thumbnail
        await fs.copyFile(sourcePath, targetPath);
        console.log('✅ Thumbnail copied successfully');
        return true;
      } catch (error) {
        console.error('❌ Error copying thumbnail:', error);
        return false;
      }
    };

    // Use transaction to ensure atomicity
    const result = await dbService.prisma.$transaction(async (prisma) => {
      // Create the new subject
      const newSubject = await prisma.subject.create({
        data: {
          userId: session.user.id,
          name: sourceSubjectWithData.name,
          description: sourceSubjectWithData.description,
          code: sourceSubjectWithData.code,
          instructor: sourceSubjectWithData.instructor,
          credits: sourceSubjectWithData.credits,
          color: sourceSubjectWithData.color,
          totalChapters: sourceSubjectWithData.totalChapters,
          completedChapters: 0, // Reset progress
          progress: 0, // Reset progress
          nextExam: null, // Reset exam date
          assignmentsDue: 0, // Reset assignments
          order: 0, // Will be set by frontend
          visibility: 'public', // All subjects are public
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });

      // Copy chapters and materials
      for (const sourceChapter of sourceSubjectWithData.chapters) {
        const newChapter = await prisma.chapter.create({
          data: {
            subjectId: newSubject.id,
            title: sourceChapter.title,
            description: sourceChapter.description,
            order: sourceChapter.order,
            isCompleted: false, // Reset progress
            createdAt: new Date(),
            updatedAt: new Date()
          }
        });

        // Copy materials for this chapter
        for (const sourceMaterial of sourceChapter.materials) {
          await prisma.material.create({
            data: {
              subjectId: newSubject.id,
              chapterId: newChapter.id,
              title: sourceMaterial.title,
              type: sourceMaterial.type,
              content: sourceMaterial.content,
              fileUrl: sourceMaterial.fileUrl,
              fileSize: sourceMaterial.fileSize,
              duration: sourceMaterial.duration,
              order: sourceMaterial.order,
              isCompleted: false, // Reset progress
              visibility: sourceMaterial.visibility,
              createdAt: new Date(),
              updatedAt: new Date()
            }
          });
        }
      }

      // Copy subject files (files are related directly to Subject, not Material)
      for (const sourceFile of sourceSubjectWithData.files) {
        const fileExtension = path.extname(sourceFile.fileName);
        const newFileName = `${Date.now()}_${Math.random().toString(36).substring(7)}${fileExtension}`;
        const newFilePath = path.join('uploads', 'subjects', session.user.id, newSubject.id, newFileName);
        
        // Construct source file path
        let sourceFilePath = sourceFile.filePath;
        if (sourceFilePath.startsWith('/uploads/')) {
          sourceFilePath = path.join(process.cwd(), 'public', sourceFilePath);
        } else if (!path.isAbsolute(sourceFilePath)) {
          sourceFilePath = path.join(process.cwd(), 'public', sourceFilePath);
        }

        // Try to copy the file
        const fileCopied = await copySubjectFile(sourceFilePath, path.join(process.cwd(), 'public', newFilePath));
        
        // Create file record (even if copy failed, for data integrity)
        await prisma.subjectFile.create({
          data: {
            userId: session.user.id,
            subjectId: newSubject.id,
            fileName: newFileName,
            originalName: sourceFile.originalName,
            fileType: sourceFile.fileType,
            mimeType: sourceFile.mimeType,
            fileSize: sourceFile.fileSize,
            filePath: newFilePath,
            category: sourceFile.category,
            tags: sourceFile.tags,
            description: sourceFile.description,
            isPublic: sourceFile.isPublic,
            downloadCount: 0, // Reset download count
            createdAt: new Date(),
            updatedAt: new Date()
          }
        });

        // Copy thumbnail if it exists
        if (sourceFile.thumbnailPath) {
          const thumbnailExtension = path.extname(sourceFile.thumbnailPath);
          const newThumbnailName = `${Date.now()}_${Math.random().toString(36).substring(7)}_thumb${thumbnailExtension}`;
          const newThumbnailPath = path.join('uploads', 'subjects', session.user.id, newSubject.id, newThumbnailName);
          
          let sourceThumbnailPath = sourceFile.thumbnailPath;
          if (sourceThumbnailPath.startsWith('/uploads/')) {
            sourceThumbnailPath = path.join(process.cwd(), 'public', sourceThumbnailPath);
          } else if (!path.isAbsolute(sourceThumbnailPath)) {
            sourceThumbnailPath = path.join(process.cwd(), 'public', sourceThumbnailPath);
          }

          try {
            await copyThumbnailFile(sourceThumbnailPath, path.join(process.cwd(), 'public', newThumbnailPath));
            
            // Update file record with thumbnail path
            await prisma.subjectFile.updateMany({
              where: { 
                subjectId: newSubject.id,
                fileName: newFileName
              },
              data: { thumbnailPath: newThumbnailPath }
            });
          } catch (error) {
            console.error('Failed to copy thumbnail:', error);
            // Continue without thumbnail
          }
        }
      }

      return newSubject;
    });

    return NextResponse.json({
      success: true,
      subject: result,
      message: `Successfully imported "${sourceSubjectWithData.name}" to your subjects`
    });

  } catch (error) {
    console.error('Error importing subject:', error);
    return NextResponse.json(
      { error: 'Failed to import subject' },
      { status: 500 }
    );
  }
}
