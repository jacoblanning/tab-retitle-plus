import { useState, useEffect } from 'react';

/**
 * Hook to get the current active tab
 * Supports test mode via URL parameters
 */
export function useCurrentTab() {
  const [tab, setTab] = useState<chrome.tabs.Tab | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function loadTab() {
      try {
        // Check for test mode
        const url = new URL(window.location.href);
        const testMode = url.searchParams.get('testMode');

        if (testMode === 'true') {
          // Test mode: use mock data from URL parameters
          const tabId = url.searchParams.get('tabId');
          const tabUrl = url.searchParams.get('tabUrl');
          const tabTitle = url.searchParams.get('tabTitle');

          setTab({
            id: tabId ? parseInt(tabId) : 1,
            url: tabUrl || 'https://example.com',
            title: tabTitle || 'Example Page',
            active: true,
            highlighted: true,
            pinned: false,
            incognito: false,
            windowId: 1,
            index: 0,
          } as chrome.tabs.Tab);
          setLoading(false);
          return;
        }

        // Production mode: query active tab
        const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
        setTab(activeTab);
        setLoading(false);
      } catch (err) {
        setError(err as Error);
        setLoading(false);
      }
    }

    loadTab();
  }, []);

  return { tab, loading, error };
}
