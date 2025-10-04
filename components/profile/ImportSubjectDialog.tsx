"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { BookOpen, Download, AlertCircle } from 'lucide-react';

interface PublicSubject {
  id: string;
  name: string;
  code?: string;
  instructor?: string;
  description?: string;
  visibility: string;
  color: string;
  credits: number;
  totalChapters: number;
  _count: {
    chapters: number;
    materials: number;
    files: number;
  };
}

interface ImportSubjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subject: PublicSubject | null;
  onImportSuccess: () => void;
}

export function ImportSubjectDialog({
  open,
  onOpenChange,
  subject,
  onImportSuccess,
}: ImportSubjectDialogProps) {
  const [isImporting, setIsImporting] = useState(false);

  if (!subject) return null;

  const handleImport = async () => {
    setIsImporting(true);
    try {
      const response = await fetch('/api/subjects/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sourceSubjectId: subject.id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(`Failed to import subject: ${data.error}`);
        return;
      }

      alert('Subject imported successfully!');
      onImportSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Error importing subject:', error);
      alert('An error occurred while importing the subject');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Import Subject
          </DialogTitle>
          <DialogDescription>
            This will import "{subject.name}" to your subjects. All chapters, materials, and files will be copied, but your progress will start fresh.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Subject Details */}
          <div className="rounded-lg border p-4">
            <div className="flex items-center gap-3 mb-3">
              <div 
                className="w-4 h-4 rounded-full" 
                style={{ backgroundColor: subject.color || '#3B82F6' }}
              />
              <h3 className="font-semibold text-lg">{subject.name}</h3>
            </div>
            
            {subject.code && (
              <p className="text-sm text-muted-foreground mb-1">
                <strong>Code:</strong> {subject.code}
              </p>
            )}
            
            {subject.instructor && (
              <p className="text-sm text-muted-foreground mb-1">
                <strong>Instructor:</strong> {subject.instructor}
              </p>
            )}
            
            {subject.description && (
              <p className="text-sm text-muted-foreground mb-3">
                <strong>Description:</strong> {subject.description}
              </p>
            )}

            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <BookOpen className="h-3 w-3" />
                <span>{subject._count?.chapters || 0} chapters</span>
              </div>
              <div className="flex items-center gap-1">
                <BookOpen className="h-3 w-3" />
                <span>{subject._count?.materials || 0} materials</span>
              </div>
              <div className="flex items-center gap-1">
                <BookOpen className="h-3 w-3" />
                <span>{subject._count?.files || 0} files</span>
              </div>
            </div>
          </div>

          {/* Warning */}
          <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-amber-800">
              <p className="font-medium mb-1">Important:</p>
              <ul className="space-y-1 text-xs">
                <li>• All chapters, materials, and files will be copied to your account</li>
                <li>• Your progress will start from 0%</li>
                <li>• The subject will be added to your subjects list</li>
                <li>• You can edit and customize it after importing</li>
              </ul>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isImporting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleImport}
            disabled={isImporting}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isImporting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Importing...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Import Subject
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
