// Storage keys
export const STORAGE_KEYS = {
  TAB_TITLES: 'tabTitles',
  URL_TITLES: 'urlTitles',
  DOMAIN_TITLES: 'domainTitles',
  REGEX_PATTERNS: 'regexPatterns',
  SETTINGS: 'settings',
} as const;

// Default settings
export const DEFAULT_SETTINGS = {
  enableBookmarkTitles: false,
  enableContextMenu: true,
  debugMode: false,
};

// Priority levels for title matching
export const PRIORITY = {
  TAB: 1,
  URL: 2,
  DOMAIN: 3,
  REGEX: 4,
  BOOKMARK: 5,
} as const;

// Context menu IDs
export const CONTEXT_MENU_ID = 'retitle-set-title';

// Title validation
export const MAX_TITLE_LENGTH = 500; // Maximum length for custom titles
export const MIN_TITLE_LENGTH = 1;   // Minimum length for custom titles

// Feedback-loop protection. Some pages (e.g. Intercom's messenger with an
// unread conversation) rewrite document.title on a timer and reassert it when
// another script overwrites it. Reasserting our custom title on every change
// creates an unbounded write loop that can hang the entire browser, so
// reassertion is debounced, capped per time window, and backs off when the
// page keeps fighting.
// NOTE: injectTitleWithObserver in service-worker.ts inlines copies of these
// values because chrome.scripting.executeScript serializes the function and it
// cannot reference imports. Keep them in sync.
export const TITLE_REASSERT_DEBOUNCE_MS = 500;  // coalesce bursts of page title churn
export const TITLE_FIGHT_MAX_REASSERTS = 5;     // max reasserts per window before standing down
export const TITLE_FIGHT_WINDOW_MS = 10_000;    // sliding window for the reassert cap
export const TITLE_FIGHT_COOLDOWN_MS = 30_000;  // how long to stand down before retrying
