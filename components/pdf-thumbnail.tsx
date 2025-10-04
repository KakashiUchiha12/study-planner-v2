'use client';

import { useEffect, useState, useRef } from 'react';

interface PDFThumbnailProps {
  documentId: string;
  fileUrl: string;
  className?: string;
  onThumbnailGenerated?: (thumbnailUrl: string) => void;
}

export function PDFThumbnail({ documentId, fileUrl, className = "", onThumbnailGenerated }: PDFThumbnailProps) {
  const [isGenerating, setIsGenerating] = useState(true);
  const [error, setError] = useState<string>('');
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    // Generate real PDF thumbnail showing actual first page
    generateRealPDFThumbnail();
  }, [documentId, fileUrl]);

  const generateRealPDFThumbnail = async () => {
    try {
      setIsGenerating(true);
      setError('');
      console.log(`[PDF] Generating REAL first page thumbnail for ${documentId}`);
      
      // Load PDF.js library from CDN (avoiding webpack bundling issues)
      await loadPDFJS();
      
      console.log(`[PDF] Fetching PDF from: ${fileUrl}`);
      
      // Load the PDF document using the global PDF.js
      const pdfjsLib = (window as any).pdfjsLib;
      const pdf = await pdfjsLib.getDocument(fileUrl).promise;
      console.log(`[PDF] PDF loaded: ${pdf.numPages} pages`);
      
      // Get the first page
      const page = await pdf.getPage(1);
      console.log(`[PDF] First page loaded`);
      
      // Set up the canvas
      const canvas = canvasRef.current;
      if (!canvas) {
        throw new Error('Canvas not available');
      }
      
      const context = canvas.getContext('2d');
      if (!context) {
        throw new Error('Canvas context not available');
      }
      
      // Set viewport with appropriate scale for thumbnail
      const viewport = page.getViewport({ scale: 0.5 }); // Adjust scale for thumbnail size
      
      canvas.height = viewport.height;
      canvas.width = viewport.width;
      
      console.log(`[PDF] Rendering page at ${viewport.width}x${viewport.height}`);
      
      // Render the page onto the canvas
      await page.render({ 
        canvasContext: context, 
        viewport: viewport
      }).promise;
      
      console.log(`[PDF] Real PDF first page rendered successfully!`);
      
      // Convert canvas to data URL for saving
      const thumbnailDataUrl = canvas.toDataURL('image/png', 0.8);
      
      // Save the real thumbnail to server
      try {
        console.log(`[PDF] Saving real first page thumbnail to server...`);
        const saveResponse = await fetch(`/api/documents/${documentId}/save-thumbnail`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({ thumbnailDataUrl }),
        });
        
        if (saveResponse.ok) {
          const result = await saveResponse.json();
          console.log(`[PDF] Real thumbnail saved to server:`, result.message);
        } else {
          console.warn(`[PDF] Failed to save thumbnail to server:`, saveResponse.status);
        }
      } catch (saveError) {
        console.warn(`[PDF] Error saving thumbnail to server:`, saveError);
        // Continue even if saving fails - user still sees the thumbnail
      }
      
      // Notify parent component
      if (onThumbnailGenerated) {
        onThumbnailGenerated(thumbnailDataUrl);
      }
      
      setIsGenerating(false);
      
    } catch (error) {
      console.error(`[PDF] Real PDF thumbnail generation failed:`, error);
      setError(error instanceof Error ? error.message : 'Failed to generate PDF thumbnail');
      setIsGenerating(false);
    }
  };

  const loadPDFJS = async (): Promise<void> => {
    // Check if PDF.js is already loaded
    if ((window as any).pdfjsLib) {
      console.log('[PDF] PDF.js already loaded');
      return;
    }

    return new Promise((resolve, reject) => {
      console.log('[PDF] Loading PDF.js from CDN...');
      
      // Load the main PDF.js library
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
      script.async = true;
      
      script.onload = () => {
        console.log('[PDF] PDF.js loaded successfully');
        
        // Set the worker
        const pdfjsLib = (window as any).pdfjsLib;
        if (pdfjsLib) {
          pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
          resolve();
        } else {
          reject(new Error('PDF.js loaded but not available'));
        }
      };
      
      script.onerror = () => {
        console.error('[PDF] Failed to load PDF.js');
        reject(new Error('Failed to load PDF.js'));
      };
      
      document.head.appendChild(script);
    });
  };

  if (isGenerating) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 rounded ${className}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500 mx-auto mb-2"></div>
          <p className="text-sm text-gray-600">Rendering PDF first page...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex items-center justify-center bg-red-50 rounded ${className}`}>
        <div className="text-center">
          <p className="text-sm text-red-600">PDF rendering failed</p>
          <p className="text-xs text-red-500">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <canvas 
      ref={canvasRef}
      className={`w-full h-full object-contain rounded ${className}`}
      style={{ maxWidth: '100%', height: 'auto' }}
    />
  );
}
