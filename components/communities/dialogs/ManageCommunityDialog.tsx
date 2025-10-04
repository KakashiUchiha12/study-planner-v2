'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings, Users, Shield, Trash2, Crown } from 'lucide-react';

interface ManageCommunityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  community: {
    id: string;
    name: string;
  };
  userRole?: string;
  onDeleteCommunity: () => void;
  onTransferOwnership: () => void;
  onManageMembers: () => void;
  onCommunitySettings: () => void;
}

export function ManageCommunityDialog({
  open,
  onOpenChange,
  community,
  userRole,
  onDeleteCommunity,
  onTransferOwnership,
  onManageMembers,
  onCommunitySettings,
}: ManageCommunityDialogProps) {
  const isOwner = userRole === 'owner';
  const isAdmin = userRole === 'admin' || isOwner;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-blue-500" />
            <DialogTitle>Manage Community</DialogTitle>
          </div>
          <DialogDescription>
            Manage settings and members for <strong>{community.name}</strong>
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="settings" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="settings">Settings</TabsTrigger>
            <TabsTrigger value="members">Members</TabsTrigger>
            <TabsTrigger value="danger">Danger Zone</TabsTrigger>
          </TabsList>
          
          <TabsContent value="settings" className="space-y-4">
            <div className="space-y-3">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => {
                  onCommunitySettings();
                  onOpenChange(false);
                }}
              >
                <Settings className="h-4 w-4 mr-2" />
                Community Settings
              </Button>
              
              {isAdmin && (
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => {
                    onManageMembers();
                    onOpenChange(false);
                  }}
                >
                  <Users className="h-4 w-4 mr-2" />
                  Manage Members
                </Button>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="members" className="space-y-4">
            <div className="space-y-3">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => {
                  onManageMembers();
                  onOpenChange(false);
                }}
              >
                <Users className="h-4 w-4 mr-2" />
                View All Members
              </Button>
              
              {isAdmin && (
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => {
                    onManageMembers();
                    onOpenChange(false);
                  }}
                >
                  <Shield className="h-4 w-4 mr-2" />
                  Manage Permissions
                </Button>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="danger" className="space-y-4">
            <div className="space-y-3">
              {isOwner && (
                <>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-amber-600 hover:text-amber-700"
                    onClick={() => {
                      onTransferOwnership();
                      onOpenChange(false);
                    }}
                  >
                    <Crown className="h-4 w-4 mr-2" />
                    Transfer Ownership
                  </Button>
                  
                  <Button
                    variant="destructive"
                    className="w-full justify-start"
                    onClick={() => {
                      onDeleteCommunity();
                      onOpenChange(false);
                    }}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Community
                  </Button>
                </>
              )}
              
              {!isOwner && (
                <p className="text-sm text-muted-foreground">
                  Only community owners can access danger zone actions.
                </p>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
