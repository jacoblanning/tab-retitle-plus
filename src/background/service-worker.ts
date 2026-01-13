import { StorageManager } from './storage-manager';
import type { Message, SaveTitlePayload, DeleteTitlePayload } from '@shared/messages';
import { CONTEXT_MENU_ID } from '@shared/constants';
import { getDomain, debugLog } from '@shared/utils';
import { createMessage } from '@shared/messages';
import type { UpdateTitlePayload } from '@shared/messages';

// In-memory cache for loop prevention
// Maps tabId to the custom title we just set
const titleCache = new Map<number, string>();

/**
 * Initialize extension on install
 */
chrome.runtime.onInstalled.addListener(async (details) => {
  debugLog('Extension installed:', details.reason);

  // Create context menu
  const settings = await StorageManager.getInstance().getSettings();
  if (settings.enableContextMenu) {
    chrome.contextMenus.create({
      id: CONTEXT_MENU_ID,
      title: 'Set Custom Title',
      contexts: ['page'],
    });
    debugLog('Context menu created');
  }

  // Clean up any orphaned tab-specific titles on install/update
  if (details.reason === 'install' || details.reason === 'update') {
    const data = await StorageManager.getInstance().getAllTitles();
    const tabIds = Object.keys(data.tabTitles);

    if (tabIds.length > 0) {
      // Get all current tab IDs
      const tabs = await chrome.tabs.query({});
      const currentTabIds = new Set(tabs.map(t => t.id?.toString()).filter(Boolean));

      // Clean up titles for tabs that no longer exist
      for (const tabId of tabIds) {
        if (!currentTabIds.has(tabId)) {
          await StorageManager.getInstance().cleanupTab(parseInt(tabId));
        }
      }
    }
  }
});

/**
 * Handle tab updates
 * CRITICAL: This listener MUST be at top level for MV3
 */
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  // Log all tab updates for debugging
  debugLog('Tab update event:', { tabId, changeInfo, url: tab.url });

  // Only process when title changes and we have a valid URL
  if (!changeInfo.title || !tab.url) {
    debugLog('Skipping - no title or URL in changeInfo');
    return;
  }

  const currentTitle = changeInfo.title;
  const cachedTitle = titleCache.get(tabId);

  debugLog('Title change detected:', {
    tabId,
    currentTitle,
    cachedTitle,
    url: tab.url,
    cacheSize: titleCache.size
  });

  // If this title matches what we just set, skip processing to prevent loops
  if (cachedTitle === currentTitle) {
    debugLog('Skipping title update (matches cache):', { tabId, title: currentTitle });
    return;
  }

  // Find matching title rule
  debugLog('Looking up custom title in storage...');
  const match = await StorageManager.getInstance().findMatchingTitle(tab);

  if (match) {
    debugLog('Found match in storage:', match);

    if (match.title !== currentTitle) {
      // Cache the custom title we're about to set
      titleCache.set(tabId, match.title);

      debugLog('Applying custom title:', { tabId, from: currentTitle, to: match.title });

      // Send message to content script to update title
      try {
        await chrome.tabs.sendMessage(tabId, createMessage('UPDATE_TITLE', {
          title: match.title,
        } as UpdateTitlePayload));
        debugLog('Successfully sent UPDATE_TITLE message');
      } catch (error) {
        console.error('Error sending message to content script:', error);
        debugLog('Content script not ready, injecting title directly...');

        // Fallback: Inject title directly using scripting API
        try {
          await chrome.scripting.executeScript({
            target: { tabId },
            func: (newTitle: string) => {
              document.title = newTitle;
            },
            args: [match.title],
          });
          debugLog('Successfully injected title directly');

          // Retry sending message after a delay to set up MutationObserver
          setTimeout(async () => {
            try {
              await chrome.tabs.sendMessage(tabId, createMessage('UPDATE_TITLE', {
                title: match.title,
              } as UpdateTitlePayload));
              debugLog('Retry: Successfully sent UPDATE_TITLE message to content script');
            } catch (retryError) {
              debugLog('Retry failed, content script may not be available');
            }
          }, 500); // Wait 500ms for content script to load

        } catch (scriptError) {
          console.error('Error injecting title:', scriptError);
          // Remove from cache if both methods failed
          titleCache.delete(tabId);
        }
      }
    } else {
      debugLog('Match found but title already correct:', { title: match.title });
    }
  } else {
    debugLog('No matching custom title found in storage');
  }
});

