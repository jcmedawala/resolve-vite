import { StreamVideoClient, User } from '@stream-io/video-react-sdk';

const apiKey = import.meta.env.VITE_STREAM_API_KEY;

if (!apiKey) {
  throw new Error('Stream API key not found. Please add VITE_STREAM_API_KEY to your .env.local file.');
}

let client: StreamVideoClient | null = null;
let currentUserId: string | null = null;

/**
 * Get or create Stream Video client (singleton pattern like Stream's example)
 * This prevents multiple client instances and handles reconnection
 */
export const getStreamClient = (user: User, token: string): StreamVideoClient => {
  // If client exists with same user, return it
  if (client && currentUserId === user.id) {
    console.log('[Stream] Reusing existing client for user:', user.id);
    return client;
  }

  // If client exists but different user, disconnect old one first
  if (client) {
    console.log('[Stream] Disconnecting previous client');
    try {
      client.disconnectUser();
    } catch (err) {
      console.error('[Stream] Error disconnecting previous client:', err);
    }
    client = null;
    currentUserId = null;
  }

  // Create new client
  console.log('[Stream] Creating new client for user:', user.id);
  client = new StreamVideoClient({
    apiKey,
    user,
    token,
    options: {
      logLevel: (import.meta.env.VITE_STREAM_LOG_LEVEL as any) || 'warn',
    },
  });
  currentUserId = user.id || null;

  return client;
};

/**
 * Get the current client instance (if any)
 */
export const getCurrentClient = (): StreamVideoClient | null => {
  return client;
};

/**
 * Disconnect and cleanup the current client
 */
export const disconnectClient = async (): Promise<void> => {
  if (client) {
    console.log('[Stream] Disconnecting client');
    try {
      await client.disconnectUser();
    } catch (err) {
      console.error('[Stream] Error disconnecting client:', err);
    } finally {
      client = null;
      currentUserId = null;
    }
  }
};
