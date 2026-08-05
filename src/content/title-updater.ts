import type { Message, UpdateTitlePayload } from '@shared/messages';
import { debugLog } from '@shared/utils';
import {
  TITLE_REASSERT_DEBOUNCE_MS,
  TITLE_FIGHT_MAX_REASSERTS,
  TITLE_FIGHT_WINDOW_MS,
  TITLE_FIGHT_COOLDOWN_MS,
} from '@shared/constants';

let currentCustomTitle: string | null = null;
let mutationObserver: MutationObserver | null = null;

// Feedback-loop protection state (see constants.ts for the rationale)
let reassertTimer: number | null = null;
let cooldownTimer: number | null = null;
let reassertTimes: number[] = [];

/**
 * Listen for messages from the service worker
 */
chrome.runtime.onMessage.addListener((message: Message, sender, sendResponse) => {
  debugLog('Content script received message:', message);

  if (message.type === 'UPDATE_TITLE') {
    const { title } = message.payload as UpdateTitlePayload;
    updateTitle(title);
    sendResponse({ success: true });
    return true;
  }

  if (message.type === 'GET_CURRENT_TITLE') {
    sendResponse({ title: document.title });
    return true;
  }

  return false;
});

/**
 * Update the document title and set up observer
 */
function updateTitle(newTitle: string): void {
  if (newTitle !== currentCustomTitle) {
    // A genuinely new title gets a fresh fight budget
    reassertTimes = [];
    if (cooldownTimer !== null) {
      window.clearTimeout(cooldownTimer);
      cooldownTimer = null;
    }
  }

  currentCustomTitle = newTitle;

  if (document.title !== newTitle) {
    document.title = newTitle;
    debugLog('Title updated to:', newTitle);
  }

  // Set up observer to handle dynamic title changes by the page
  setupTitleObserver();
}

/**
 * Set up MutationObserver to watch for title changes
 * This ensures our custom title persists even if the page tries to change it
 */
function setupTitleObserver(): void {
  // Disconnect existing observer if any
  if (mutationObserver) {
    mutationObserver.disconnect();
  }

  // Create new observer. Never write document.title synchronously here: pages
  // that reassert their own title (e.g. Intercom's unread-message flash) would
  // turn that into an unbounded microtask loop that hangs the browser.
  mutationObserver = new MutationObserver(() => {
    if (currentCustomTitle && document.title !== currentCustomTitle) {
      scheduleReassert();
    }
  });

  // Find the title element
  const titleElement = document.querySelector('title');
  if (titleElement) {
    // Observe changes to the title element
    mutationObserver.observe(titleElement, {
      childList: true,
      characterData: true,
      subtree: true,
    });
    debugLog('MutationObserver set up for title element');
  } else {
    console.warn('Title element not found, observer not set up');
  }
}

/**
 * Reassert the custom title after a debounce delay, with a circuit breaker:
 * if the page keeps overwriting us, stand down instead of fighting forever.
 */
function scheduleReassert(): void {
  // A pending reassert coalesces further mutations; during cooldown we let
  // the page win entirely.
  if (reassertTimer !== null || cooldownTimer !== null) {
    return;
  }

  const now = Date.now();
  reassertTimes = reassertTimes.filter((t) => now - t < TITLE_FIGHT_WINDOW_MS);

  if (reassertTimes.length >= TITLE_FIGHT_MAX_REASSERTS) {
    standDown();
    return;
  }

  reassertTimes.push(now);
  reassertTimer = window.setTimeout(() => {
    reassertTimer = null;
    if (currentCustomTitle && document.title !== currentCustomTitle) {
      debugLog('Page changed title, reapplying custom title');
      document.title = currentCustomTitle;
    }
  }, TITLE_REASSERT_DEBOUNCE_MS);
}

/**
 * The page is repeatedly overwriting the custom title. Stop observing and let
 * it win for a cooldown period, then try once more with a fresh budget.
 */
function standDown(): void {
  debugLog('Page is fighting for the title; standing down for', TITLE_FIGHT_COOLDOWN_MS, 'ms');

  if (mutationObserver) {
    mutationObserver.disconnect();
    mutationObserver = null;
  }
  if (reassertTimer !== null) {
    window.clearTimeout(reassertTimer);
    reassertTimer = null;
  }
  reassertTimes = [];

  cooldownTimer = window.setTimeout(() => {
    cooldownTimer = null;
    if (currentCustomTitle) {
      updateTitle(currentCustomTitle);
    }
  }, TITLE_FIGHT_COOLDOWN_MS);
}

/**
 * Clean up when the page is about to unload
 */
window.addEventListener('beforeunload', () => {
  if (mutationObserver) {
    mutationObserver.disconnect();
    debugLog('MutationObserver disconnected');
  }
  if (reassertTimer !== null) {
    window.clearTimeout(reassertTimer);
    reassertTimer = null;
  }
  if (cooldownTimer !== null) {
    window.clearTimeout(cooldownTimer);
    cooldownTimer = null;
  }
});

debugLog('Content script loaded');
