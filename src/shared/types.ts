// Storage types
export interface TabTitle {
  title: string;
  originalUrl: string;
  originalTitle: string;
  timestamp: number;
}

export interface UrlTitle {
  title: string;
  originalTitle: string;
  timestamp: number;
}

export interface DomainTitle {
  title: string;
  originalTitle: string;
  timestamp: number;
}

export interface RegexPattern {
  id: string;
  pattern: string;
  replacement: string;
  flags: string;
  timestamp: number;
}

export interface Settings {
  enableBookmarkTitles: boolean;
  enableContextMenu: boolean;
  debugMode: boolean;
}

export interface StorageData {
  tabTitles: Record<string, TabTitle>;
  urlTitles: Record<string, UrlTitle>;
  domainTitles: Record<string, DomainTitle>;
  regexPatterns: RegexPattern[];
  settings: Settings;
}

// Storage type options
export type StorageType = 'once' | 'tab' | 'url' | 'domain';

// Title match result
export interface TitleMatch {
  title: string;
  type: 'tab' | 'url' | 'domain' | 'regex' | 'bookmark';
  priority: number;
  patternId?: string;
}
