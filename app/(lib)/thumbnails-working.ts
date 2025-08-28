'use client';

// Working thumbnail generation system
const THUMB_W = 300;
const THUMB_H = 200;

export async function generateThumbnail(file: File): Promise<string> {
  console.log('=== THUMBNAIL GENERATION START ===');
  console.log('File:', file.name);
  console.log('Type:', file.type);
  console.log('Size:', file.size, 'bytes');
  
  try {
    const type = file.type.toLowerCase();
    console.log('Normalized type:', type);
    
    if (type.startsWith('image/')) {
      console.log('✅ Processing as IMAGE');
      return await generateImageThumbnail(file);
    }
    
    if (type === 'application/pdf') {
      console.log('✅ Processing as PDF');
      return await generatePDFThumbnail(file);
    }
    
    if (type.startsWith('video/')) {
      console.log('✅ Processing as VIDEO');
      return await generateVideoThumbnail(file);
    }
    
    if (type.startsWith('text/')) {
      console.log('✅ Processing as TEXT');
      return await generateTextThumbnail(file);
    }
    
    // Try to read as text for other file types
    try {
      console.log('🔄 Trying to read as text file (fallback)');
      return await generateTextThumbnail(file);
    } catch (textError) {
      console.log('❌ Text reading failed, using generic thumbnail');
      console.error('Text error:', textError);
      return generateGenericThumbnail(file);
    }
    
  } catch (error) {
    console.error('❌ Thumbnail generation failed:', error);
    return generateGenericThumbnail(file);
  }
}

async function generateImageThumbnail(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = THUMB_W;
      canvas.height = THUMB_H;
      const ctx = canvas.getContext('2d')!;
      
      // Fill background
      ctx.fillStyle = '#f8f9fa';
      ctx.fillRect(0, 0, THUMB_W, THUMB_H);
      
      // Calculate dimensions to maintain aspect ratio
      const scale = Math.min(THUMB_W / img.width, THUMB_H / img.height);
      const width = img.width * scale;
      const height = img.height * scale;
      const x = (THUMB_W - width) / 2;
      const y = (THUMB_H - height) / 2;
      
      // Draw the actual image
      ctx.drawImage(img, x, y, width, height);
      
      // Add border
      ctx.strokeStyle = '#e9ecef';
      ctx.lineWidth = 1;
      ctx.strokeRect(0, 0, THUMB_W, THUMB_H);
      
      resolve(canvas.toDataURL('image/jpeg', 0.9));
    };
    
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
}

