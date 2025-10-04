'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  ExternalLink, 
  Globe, 
  Github, 
  Twitter, 
  Youtube, 
  Instagram, 
  Facebook, 
  Linkedin,
  MessageSquare,
  Calendar,
  FileText,
  Users,
  Settings,
  Plus
} from 'lucide-react';

interface CommunityLink {
  text: string;
  url: string;
}

interface CommunityLinksProps {
  links: CommunityLink[];
  isOwner?: boolean;
}

const ICON_MAP = {
  globe: Globe,
  github: Github,
  twitter: Twitter,
  youtube: Youtube,
  instagram: Instagram,
  facebook: Facebook,
  linkedin: Linkedin,
  message: MessageSquare,
  calendar: Calendar,
  file: FileText,
  users: Users,
  settings: Settings,
  plus: Plus,
  external: ExternalLink,
};

export function CommunityLinks({ 
  links = [], 
  isOwner = false
}: CommunityLinksProps) {
  const [showAllLinks, setShowAllLinks] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Check if mobile
  useState(() => {
    setIsMobile(window.innerWidth < 768);
  });

  const handleLinkClick = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const getIcon = (url: string) => {
    // Simple icon detection based on URL
    if (url.includes('discord')) return <MessageSquare className="h-4 w-4" />;
    if (url.includes('youtube')) return <Youtube className="h-4 w-4" />;
    if (url.includes('github')) return <Github className="h-4 w-4" />;
    if (url.includes('twitter') || url.includes('x.com')) return <Twitter className="h-4 w-4" />;
    if (url.includes('instagram')) return <Instagram className="h-4 w-4" />;
    if (url.includes('facebook')) return <Facebook className="h-4 w-4" />;
    if (url.includes('linkedin')) return <Linkedin className="h-4 w-4" />;
    return <ExternalLink className="h-4 w-4" />;
  };

  // Filter out empty links
  const validLinks = links.filter(link => link.text.trim() && link.url.trim());
  
  if (validLinks.length === 0) {
    return null;
  }

  const firstLink = validLinks[0];
  const remainingLinks = validLinks.slice(1);

  return (
    <div className="mt-4">
      <div className="flex items-center gap-2">
        {/* First Link */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleLinkClick(firstLink.url)}
          className="flex items-center gap-2"
        >
          {getIcon(firstLink.url)}
          {firstLink.text}
        </Button>

        {/* +Links indicator */}
        {remainingLinks.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAllLinks(true)}
            className="text-muted-foreground hover:text-foreground"
          >
            +{remainingLinks.length} links
          </Button>
        )}
      </div>

      {/* Links Dialog */}
      <Dialog open={showAllLinks} onOpenChange={setShowAllLinks}>
        <DialogContent className={isMobile ? "max-w-[95vw] h-[90vh]" : "max-w-md"}>
          <DialogHeader>
            <DialogTitle>Community Links</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-3">
            {validLinks.map((link, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <Button
                  variant="ghost"
                  onClick={() => handleLinkClick(link.url)}
                  className="flex items-center gap-3 justify-start flex-1"
                >
                  {getIcon(link.url)}
                  <span className="font-medium">{link.text}</span>
                </Button>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
