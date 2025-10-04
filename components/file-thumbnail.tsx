'use client';

import { useEffect, useState } from 'react';

interface FileThumbnailProps {
  fileUrl: string;
  fileName: string;
  fileType: string;
  className?: string;
}

export function FileThumbnail({ fileUrl, fileName, fileType, className = "" }: FileThumbnailProps) {
  const [thumbnailUrl, setThumbnailUrl] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(true);

  useEffect(() => {
    generateThumbnail();
  }, [fileUrl, fileType]);

  const generateThumbnail = async () => {
    setIsGenerating(true);
    
    try {
      if (fileType.startsWith('image/')) {
        await generateImageThumbnail();
      } else if (fileType === 'application/pdf') {
        await generatePDFThumbnail();
      } else if (fileType.includes('powerpoint') || fileType.includes('presentation')) {
        await generatePowerPointThumbnail();
      } else {
        generateIconThumbnail();
      }
    } catch (error) {
      console.error('Thumbnail generation failed:', error);
      generateIconThumbnail();
    } finally {
      setIsGenerating(false);
    }
  };

  const generateImageThumbnail = async () => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    await new Promise((resolve, reject) => {
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d')!;
        
        canvas.width = 400;
        canvas.height = 300;
        
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, 400, 300);
        
        const scale = Math.min(400 / img.width, 300 / img.height);
        const width = img.width * scale;
        const height = img.height * scale;
        const x = (400 - width) / 2;
        const y = (300 - height) / 2;
        
        ctx.drawImage(img, x, y, width, height);
        
        ctx.strokeStyle = '#e5e7eb';
        ctx.lineWidth = 1;
        ctx.strokeRect(0.5, 0.5, 399, 299);
        
        setThumbnailUrl(canvas.toDataURL('image/png', 1.0));
        resolve(true);
      };
      
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = fileUrl;
    });
  };

  const generatePDFThumbnail = async () => {
    try {
      const response = await fetch(fileUrl);
      const arrayBuffer = await response.arrayBuffer();
      
      let pdfjsLib = (window as any).pdfjsLib;
      if (!pdfjsLib) {
        await new Promise((resolve, reject) => {
          const script = document.createElement('script');
          script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
          script.async = true;
          script.onload = () => {
            pdfjsLib = (window as any).pdfjsLib;
            resolve(true);
          };
          script.onerror = () => reject(new Error('Failed to load PDF.js'));
          document.head.appendChild(script);
        });
      }
      
      pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
      
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const page = await pdf.getPage(1);
      
      const viewport = page.getViewport({ scale: 2.0 });
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d')!;
      canvas.height = viewport.height;
      canvas.width = viewport.width;
      
      await page.render({ canvasContext: context, viewport }).promise;
      
      const thumbCanvas = document.createElement('canvas');
      thumbCanvas.width = 400;
      thumbCanvas.height = 300;
      const thumbCtx = thumbCanvas.getContext('2d')!;
      
      thumbCtx.fillStyle = '#ffffff';
      thumbCtx.fillRect(0, 0, 400, 300);
      
      const scale = Math.min(400 / canvas.width, 300 / canvas.height);
      const width = canvas.width * scale;
      const height = canvas.height * scale;
      const x = (400 - width) / 2;
      const y = (300 - height) / 2;
      
      thumbCtx.drawImage(canvas, x, y, width, height);
      
      thumbCtx.strokeStyle = '#e5e7eb';
      thumbCtx.lineWidth = 1;
      thumbCtx.strokeRect(0.5, 0.5, 399, 299);
      
      setThumbnailUrl(thumbCanvas.toDataURL('image/png', 1.0));
    } catch (error) {
      console.error('PDF thumbnail generation failed:', error);
      generateIconThumbnail();
    }
  };

  const generateRealSlideThumbnail = async (slideContent: any) => {
    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 300;
    const ctx = canvas.getContext('2d')!;
    
    // Create a realistic slide thumbnail based on ACTUAL slide content
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 400, 300);
    
    // Add slide border
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 2;
    ctx.strokeRect(10, 10, 380, 280);
    
    // Add ACTUAL title from the slide
    ctx.fillStyle = '#1e293b';
    ctx.font = 'bold 20px Arial';
    ctx.textAlign = 'center';
    const title = slideContent.title || 'Slide Title';
    ctx.fillText(title, 200, 50);
    
    // Add ACTUAL text content from the slide
    ctx.fillStyle = '#475569';
    ctx.font = '14px Arial';
    ctx.textAlign = 'left';
    
    const lines = slideContent.text.split('\n').slice(0, 8); // Limit to 8 lines
    let y = 80;
    lines.forEach((line: string) => {
      if (line.trim()) {
        ctx.fillText('• ' + line.trim(), 30, y);
        y += 20;
      }
    });
    
    // Add "Real Content" indicator
    ctx.fillStyle = '#059669';
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'right';
    ctx.fillText('✓ Real Slide Content', 370, 290);
    
    return canvas.toDataURL('image/png', 1.0);
  };

  const generatePowerPointThumbnail = async () => {
    try {
      console.log('[FileThumbnail] Generating PowerPoint thumbnail for:', fileName);
      
      // Try to extract real content from PowerPoint file
      try {
        const response = await fetch('/api/files/powerpoint-extract', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ fileUrl }),
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.thumbnailDataUrl) {
            // Use the ACTUAL first slide image as thumbnail
            setThumbnailUrl(data.thumbnailDataUrl);
            console.log('[FileThumbnail] Real PowerPoint first slide image extracted');
            return;
          } else if (data.success && data.slideContent) {
            // Fallback to text-based thumbnail if no image found
            const thumbnailDataUrl = await generateRealSlideThumbnail(data.slideContent);
            setThumbnailUrl(thumbnailDataUrl);
            console.log('[FileThumbnail] PowerPoint text content extracted and thumbnail generated');
            return;
          }
        }
      } catch (extractError) {
        console.log('[FileThumbnail] Real content extraction failed, using fallback');
      }
      
      // Fallback to filename-based PowerPoint thumbnail
      // This creates a more realistic thumbnail based on the filename
      
      const canvas = document.createElement('canvas');
      canvas.width = 400;
      canvas.height = 300;
      const ctx = canvas.getContext('2d')!;
      
      // Create a realistic PowerPoint slide thumbnail
      // Fill background with PowerPoint-like gradient
      const gradient = ctx.createLinearGradient(0, 0, 0, 300);
      gradient.addColorStop(0, '#f8fafc');
      gradient.addColorStop(1, '#e2e8f0');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 400, 300);
      
      // Add main border
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 2;
      ctx.strokeRect(1, 1, 398, 298);
      
      // Add slide frame (16:9 aspect ratio)
      const slideWidth = 360;
      const slideHeight = 200;
      const slideX = (400 - slideWidth) / 2;
      const slideY = (300 - slideHeight) / 2;
      
      // Slide background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(slideX, slideY, slideWidth, slideHeight);
      
      // Slide border
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 1;
      ctx.strokeRect(slideX, slideY, slideWidth, slideHeight);
      
      // Add slide content based on filename
      const slideTitle = fileName.replace('.pptx', '').replace('.ppt', '');
      const words = slideTitle.split(/[-_\s]+/);
      const displayTitle = words.slice(0, 3).join(' '); // Take first 3 words
      
      // Add slide title
      ctx.fillStyle = '#1e293b';
      ctx.font = 'bold 18px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(displayTitle, slideX + slideWidth/2, slideY + 50);
      
      // Add slide number
      ctx.fillStyle = '#64748b';
      ctx.font = '12px Arial';
      ctx.fillText('Slide 1', slideX + slideWidth/2, slideY + 75);
      
      // Add content based on filename
      let contentLines = [];
      if (slideTitle.toLowerCase().includes('chapter')) {
        contentLines = [
          '• Chapter Overview',
          '• Key Concepts',
          '• Summary'
        ];
      } else if (slideTitle.toLowerCase().includes('introduction')) {
        contentLines = [
          '• Welcome',
          '• Objectives',
          '• Agenda'
        ];
      } else {
        contentLines = [
          '• Main Topic',
          '• Key Points',
          '• Conclusion'
        ];
      }
      
      // Add bullet points
      ctx.fillStyle = '#475569';
      ctx.font = '14px Arial';
      ctx.textAlign = 'left';
      
      let y = slideY + 100;
      contentLines.forEach(point => {
        ctx.fillText(point, slideX + 20, y);
        y += 25;
      });
      
      // Add PowerPoint logo/icon
      ctx.fillStyle = '#dc2626';
      ctx.font = '24px Arial';
      ctx.textAlign = 'right';
      ctx.fillText('📽️', slideX + slideWidth - 15, slideY + 30);
      
      // Add file name at bottom
      ctx.fillStyle = '#64748b';
      ctx.font = '10px Arial';
      ctx.textAlign = 'center';
      const displayName = fileName.length > 35 ? fileName.substring(0, 35) + '...' : fileName;
      ctx.fillText(displayName, 200, 280);
      
      // Add "PPTX" label
      ctx.fillStyle = '#dc2626';
      ctx.font = 'bold 11px Arial';
      ctx.fillText('PPTX', 200, 295);
      
      setThumbnailUrl(canvas.toDataURL('image/png', 1.0));
      console.log('[FileThumbnail] PowerPoint thumbnail generated successfully');
    } catch (error) {
      console.error('[FileThumbnail] PowerPoint thumbnail generation failed:', error);
      generateIconThumbnail();
    }
  };

  const generateIconThumbnail = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 300;
    const ctx = canvas.getContext('2d')!;
    
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, 400, 300);
    
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;
    ctx.strokeRect(0.5, 0.5, 399, 299);
    
    const { icon, color } = getFileIcon(fileType);
    
    ctx.fillStyle = color;
    ctx.font = '120px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(icon, 200, 120);
    
    ctx.fillStyle = '#374151';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(fileName.length > 20 ? fileName.substring(0, 20) + '...' : fileName, 200, 200);
    
    ctx.fillStyle = '#6b7280';
    ctx.font = '14px Arial';
    ctx.fillText(getFileTypeLabel(fileType), 200, 230);
    
    setThumbnailUrl(canvas.toDataURL('image/png', 1.0));
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) return { icon: '🖼️', color: '#10b981' };
    if (fileType === 'application/pdf') return { icon: '📄', color: '#ef4444' };
    if (fileType.startsWith('video/')) return { icon: '🎥', color: '#8b5cf6' };
    if (fileType.startsWith('audio/')) return { icon: '🎵', color: '#f59e0b' };
    if (fileType.includes('zip') || fileType.includes('rar')) return { icon: '📦', color: '#6b7280' };
    if (fileType.includes('javascript') || fileType.includes('typescript')) return { icon: '💻', color: '#3b82f6' };
    if (fileType.includes('word')) return { icon: '📝', color: '#2563eb' };
    if (fileType.includes('excel')) return { icon: '📊', color: '#059669' };
    if (fileType.includes('powerpoint')) return { icon: '📽️', color: '#dc2626' };
    return { icon: '📄', color: '#6b7280' };
  };

  const getFileTypeLabel = (fileType: string) => {
    if (fileType.startsWith('image/')) return 'Image File';
    if (fileType === 'application/pdf') return 'PDF Document';
    if (fileType.startsWith('video/')) return 'Video File';
    if (fileType.startsWith('audio/')) return 'Audio File';
    if (fileType.includes('zip') || fileType.includes('rar')) return 'Archive File';
    if (fileType.includes('javascript')) return 'JavaScript File';
    if (fileType.includes('typescript')) return 'TypeScript File';
    if (fileType.includes('word')) return 'Word Document';
    if (fileType.includes('excel')) return 'Excel Spreadsheet';
    if (fileType.includes('powerpoint')) return 'PowerPoint Presentation';
    return 'Document';
  };

  if (isGenerating) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 rounded ${className}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
          <p className="text-sm text-gray-600">Generating thumbnail...</p>
        </div>
      </div>
    );
  }

    return (
        <img 
          src={thumbnailUrl} 
      alt={`${fileName} thumbnail`}
      className={`w-full h-full object-contain rounded ${className}`}
    />
  );
}