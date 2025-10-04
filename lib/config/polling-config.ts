// Centralized polling configuration for the application
export const POLLING_CONFIG = {
  // Community message notifications polling
  COMMUNITY_NOTIFICATIONS: {
    INTERVAL: 30000, // 30 seconds - much less frequent to save memory
    ENABLED: true,
    MAX_RETRIES: 2,
    RETRY_DELAY: 2000
  },

  // Community chat messages polling
  COMMUNITY_CHAT: {
    INTERVAL: 15000, // 15 seconds - reduced frequency
    ENABLED: true,
    MAX_RETRIES: 2,
    RETRY_DELAY: 2000
  },

  // Conversation list polling
  CONVERSATION_LIST: {
    INTERVAL: 20000, // 20 seconds
    ENABLED: true,
    MAX_RETRIES: 2,
    RETRY_DELAY: 2000
  },

  // Message list polling
  MESSAGE_LIST: {
    INTERVAL: 10000, // 10 seconds
    ENABLED: true,
    MAX_RETRIES: 2,
    RETRY_DELAY: 2000
  },

  // Global navigation polling
  GLOBAL_NAV: {
    INTERVAL: 60000, // 60 seconds - much less frequent
    ENABLED: true,
    MAX_RETRIES: 2,
    RETRY_DELAY: 2000
  },

  // Global settings
  GLOBAL: {
    CACHE_BUSTING: true,
    CONCURRENT_REQUESTS: 2, // Reduced concurrent requests
    TIMEOUT: 5000, // 5 seconds - reduced timeout
    BACKOFF_MULTIPLIER: 1.5
  }
} as const;

// Helper function to get polling interval with jitter to prevent thundering herd
export function getPollingInterval(baseInterval: number, jitter: number = 0.1): number {
  const jitterAmount = baseInterval * jitter;
  const randomJitter = (Math.random() - 0.5) * 2 * jitterAmount;
  return Math.max(1000, baseInterval + randomJitter); // Minimum 1 second
}

// Helper function to create exponential backoff delay
export function getBackoffDelay(attempt: number, baseDelay: number = 1000): number {
  return Math.min(baseDelay * Math.pow(POLLING_CONFIG.GLOBAL.BACKOFF_MULTIPLIER, attempt), 30000);
}

// Helper function to create fetch options with cache busting
export function getFetchOptions(additionalHeaders: Record<string, string> = {}): RequestInit {
  const headers: Record<string, string> = {
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache',
    ...additionalHeaders
  };

  return {
    method: 'GET',
    headers
  };
}