async function generatePDFThumbnail(file: File): Promise<string> {
  try {
    console.log('Starting PDF thumbnail generation...');
    
    // Check if PDF.js is available globally (from CDN or script tag)
    let pdfjsLib: any;
    
    if (typeof window !== 'undefined' && (window as any).pdfjsLib) {
      pdfjsLib = (window as any).pdfjsLib;
      console.log('Using global PDF.js');
    } else {
      // Try to import dynamically
      // pdfjsLib = await import('pdfjs-dist/build/pdf');
      console.log('PDF.js imported dynamically');
    }
    
    // Set worker
    if (pdfjsLib.GlobalWorkerOptions) {
      pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';
      console.log('PDF worker set to:', pdfjsLib.GlobalWorkerOptions.workerSrc);
    }
    
    const arrayBuffer = await file.arrayBuffer();
    console.log('File converted to ArrayBuffer, size:', arrayBuffer.byteLength);
    
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    console.log('PDF document loaded, pages:', pdf.numPages);
    
    const page = await pdf.getPage(1);
    console.log('First page loaded');
    
    // Create viewport for the first page with a reasonable scale
    const viewport = page.getViewport({ scale: 1.5 });
    console.log('Viewport created:', viewport.width, 'x', viewport.height);
    
    // Create canvas for the page
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d')!;
    canvas.height = viewport.height;
    canvas.width = viewport.width;
    console.log('Canvas created:', canvas.width, 'x', canvas.height);
    
    // Render the page
    const renderContext = {
      canvasContext: context,
      viewport: viewport
    };
    
    console.log('Starting page render...');
    await page.render(renderContext).promise;
    console.log('Page rendered successfully');
    
    // Now create the thumbnail from this rendered page
    const thumbCanvas = document.createElement('canvas');
    thumbCanvas.width = THUMB_W;
    thumbCanvas.height = THUMB_H;
    const thumbCtx = thumbCanvas.getContext('2d')!;
    
    // Fill background
    thumbCtx.fillStyle = '#ffffff';
    thumbCtx.fillRect(0, 0, THUMB_W, THUMB_H);
    
    // Calculate dimensions to fit the PDF page
    const scale = Math.min(THUMB_W / canvas.width, THUMB_H / canvas.height);
    const width = canvas.width * scale;
    const height = canvas.height * scale;
    const x = (THUMB_W - width) / 2;
    const y = (THUMB_H - height) / 2;
    
    console.log('Drawing PDF page to thumbnail:', width, 'x', height, 'at', x, y);
    
    // Draw the actual PDF page
    thumbCtx.drawImage(canvas, x, y, width, height);
    
    // Add border
    thumbCtx.strokeStyle = '#e9ecef';
    thumbCtx.lineWidth = 1;
    thumbCtx.strokeRect(0, 0, THUMB_W, THUMB_H);
    
    console.log('PDF thumbnail generated successfully');
    return thumbCanvas.toDataURL('image/jpeg', 0.9);
    
  } catch (error) {
    console.error('PDF.js failed with error:', error);
    
    // Don't fall back to text reading for PDFs - that gives raw PDF content
    // Instead, create a proper PDF icon thumbnail
    console.log('Creating PDF icon thumbnail as fallback');
    return createPDFIconThumbnail();
  }
}

function createPDFIconThumbnail(): string {
  const canvas = document.createElement('canvas');
  canvas.width = THUMB_W;
  canvas.height = THUMB_H;
  const ctx = canvas.getContext('2d')!;
  
  // Fill background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, THUMB_W, THUMB_H);
  
  // Draw PDF icon
  ctx.fillStyle = '#dc3545';
  ctx.fillRect(20, 20, 30, 40);
  
  // Draw text
  ctx.fillStyle = '#495057';
  ctx.font = 'bold 16px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('PDF', THUMB_W / 2, 90);
  
  ctx.font = '12px Arial';
  ctx.fillText('Document', THUMB_W / 2, 110);
  
  // Add border
  ctx.strokeStyle = '#e9ecef';
  ctx.lineWidth = 1;
  ctx.strokeRect(0, 0, THUMB_W, THUMB_H);
  
  return canvas.toDataURL('image/jpeg', 0.8);
}

async function generateVideoThumbnail(file: File): Promise<string> {
  console.log('Starting video thumbnail generation for:', file.name);
  
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.muted = true;
    video.playsInline = true;
    
    video.onloadeddata = () => {
      try {
        console.log('Video loaded, dimensions:', video.videoWidth, 'x', video.videoHeight);
        
        const canvas = document.createElement('canvas');
        canvas.width = THUMB_W;
        canvas.height = THUMB_H;
        const ctx = canvas.getContext('2d')!;
        
        // Fill background
        ctx.fillStyle = '#f8f9fa';
        ctx.fillRect(0, 0, THUMB_W, THUMB_H);
        
        // Calculate dimensions
        const scale = Math.min(THUMB_W / video.videoWidth, THUMB_H / video.videoHeight);
        const width = video.videoWidth * scale;
        const height = video.videoHeight * scale;
        const x = (THUMB_W - width) / 2;
        const y = (THUMB_H - height) / 2;
        
        console.log('Video thumbnail dimensions:', width, 'x', height, 'at', x, y);
        
        // Draw the actual video frame
        ctx.drawImage(video, x, y, width, height);
        
        // Add play button overlay
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.beginPath();
        ctx.arc(THUMB_W / 2, THUMB_H / 2, 25, 0, 2 * Math.PI);
        ctx.fill();
        
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.moveTo(THUMB_W / 2 + 8, THUMB_H / 2 - 12);
        ctx.lineTo(THUMB_W / 2 + 8, THUMB_H / 2 + 12);
        ctx.lineTo(THUMB_W / 2 + 20, THUMB_H / 2);
        ctx.closePath();
        ctx.fill();
        
        // Add border
        ctx.strokeStyle = '#e9ecef';
        ctx.lineWidth = 1;
        ctx.strokeRect(0, 0, THUMB_W, THUMB_H);
        
        console.log('Video thumbnail generated successfully');
        resolve(canvas.toDataURL('image/jpeg', 0.9));
      } catch (error) {
        console.error('Error in video thumbnail generation:', error);
        reject(error);
      }
    };
    
    video.onerror = (e) => {
      console.error('Video load error:', e);
      reject(new Error('Failed to load video'));
    };
    
    console.log('Setting video source...');
    video.src = URL.createObjectURL(file);
  });
}

