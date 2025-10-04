"use client"

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { X, RotateCw, ZoomIn, ZoomOut } from 'lucide-react';

interface ImageCropperProps {
  imageUrl: string;
  onCrop: (croppedImageUrl: string) => void;
  onCancel: () => void;
  aspectRatio?: number;
}

export function ImageCropper({ imageUrl, onCrop, onCancel, aspectRatio = 1 }: ImageCropperProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [cropArea, setCropArea] = useState({ x: 0, y: 0, width: 200, height: 200 });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState<string>('');
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [containerSize, setContainerSize] = useState({ width: 400, height: 400 });
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [imageDisplaySize, setImageDisplaySize] = useState({ width: 0, height: 0 });

  // Update container size when component mounts or window resizes
  useEffect(() => {
    const updateContainerSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setContainerSize({ width: rect.width, height: rect.height });
      }
    };

    updateContainerSize();
    window.addEventListener('resize', updateContainerSize);
    return () => window.removeEventListener('resize', updateContainerSize);
  }, []);

  // Calculate image display size based on container and maintain aspect ratio
  useEffect(() => {
    if (containerSize.width === 0 || containerSize.height === 0 || imageSize.width === 0 || imageSize.height === 0) return;
    
    const imageAspectRatio = imageSize.width / imageSize.height;
    const containerAspectRatio = containerSize.width / containerSize.height;
    
    let displayWidth, displayHeight;
    
    if (imageAspectRatio > containerAspectRatio) {
      // Image is wider than container
      displayWidth = containerSize.width * scale;
      displayHeight = displayWidth / imageAspectRatio;
    } else {
      // Image is taller than container
      displayHeight = containerSize.height * scale;
      displayWidth = displayHeight * imageAspectRatio;
    }
    
    setImageDisplaySize({ width: displayWidth, height: displayHeight });
  }, [containerSize, imageSize, scale]);

  // Update crop area when container size or image size changes
  useEffect(() => {
    if (containerSize.width === 0 || containerSize.height === 0) return;
    
    // Calculate initial crop size
    const cropSize = Math.min(containerSize.width, containerSize.height) * 0.4;
    
    setCropArea({
      x: (containerSize.width - cropSize) / 2,
      y: (containerSize.height - cropSize) / 2,
      width: cropSize,
      height: cropSize / aspectRatio
    });
  }, [containerSize, aspectRatio]);

  const handleZoomIn = () => {
    setScale(prev => Math.min(prev * 1.2, 3));
  };

  const handleZoomOut = () => {
    setScale(prev => Math.max(prev / 1.2, 0.5));
  };

  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  const handleMouseDown = (e: React.MouseEvent, handle?: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    if (handle) {
      setIsResizing(true);
      setResizeHandle(handle);
    } else {
      setIsDragging(true);
    }
    
    setDragStart({ 
      x: e.clientX - rect.left - cropArea.x, 
      y: e.clientY - rect.top - cropArea.y 
    });
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    if (isDragging) {
      const newX = mouseX - dragStart.x;
      const newY = mouseY - dragStart.y;
      
      setCropArea(prev => ({
        ...prev,
        x: Math.max(0, Math.min(newX, containerSize.width - prev.width)),
        y: Math.max(0, Math.min(newY, containerSize.height - prev.height))
      }));
    } else if (isResizing && resizeHandle) {
      setCropArea(prev => {
        let newArea = { ...prev };
        const minSize = 50;
        
        switch (resizeHandle) {
          case 'nw': // Top-left
            const nwWidth = Math.max(minSize, prev.width + (prev.x - mouseX));
            const nwHeight = nwWidth / aspectRatio;
            newArea = {
              x: Math.max(0, mouseX),
              y: Math.max(0, prev.y + prev.height - nwHeight),
              width: Math.min(nwWidth, prev.x + prev.width),
              height: nwHeight
            };
            break;
          case 'ne': // Top-right
            const neWidth = Math.max(minSize, mouseX - prev.x);
            const neHeight = neWidth / aspectRatio;
            newArea = {
              ...prev,
              y: Math.max(0, prev.y + prev.height - neHeight),
              width: Math.min(neWidth, containerSize.width - prev.x),
              height: neHeight
            };
            break;
          case 'sw': // Bottom-left
            const swWidth = Math.max(minSize, prev.width + (prev.x - mouseX));
            const swHeight = swWidth / aspectRatio;
            newArea = {
              x: Math.max(0, mouseX),
              y: prev.y,
              width: Math.min(swWidth, prev.x + prev.width),
              height: Math.min(swHeight, containerSize.height - prev.y)
            };
            break;
          case 'se': // Bottom-right
            const seWidth = Math.max(minSize, mouseX - prev.x);
            const seHeight = seWidth / aspectRatio;
            newArea = {
              ...prev,
              width: Math.min(seWidth, containerSize.width - prev.x),
              height: Math.min(seHeight, containerSize.height - prev.y)
            };
            break;
          case 'n': // Top
            const nHeight = Math.max(minSize, prev.height + (prev.y - mouseY));
            const nWidth = nHeight * aspectRatio;
            newArea = {
              x: Math.max(0, prev.x + (prev.width - nWidth) / 2),
              y: Math.max(0, mouseY),
              width: Math.min(nWidth, containerSize.width),
              height: Math.min(nHeight, prev.y + prev.height)
            };
            break;
          case 's': // Bottom
            const sHeight = Math.max(minSize, mouseY - prev.y);
            const sWidth = sHeight * aspectRatio;
            newArea = {
              x: Math.max(0, prev.x + (prev.width - sWidth) / 2),
              y: prev.y,
              width: Math.min(sWidth, containerSize.width),
              height: Math.min(sHeight, containerSize.height - prev.y)
            };
            break;
          case 'w': // Left
            const wWidth = Math.max(minSize, prev.width + (prev.x - mouseX));
            const wHeight = wWidth / aspectRatio;
            newArea = {
              x: Math.max(0, mouseX),
              y: Math.max(0, prev.y + (prev.height - wHeight) / 2),
              width: Math.min(wWidth, prev.x + prev.width),
              height: Math.min(wHeight, containerSize.height)
            };
            break;
          case 'e': // Right
            const eWidth = Math.max(minSize, mouseX - prev.x);
            const eHeight = eWidth / aspectRatio;
            newArea = {
              x: prev.x,
              y: Math.max(0, prev.y + (prev.height - eHeight) / 2),
              width: Math.min(eWidth, containerSize.width - prev.x),
              height: Math.min(eHeight, containerSize.height)
            };
            break;
        }
        
        return newArea;
      });
    }
  }, [isDragging, isResizing, resizeHandle, dragStart, containerSize, aspectRatio]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setIsResizing(false);
    setResizeHandle('');
  }, []);

  // Add global mouse event listeners for better drag experience
  useEffect(() => {
    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, isResizing, handleMouseMove, handleMouseUp]);

  const handleImageLoad = () => {
    const image = imageRef.current;
    if (image) {
      setImageSize({ width: image.naturalWidth, height: image.naturalHeight });
    }
  };

  const handleCrop = useCallback(() => {
    const canvas = canvasRef.current;
    const image = imageRef.current;
    
    if (!canvas || !image || !containerRef.current) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Calculate the position and size of the image within the container
    const centerX = containerSize.width / 2;
    const centerY = containerSize.height / 2;
    
    // Image position accounting for scale and centering
    const imageLeft = centerX - (imageDisplaySize.width / 2);
    const imageTop = centerY - (imageDisplaySize.height / 2);
    
    // Calculate scale factors between displayed image and natural image
    const scaleX = imageSize.width / imageDisplaySize.width;
    const scaleY = imageSize.height / imageDisplaySize.height;
    
    // Calculate the crop area relative to the natural image size
    const cropX = Math.max(0, (cropArea.x - imageLeft) * scaleX);
    const cropY = Math.max(0, (cropArea.y - imageTop) * scaleY);
    const cropWidth = Math.min(cropArea.width * scaleX, imageSize.width - cropX);
    const cropHeight = Math.min(cropArea.height * scaleY, imageSize.height - cropY);

    // Set canvas size to desired output size
    const outputSize = 400;
    canvas.width = outputSize;
    canvas.height = outputSize / aspectRatio;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Save context for rotation
    ctx.save();
    
    // Apply rotation if needed
    if (rotation !== 0) {
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.translate(-canvas.width / 2, -canvas.height / 2);
    }

    // Draw the cropped portion of the image
    ctx.drawImage(
      image,
      cropX, cropY, cropWidth, cropHeight,
      0, 0, canvas.width, canvas.height
    );

    // Restore context
    ctx.restore();

    // Convert to blob and create URL
    canvas.toBlob((blob) => {
      if (blob) {
        const croppedUrl = URL.createObjectURL(blob);
        onCrop(croppedUrl);
      }
    }, 'image/jpeg', 0.9);
  }, [cropArea, onCrop, containerSize, imageDisplaySize, imageSize, aspectRatio, rotation]);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Crop Profile Picture</CardTitle>
            <Button variant="ghost" size="sm" onClick={onCancel}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Controls */}
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleZoomOut}>
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-sm">{Math.round(scale * 100)}%</span>
            <Button variant="outline" size="sm" onClick={handleZoomIn}>
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={handleRotate}>
              <RotateCw className="h-4 w-4" />
            </Button>
          </div>

          {/* Image Container */}
          <div 
            ref={containerRef}
            className="relative w-full h-96 bg-gray-100 rounded-lg overflow-hidden select-none"
          >
            {/* Image with proper scaling and centering */}
            <div 
              className="absolute inset-0 flex items-center justify-center"
              style={{
                transform: `rotate(${rotation}deg)`,
                transformOrigin: 'center'
              }}
            >
              <img
                ref={imageRef}
                src={imageUrl}
                alt="Crop preview"
                className="pointer-events-none"
                style={{
                  width: `${imageDisplaySize.width}px`,
                  height: `${imageDisplaySize.height}px`,
                  maxWidth: 'none',
                  maxHeight: 'none'
                }}
                onLoad={handleImageLoad}
                draggable={false}
              />
            </div>
            
            {/* Crop Overlay */}
            <div
              className="absolute border-2 border-blue-500 bg-blue-500/20 cursor-move select-none"
              style={{
                left: cropArea.x,
                top: cropArea.y,
                width: cropArea.width,
                height: cropArea.height,
                minWidth: '50px',
                minHeight: '50px'
              }}
              onMouseDown={(e) => handleMouseDown(e)}
            >
              {/* Corner handles */}
              <div 
                className="absolute -top-2 -left-2 w-4 h-4 bg-blue-600 border-2 border-white rounded-full cursor-nw-resize shadow-md z-10" 
                onMouseDown={(e) => handleMouseDown(e, 'nw')}
              />
              <div 
                className="absolute -top-2 -right-2 w-4 h-4 bg-blue-600 border-2 border-white rounded-full cursor-ne-resize shadow-md z-10" 
                onMouseDown={(e) => handleMouseDown(e, 'ne')}
              />
              <div 
                className="absolute -bottom-2 -left-2 w-4 h-4 bg-blue-600 border-2 border-white rounded-full cursor-sw-resize shadow-md z-10" 
                onMouseDown={(e) => handleMouseDown(e, 'sw')}
              />
              <div 
                className="absolute -bottom-2 -right-2 w-4 h-4 bg-blue-600 border-2 border-white rounded-full cursor-se-resize shadow-md z-10" 
                onMouseDown={(e) => handleMouseDown(e, 'se')}
              />
              
              {/* Edge handles */}
              <div 
                className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-blue-600 border-2 border-white rounded-full cursor-n-resize shadow-md z-10" 
                onMouseDown={(e) => handleMouseDown(e, 'n')}
              />
              <div 
                className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-blue-600 border-2 border-white rounded-full cursor-s-resize shadow-md z-10" 
                onMouseDown={(e) => handleMouseDown(e, 's')}
              />
              <div 
                className="absolute -left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 bg-blue-600 border-2 border-white rounded-full cursor-w-resize shadow-md z-10" 
                onMouseDown={(e) => handleMouseDown(e, 'w')}
              />
              <div 
                className="absolute -right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 bg-blue-600 border-2 border-white rounded-full cursor-e-resize shadow-md z-10" 
                onMouseDown={(e) => handleMouseDown(e, 'e')}
              />
              
              {/* Center indicator */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-blue-600 rounded-full shadow-sm" />
              
              {/* Helper text */}
              <div className="absolute top-2 left-2 text-xs text-blue-700 font-medium bg-white/80 px-1 rounded">
                Drag to move • Handles to resize
              </div>
            </div>
            
            {/* Dark overlay to show non-cropped areas */}
            <div className="absolute inset-0 pointer-events-none">
              {/* Top overlay */}
              <div 
                className="absolute bg-black/30"
                style={{
                  top: 0,
                  left: 0,
                  right: 0,
                  height: Math.max(0, cropArea.y)
                }}
              />
              {/* Bottom overlay */}
              <div 
                className="absolute bg-black/30"
                style={{
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: Math.max(0, containerSize.height - cropArea.y - cropArea.height)
                }}
              />
              {/* Left overlay */}
              <div 
                className="absolute bg-black/30"
                style={{
                  top: cropArea.y,
                  left: 0,
                  width: Math.max(0, cropArea.x),
                  height: cropArea.height
                }}
              />
              {/* Right overlay */}
              <div 
                className="absolute bg-black/30"
                style={{
                  top: cropArea.y,
                  right: 0,
                  width: Math.max(0, containerSize.width - cropArea.x - cropArea.width),
                  height: cropArea.height
                }}
              />
            </div>
          </div>

          {/* Hidden canvas for cropping */}
          <canvas ref={canvasRef} className="hidden" />

          {/* Action Buttons */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button onClick={handleCrop}>
              Crop & Save
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}