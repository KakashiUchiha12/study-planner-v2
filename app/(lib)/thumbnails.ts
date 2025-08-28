// app/(lib)/thumbnails.ts
'use client';

// import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.js';
import 'pdfjs-dist/legacy/build/pdf.worker.entry';

// target size for grid tiles
const THUMB_W = 480;
const THUMB_H = 360;

function drawToThumbCanvas(srcW: number, srcH: number, draw: (ctx: CanvasRenderingContext2D, w:number, h:number) => void): string {
  console.log('Creating thumbnail canvas:', srcW, 'x', srcH, '→', THUMB_W, 'x', THUMB_H);
  
  const canvas = document.createElement('canvas');
  canvas.width = THUMB_W;
  canvas.height = THUMB_H;
  const ctx = canvas.getContext('2d')!;
  
  // bg
  ctx.fillStyle = '#f5f5f7';
  ctx.fillRect(0, 0, THUMB_W, THUMB_H);

  // fit cover
  const srcRatio = srcW / srcH;
  const dstRatio = THUMB_W / THUMB_H;
  let w = THUMB_W, h = THUMB_H, dx = 0, dy = 0;
  if (srcRatio > dstRatio) {
    // wider than target → fit height
    h = THUMB_H;
    w = Math.round(h * srcRatio);
    dx = Math.round((THUMB_W - w) / 2);
  } else {
    // taller → fit width
    w = THUMB_W;
    h = Math.round(w / srcRatio);
    dy = Math.round((THUMB_H - h) / 2);
  }

  ctx.save();
  ctx.translate(dx, dy);
  draw(ctx, w, h);
  ctx.restore();

  // subtle border
  ctx.strokeStyle = '#e5e7eb';
  ctx.strokeRect(0.5, 0.5, THUMB_W - 1, THUMB_H - 1);

  const result = canvas.toDataURL('image/webp', 0.9);
  console.log('Thumbnail generated successfully, size:', result.length);
  return result;
}

export async function thumbFromImage(file: File): Promise<string> {
  try {
    console.log('Starting image thumbnail generation...');
    const bmp = await createImageBitmap(file);
    console.log('Image bitmap created:', bmp.width, 'x', bmp.height);
    
    const result = drawToThumbCanvas(bmp.width, bmp.height, (ctx, w, h) => {
      ctx.drawImage(bmp, 0, 0, w, h);
    });
    
    console.log('Image thumbnail generated successfully');
    return result;
  } catch (error) {
    console.error('Image thumbnail generation failed:', error);
    // Fallback to generic image icon
    return createImageIconThumbnail();
  }
}

export async function thumbFromPdf(file: File): Promise<string> {
  try {
    console.log('Starting PDF thumbnail generation...');
    
    // Dynamically import PDF.js
    const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.js');
    console.log('PDF.js loaded successfully');
    
    // Set worker source
    pdfjsLib.GlobalWorkerOptions.workerSrc = '//cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';
    
    const buf = await file.arrayBuffer();
    console.log('File converted to ArrayBuffer, size:', buf.byteLength);
    
    const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
    console.log('PDF document loaded, pages:', pdf.numPages);
    
    const page = await pdf.getPage(1);
    console.log('First page loaded');
    
    // Create viewport for thumbnail size
    const viewport = page.getViewport({ scale: 0.5 });
    console.log('Viewport created:', viewport.width, 'x', viewport.height);
    
    // Create canvas for rendering
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d')!;
    
    // Set canvas dimensions
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    
    console.log('Canvas created:', canvas.width, 'x', canvas.height);
    
    // Render the page to canvas
    const renderContext = {
      canvasContext: context,
      viewport: viewport
    };
    
    await page.render(renderContext).promise;
    console.log('Page rendered to canvas');
    
    // Generate thumbnail using the existing function
    return drawToThumbCanvas(canvas.width, canvas.height, (ctx, w, h) => {
      ctx.drawImage(canvas, 0, 0, w, h);
    });
    
  } catch (error) {
    console.error('PDF thumbnail generation failed:', error);
    // Fallback to generic PDF thumbnail
    return createPDFIconThumbnail();
  }
}

export async function thumbFromVideo(file: File): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    console.log('Starting video thumbnail generation...');
    
    const video = document.createElement('video');
    video.src = url;
    video.muted = true;
    video.playsInline = true;
    video.preload = 'metadata';

    // Wait for video to load metadata
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Video load timeout')), 10000);
      
      video.addEventListener('loadedmetadata', () => {
        clearTimeout(timeout);
        console.log('Video metadata loaded:', video.videoWidth, 'x', video.videoHeight);
        resolve();
      }, { once: true });
      
      video.addEventListener('error', (e) => {
        clearTimeout(timeout);
        console.error('Video load error:', e);
        reject(new Error('Video load error'));
      }, { once: true });
    });

    // Seek to a specific time (0.1 seconds to avoid black frames)
    video.currentTime = 0.1;
    
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Video seek timeout')), 5000);
      
      const handler = () => {
        clearTimeout(timeout);
        console.log('Video seeked to:', video.currentTime);
        resolve();
      };
      
      video.addEventListener('seeked', handler, { once: true });
      video.addEventListener('error', (e) => {
        clearTimeout(timeout);
        console.error('Video seek error:', e);
        reject(new Error('Video seek error'));
      }, { once: true });
    });

    console.log('Generating video thumbnail...');
    return drawToThumbCanvas(video.videoWidth, video.videoHeight, (ctx, w, h) => {
      ctx.drawImage(video, 0, 0, w, h);
    });
    
  } catch (error) {
    console.error('Video thumbnail generation failed:', error);
    // Fallback to generic video thumbnail
    return createVideoIconThumbnail();
  } finally {
    URL.revokeObjectURL(url);
  }
}