/**
 * Handle tab removal - clean up cache and storage
 * CRITICAL: This listener MUST be at top level for MV3
 */
chrome.tabs.onRemoved.addListener(async (tabId, removeInfo) => {
  debugLog('Tab removed:', { tabId });

  // Remove from cache
  titleCache.delete(tabId);

  // Clean up tab-specific storage
  await StorageManager.getInstance().cleanupTab(tabId);
});

/**
 * Handle context menu clicks
 * CRITICAL: This listener MUST be at top level for MV3
 */
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === CONTEXT_MENU_ID && tab?.id) {
    debugLog('Context menu clicked:', { tabId: tab.id });
    // Open the popup
    chrome.action.openPopup();
  }
});

/**
 * Handle messages from popup and options pages
 * CRITICAL: This listener MUST be at top level for MV3
 */
chrome.runtime.onMessage.addListener((message: Message, sender, sendResponse) => {
  debugLog('Service worker received message:', message);

  // Handle messages asynchronously
  handleMessage(message, sender)
    .then(response => {
      sendResponse(response);
    })
    .catch(error => {
      console.error('Error handling message:', error);
      sendResponse({ error: error.message });
    });

  // Return true to indicate we'll send a response asynchronously
  return true;
});

/**
 * Handle different message types
 */
async function handleMessage(message: Message, sender: chrome.runtime.MessageSender) {
  const storage = StorageManager.getInstance();

  switch (message.type) {
    case 'SAVE_TITLE': {
      const payload = message.payload as SaveTitlePayload;
      const { title, storageType, tabId, url, originalTitle } = payload;

      debugLog('Saving title:', payload);

      // For one-time titles, just update the tab directly without saving to storage
      if (storageType === 'once' && tabId) {
        titleCache.set(tabId, title);
        try {
          await chrome.tabs.sendMessage(tabId, createMessage('UPDATE_TITLE', {
            title,
          } as UpdateTitlePayload));
          return { success: true };
        } catch (error) {
          debugLog('Message failed, injecting directly...');
          // Fallback: Inject title directly
          try {
            await chrome.scripting.executeScript({
              target: { tabId },
              func: (newTitle: string) => { document.title = newTitle; },
              args: [title],
            });

            // Retry message to set up MutationObserver
            setTimeout(async () => {
              try {
                await chrome.tabs.sendMessage(tabId, createMessage('UPDATE_TITLE', {
                  title,
                } as UpdateTitlePayload));
                debugLog('Retry: Content script received message');
              } catch (retryError) {
                debugLog('Retry failed');
              }
            }, 500);

            return { success: true };
          } catch (scriptError) {
            titleCache.delete(tabId);
            throw scriptError;
          }
        }
      }

      // For persistent storage types, save to storage
      const domain = url ? getDomain(url) : undefined;
      await storage.saveTitle(storageType, title, { tabId, url, domain, originalTitle });

      // If we have a tab ID, apply the title immediately
      if (tabId) {
        titleCache.set(tabId, title);
        try {
          await chrome.tabs.sendMessage(tabId, createMessage('UPDATE_TITLE', {
            title,
          } as UpdateTitlePayload));
        } catch (error) {
          console.error('Error applying title immediately:', error);
          debugLog('Message failed, injecting directly...');
          // Fallback: Inject title directly
          try {
            await chrome.scripting.executeScript({
              target: { tabId },
              func: (newTitle: string) => { document.title = newTitle; },
              args: [title],
            });

            // Retry message to set up MutationObserver
            setTimeout(async () => {
              try {
                await chrome.tabs.sendMessage(tabId, createMessage('UPDATE_TITLE', {
                  title,
                } as UpdateTitlePayload));
                debugLog('Retry: Content script received message');
              } catch (retryError) {
                debugLog('Retry failed');
              }
            }, 500);

          } catch (scriptError) {
            console.error('Error injecting title:', scriptError);
          }
        }
      }

      return { success: true };
    }

    case 'DELETE_TITLE': {
      const payload = message.payload as DeleteTitlePayload;
      await storage.deleteTitle(payload.type, payload.key);
      return { success: true };
    }

    case 'GET_SAVED_TITLES': {
      const titles = await storage.getAllTitles();
      return titles;
    }

    default:
      throw new Error(`Unknown message type: ${message.type}`);
  }
}

debugLog('Service worker initialized');
