'use client';

import { useEffect, useState } from 'react';

interface PDFThumbnailProps {
  documentId: string;
  fileUrl: string;
  className?: string;
  onThumbnailGenerated?: (thumbnailUrl: string) => void;
}

export function PDFThumbnail({ documentId, fileUrl, className = "", onThumbnailGenerated }: PDFThumbnailProps) {
  const [thumbnailUrl, setThumbnailUrl] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    generatePDFThumbnail();
  }, [fileUrl]);

  const generatePDFThumbnail = async () => {
    setIsGenerating(true);
    setError('');

    try {
      console.log(`[PDF] Generating real thumbnail for ${documentId}`);
      
      // Fetch the PDF file
      const response = await fetch(fileUrl);
      const arrayBuffer = await response.arrayBuffer();
      
      // Import PDF.js dynamically
      const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.js');
      
      // Set worker
      pdfjsLib.GlobalWorkerOptions.workerSrc = '//cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
      
      console.log(`[PDF] Loading PDF document...`);
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      console.log(`[PDF] PDF loaded: ${pdf.numPages} pages`);
      
      if (pdf.numPages === 0) {
        throw new Error('PDF has no pages');
      }
      
      // Get first page
      const page = await pdf.getPage(1);
      console.log(`[PDF] First page loaded`);
      
      // Create viewport with higher scale for better quality
      // Higher scale = more pixels = sharper thumbnail
      const viewport = page.getViewport({ scale: 2.0 }); // Increased from 1.0 to 2.0
      console.log(`[PDF] Viewport: ${viewport.width} x ${viewport.height}`);
      
      // Create canvas for the page with higher resolution
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d')!;
      canvas.height = viewport.height;
      canvas.width = viewport.width;
      
      // Enable high-quality rendering
      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = 'high';
      
      // Render the page
      const renderContext = {
        canvasContext: context,
        viewport: viewport
      };
      
      console.log(`[PDF] Rendering page at high quality...`);
      await page.render(renderContext).promise;
      console.log(`[PDF] Page rendered successfully at high resolution`);
      
      // Create thumbnail canvas with higher dimensions for better quality
      const thumbCanvas = document.createElement('canvas');
      thumbCanvas.width = 400; // Increased from 200 to 400
      thumbCanvas.height = 300; // Increased from 150 to 300
      const thumbCtx = thumbCanvas.getContext('2d')!;
      
      // Enable high-quality rendering for thumbnail
      thumbCtx.imageSmoothingEnabled = true;
      thumbCtx.imageSmoothingQuality = 'high';
      
      // Fill background with pure white
      thumbCtx.fillStyle = '#ffffff';
      thumbCtx.fillRect(0, 0, 400, 300);
      
      // Calculate dimensions to fit the PDF page with better scaling
      const scale = Math.min(400 / canvas.width, 300 / canvas.height);
      const width = canvas.width * scale;
      const height = canvas.height * scale;
      const x = (400 - width) / 2;
      const y = (300 - height) / 2;
      
      console.log(`[PDF] Drawing high-quality thumbnail: ${width} x ${height} at (${x}, ${y})`);
      
      // Draw the actual PDF page with high quality
      thumbCtx.drawImage(canvas, x, y, width, height);
      
      // Add subtle border for better visual appeal
      thumbCtx.strokeStyle = '#e5e7eb';
      thumbCtx.lineWidth = 1;
      thumbCtx.strokeRect(0.5, 0.5, 399, 299);
      
      // Convert to high-quality PNG
      const thumbnailDataUrl = thumbCanvas.toDataURL('image/png', 1.0); // Maximum quality
      setThumbnailUrl(thumbnailDataUrl);
      
      console.log(`[PDF] High-quality thumbnail generated successfully`);
      
      // Save the high-quality thumbnail to the server
      try {
        console.log(`[PDF] Saving high-quality thumbnail to server...`);
        setIsSaving(true);
        
        const saveResponse = await fetch(`/api/documents/${documentId}/thumbnail`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ thumbnailDataUrl }),
        });
        
        if (saveResponse.ok) {
          const result = await saveResponse.json();
          console.log(`[PDF] Thumbnail saved to server:`, result.message);
        } else {
          console.warn(`[PDF] Failed to save thumbnail to server:`, saveResponse.status);
        }
      } catch (saveError) {
        console.warn(`[PDF] Error saving thumbnail to server:`, saveError);
        // Continue even if saving fails - user still sees the thumbnail
      } finally {
        setIsSaving(false);
      }
      
      // Notify parent component
      if (onThumbnailGenerated) {
        onThumbnailGenerated(thumbnailDataUrl);
      }
      
    } catch (error) {
      console.error(`[PDF] Thumbnail generation failed:`, error);
      setError(error instanceof Error ? error.message : 'Unknown error');
      
      // Create a fallback PDF icon
      const fallbackUrl = createPDFIconThumbnail();
      setThumbnailUrl(fallbackUrl);
      
      if (onThumbnailGenerated) {
        onThumbnailGenerated(fallbackUrl);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const createPDFIconThumbnail = (): string => {
    const canvas = document.createElement('canvas');
    canvas.width = 400; // Increased to match new thumbnail size
    canvas.height = 300; // Increased to match new thumbnail size
    const ctx = canvas.getContext('2d')!;
    
    // Enable high-quality rendering
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    
    // Fill background with pure white
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 400, 300);
    
    // Add subtle border
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;
    ctx.strokeRect(0.5, 0.5, 399, 299);
    
    // Add PDF icon (red rectangle) - scaled up for higher quality
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(120, 60, 160, 180); // Doubled dimensions
    
    // Add PDF text - larger and sharper
    ctx.fillStyle = 'white';
    ctx.font = 'bold 32px Arial'; // Doubled font size
    ctx.textAlign = 'center';
    ctx.fillText('PDF', 200, 150); // Centered in new dimensions
    
    // Add document lines to simulate content - scaled up
    ctx.fillStyle = 'white';
    ctx.fillRect(150, 130, 100, 4); // Doubled dimensions
    ctx.fillRect(150, 140, 80, 4);
    ctx.fillRect(150, 150, 90, 4);
    ctx.fillRect(150, 160, 70, 4);
    
    // Add file info - larger text
    ctx.fillStyle = '#6b7280';
    ctx.font = '20px Arial'; // Doubled font size
    ctx.textAlign = 'center';
    ctx.fillText('Document', 200, 230); // Adjusted position
    
    return canvas.toDataURL('image/png', 1.0); // Maximum quality
  };

  if (isGenerating) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 rounded ${className}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500 mx-auto mb-2"></div>
          <p className="text-sm text-gray-600">Generating PDF thumbnail...</p>
        </div>
      </div>
    );
  }

  if (isSaving) {
    return (
      <div className={`flex items-center justify-center bg-blue-50 rounded ${className}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
          <p className="text-sm text-blue-600">Saving thumbnail...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex items-center justify-center bg-red-50 rounded ${className}`}>
        <div className="text-center">
          <p className="text-sm text-red-600">PDF thumbnail failed</p>
          <p className="text-xs text-red-500">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <img 
      src={thumbnailUrl} 
      alt="PDF thumbnail" 
      className={`w-full h-full object-contain rounded ${className}`}
    />
  );
}
