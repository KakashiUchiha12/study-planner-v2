'use client';

// Simple PDF thumbnail generation
const THUMB_W = 300;
const THUMB_H = 200;

export async function generatePDFThumbnail(file: File): Promise<string> {
  try {
    console.log('Starting simple PDF thumbnail generation...');
    
    // Try to use PDF.js directly
    const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.js');
    console.log('PDF.js loaded via import');
    
    // Set worker
    pdfjsLib.GlobalWorkerOptions.workerSrc = '//cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';
    
    const arrayBuffer = await file.arrayBuffer();
    console.log('File converted to ArrayBuffer');
    
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    console.log('PDF document loaded');
    
    const page = await pdf.getPage(1);
    console.log('First page loaded');
    
    // Create viewport
    const viewport = page.getViewport({ scale: 1.0 });
    console.log('Viewport created');
    
    // Create canvas
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d')!;
    canvas.height = viewport.height;
    canvas.width = viewport.width;
    
    // Render page
    const renderContext = {
      canvasContext: context,
      viewport: viewport,
      canvas: canvas
    };
    
    await page.render(renderContext).promise;
    console.log('Page rendered');
    
    // Create thumbnail
    const thumbCanvas = document.createElement('canvas');
    thumbCanvas.width = THUMB_W;
    thumbCanvas.height = THUMB_H;
    const thumbCtx = thumbCanvas.getContext('2d')!;
    
    // Fill background
    thumbCtx.fillStyle = '#ffffff';
    thumbCtx.fillRect(0, 0, THUMB_W, THUMB_H);
    
    // Calculate dimensions
    const scale = Math.min(THUMB_W / canvas.width, THUMB_H / canvas.height);
    const width = canvas.width * scale;
    const height = canvas.height * scale;
    const x = (THUMB_W - width) / 2;
    const y = (THUMB_H - height) / 2;
    
    // Draw PDF page
    thumbCtx.drawImage(canvas, x, y, width, height);
    
    // Add border
    thumbCtx.strokeStyle = '#e9ecef';
    thumbCtx.lineWidth = 1;
    thumbCtx.strokeRect(0, 0, THUMB_W, THUMB_H);
    
    console.log('PDF thumbnail generated successfully');
    return thumbCanvas.toDataURL('image/jpeg', 0.9);
    
  } catch (error) {
    console.error('Simple PDF generation failed:', error);
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
