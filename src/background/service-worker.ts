import { StorageManager } from './storage-manager';
import type { Message, SaveTitlePayload, DeleteTitlePayload } from '@shared/messages';
import {
  CONTEXT_MENU_ID,
  TITLE_FIGHT_MAX_REASSERTS,
  TITLE_FIGHT_WINDOW_MS,
  TITLE_FIGHT_COOLDOWN_MS,
} from '@shared/constants';
import { getDomain, debugLog, processTitleTemplate, isCustomizableUrl, validateTitleLength } from '@shared/utils';
import { createMessage } from '@shared/messages';
import type { UpdateTitlePayload } from '@shared/messages';

// In-memory cache for loop prevention
// Maps tabId to the custom title we just set
const titleCache = new Map<number, string>();

// Per-tab backoff for automatic title reapplication. Pages that rewrite their
// title on a timer (e.g. Intercom's unread-message flash) fire tabs.onUpdated
// on every change; without a cap we would re-send UPDATE_TITLE forever and
// keep re-arming the content script's observer against a page that fights back.
const reapplyBackoff = new Map<number, { times: number[]; cooldownUntil: number }>();

/**
 * Returns whether an automatic reapply for this tab is within budget.
 * Explicit user actions (SAVE_TITLE) bypass this check.
 */
function shouldReapplyTitle(tabId: number): boolean {
  const now = Date.now();
  let entry = reapplyBackoff.get(tabId);
  if (!entry) {
    entry = { times: [], cooldownUntil: 0 };
    reapplyBackoff.set(tabId, entry);
  }

  if (now < entry.cooldownUntil) {
    return false;
  }

  entry.times = entry.times.filter((t) => now - t < TITLE_FIGHT_WINDOW_MS);
  if (entry.times.length >= TITLE_FIGHT_MAX_REASSERTS) {
    entry.times = [];
    entry.cooldownUntil = now + TITLE_FIGHT_COOLDOWN_MS;
    debugLog('Tab is fighting for its title; pausing reapplies:', { tabId });
    return false;
  }

  entry.times.push(now);
  return true;
}

/**
 * Injects title update logic with MutationObserver directly into the page.
 * This is used as a fallback when the content script isn't ready.
 *
 * NOTE: chrome.scripting.executeScript serializes this function, so it cannot
 * reference imports or outer variables. The loop-guard values below mirror the
 * TITLE_* constants in shared/constants.ts — keep them in sync. State lives on
 * a window property so repeated injections reuse one observer instead of
 * stacking a new one per injection.
 */
function injectTitleWithObserver(newTitle: string): void {
  const DEBOUNCE_MS = 500;
  const MAX_REASSERTS = 5;
  const WINDOW_MS = 10000;
  const COOLDOWN_MS = 30000;
  const STATE_KEY = '__tabRetitlePlusState';

  const w = window as unknown as Record<string, any>;
  const state = w[STATE_KEY] ?? (w[STATE_KEY] = {
    customTitle: null as string | null,
    observer: null as MutationObserver | null,
    reassertTimer: null as number | null,
    cooldownTimer: null as number | null,
    reassertTimes: [] as number[],
    cleanupInstalled: false,
  });

  if (state.customTitle !== newTitle) {
    // A genuinely new title gets a fresh fight budget
    state.reassertTimes = [];
    if (state.cooldownTimer !== null) {
      clearTimeout(state.cooldownTimer);
      state.cooldownTimer = null;
    }
  }

  state.customTitle = newTitle;
  document.title = newTitle;

  const observe = (): void => {
    if (state.observer) {
      state.observer.disconnect();
      state.observer = null;
    }
    const titleElement = document.querySelector('title');
    if (!titleElement) return;

    // Never write document.title synchronously in the callback: pages that
    // reassert their own title would turn that into an unbounded loop.
    state.observer = new MutationObserver(() => {
      if (!state.customTitle || document.title === state.customTitle) return;
      if (state.reassertTimer !== null || state.cooldownTimer !== null) return;

      const now = Date.now();
      state.reassertTimes = state.reassertTimes.filter((t: number) => now - t < WINDOW_MS);

      if (state.reassertTimes.length >= MAX_REASSERTS) {
        // Page keeps overwriting us: stand down for a cooldown, then retry
        if (state.observer) {
          state.observer.disconnect();
          state.observer = null;
        }
        state.reassertTimes = [];
        state.cooldownTimer = window.setTimeout(() => {
          state.cooldownTimer = null;
          if (state.customTitle) {
            document.title = state.customTitle;
            observe();
          }
        }, COOLDOWN_MS);
        return;
      }

      state.reassertTimes.push(now);
      state.reassertTimer = window.setTimeout(() => {
        state.reassertTimer = null;
        if (state.customTitle && document.title !== state.customTitle) {
          document.title = state.customTitle;
        }
      }, DEBOUNCE_MS);
    });

    state.observer.observe(titleElement, {
      childList: true,
      characterData: true,
      subtree: true,
    });
  };

  observe();

  // Clean up on page unload (install once, even across repeated injections)
  if (!state.cleanupInstalled) {
    state.cleanupInstalled = true;
    window.addEventListener('beforeunload', () => {
      if (state.observer) {
        state.observer.disconnect();
        state.observer = null;
      }
      if (state.reassertTimer !== null) {
        clearTimeout(state.reassertTimer);
        state.reassertTimer = null;
      }
      if (state.cooldownTimer !== null) {
        clearTimeout(state.cooldownTimer);
        state.cooldownTimer = null;
      }
    });
  }
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

  // A new navigation gets a fresh reapply budget
  if (changeInfo.status === 'loading') {
    reapplyBackoff.delete(tabId);
  }

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
      // Rate-limit automatic reapplies so a page that rewrites its title on a
      // timer can't drive an endless reapply loop through this listener
      if (!shouldReapplyTitle(tabId)) {
        debugLog('Skipping reapply (backoff active):', { tabId });
        return;
      }

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
  reapplyBackoff.delete(tabId);

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

      // An explicit user action always applies immediately, with a fresh
      // reapply budget for the tab
      if (tabId) {
        reapplyBackoff.delete(tabId);
      }

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