async function generateTextThumbnail(file: File): Promise<string> {
  try {
    console.log('Starting text thumbnail generation for:', file.name);
    
    // Actually read the file content
    const text = await file.text();
    console.log('File text read, length:', text.length);
    
    const preview = text.slice(0, 200).replace(/\s+/g, ' ');
    console.log('Text preview:', preview.substring(0, 50) + '...');
    
    const canvas = document.createElement('canvas');
    canvas.width = THUMB_W;
    canvas.height = THUMB_H;
    const ctx = canvas.getContext('2d')!;
    
    // Fill background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, THUMB_W, THUMB_H);
    
    // Draw filename
    ctx.fillStyle = '#495057';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(file.name, 10, 25);
    
    // Draw the actual content preview
    ctx.font = '12px Arial';
    ctx.fillStyle = '#6c757d';
    
    const lines = wrapText(ctx, preview, 10, 45, THUMB_W - 20, 16);
    console.log('Text wrapped into', lines.length, 'lines');
    
    lines.forEach((line, index) => {
      if (index < 6) { // Show more lines
        ctx.fillText(line, 10, 45 + (index * 16));
      }
    });
    
    // Add border
    ctx.strokeStyle = '#e9ecef';
    ctx.lineWidth = 1;
    ctx.strokeRect(0, 0, THUMB_W, THUMB_H);
    
    console.log('Text thumbnail generated successfully');
    return canvas.toDataURL('image/jpeg', 0.9);
  } catch (error) {
    console.error('Text reading failed:', error);
    return generateGenericThumbnail(file);
  }
}

function generateGenericThumbnail(file: File): string {
  const canvas = document.createElement('canvas');
  canvas.width = THUMB_W;
  canvas.height = THUMB_H;
  const ctx = canvas.getContext('2d')!;
  
  // Fill background
  ctx.fillStyle = '#f8f9fa';
  ctx.fillRect(0, 0, THUMB_W, THUMB_H);
  
  // Draw file icon
  ctx.fillStyle = '#6c757d';
  ctx.fillRect(25, 20, 40, 50);
  
  // Draw text
  ctx.fillStyle = '#495057';
  ctx.font = 'bold 14px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('FILE', THUMB_W / 2, 90);
  
  ctx.font = '10px Arial';
  ctx.fillText(file.name.slice(-15), THUMB_W / 2, 110);
  
  // Add border
  ctx.strokeStyle = '#e9ecef';
  ctx.lineWidth = 1;
  ctx.strokeRect(0, 0, THUMB_W, THUMB_H);
  
  return canvas.toDataURL('image/jpeg', 0.8);
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';
  
  for (const word of words) {
    const testLine = currentLine + word + ' ';
    const metrics = ctx.measureText(testLine);
    
    if (metrics.width > maxWidth && currentLine !== '') {
      lines.push(currentLine.trim());
      currentLine = word + ' ';
    } else {
      currentLine = testLine;
    }
  }
  
  if (currentLine.trim()) {
    lines.push(currentLine.trim());
  }
  
  return lines;
}
