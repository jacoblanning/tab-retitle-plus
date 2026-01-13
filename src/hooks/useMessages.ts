import { useCallback, useState } from 'react';
import type { Message } from '@shared/messages';

/**
 * Hook to send messages to the service worker
 */
export function useMessages() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const sendMessage = useCallback(async <T = any>(message: Message): Promise<T> => {
    try {
      setLoading(true);
      setError(null);
      const response = await chrome.runtime.sendMessage(message);
      setLoading(false);
      return response;
    } catch (err) {
      const error = err as Error;
      setError(error);
      setLoading(false);
      throw error;
    }
  }, []);

  return { sendMessage, loading, error };
}
