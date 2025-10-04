"use client"

import React from 'react';
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { CheckCircle, XCircle, AlertCircle, Info } from 'lucide-react';

interface MessageDialogProps {
  open: boolean;
  onClose: () => void;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  buttonText?: string;
}

export function MessageDialog({ 
  open, 
  onClose, 
  type, 
  title, 
  message, 
  buttonText = 'OK' 
}: MessageDialogProps) {
  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-6 w-6 text-green-600" />;
      case 'error':
        return <XCircle className="h-6 w-6 text-red-600" />;
      case 'warning':
        return <AlertCircle className="h-6 w-6 text-yellow-600" />;
      case 'info':
        return <Info className="h-6 w-6 text-blue-600" />;
      default:
        return <Info className="h-6 w-6 text-blue-600" />;
    }
  };

  const getTitleColor = () => {
    switch (type) {
      case 'success':
        return 'text-green-800';
      case 'error':
        return 'text-red-800';
      case 'warning':
        return 'text-yellow-800';
      case 'info':
        return 'text-blue-800';
      default:
        return 'text-blue-800';
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            {getIcon()}
            <AlertDialogTitle className={getTitleColor()}>
              {title}
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-left">
            {message}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction onClick={onClose}>
            {buttonText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
