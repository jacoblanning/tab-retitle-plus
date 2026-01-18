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
