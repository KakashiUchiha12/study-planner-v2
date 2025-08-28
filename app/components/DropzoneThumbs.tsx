'use client';
import { useState } from 'react';
import { generateThumbnail } from '@/app/(lib)/thumbnails-working';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Upload, FileText, Image, Video, FileSpreadsheet } from 'lucide-react';

type UiFile = { file: File; thumb: string; };

export default function DropzoneThumbs() {
  const [items, setItems] = useState<UiFile[]>([]);
  const [busy, setBusy] = useState(false);

  async function onSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const fs = Array.from(e.target.files || []);
    if (!fs.length) return;

    setBusy(true);
    const results: UiFile[] = [];
    for (const f of fs) {
      try {
        const thumb = await generateThumbnail(f);
        results.push({ file: f, thumb });
      } catch {
        results.push({ file: f, thumb: '/thumbs/file-generic.png' });
      }
    }
    setItems(prev => [...results, ...prev]);
    setBusy(false);
  }

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) return <Image className="h-4 w-4" />;
    if (fileType === 'application/pdf') return <FileText className="h-4 w-4" />;
    if (fileType.startsWith('video/')) return <Video className="h-4 w-4" />;
    if (fileType.includes('excel') || fileType.includes('spreadsheet')) return <FileSpreadsheet className="h-4 w-4" />;
    return <FileText className="h-4 w-4" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">File Upload with Thumbnails</h2>
        <p className="text-muted-foreground">Select files to see real-time thumbnail generation</p>
      </div>

      <div className="flex justify-center">
        <label className="block">
          <input type="file" multiple onChange={onSelect} className="hidden" accept="*/*" />
          <Button asChild className="cursor-pointer">
            <span>
              <Upload className="h-4 w-4 mr-2" />
              Select Files
            </span>
          </Button>
        </label>
      </div>

      {busy && (
        <div className="text-center text-sm text-muted-foreground">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
          Generating thumbnails…
        </div>
      )}

      {items.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {items.map(({ file, thumb }, i) => (
            <Card key={i} className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="aspect-video relative bg-muted">
                <img 
                  src={thumb} 
                  alt={file.name} 
                  className="w-full h-full object-cover" 
                  loading="lazy" 
                />
                <div className="absolute top-2 right-2 bg-background/80 rounded-full p-1">
                  {getFileIcon(file.type)}
                </div>
              </div>
              <CardContent className="p-3">
                <div className="text-sm font-medium truncate mb-1" title={file.name}>
                  {file.name}
                </div>
                <div className="text-xs text-muted-foreground">
                  {formatFileSize(file.size)} • {file.type || 'Unknown type'}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {items.length === 0 && !busy && (
        <div className="text-center py-12 text-muted-foreground">
          <Upload className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No files selected yet</p>
          <p className="text-sm">Select files to see thumbnail generation in action</p>
        </div>
      )}
    </div>
  );
}
