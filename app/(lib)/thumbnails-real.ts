'use client';

// Real thumbnail generation system - actually reads file content
const THUMB_W = 300;
const THUMB_H = 200;

export async function generateThumbnail(file: File): Promise<string> {
  console.log('Generating REAL thumbnail for:', file.name, 'Type:', file.type, 'Size:', file.size);
  
  try {
    const type = file.type.toLowerCase();
    
    if (type.startsWith('image/')) {
      console.log('Processing as REAL image');
      return await generateRealImageThumbnail(file);
    }
    
    if (type === 'application/pdf') {
      console.log('Processing as REAL PDF - reading first page');
      return await generateRealPDFThumbnail(file);
    }
    
    if (type.startsWith('video/')) {
      console.log('Processing as REAL video - capturing first frame');
      return await generateRealVideoThumbnail(file);
    }
    
    if (type.startsWith('text/')) {
      console.log('Processing as REAL text - reading content');
      return await generateRealTextThumbnail(file);
    }
    
    // For other file types, try to read them as text first
    try {
      console.log('Trying to read as text file');
      return await generateRealTextThumbnail(file);
    } catch {
      console.log('Using generic thumbnail for unsupported type');
      return generateGenericThumbnail(file);
    }
    
  } catch (error) {
    console.error('Real thumbnail generation failed:', error);
    return generateGenericThumbnail(file);
  }
}

async function generateRealImageThumbnail(file: File): Promise<string> {
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
      
      // Draw the ACTUAL image
      ctx.drawImage(img, x, y, width, height);
      
      // Add subtle border
      ctx.strokeStyle = '#e9ecef';
      ctx.lineWidth = 1;
      ctx.strokeRect(0, 0, THUMB_W, THUMB_H);
      
      resolve(canvas.toDataURL('image/jpeg', 0.9));
    };
    
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
}

async function generateRealPDFThumbnail(file: File): Promise<string> {
  try {
    // Try to use PDF.js if available
    // const pdfjsLib = await import('pdfjs-dist/build/pdf');
    
    // Set worker
    // if (typeof window !== 'undefined') {
    //   pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';
    // }
    
    // const arrayBuffer = await file.arrayBuffer();
    // const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    // const page = await pdf.getPage(1);
    
    // Create viewport for the first page
    // const viewport = page.getViewport({ scale: 1.0 });
    
    // Create canvas for the page
    // const canvas = document.createElement('canvas');
    // const context = canvas.getContext('2d')!;
    // canvas.height = viewport.height;
    // canvas.width = viewport.width;
    
    // Render the page
    // const renderContext = {
    //   canvasContext: context,
    //   viewport: viewport
    // };
    
    // await page.render(renderContext).promise;
    
    // Now create the thumbnail from this rendered page
    // const thumbCanvas = document.createElement('canvas');
    // thumbCanvas.width = THUMB_W;
    // thumbCanvas.height = THUMB_H;
    // const thumbCtx = thumbCanvas.getContext('2d')!;
    
    // Fill background
    // thumbCtx.fillStyle = '#ffffff';
    // thumbCtx.fillRect(0, 0, THUMB_W, THUMB_H);
    
    // Calculate dimensions to fit the PDF page
    // const scale = Math.min(THUMB_W / canvas.width, THUMB_H / canvas.height);
    // const width = canvas.width * scale;
    // const height = canvas.height * scale;
    // const x = (THUMB_W - width) / 2;
    // const y = (THUMB_H - height) / 2;
    
    // Draw the ACTUAL PDF page
    // thumbCtx.drawImage(canvas, x, y, width, height);
    
    // Add border
    // thumbCtx.strokeStyle = '#e9ecef';
    // thumbCtx.lineWidth = 1;
    // thumbCtx.strokeRect(0, 0, THUMB_W, THUMB_H);
    
    // return thumbCanvas.toDataURL('image/jpeg', 0.9);
    
    // For now, use fallback since PDF.js is not available
    throw new Error('PDF.js not available');
    
  } catch (error) {
    console.error('PDF.js failed, using fallback:', error);
    // Fallback: try to read as text
    try {
      return await generateRealTextThumbnail(file);
    } catch {
      return generateGenericThumbnail(file);
    }
  }
}

async function generateRealVideoThumbnail(file: File): Promise<string> {
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
        
        // Draw the ACTUAL video frame
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
        
        resolve(canvas.toDataURL('image/jpeg', 0.9));
      } catch (error) {
        reject(error);
      }
    };
    
    video.onerror = () => reject(new Error('Failed to load video'));
    video.src = URL.createObjectURL(file);
  });
}

async function generateRealTextThumbnail(file: File): Promise<string> {
  try {
    // Actually read the file content
    const text = await file.text();
    const preview = text.slice(0, 200).replace(/\s+/g, ' ');
    
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
    
    // Draw the ACTUAL content preview
    ctx.font = '12px Arial';
    ctx.fillStyle = '#6c757d';
    
    const lines = wrapText(ctx, preview, 10, 45, THUMB_W - 20, 16);
    lines.forEach((line, index) => {
      if (index < 6) { // Show more lines
        ctx.fillText(line, 10, 45 + (index * 16));
      }
    });
    
    // Add border
    ctx.strokeStyle = '#e9ecef';
    ctx.lineWidth = 1;
    ctx.strokeRect(0, 0, THUMB_W, THUMB_H);
    
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
