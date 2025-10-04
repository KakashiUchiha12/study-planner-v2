'use client';

import { useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import socketIOClient from '@/lib/socketio-client';

// Global authentication state to prevent multiple authentication calls
let globalAuthState = {
  isAuthenticating: false,
  authenticatedUserId: null as string | null,
  lastAuthTime: 0
};

export function useSocketIOAuth() {
  const { data: session } = useSession();
  const authAttempted = useRef(false);

  useEffect(() => {
    if (!session?.user || !socketIOClient) {
      return;
    }

    const userId = (session.user as any).id;
    const now = Date.now();
    
    // Prevent multiple authentication calls within 5 seconds
    if (globalAuthState.isAuthenticating && (now - globalAuthState.lastAuthTime) < 5000) {
      console.log('🔌 useSocketIOAuth: Authentication already in progress, skipping');
      return;
    }

    // If already authenticated as the same user, skip
    if (globalAuthState.authenticatedUserId === userId) {
      console.log('🔌 useSocketIOAuth: Already authenticated as', userId, ', skipping');
      return;
    }

    // If this hook instance already attempted authentication, skip
    if (authAttempted.current) {
      console.log('🔌 useSocketIOAuth: Authentication already attempted by this hook instance');
      return;
    }

    console.log('🔌 useSocketIOAuth: Authenticating user:', userId);
    globalAuthState.isAuthenticating = true;
    globalAuthState.lastAuthTime = now;
    authAttempted.current = true;

    socketIOClient.authenticate(userId);

    // Reset authentication state after a delay
    setTimeout(() => {
      globalAuthState.isAuthenticating = false;
    }, 2000);

  }, [session?.user]);

  // Update global state when authentication succeeds
  useEffect(() => {
    const handleAuthSuccess = (data: { userId: string }) => {
      globalAuthState.authenticatedUserId = data.userId;
      globalAuthState.isAuthenticating = false;
      console.log('🔌 useSocketIOAuth: Authentication successful for user:', data.userId);
    };

    // Listen for authentication success
    if (socketIOClient && socketIOClient.socket) {
      socketIOClient.socket.on('authenticated', handleAuthSuccess);
      
      return () => {
        if (socketIOClient && socketIOClient.socket) {
          socketIOClient.socket.off('authenticated', handleAuthSuccess);
        }
      };
    }
  }, []);

  return {
    isAuthenticated: !!globalAuthState.authenticatedUserId,
    userId: globalAuthState.authenticatedUserId
  };
}
