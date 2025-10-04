'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Edit, Trash2, Settings } from 'lucide-react';

interface Channel {
  id: string;
  name: string;
  description?: string;
  type: 'text' | 'voice' | 'announcement';
  isPrivate: boolean;
}

interface ChannelSettingsDialogProps {
  channel: Channel | null;
  isOpen: boolean;
  onClose: () => void;
  onChannelUpdated: () => void;
  onChannelDeleted: () => void;
  userRole: string;
}

export function ChannelSettingsDialog({
  channel,
  isOpen,
  onClose,
  onChannelUpdated,
  onChannelDeleted,
  userRole
}: ChannelSettingsDialogProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'text' as 'text' | 'voice' | 'announcement',
    isPrivate: false
  });

  // Check if user can edit/delete channels
  const canEdit = ['admin', 'moderator', 'owner'].includes(userRole);
  const canDelete = ['admin', 'owner'].includes(userRole);

  const handleEdit = () => {
    if (channel) {
      setFormData({
        name: channel.name,
        description: channel.description || '',
        type: channel.type,
        isPrivate: channel.isPrivate
      });
      setIsEditing(true);
    }
  };

  const handleSave = async () => {
    if (!channel) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/communities/channels/${channel.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        onChannelUpdated();
        setIsEditing(false);
        onClose();
      } else {
        const errorData = await response.json();
        alert(`Failed to update channel: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Error updating channel:', error);
      alert('Failed to update channel');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!channel) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/communities/channels/${channel.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        onChannelDeleted();
        setIsDeleting(false);
        onClose();
      } else {
        const errorData = await response.json();
        alert(`Failed to delete channel: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Error deleting channel:', error);
      alert('Failed to delete channel');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setIsEditing(false);
    setIsDeleting(false);
    onClose();
  };

  if (!channel) return null;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Channel Settings
            </DialogTitle>
          </DialogHeader>

          {!isEditing ? (
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Channel Name</Label>
                <p className="text-sm text-gray-600">{channel.name}</p>
              </div>

              <div>
                <Label className="text-sm font-medium">Description</Label>
                <p className="text-sm text-gray-600">
                  {channel.description || 'No description'}
                </p>
              </div>

              <div>
                <Label className="text-sm font-medium">Type</Label>
                <p className="text-sm text-gray-600 capitalize">{channel.type}</p>
              </div>

              <div>
                <Label className="text-sm font-medium">Privacy</Label>
                <p className="text-sm text-gray-600">
                  {channel.isPrivate ? 'Private' : 'Public'}
                </p>
              </div>

              <div className="flex gap-2 pt-4">
                {canEdit && (
                  <Button onClick={handleEdit} variant="outline" className="flex-1">
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Channel
                  </Button>
                )}
                {canDelete && (
                  <Button 
                    onClick={() => setIsDeleting(true)} 
                    variant="destructive" 
                    className="flex-1"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Channel
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Channel Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter channel name"
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter channel description"
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="type">Channel Type</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value: 'text' | 'voice' | 'announcement') => 
                    setFormData(prev => ({ ...prev, type: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text">Text</SelectItem>
                    <SelectItem value="voice">Voice</SelectItem>
                    <SelectItem value="announcement">Announcement</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="private"
                  checked={formData.isPrivate}
                  onCheckedChange={(checked) => 
                    setFormData(prev => ({ ...prev, isPrivate: checked }))
                  }
                />
                <Label htmlFor="private">Private Channel</Label>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={loading}>
                  {loading ? 'Saving...' : 'Save Changes'}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleting} onOpenChange={setIsDeleting}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Channel</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the channel "{channel.name}"? This action cannot be undone.
              All messages in this channel will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
              disabled={loading}
            >
              {loading ? 'Deleting...' : 'Delete Channel'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
