'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Users, 
  Search, 
  Crown, 
  Shield, 
  User, 
  MoreVertical,
  UserPlus,
  UserMinus,
  ShieldCheck,
  ShieldX,
  Ban,
  MessageSquare
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface Member {
  id: string;
  userId: string;
  role: 'owner' | 'admin' | 'moderator' | 'member';
  status: 'active' | 'pending' | 'banned';
  joinedAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    image?: string;
  };
}

interface MemberManagementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  communityId: string;
  currentUserRole: 'owner' | 'admin' | 'moderator' | 'member';
  onMemberUpdated: () => void;
}

export function MemberManagementDialog({
  open,
  onOpenChange,
  communityId,
  currentUserRole,
  onMemberUpdated,
}: MemberManagementDialogProps) {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      fetchMembers();
    }
  }, [open, communityId]);

  const fetchMembers = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/communities/${communityId}/members?limit=100`);
      if (response.ok) {
        const data = await response.json();
        setMembers(data.members || []);
      } else {
        console.error('Failed to fetch members');
      }
    } catch (error) {
      console.error('Error fetching members:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (memberId: string, newRole: string) => {
    if (newRole === 'owner') {
      alert('Transferring ownership is not implemented yet.');
      return;
    }

    setActionLoading(memberId);
    try {
      const response = await fetch(`/api/communities/${communityId}/members/${memberId}/role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role: newRole }),
      });

      if (response.ok) {
        setMembers(prev => prev.map(member => 
          member.id === memberId ? { ...member, role: newRole as any } : member
        ));
        onMemberUpdated();
      } else {
        const error = await response.json();
        alert(`Failed to update role: ${error.error}`);
      }
    } catch (error) {
      console.error('Error updating member role:', error);
      alert('An error occurred while updating the member role.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm('Are you sure you want to remove this member?')) {
      return;
    }

    setActionLoading(memberId);
    try {
      const response = await fetch(`/api/communities/${communityId}/members/${memberId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setMembers(prev => prev.filter(member => member.id !== memberId));
        onMemberUpdated();
      } else {
        const error = await response.json();
        alert(`Failed to remove member: ${error.error}`);
      }
    } catch (error) {
      console.error('Error removing member:', error);
      alert('An error occurred while removing the member.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleBanMember = async (memberId: string) => {
    if (!confirm('Are you sure you want to ban this member?')) {
      return;
    }

    setActionLoading(memberId);
    try {
      const response = await fetch(`/api/communities/${communityId}/members/${memberId}/ban`, {
        method: 'PUT',
      });

      if (response.ok) {
        setMembers(prev => prev.map(member => 
          member.id === memberId ? { ...member, status: 'banned' } : member
        ));
        onMemberUpdated();
      } else {
        const error = await response.json();
        alert(`Failed to ban member: ${error.error}`);
      }
    } catch (error) {
      console.error('Error banning member:', error);
      alert('An error occurred while banning the member.');
    } finally {
      setActionLoading(null);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner':
        return <Crown className="h-4 w-4 text-yellow-500" />;
      case 'admin':
        return <Shield className="h-4 w-4 text-blue-500" />;
      case 'moderator':
        return <ShieldCheck className="h-4 w-4 text-green-500" />;
      default:
        return <User className="h-4 w-4 text-gray-500" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'owner':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'admin':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'moderator':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'banned':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const canManageMember = (member: Member) => {
    if (currentUserRole === 'owner') return true;
    if (currentUserRole === 'admin') return member.role !== 'owner' && member.role !== 'admin';
    if (currentUserRole === 'moderator') return member.role === 'member';
    return false;
  };

  const filteredMembers = members.filter(member => {
    const matchesSearch = member.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || member.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || member.status === statusFilter;
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-500" />
            <DialogTitle>Manage Members</DialogTitle>
          </div>
          <DialogDescription>
            Manage community members, roles, and permissions
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search members..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="owner">Owner</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="moderator">Moderator</SelectItem>
                <SelectItem value="member">Member</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="banned">Banned</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Members List */}
          <div className="space-y-2">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                <p className="text-muted-foreground mt-2">Loading members...</p>
              </div>
            ) : filteredMembers.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No members found</p>
              </div>
            ) : (
              filteredMembers.map((member) => (
                <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={member.user.image} alt={member.user.name} />
                      <AvatarFallback>
                        {member.user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{member.user.name}</h4>
                        {getRoleIcon(member.role)}
                      </div>
                      <p className="text-sm text-muted-foreground">{member.user.email}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className={getRoleColor(member.role)}>
                          {member.role}
                        </Badge>
                        <Badge variant="outline" className={getStatusColor(member.status)}>
                          {member.status}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {canManageMember(member) && (
                      <>
                        <Select
                          value={member.role}
                          onValueChange={(value) => handleRoleChange(member.id, value)}
                          disabled={actionLoading === member.id}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="member">Member</SelectItem>
                            <SelectItem value="moderator">Moderator</SelectItem>
                            {currentUserRole === 'owner' && (
                              <SelectItem value="admin">Admin</SelectItem>
                            )}
                          </SelectContent>
                        </Select>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" disabled={actionLoading === member.id}>
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {member.status === 'banned' ? (
                              <DropdownMenuItem
                                onClick={() => handleBanMember(member.id)}
                                className="text-green-600"
                              >
                                <UserPlus className="h-4 w-4 mr-2" />
                                Unban Member
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem
                                onClick={() => handleBanMember(member.id)}
                                className="text-red-600"
                              >
                                <Ban className="h-4 w-4 mr-2" />
                                Ban Member
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleRemoveMember(member.id)}
                              className="text-red-600"
                            >
                              <UserMinus className="h-4 w-4 mr-2" />
                              Remove Member
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
