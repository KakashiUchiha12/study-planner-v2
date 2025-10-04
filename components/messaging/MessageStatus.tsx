'use client';

import { Check, CheckCheck, Clock, AlertCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useEffect, useState } from 'react';

interface MessageStatusProps {
  status: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
  readAt?: string;
  sentAt?: string;
  deliveredAt?: string;
  isCurrentUser?: boolean;
  messageId?: string;
}

export function MessageStatus({ 
  status, 
  readAt, 
  sentAt, 
  deliveredAt, 
  isCurrentUser = false,
  messageId
}: MessageStatusProps) {
  const [currentStatus, setCurrentStatus] = useState(status);
  const [showTooltip, setShowTooltip] = useState(false);

  // Update status when props change
  useEffect(() => {
    setCurrentStatus(status);
  }, [status]);

  if (!isCurrentUser) return null;

  const getStatusIcon = () => {
    switch (currentStatus) {
      case 'sending':
        return <Clock className="h-3 w-3 text-muted-foreground animate-pulse" />;
      case 'sent':
        return <Check className="h-3 w-3 text-muted-foreground" />;
      case 'delivered':
        return <CheckCheck className="h-3 w-3 text-muted-foreground" />;
      case 'read':
        return <CheckCheck className="h-3 w-3 text-blue-500" />;
      case 'failed':
        return <AlertCircle className="h-3 w-3 text-red-500" />;
      default:
        return <Check className="h-3 w-3 text-muted-foreground" />;
    }
  };

  const getStatusText = () => {
    switch (currentStatus) {
      case 'sending':
        return 'Sending...';
      case 'sent':
        return sentAt ? `Sent ${formatDistanceToNow(new Date(sentAt), { addSuffix: true })}` : 'Sent';
      case 'delivered':
        return deliveredAt ? `Delivered ${formatDistanceToNow(new Date(deliveredAt), { addSuffix: true })}` : 'Delivered';
      case 'read':
        return readAt ? `Read ${formatDistanceToNow(new Date(readAt), { addSuffix: true })}` : 'Read';
      case 'failed':
        return 'Failed to send';
      default:
        return 'Sent';
    }
  };

  const getStatusColor = () => {
    switch (currentStatus) {
      case 'sending':
        return 'text-muted-foreground';
      case 'sent':
        return 'text-muted-foreground';
      case 'delivered':
        return 'text-muted-foreground';
      case 'read':
        return 'text-blue-500';
      case 'failed':
        return 'text-red-500';
      default:
        return 'text-muted-foreground';
    }
  };

  return (
    <div 
      className="flex items-center space-x-1 text-xs cursor-pointer"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {getStatusIcon()}
      {showTooltip && (
        <div className="absolute bottom-full mb-1 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap z-10">
          {getStatusText()}
        </div>
      )}
    </div>
  );
}