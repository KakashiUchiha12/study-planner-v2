'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UserDisplay } from '@/components/ui/UserDisplay';
import { Badge } from '@/components/ui/badge';
import { Users, Crown, Shield, User } from 'lucide-react';

interface Member {
  id: string;
  userId: string;
  role: string;
  status: string;
  joinedAt: string;
  user: {
    id: string;
    name: string;
    image?: string;
  };
}

interface CommunityMembersProps {
  communityId: string;
}

export function CommunityMembers({ communityId }: CommunityMembersProps) {
  const router = useRouter();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/communities/${communityId}/members`);
        if (response.ok) {
          const data = await response.json();
          setMembers(data.members || []);
        } else {
          console.error('Failed to fetch community members');
        }
      } catch (error) {
        console.error('Error fetching community members:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMembers();
  }, [communityId]);

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner':
        return <Crown className="h-3 w-3" />;
      case 'admin':
        return <Shield className="h-3 w-3" />;
      default:
        return <User className="h-3 w-3" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'owner':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'admin':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'moderator':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const handleMemberClick = (userId: string) => {
    router.push(`/profile/${userId}`);
  };

  const displayedMembers = showAll ? members : members.slice(0, 4);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>Members</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-center space-x-3">
              <div className="h-8 w-8 bg-muted animate-pulse rounded-full" />
              <div className="flex-1 space-y-1">
                <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                <div className="h-3 w-16 bg-muted animate-pulse rounded" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Users className="h-5 w-5" />
          <span>Members ({members.length})</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {displayedMembers.length === 0 ? (
          <p className="text-muted-foreground text-sm">No members found</p>
        ) : (
          <>
            {displayedMembers.map((member) => (
              <div 
                key={member.id} 
                className="flex items-center space-x-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <UserDisplay 
                  user={member.user} 
                  size="md" 
                  clickable={true}
                  className="flex-1"
                />
                <div className="flex items-center space-x-2">
                  <Badge 
                    variant="outline" 
                    className={`text-xs ${getRoleColor(member.role)}`}
                  >
                    {getRoleIcon(member.role)}
                    <span className="ml-1 capitalize">{member.role}</span>
                  </Badge>
                </div>
              </div>
            ))}
            
            {members.length > 4 && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowAll(!showAll)}
                className="w-full"
              >
                {showAll ? 'Show Less' : `Show More (${members.length - 4} more)`}
              </Button>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
