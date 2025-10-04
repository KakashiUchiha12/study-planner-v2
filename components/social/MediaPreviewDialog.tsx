'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, ChevronLeft, ChevronRight, X } from 'lucide-react';

interface MediaPreviewDialogProps {
  media: any;
  mediaList?: any[];
  isOpen: boolean;
  onClose: () => void;
}

export function MediaPreviewDialog({ media, mediaList = [], isOpen, onClose }: MediaPreviewDialogProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  
  if (!isOpen || !media) return null;

  // Find current media index in the list
  const currentMedia = mediaList.length > 0 ? mediaList[currentIndex] : media;
  const hasMultipleMedia = mediaList.length > 1;

  const download = () => {
    const link = document.createElement('a');
    link.href = currentMedia.url;
    link.download = currentMedia.name || 'download';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const goToPrevious = () => {
    if (hasMultipleMedia) {
      setCurrentIndex((prev) => (prev > 0 ? prev - 1 : mediaList.length - 1));
    }
  };

  const goToNext = () => {
    if (hasMultipleMedia) {
      setCurrentIndex((prev) => (prev < mediaList.length - 1 ? prev + 1 : 0));
    }
  };

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50" onClick={onClose}>
      <div className="relative max-w-7xl w-full mx-4 max-h-[95vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between mb-4 bg-black/50 backdrop-blur-sm rounded-t-lg p-4">
          <div className="flex items-center gap-4">
            <h3 className="text-lg font-semibold text-white">{currentMedia.name || 'Media Preview'}</h3>
            {hasMultipleMedia && (
              <span className="text-sm text-gray-300">
                {currentIndex + 1} of {mediaList.length}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={download} className="text-white border-white hover:bg-white hover:text-black">
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
            <Button variant="outline" size="sm" onClick={onClose} className="text-white border-white hover:bg-white hover:text-black">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {/* Media Container */}
        <div className="relative flex-1 bg-black rounded-b-lg overflow-hidden">
          {/* Navigation Buttons */}
          {hasMultipleMedia && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={goToPrevious}
                className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10 bg-black/50 border-white text-white hover:bg-white hover:text-black"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={goToNext}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 z-10 bg-black/50 border-white text-white hover:bg-white hover:text-black"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </>
          )}
          
          {/* Media Content */}
          <div className="w-full h-full flex items-center justify-center p-4">
            {currentMedia.kind === 'image' || currentMedia.mimeType?.startsWith('image/') ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img 
                src={currentMedia.url} 
                alt={currentMedia.name || 'image'} 
                className="max-w-full max-h-full object-contain rounded-lg"
                style={{ maxHeight: 'calc(95vh - 120px)' }}
              />
            ) : currentMedia.kind === 'video' || currentMedia.mimeType?.startsWith('video/') ? (
              <div className="w-full h-full flex items-center justify-center">
                <video
                  src={currentMedia.url}
                  controls
                  className="max-w-full max-h-full object-contain rounded-lg"
                  poster={currentMedia.thumbnail || currentMedia.thumbnailUrl}
                  preload="metadata"
                  style={{ maxHeight: 'calc(95vh - 120px)' }}
                >
                  Your browser does not support the video element.
                </video>
              </div>
            ) : currentMedia.mimeType === 'application/pdf' ? (
              <iframe 
                src={currentMedia.url} 
                className="w-full rounded-lg"
                style={{ height: 'calc(95vh - 120px)' }}
              />
            ) : currentMedia.mimeType?.startsWith('text/') ? (
              <div className="w-full h-full bg-gray-50 p-4 rounded-lg overflow-auto">
                <pre className="text-sm whitespace-pre-wrap font-mono">
                  {currentMedia.name || 'Text file content'}
                </pre>
              </div>
            ) : currentMedia.mimeType?.includes('document') || currentMedia.mimeType?.includes('word') ? (
              <div className="p-6 text-center bg-white rounded-lg">
                <div className="text-6xl mb-4">📄</div>
                <p className="text-lg font-medium mb-2">{currentMedia.name}</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Document preview not available in browser
                </p>
                <Button onClick={download} size="lg">
                  <Download className="h-4 w-4 mr-2" />
                  Download Document
                </Button>
              </div>
            ) : (
              <div className="p-6 text-center bg-white rounded-lg">
                <div className="text-6xl mb-4">📁</div>
                <p className="text-lg font-medium mb-2">{currentMedia.name}</p>
                <p className="text-sm text-muted-foreground mb-4">
                  File preview not available. Download to view.
                </p>
                <Button onClick={download} size="lg">
                  <Download className="h-4 w-4 mr-2" />
                  Download File
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
