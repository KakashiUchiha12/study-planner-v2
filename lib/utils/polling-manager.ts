// Polling manager for efficient and coordinated polling across the application
import { POLLING_CONFIG, getPollingInterval, getBackoffDelay } from '@/lib/config/polling-config';

export interface PollingOptions {
  interval: number;
  maxRetries?: number;
  retryDelay?: number;
  backoffMultiplier?: number;
  onSuccess?: () => void;
  onError?: (error: Error, attempt: number) => void;
  onRetry?: (attempt: number) => void;
}

export class PollingManager {
  private intervals: Map<string, NodeJS.Timeout> = new Map();
  private retryCounts: Map<string, number> = new Map();
  private isActive: Map<string, boolean> = new Map();
  private maxActivePolls = 5; // Limit concurrent polls to save memory

  /**
   * Start polling for a specific key
   */
  startPolling(
    key: string,
    pollFunction: () => Promise<void>,
    options: PollingOptions
  ): void {
    // Stop existing polling for this key
    this.stopPolling(key);

    // Limit concurrent polls to prevent memory issues
    if (this.intervals.size >= this.maxActivePolls) {
      // Stop the oldest poll to make room
      const oldestKey = this.intervals.keys().next().value;
      if (oldestKey) {
        this.stopPolling(oldestKey);
      }
    }

    const {
      interval,
      maxRetries = 2, // Reduced default retries
      retryDelay = 2000, // Increased delay
      onSuccess,
      onError,
      onRetry
    } = options;

    this.isActive.set(key, true);
    this.retryCounts.set(key, 0);

    const poll = async () => {
      if (!this.isActive.get(key)) return;

      try {
        await pollFunction();
        this.retryCounts.set(key, 0); // Reset retry count on success
        onSuccess?.();
      } catch (error) {
        const currentRetries = this.retryCounts.get(key) || 0;
        
        if (currentRetries < maxRetries) {
          this.retryCounts.set(key, currentRetries + 1);
          onRetry?.(currentRetries + 1);
          
          // Exponential backoff
          const delay = getBackoffDelay(currentRetries, retryDelay);
          setTimeout(() => {
            if (this.isActive.get(key)) {
              poll();
            }
          }, delay);
        } else {
          onError?.(error as Error, currentRetries);
          this.stopPolling(key);
        }
      }
    };

    // Start initial poll
    poll();

    // Set up interval
    const intervalId = setInterval(() => {
      if (this.isActive.get(key)) {
        poll();
      }
    }, getPollingInterval(interval));

    this.intervals.set(key, intervalId);
  }

  /**
   * Stop polling for a specific key
   */
  stopPolling(key: string): void {
    const intervalId = this.intervals.get(key);
    if (intervalId) {
      clearInterval(intervalId);
      this.intervals.delete(key);
    }
    this.isActive.set(key, false);
    this.retryCounts.delete(key);
  }

  /**
   * Stop all polling
   */
  stopAllPolling(): void {
    for (const [key] of this.intervals) {
      this.stopPolling(key);
    }
  }

  /**
   * Check if polling is active for a key
   */
  isPollingActive(key: string): boolean {
    return this.isActive.get(key) || false;
  }

  /**
   * Get retry count for a key
   */
  getRetryCount(key: string): number {
    return this.retryCounts.get(key) || 0;
  }

  /**
   * Get all active polling keys
   */
  getActiveKeys(): string[] {
    return Array.from(this.isActive.keys()).filter(key => this.isActive.get(key));
  }
}

// Global polling manager instance
export const pollingManager = new PollingManager();

// Helper functions for common polling patterns
export const startCommunityNotificationsPolling = (
  pollFunction: () => Promise<void>,
  onError?: (error: Error) => void
) => {
  pollingManager.startPolling('community-notifications', pollFunction, {
    interval: POLLING_CONFIG.COMMUNITY_NOTIFICATIONS.INTERVAL,
    maxRetries: POLLING_CONFIG.COMMUNITY_NOTIFICATIONS.MAX_RETRIES,
    retryDelay: POLLING_CONFIG.COMMUNITY_NOTIFICATIONS.RETRY_DELAY,
    onError: (error, attempt) => {
      console.error(`Community notifications polling failed (attempt ${attempt}):`, error);
      onError?.(error);
    }
  });
};

export const startCommunityChatPolling = (
  pollFunction: () => Promise<void>,
  onError?: (error: Error) => void
) => {
  pollingManager.startPolling('community-chat', pollFunction, {
    interval: POLLING_CONFIG.COMMUNITY_CHAT.INTERVAL,
    maxRetries: POLLING_CONFIG.COMMUNITY_CHAT.MAX_RETRIES,
    retryDelay: POLLING_CONFIG.COMMUNITY_CHAT.RETRY_DELAY,
    onError: (error, attempt) => {
      console.error(`Community chat polling failed (attempt ${attempt}):`, error);
      onError?.(error);
    }
  });
};

export const startConversationListPolling = (
  pollFunction: () => Promise<void>,
  onError?: (error: Error) => void
) => {
  pollingManager.startPolling('conversation-list', pollFunction, {
    interval: POLLING_CONFIG.CONVERSATION_LIST.INTERVAL,
    maxRetries: POLLING_CONFIG.CONVERSATION_LIST.MAX_RETRIES,
    retryDelay: POLLING_CONFIG.CONVERSATION_LIST.RETRY_DELAY,
    onError: (error, attempt) => {
      console.error(`Conversation list polling failed (attempt ${attempt}):`, error);
      onError?.(error);
    }
  });
};

export const startGlobalNavPolling = (
  pollFunction: () => Promise<void>,
  onError?: (error: Error) => void
) => {
  pollingManager.startPolling('global-nav', pollFunction, {
    interval: POLLING_CONFIG.GLOBAL_NAV.INTERVAL,
    maxRetries: POLLING_CONFIG.GLOBAL_NAV.MAX_RETRIES,
    retryDelay: POLLING_CONFIG.GLOBAL_NAV.RETRY_DELAY,
    onError: (error, attempt) => {
      console.error(`Global nav polling failed (attempt ${attempt}):`, error);
      onError?.(error);
    }
  });
};
