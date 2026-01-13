import { useState, useEffect, useCallback } from 'react';
import type { StorageData } from '@shared/types';

/**
 * Hook to access and manage Chrome extension storage
 */
export function useExtensionStorage() {
  const [data, setData] = useState<Partial<StorageData>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Load storage data
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const result = await chrome.storage.sync.get(null);
      setData(result);
      setLoading(false);
    } catch (err) {
      setError(err as Error);
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Listen for storage changes
  useEffect(() => {
    const handleStorageChange = (changes: { [key: string]: chrome.storage.StorageChange }) => {
      setData(prevData => {
        const newData = { ...prevData };
        for (const [key, { newValue }] of Object.entries(changes)) {
          (newData as any)[key] = newValue;
        }
        return newData;
      });
    };

    chrome.storage.onChanged.addListener(handleStorageChange);
    return () => chrome.storage.onChanged.removeListener(handleStorageChange);
  }, []);

  // Set storage data
  const setStorageData = useCallback(async (newData: Partial<StorageData>) => {
    try {
      await chrome.storage.sync.set(newData);
      setData(prevData => ({ ...prevData, ...newData }));
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  }, []);

  // Clear all storage
  const clearStorage = useCallback(async () => {
    try {
      await chrome.storage.sync.clear();
      setData({});
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  }, []);

  return {
    data,
    loading,
    error,
    reload: loadData,
    setData: setStorageData,
    clearStorage,
  };
}