export async function thumbFromText(file: File): Promise<string> {
  const text = await file.text();
  const first = text.replace(/\s+/g, ' ').slice(0, 100);

  const canvas = document.createElement('canvas');
  canvas.width = THUMB_W;
  canvas.height = THUMB_H;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, THUMB_W, THUMB_H);
  ctx.fillStyle = '#111827';
  ctx.font = '600 18px system-ui, -apple-system, Segoe UI, Roboto, sans-serif';
  ctx.fillText(file.name, 16, 40);
  ctx.font = '14px system-ui, -apple-system, Segoe UI, Roboto, sans-serif';
  wrapText(ctx, first || '(empty)', 16, 70, THUMB_W - 32, 18);
  ctx.strokeStyle = '#e5e7eb';
  ctx.strokeRect(0.5, 0.5, THUMB_W - 1, THUMB_H - 1);
  return canvas.toDataURL('image/webp', 0.9);
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number) {
  const words = text.split(' ');
  let line = '';
  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + ' ';
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && n > 0) {
      ctx.fillText(line, x, y);
      line = words[n] + ' ';
      y += lineHeight;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line, x, y);
}

export async function generateThumbnail(file: File): Promise<string> {
  const type = (file.type || '').toLowerCase();
  console.log('Generating thumbnail for file:', file.name, 'Type:', type, 'Size:', file.size);
  
  if (type.startsWith('image/')) {
    console.log('Processing as image file');
    return thumbFromImage(file);
  }
  if (type === 'application/pdf') {
    console.log('Processing as PDF file');
    return thumbFromPdf(file);
  }
  if (type.startsWith('video/')) {
    console.log('Processing as video file');
    return thumbFromVideo(file);
  }
  if (type.startsWith('text/')) {
    console.log('Processing as text file');
    return thumbFromText(file);
  }

  // common office mimes → fallback icon (put your own SVG/PNG in /public)
  const office = [
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel'
  ];
  if (office.includes(type)) return '/thumbs/office-generic.png';

  return '/thumbs/file-generic.png';
}

// Helper function to create PDF icon thumbnail
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

// Helper function to create video icon thumbnail
function createVideoIconThumbnail(): string {
  const canvas = document.createElement('canvas');
  canvas.width = THUMB_W;
  canvas.height = THUMB_H;
  const ctx = canvas.getContext('2d')!;
  
  // Fill background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, THUMB_W, THUMB_H);
  
  // Draw video icon (play button)
  ctx.fillStyle = '#dc3545';
  ctx.beginPath();
  ctx.moveTo(THUMB_W / 2 - 15, THUMB_H / 2 - 20);
  ctx.lineTo(THUMB_W / 2 - 15, THUMB_H / 2 + 20);
  ctx.lineTo(THUMB_W / 2 + 15, THUMB_H / 2);
  ctx.closePath();
  ctx.fill();
  
  // Draw text
  ctx.fillStyle = '#495057';
  ctx.font = 'bold 16px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('Video', THUMB_W / 2, THUMB_H - 30);
  
  // Add border
  ctx.strokeStyle = '#e9ecef';
  ctx.lineWidth = 1;
  ctx.strokeRect(0, 0, THUMB_W, THUMB_H);
  
  return canvas.toDataURL('image/jpeg', 0.8);
}

// Helper function to create image icon thumbnail
function createImageIconThumbnail(): string {
  const canvas = document.createElement('canvas');
  canvas.width = THUMB_W;
  canvas.height = THUMB_H;
  const ctx = canvas.getContext('2d')!;
  
  // Fill background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, THUMB_W, THUMB_H);
  
  // Draw image icon (camera)
  ctx.fillStyle = '#3b82f6';
  ctx.beginPath();
  ctx.arc(THUMB_W / 2, THUMB_H / 2 - 10, 25, 0, 2 * Math.PI);
  ctx.fill();
  
  // Draw camera body
  ctx.fillStyle = '#1e40af';
  ctx.fillRect(THUMB_W / 2 - 20, THUMB_H / 2 + 15, 40, 25);
  
  // Draw text
  ctx.fillStyle = '#495057';
  ctx.font = 'bold 16px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('Image', THUMB_W / 2, THUMB_H - 30);
  
  // Add border
  ctx.strokeStyle = '#e9ecef';
  ctx.lineWidth = 1;
  ctx.strokeRect(0, 0, THUMB_W, THUMB_H);
  
  return canvas.toDataURL('image/jpeg', 0.8);
}
