'use client';

import React, { useState, useRef, useCallback } from 'react';
import ReactCrop, {
  centerCrop,
  makeAspectCrop,
  Crop,
  PixelCrop,
  convertToPixelCrop,
} from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { X, RotateCw, ZoomIn, ZoomOut } from 'lucide-react';

interface ImageCropperProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageSrc: string;
  onCropComplete: (croppedImageBlob: Blob) => void;
  aspectRatio?: number;
  title?: string;
}

function centerAspectCrop(
  mediaWidth: number,
  mediaHeight: number,
  aspect: number,
) {
  return centerCrop(
    makeAspectCrop(
      {
        unit: '%',
        width: 90,
      },
      aspect,
      mediaWidth,
      mediaHeight,
    ),
    mediaWidth,
    mediaHeight,
  );
}

export function ImageCropper({
  open,
  onOpenChange,
  imageSrc,
  onCropComplete,
  aspectRatio = 16 / 9,
  title = "Crop Image"
}: ImageCropperProps) {
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [scale, setScale] = useState(1);
  const [rotate, setRotate] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);

  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    if (aspectRatio) {
      const { width, height } = e.currentTarget;
      setCrop(centerAspectCrop(width, height, aspectRatio));
    }
  }, [aspectRatio]);

  const onDownloadCropClick = useCallback(async () => {
    if (!completedCrop || !previewCanvasRef.current || !imgRef.current) {
      return;
    }

    setIsProcessing(true);

    try {
      const image = imgRef.current;
      const canvas = previewCanvasRef.current;
      const crop = completedCrop;

      const scaleX = image.naturalWidth / image.width;
      const scaleY = image.naturalHeight / image.height;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        throw new Error('No 2d context');
      }

      const pixelRatio = window.devicePixelRatio;
      canvas.width = crop.width * pixelRatio * scaleX;
      canvas.height = crop.height * pixelRatio * scaleY;

      ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      ctx.imageSmoothingQuality = 'high';

      const cropX = crop.x * scaleX;
      const cropY = crop.y * scaleY;

      const rotateRads = rotate * (Math.PI / 180);
      const centerX = image.naturalWidth / 2;
      const centerY = image.naturalHeight / 2;

      ctx.save();

      // Move the crop origin to the canvas origin (0,0)
      ctx.translate(-cropX, -cropY);
      // Move the origin to the center of the original position
      ctx.translate(centerX, centerY);
      // Rotate around the origin
      ctx.rotate(rotateRads);
      // Scale the image
      ctx.scale(scale, scale);
      // Move the center of the image to the origin (0,0)
      ctx.translate(-centerX, -centerY);
      // Draw the image on the canvas
      ctx.drawImage(
        image,
        0,
        0,
        image.naturalWidth,
        image.naturalHeight,
        0,
        0,
        image.naturalWidth,
        image.naturalHeight,
      );

      ctx.restore();

      // Convert canvas to blob
      canvas.toBlob((blob) => {
        if (blob) {
          onCropComplete(blob);
          onOpenChange(false);
        }
      }, 'image/jpeg', 0.9);
    } catch (error) {
      console.error('Error cropping image:', error);
    } finally {
      setIsProcessing(false);
    }
  }, [completedCrop, rotate, scale, onCropComplete, onOpenChange]);

  const handleZoomIn = () => {
    setScale(prev => Math.min(prev + 0.1, 3));
  };

  const handleZoomOut = () => {
    setScale(prev => Math.max(prev - 0.1, 0.1));
  };

  const handleRotate = () => {
    setRotate(prev => (prev + 90) % 360);
  };

  const handleReset = () => {
    setScale(1);
    setRotate(0);
    if (imgRef.current) {
      const { width, height } = imgRef.current;
      setCrop(centerAspectCrop(width, height, aspectRatio));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Controls */}
          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleZoomOut}
                disabled={scale <= 0.1}
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium min-w-[60px] text-center">
                {Math.round(scale * 100)}%
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleZoomIn}
                disabled={scale >= 3}
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRotate}
              >
                <RotateCw className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleReset}
              >
                Reset
              </Button>
            </div>
          </div>

          {/* Image Cropper */}
          <div className="flex justify-center">
            <ReactCrop
              crop={crop}
              onChange={(_, percentCrop) => setCrop(percentCrop)}
              onComplete={(c) => setCompletedCrop(c)}
              aspect={aspectRatio}
              minWidth={100}
              minHeight={100}
              keepSelection
            >
              <img
                ref={imgRef}
                alt="Crop me"
                src={imageSrc}
                style={{
                  transform: `scale(${scale}) rotate(${rotate}deg)`,
                  maxHeight: '60vh',
                  maxWidth: '100%',
                }}
                onLoad={onImageLoad}
              />
            </ReactCrop>
          </div>

          {/* Preview Section */}
          {completedCrop && (
            <div className="mt-6 p-4 bg-muted rounded-lg">
              <h3 className="text-sm font-medium mb-3">Preview - This is how your banner will look:</h3>
              <div className="flex justify-center">
                <div 
                  className="bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg overflow-hidden"
                  style={{
                    width: '400px',
                    height: `${400 / aspectRatio}px`,
                    aspectRatio: aspectRatio
                  }}
                >
                  {completedCrop && (
                    <img
                      src={imageSrc}
                      alt="Banner preview"
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        transform: `scale(${scale}) rotate(${rotate}deg)`,
                        transformOrigin: 'center',
                      }}
                    />
                  )}
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2 text-center">
                Banner dimensions: {Math.round(400)} × {Math.round(400 / aspectRatio)} pixels
              </p>
            </div>
          )}

          {/* Hidden canvas for processing */}
          <canvas
            ref={previewCanvasRef}
            style={{
              display: 'none',
            }}
          />
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            onClick={onDownloadCropClick}
            disabled={!completedCrop || isProcessing}
          >
            {isProcessing ? 'Processing...' : 'Crop & Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
