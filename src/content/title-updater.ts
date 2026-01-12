import type { Message, UpdateTitlePayload } from '@shared/messages';
import { debugLog } from '@shared/utils';

let currentCustomTitle: string | null = null;
let mutationObserver: MutationObserver | null = null;

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
  if (document.title === newTitle) {
    debugLog('Title already set, skipping update');
    return;
  }

  currentCustomTitle = newTitle;
  document.title = newTitle;

  debugLog('Title updated to:', newTitle);

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

  // Create new observer
  mutationObserver = new MutationObserver((mutations) => {
    // If the page changed the title and we have a custom title set, reapply it
    if (currentCustomTitle && document.title !== currentCustomTitle) {
      debugLog('Page changed title, reapplying custom title');
      document.title = currentCustomTitle;
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
 * Clean up when the page is about to unload
 */
window.addEventListener('beforeunload', () => {
  if (mutationObserver) {
    mutationObserver.disconnect();
    debugLog('MutationObserver disconnected');
  }
});

debugLog('Content script loaded');
