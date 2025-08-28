'use client';

// Simple thumbnail generation system
const THUMB_W = 200;
const THUMB_H = 150;

export async function generateThumbnail(file: File): Promise<string> {
  console.log('Generating thumbnail for:', file.name, 'Type:', file.type, 'Size:', file.size);
  
  try {
    const type = file.type.toLowerCase();
    
    if (type.startsWith('image/')) {
      console.log('Processing as image');
      return await generateImageThumbnail(file);
    }
    
    if (type === 'application/pdf') {
      console.log('Processing as PDF');
      return generatePDFThumbnail();
    }
    
    if (type.startsWith('video/')) {
      console.log('Processing as video');
      return await generateVideoThumbnail(file);
    }
    
    if (type.startsWith('text/')) {
      console.log('Processing as text');
      return generateTextThumbnail(file);
    }
    
    console.log('Using generic thumbnail');
    // Default fallback for other file types
    return generateGenericThumbnail(file);
    
  } catch (error) {
    console.error('Thumbnail generation failed:', error);
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
      
      // Draw image
      ctx.drawImage(img, x, y, width, height);
      
      // Add border
      ctx.strokeStyle = '#e9ecef';
      ctx.lineWidth = 1;
      ctx.strokeRect(0, 0, THUMB_W, THUMB_H);
      
      resolve(canvas.toDataURL('image/jpeg', 0.8));
    };
    
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
}

function generatePDFThumbnail(): string {
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
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.muted = true;
    video.playsInline = true;
    
    video.onloadeddata = () => {
      try {
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
        
        // Draw video frame
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
        
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      } catch (error) {
        reject(error);
      }
    };
    
    video.onerror = () => reject(new Error('Failed to load video'));
    video.src = URL.createObjectURL(file);
  });
}

async function generateTextThumbnail(file: File): Promise<string> {
  try {
    const text = await file.text();
    const preview = text.slice(0, 100).replace(/\s+/g, ' ');
    
    const canvas = document.createElement('canvas');
    canvas.width = THUMB_W;
    canvas.height = THUMB_H;
    const ctx = canvas.getContext('2d')!;
    
    // Fill background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, THUMB_W, THUMB_H);
    
    // Draw filename
    ctx.fillStyle = '#495057';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(file.name, 10, 25);
    
    // Draw content preview
    ctx.font = '12px Arial';
    ctx.fillStyle = '#6c757d';
    
    const lines = wrapText(ctx, preview, 10, 45, THUMB_W - 20, 15);
    lines.forEach((line, index) => {
      if (index < 4) { // Max 4 lines
        ctx.fillText(line, 10, 45 + (index * 15));
      }
    });
    
    // Add border
    ctx.strokeStyle = '#e9ecef';
    ctx.lineWidth = 1;
    ctx.strokeRect(0, 0, THUMB_W, THUMB_H);
    
    return canvas.toDataURL('image/jpeg', 0.8);
  } catch (error) {
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
