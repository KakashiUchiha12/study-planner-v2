'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  Paperclip, 
  Image, 
  File, 
  X, 
  Upload,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

interface AttachmentFile {
  id: string;
  file: File;
  type: 'image' | 'file' | 'document';
  preview?: string;
  progress: number;
  status: 'uploading' | 'completed' | 'error';
  error?: string;
  uploadedUrl?: string;
  uploadedId?: string;
}

interface MessageAttachmentUploadProps {
  onAttachmentsUploaded: (attachments: Array<{
    id: string;
    type: string;
    url: string;
    name: string;
    size?: number;
    mimeType: string;
  }>) => void;
  onClose: () => void;
  open: boolean;
}

export function MessageAttachmentUpload({
  onAttachmentsUploaded,
  onClose,
  open
}: MessageAttachmentUploadProps) {
  const [attachments, setAttachments] = useState<AttachmentFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getFileType = (file: File): 'image' | 'file' | 'document' => {
    if (file.type.startsWith('image/')) return 'image';
    if (file.type.includes('pdf') || file.type.includes('document') || file.type.includes('text')) {
      return 'document';
    }
    return 'file';
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'image':
        return <Image className="h-4 w-4" />;
      case 'document':
        return <File className="h-4 w-4" />;
      default:
        return <Paperclip className="h-4 w-4" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;

    const newAttachments: AttachmentFile[] = Array.from(files).map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      type: getFileType(file),
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
      progress: 0,
      status: 'uploading' as const
    }));

    setAttachments(prev => [...prev, ...newAttachments]);
    uploadFiles(newAttachments);
  };

  const uploadFiles = async (filesToUpload: AttachmentFile[]) => {
    setIsUploading(true);

    for (const attachment of filesToUpload) {
      try {
        const formData = new FormData();
        formData.append('file', attachment.file);
        formData.append('type', attachment.type);

        const response = await fetch('/api/messaging/upload', {
          method: 'POST',
          body: formData,
        });

        if (response.ok) {
          const result = await response.json();
          
          setAttachments(prev => prev.map(att => 
            att.id === attachment.id 
              ? { 
                  ...att, 
                  progress: 100, 
                  status: 'completed' as const,
                  uploadedUrl: result.url,
                  uploadedId: result.id
                }
              : att
          ));
        } else {
          throw new Error('Upload failed');
        }
      } catch (error) {
        setAttachments(prev => prev.map(att => 
          att.id === attachment.id 
            ? { ...att, status: 'error' as const, error: 'Upload failed' }
            : att
        ));
      }
    }

    setIsUploading(false);
  };

  const removeAttachment = (id: string) => {
    setAttachments(prev => {
      const attachment = prev.find(att => att.id === id);
      if (attachment?.preview) {
        URL.revokeObjectURL(attachment.preview);
      }
      return prev.filter(att => att.id !== id);
    });
  };

  const handleSend = () => {
    const completedAttachments = attachments
      .filter(att => att.status === 'completed' && att.uploadedUrl)
      .map(att => ({
        id: att.uploadedId || att.id,
        type: att.type,
        url: att.uploadedUrl!,
        name: att.file.name,
        size: att.file.size,
        mimeType: att.file.type
      }));

    onAttachmentsUploaded(completedAttachments);
    handleClose();
  };

  const handleClose = () => {
    // Clean up object URLs
    attachments.forEach(att => {
      if (att.preview) {
        URL.revokeObjectURL(att.preview);
      }
    });
    setAttachments([]);
    setIsUploading(false);
    onClose();
  };

  const completedCount = attachments.filter(att => att.status === 'completed').length;
  const errorCount = attachments.filter(att => att.status === 'error').length;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Upload Attachments</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* File Input */}
          <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,.pdf,.doc,.docx,.txt,.zip,.rar"
              onChange={(e) => handleFileSelect(e.target.files)}
              className="hidden"
            />
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              <Upload className="h-4 w-4 mr-2" />
              Choose Files
            </Button>
            <p className="text-sm text-muted-foreground mt-2">
              Images, documents, and other files up to 10MB each
            </p>
          </div>

          {/* Attachments List */}
          {attachments.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium">Attachments ({attachments.length})</h4>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {attachments.map((attachment) => (
                  <div
                    key={attachment.id}
                    className="flex items-center space-x-3 p-3 border rounded-lg"
                  >
                    {/* Preview or Icon */}
                    <div className="flex-shrink-0">
                      {attachment.preview ? (
                        <img
                          src={attachment.preview}
                          alt={attachment.file.name}
                          className="h-10 w-10 object-cover rounded"
                        />
                      ) : (
                        <div className="h-10 w-10 bg-muted rounded flex items-center justify-center">
                          {getFileIcon(attachment.type)}
                        </div>
                      )}
                    </div>

                    {/* File Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {attachment.file.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(attachment.file.size)}
                      </p>
                      
                      {/* Progress Bar */}
                      {attachment.status === 'uploading' && (
                        <Progress value={attachment.progress} className="h-1 mt-1" />
                      )}
                      
                      {/* Status */}
                      {attachment.status === 'completed' && (
                        <div className="flex items-center text-xs text-green-600 mt-1">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Uploaded
                        </div>
                      )}
                      
                      {attachment.status === 'error' && (
                        <div className="flex items-center text-xs text-red-600 mt-1">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          {attachment.error}
                        </div>
                      )}
                    </div>

                    {/* Remove Button */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeAttachment(attachment.id)}
                      className="h-6 w-6 p-0"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              onClick={handleSend}
              disabled={completedCount === 0 || isUploading}
            >
              Send {completedCount > 0 && `(${completedCount})`}
            </Button>
          </div>

          {/* Status Summary */}
          {attachments.length > 0 && (
            <div className="text-xs text-muted-foreground">
              {completedCount} uploaded, {errorCount} failed
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
