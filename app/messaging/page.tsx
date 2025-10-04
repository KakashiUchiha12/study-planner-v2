'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import { ConversationList } from '@/components/messaging/ConversationList';
import { MessageList } from '@/components/messaging/MessageList';
import { MessageInput } from '@/components/messaging/MessageInput';
import { ConversationHeader } from '@/components/messaging/ConversationHeader';
import { NewConversationDialog } from '@/components/messaging/NewConversationDialog';
import { ConversationInfoDialog } from '@/components/messaging/ConversationInfoDialog';
import { GroupSettingsDialog } from '@/components/messaging/GroupSettingsDialog';
import { UserSearch } from '@/components/messaging/UserSearch';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  MessageCircle, 
  Plus, 
  Users,
  User,
  Search,
  ArrowLeft
} from 'lucide-react';

interface Message {
  id: string;
  content: string;
  sender: {
    id: string;
    name: string;
    image?: string;
  };
}

interface Conversation {
  id: string;
  type: string;
  name?: string;
  description?: string;
  avatar?: string;
  participants: Array<{
    id: string;
    role: string;
    user: {
      id: string;
      name: string;
      image?: string;
    };
  }>;
  createdBy: {
    id: string;
    name: string;
    image?: string;
  };
}

export default function MessagingPage() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [replyToMessage, setReplyToMessage] = useState<Message | null>(null);
  const [showNewConversation, setShowNewConversation] = useState(false);
  const [showGroupSettings, setShowGroupSettings] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showMessages, setShowMessages] = useState(false);

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (selectedConversationId) {
      fetchConversationDetails(selectedConversationId);
      // On mobile, show messages when conversation is selected
      if (isMobile) {
        setShowMessages(true);
      }
    }
  }, [selectedConversationId, isMobile]);

  // Handle conversation parameter from URL
  useEffect(() => {
    const conversationId = searchParams.get('conversation');
    if (conversationId) {
      setSelectedConversationId(conversationId);
    }
  }, [searchParams]);

  const fetchConversationDetails = async (conversationId: string) => {
    try {
      const response = await fetch(`/api/messaging/conversations/${conversationId}`);
      if (response.ok) {
        const conversation = await response.json();
        setSelectedConversation(conversation);
      }
    } catch (error) {
      console.error('Error fetching conversation details:', error);
    }
  };

  const handleConversationSelect = (conversationId: string) => {
    setSelectedConversationId(conversationId);
    setReplyToMessage(null);
  };

  const handleBackToConversations = () => {
    if (isMobile) {
      setShowMessages(false);
      setSelectedConversationId(null);
      setSelectedConversation(null);
    }
  };

  const handleNewConversation = () => {
    setShowNewConversation(true);
  };

  const handleConversationCreated = (conversationId: string) => {
    setSelectedConversationId(conversationId);
    setShowNewConversation(false);
  };

  const handleMessageSent = (message: any) => {
    console.log('🔔 MessagingPage: Message sent callback received:', message.id);
    
    // Add the message to the MessageList immediately (since Socket.IO is not working)
    if ((window as any).messageListHandler) {
      console.log('🔔 MessagingPage: Adding message to MessageList immediately');
      (window as any).messageListHandler(message);
    } else {
      console.log('🔔 MessagingPage: MessageList handler not available');
    }
  };

  const handleReplyToMessage = (message: Message) => {
    setReplyToMessage(message);
  };

  const handleCancelReply = () => {
    setReplyToMessage(null);
  };

  const handleEditMessage = (message: Message) => {
    // TODO: Implement message editing
    console.log('Edit message:', message);
  };

  const handleDeleteMessage = async (messageId: string) => {
    try {
      const response = await fetch(`/api/messaging/messages/${messageId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Refresh messages will be handled by MessageList component
        console.log('Message deleted');
      }
    } catch (error) {
      console.error('Error deleting message:', error);
    }
  };

  const handleViewInfo = () => {
    // This will be handled by the ConversationInfoDialog component
  };

  const handleConversationUpdate = (updatedConversation: Conversation) => {
    setSelectedConversation(updatedConversation);
  };

  const handleDeleteConversation = () => {
    setSelectedConversationId(null);
    setSelectedConversation(null);
  };

  const handleGroupSettings = () => {
    setShowGroupSettings(true);
  };

  const handleSearchMessages = () => {
    // TODO: Open message search
    console.log('Search messages');
  };

  const handleArchiveConversation = () => {
    // TODO: Archive conversation
    console.log('Archive conversation');
  };


  if (!session?.user) {
    return (
      <div className="flex items-center justify-center h-full">
        <Card>
          <CardContent className="p-6 text-center">
            <MessageCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-lg font-semibold mb-2">Please sign in</h2>
            <p className="text-muted-foreground">
              You need to be signed in to access messaging.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full overflow-hidden">
      {/* Left sidebar - Conversation list */}
      <div className={`${isMobile ? (showMessages ? 'hidden' : 'w-full') : 'w-96 min-w-96 max-w-96'} border-r bg-background flex flex-col overflow-hidden flex-shrink-0`}>
        <ConversationList
          selectedConversationId={selectedConversationId || undefined}
          onConversationSelect={handleConversationSelect}
          onNewConversation={handleNewConversation}
          onConversationCreated={handleConversationCreated}
        />
      </div>

      {/* Right side - Chat area */}
      <div className={`${isMobile ? (showMessages ? 'w-full' : 'hidden') : 'flex-1'} min-w-0 flex flex-col overflow-hidden`}>
        {/* Header with back button */}
        <div className="h-16 border-b bg-background flex items-center px-4">
          {isMobile && showMessages ? (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2"
              onClick={handleBackToConversations}
              title="Back to Conversations"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              <span className="text-xs">Back</span>
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2"
              onClick={() => window.location.href = '/social'}
              title="Back to Social Feed"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              <span className="text-xs">Social</span>
            </Button>
          )}
        </div>

        {selectedConversationId ? (
          <>
            {/* Conversation-specific header */}
            <ConversationHeader
              conversation={selectedConversation}
              currentUserId={session.user.id}
              onViewInfo={handleViewInfo}
              onSearchMessages={handleSearchMessages}
              onArchiveConversation={handleArchiveConversation}
              onDeleteConversation={handleDeleteConversation}
              onGroupSettings={handleGroupSettings}
            />
            
            {/* Conversation Info Dialog */}
            <ConversationInfoDialog
              conversation={selectedConversation}
              currentUserId={session.user.id}
              onConversationUpdate={handleConversationUpdate}
              onDeleteConversation={handleDeleteConversation}
            />

            {/* Messages */}
            <MessageList
              conversationId={selectedConversationId}
              currentUserId={session.user.id}
              onReplyToMessage={handleReplyToMessage}
              onEditMessage={handleEditMessage}
              onDeleteMessage={handleDeleteMessage}
              onNewMessage={handleMessageSent}
            />

            {/* Message input */}
            <MessageInput
              conversationId={selectedConversationId}
              onMessageSent={handleMessageSent}
              replyToMessage={replyToMessage}
              onCancelReply={handleCancelReply}
            />
          </>
        ) : (
          /* Empty state */
          <div className="flex-1 flex items-center justify-center">
            <Card>
              <CardContent className="p-8 text-center">
                <MessageCircle className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <h2 className="text-xl font-semibold mb-2">Welcome to Messages</h2>
                <p className="text-muted-foreground mb-6 max-w-sm">
                  Start a conversation with your study partners, classmates, or create study groups to collaborate.
                </p>
                <div className="space-y-3">
                  <NewConversationDialog
                    onConversationCreated={handleConversationCreated}
                    trigger={
                      <Button className="w-full">
                        <Plus className="h-4 w-4 mr-2" />
                        Start New Conversation
                      </Button>
                    }
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <UserSearch
                      onUserSelect={(user) => {
                        // Create direct conversation with selected user
                        handleConversationCreated('temp'); // This will be replaced with actual conversation creation
                      }}
                      placeholder="Quick message..."
                      className="w-full"
                    />
                    <Button variant="outline" size="sm">
                      <Users className="h-4 w-4 mr-2" />
                      Study Group
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Group Settings Dialog */}
        <GroupSettingsDialog
          open={showGroupSettings}
          onOpenChange={setShowGroupSettings}
          conversation={selectedConversation}
          onUpdateConversation={handleConversationUpdate}
        />
      </div>
    </div>
  );
}
