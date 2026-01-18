import { StorageManager } from './storage-manager';
import type { Message, SaveTitlePayload, DeleteTitlePayload } from '@shared/messages';
import { CONTEXT_MENU_ID } from '@shared/constants';
import { getDomain, debugLog, processTitleTemplate, isCustomizableUrl, validateTitleLength } from '@shared/utils';
import { createMessage } from '@shared/messages';
import type { UpdateTitlePayload } from '@shared/messages';

// In-memory cache for loop prevention
// Maps tabId to the custom title we just set
const titleCache = new Map<number, string>();

/**
 * Injects title update logic with MutationObserver directly into the page.
 * This is used as a fallback when the content script isn't ready.
 * MV3-safe: No setTimeout, all logic executes in the injected context.
 */
function injectTitleWithObserver(newTitle: string): void {
  // Store the custom title
  let currentCustomTitle: string | null = newTitle;
  let mutationObserver: MutationObserver | null = null;

  // Set the title
  document.title = newTitle;

  // Set up observer to handle dynamic title changes by the page
  mutationObserver = new MutationObserver(() => {
    if (currentCustomTitle && document.title !== currentCustomTitle) {
      document.title = currentCustomTitle;
    }
  });

  const titleElement = document.querySelector('title');
  if (titleElement) {
    mutationObserver.observe(titleElement, {
      childList: true,
      characterData: true,
      subtree: true,
    });
  }

  // Clean up on page unload
  window.addEventListener('beforeunload', () => {
    if (mutationObserver) {
      mutationObserver.disconnect();
    }
  });
}

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

  // Skip internal browser pages (chrome://, about:, etc.)
  if (!isCustomizableUrl(tab.url)) {
    debugLog('Skipping internal browser page:', tab.url);
    return;
  }

  // Skip incognito tabs - don't apply persistent rules for privacy
  if (tab.incognito) {
    debugLog('Skipping incognito tab - persistent titles not applied');
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
        debugLog('Content script not ready, using fallback injection with observer');

        // Fallback: Inject title with MutationObserver directly
        // This is MV3-safe as it doesn't use setTimeout
        try {
          await chrome.scripting.executeScript({
            target: { tabId },
            func: injectTitleWithObserver,
            args: [match.title],
          });
          debugLog('Successfully injected title with observer');
        } catch (scriptError) {
          console.error('Error injecting title:', scriptError);
          // Remove from cache if injection failed
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
chrome.tabs.onRemoved.addListener(async (tabId, _removeInfo) => {
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
chrome.runtime.onMessage.addListener((message: Message, _sender, sendResponse) => {
  debugLog('Service worker received message:', message);

  // Handle messages asynchronously
  handleMessage(message, _sender)
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
async function handleMessage(message: Message, _sender: chrome.runtime.MessageSender) {
  const storage = StorageManager.getInstance();

  switch (message.type) {
    case 'SAVE_TITLE': {
      const payload = message.payload as SaveTitlePayload;
      const { title, storageType, tabId, url, originalTitle } = payload;

      debugLog('Saving title:', payload);

      // Validate title length
      const titleValidation = validateTitleLength(title);
      if (!titleValidation.isValid) {
        debugLog('Title validation failed:', titleValidation.error);
        return {
          success: false,
          error: titleValidation.error
        };
      }

      // Validate URL is customizable (not an internal browser page)
      if (url && !isCustomizableUrl(url)) {
        debugLog('Cannot save title for internal browser page:', url);
        return {
          success: false,
          error: 'Cannot customize titles for internal browser pages (chrome://, about:, etc.)'
        };
      }

      // Check if tab is in incognito mode
      let isIncognito = false;
      if (tabId) {
        try {
          const tabInfo = await chrome.tabs.get(tabId);
          isIncognito = tabInfo.incognito || false;
        } catch (error) {
          debugLog('Error checking incognito status:', error);
        }
      }

      // For one-time titles, just update the tab directly without saving to storage
      if (storageType === 'once' && tabId) {
        // Process template before applying
        const processedTitle = processTitleTemplate(title, originalTitle || '', url);
        titleCache.set(tabId, processedTitle);
        try {
          await chrome.tabs.sendMessage(tabId, createMessage('UPDATE_TITLE', {
            title: processedTitle,
          } as UpdateTitlePayload));
          return { success: true };
        } catch (error) {
          debugLog('Content script not ready, using fallback injection with observer');
          // Fallback: Inject title with MutationObserver directly
          try {
            await chrome.scripting.executeScript({
              target: { tabId },
              func: injectTitleWithObserver,
              args: [processedTitle],
            });
            debugLog('Successfully injected title with observer');
            return { success: true };
          } catch (scriptError) {
            titleCache.delete(tabId);
            throw scriptError;
          }
        }
      }

      // Don't persist titles for incognito tabs (except one-time titles which are handled above)
      if (isIncognito) {
        debugLog('Skipping storage for incognito tab');
        return {
          success: false,
          error: 'Cannot save persistent titles in incognito mode. Use "One-time" storage type instead.'
        };
      }

      // For persistent storage types, save to storage
      const domain = url ? getDomain(url) : undefined;
      await storage.saveTitle(storageType, title, { tabId, url, domain, originalTitle });

      // If we have a tab ID, apply the title immediately
      if (tabId) {
        // Process template before applying
        const processedTitle = processTitleTemplate(title, originalTitle || '', url);
        titleCache.set(tabId, processedTitle);
        try {
          await chrome.tabs.sendMessage(tabId, createMessage('UPDATE_TITLE', {
            title: processedTitle,
          } as UpdateTitlePayload));
        } catch (error) {
          debugLog('Content script not ready, using fallback injection with observer');
          // Fallback: Inject title with MutationObserver directly
          try {
            await chrome.scripting.executeScript({
              target: { tabId },
              func: injectTitleWithObserver,
              args: [processedTitle],
            });
            debugLog('Successfully injected title with observer');
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

    case 'GET_QUOTA_INFO': {
      const quotaInfo = await storage.getQuotaInfo();
      return quotaInfo;
    }

    default:
      throw new Error(`Unknown message type: ${message.type}`);
  }
}

debugLog('Service worker initialized');
