// Hook to handle cleanup of all polling when user logs out or app closes
import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { pollingManager } from '@/lib/utils/polling-manager';

export function usePollingCleanup() {
  const { status } = useSession();

  useEffect(() => {
    // Stop all polling when user logs out
    if (status === 'unauthenticated') {
      console.log('🔄 Polling cleanup: User logged out, stopping all polling');
      pollingManager.stopAllPolling();
    }
  }, [status]);

  useEffect(() => {
    // Cleanup on page unload
    const handleBeforeUnload = () => {
      console.log('🔄 Polling cleanup: Page unloading, stopping all polling');
      pollingManager.stopAllPolling();
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        console.log('🔄 Polling cleanup: Page hidden, stopping all polling');
        pollingManager.stopAllPolling();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);
}
