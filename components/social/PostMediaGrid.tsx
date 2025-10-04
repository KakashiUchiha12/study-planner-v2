'use client';

interface MediaItem {
  id: string;
  kind: 'image' | 'file' | 'video';
  url: string;
  mimeType: string;
  name: string;
  size: number;
  thumbnailUrl?: string;
  thumbnail?: string;
}

interface PostMediaGridProps {
  media: MediaItem[];
  onMediaClick?: (media: MediaItem) => void;
}

export function PostMediaGrid({ media, onMediaClick }: PostMediaGridProps) {
  if (!media || media.length === 0) return null;

  const handleClick = (item: MediaItem) => {
    if (onMediaClick) {
      onMediaClick(item);
    } else {
      // Default behavior: open in new tab
      window.open(item.url, '_blank');
    }
  };

  if (media.length === 1) {
    const item = media[0];
    return (
      <div className="rounded-lg overflow-hidden">
        {item.kind === 'image' || item.mimeType?.startsWith('image/') ? (
          <div className="relative group">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={item.url}
              alt={item.name || 'image'}
              className="w-full h-auto max-h-96 object-contain cursor-pointer transition-transform group-hover:scale-105"
              onClick={() => handleClick(item)}
              style={{ 
                maxHeight: '400px',
                objectFit: 'contain',
                backgroundColor: '#f8f9fa'
              }}
            />
            {/* Overlay for better UX */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors rounded-lg" />
          </div>
        ) : (
          <div
            className="p-4 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
            onClick={() => handleClick(item)}
          >
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                <span className="text-2xl">📄</span>
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm">{item.name}</p>
                <p className="text-xs text-muted-foreground">
                  {(item.size / 1024).toFixed(1)} KB
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Multiple media items
  return (
    <div className="grid grid-cols-2 gap-2 rounded-lg overflow-hidden">
      {media.slice(0, 4).map((item, index) => (
        <div key={item.id} className="relative group">
          {item.kind === 'image' || item.mimeType?.startsWith('image/') ? (
            <div className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.url}
                alt={item.name || 'image'}
                className="w-full h-32 object-cover cursor-pointer transition-transform group-hover:scale-105"
                onClick={() => handleClick(item)}
                style={{ 
                  backgroundColor: '#f8f9fa'
                }}
              />
              {/* Overlay for better UX */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
            </div>
          ) : (
            <div
              className="w-full h-32 bg-muted rounded-lg flex items-center justify-center cursor-pointer hover:bg-muted/80 transition-colors"
              onClick={() => handleClick(item)}
            >
              <span className="text-2xl">📄</span>
            </div>
          )}
          
          {index === 3 && media.length > 4 && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center cursor-pointer" onClick={() => handleClick(item)}>
              <span className="text-white font-medium">
                +{media.length - 4} more
              </span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
