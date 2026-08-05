import type { StorageData, TitleMatch, StorageType, TabTitle, UrlTitle, DomainTitle, RegexPattern, Settings } from '@shared/types';
import { DEFAULT_SETTINGS, PRIORITY } from '@shared/constants';
import { getDomain, isValidRegex, debugLog, processTitleTemplate } from '@shared/utils';

// Chrome storage.sync quota limits
const QUOTA_BYTES = 102400; // 100 KB
const QUOTA_BYTES_PER_ITEM = 8192; // 8 KB
const MAX_ITEMS = 512;
const QUOTA_WARNING_THRESHOLD = 0.8; // Warn at 80% usage

export class StorageManager {
  private static instance: StorageManager;
  private dataCache: StorageData | null = null;
  private cacheTimestamp: number = 0;
  private readonly CACHE_TTL = 5000; // Cache time-to-live: 5 seconds

  private constructor() {
    // setData() invalidates the cache for writes made through this instance,
    // but storage can also change externally — Chrome Sync pushing updates
    // from another device, or direct chrome.storage writes (e.g. in tests).
    // Invalidate on any sync-area change so reads never serve stale data.
    chrome.storage.onChanged.addListener((_changes, areaName) => {
      if (areaName === 'sync') {
        this.invalidateCache();
      }
    });
  }

  static getInstance(): StorageManager {
    if (!this.instance) {
      this.instance = new StorageManager();
    }
    return this.instance;
  }

  /**
   * Invalidate the cache, forcing next getData() to fetch from storage
   */
  private invalidateCache(): void {
    this.dataCache = null;
    this.cacheTimestamp = 0;
  }

  /**
   * Check if cache is valid
   */
  private isCacheValid(): boolean {
    if (!this.dataCache) return false;
    const now = Date.now();
    return (now - this.cacheTimestamp) < this.CACHE_TTL;
  }

  /**
   * Find matching title for a tab based on priority system
   * Priority: Tab-specific > Exact URL > Domain > Regex > Bookmark
   */
  async findMatchingTitle(tab: chrome.tabs.Tab): Promise<TitleMatch | null> {
    const data = await this.getData();
    const url = tab.url || '';
    const domain = getDomain(url);
    const tabId = tab.id?.toString();
    const originalTitle = tab.title || '';

    debugLog('Finding match for:', { url, domain, tabId, originalTitle });

    // Priority 1: Tab-specific
    if (tabId && data.tabTitles[tabId]) {
      debugLog('Match found: Tab-specific');
      const rule = data.tabTitles[tabId];
      const template = rule.title;
      // Use stored original title if available, fallback to current title
      const titleToUse = rule.originalTitle || originalTitle;
      const processedTitle = processTitleTemplate(template, titleToUse, url);
      return {
        title: processedTitle,
        type: 'tab',
        priority: PRIORITY.TAB,
      };
    }

    // Priority 2: Exact URL
    if (data.urlTitles[url]) {
      debugLog('Match found: Exact URL');
      const rule = data.urlTitles[url];
      const template = rule.title;
      // URL rules use current title (each URL may have different original title)
      const processedTitle = processTitleTemplate(template, originalTitle, url);
      return {
        title: processedTitle,
        type: 'url',
        priority: PRIORITY.URL,
      };
    }

    // Priority 3: Domain
    if (domain && data.domainTitles[domain]) {
      debugLog('Match found: Domain');
      const rule = data.domainTitles[domain];
      const template = rule.title;
      // Domain rules use current title (each page on domain has different original title)
      const processedTitle = processTitleTemplate(template, originalTitle, url);
      return {
        title: processedTitle,
        type: 'domain',
        priority: PRIORITY.DOMAIN,
      };
    }

    // Priority 4: Regex patterns
    // Note: Regex UI not yet implemented - backend ready for future release
    for (const pattern of data.regexPatterns) {
      try {
        if (!isValidRegex(pattern.pattern, pattern.flags)) {
          console.warn('Invalid regex pattern:', pattern);
          continue;
        }

        const regex = new RegExp(pattern.pattern, pattern.flags);
        const currentTitle = tab.title || '';

        if (regex.test(currentTitle)) {
          const newTitle = currentTitle.replace(regex, pattern.replacement);
          debugLog('Match found: Regex', { pattern: pattern.pattern, newTitle });
          return {
            title: newTitle,
            type: 'regex',
            priority: PRIORITY.REGEX,
            patternId: pattern.id,
          };
        }
      } catch (error) {
        console.error('Error processing regex pattern:', pattern, error);
      }
    }

    // Priority 5: Bookmark title (if enabled)
    if (data.settings.enableBookmarkTitles) {
      const bookmarkTitle = await this.getBookmarkTitle(url);
      if (bookmarkTitle) {
        debugLog('Match found: Bookmark');
        return {
          title: bookmarkTitle,
          type: 'bookmark',
          priority: PRIORITY.BOOKMARK,
        };
      }
    }

    debugLog('No match found');
    return null;
  }

  /**
   * Save a new title based on storage type
   */
  async saveTitle(
    type: StorageType,
    title: string,
    context: { tabId?: number; url?: string; domain?: string; originalTitle?: string }
  ): Promise<void> {
    const data = await this.getData();

    switch (type) {
      case 'tab':
        if (context.tabId && context.url) {
          data.tabTitles[context.tabId.toString()] = {
            title,
            originalUrl: context.url,
            originalTitle: context.originalTitle || '',
            timestamp: Date.now(),
          };
          debugLog('Saved tab-specific title:', { tabId: context.tabId, title, originalTitle: context.originalTitle });
        }
        break;

      case 'url':
        if (context.url) {
          data.urlTitles[context.url] = {
            title,
            originalTitle: context.originalTitle || '',
            timestamp: Date.now(),
          };
          debugLog('Saved URL title:', { url: context.url, title, originalTitle: context.originalTitle });
        }
        break;

      case 'domain':
        if (context.domain) {
          data.domainTitles[context.domain] = {
            title,
            originalTitle: context.originalTitle || '',
            timestamp: Date.now(),
          };
          debugLog('Saved domain title:', { domain: context.domain, title, originalTitle: context.originalTitle });
        }
        break;

      case 'once':
        // One-time titles are not persisted to storage
        debugLog('One-time title (not persisted):', { title });
        return;
    }

    await this.setData(data);
  }

  /**
   * Delete a title by type and key
   */
  async deleteTitle(type: 'tab' | 'url' | 'domain' | 'regex', key: string): Promise<void> {
    const data = await this.getData();

    switch (type) {
      case 'tab':
        delete data.tabTitles[key];
        break;
      case 'url':
        delete data.urlTitles[key];
        break;
      case 'domain':
        delete data.domainTitles[key];
        break;
      case 'regex':
        data.regexPatterns = data.regexPatterns.filter(p => p.id !== key);
        break;
    }

    await this.setData(data);
    debugLog('Deleted title:', { type, key });
  }

  /**
   * Get all saved titles
   */
  async getAllTitles() {
    const data = await this.getData();
    return {
      tabTitles: data.tabTitles,
      urlTitles: data.urlTitles,
      domainTitles: data.domainTitles,
      regexPatterns: data.regexPatterns,
    };
  }

  /**
   * Add a regex pattern
   */
  async addRegexPattern(pattern: string, replacement: string, flags: string): Promise<string> {
    const data = await this.getData();

    const id = crypto.randomUUID();
    const newPattern: RegexPattern = {
      id,
      pattern,
      replacement,
      flags,
      timestamp: Date.now(),
    };

    data.regexPatterns.push(newPattern);
    await this.setData(data);

    debugLog('Added regex pattern:', newPattern);
    return id;
  }

  /**
   * Clean up tab-specific titles for a closed tab
   */
  async cleanupTab(tabId: number): Promise<void> {
    const data = await this.getData();
    const key = tabId.toString();

    if (data.tabTitles[key]) {
      delete data.tabTitles[key];
      await this.setData(data);
      debugLog('Cleaned up tab title:', { tabId });
    }
  }

  /**
   * Get or initialize storage data (with caching)
   */
  private async getData(): Promise<StorageData> {
    // Return cached data if valid
    if (this.isCacheValid()) {
      debugLog('Using cached storage data');
      return this.dataCache!;
    }

    // Fetch from storage
    const result = await chrome.storage.sync.get(null);

    debugLog('Fetched storage data from chrome.storage.sync');

    const data: StorageData = {
      tabTitles: (result.tabTitles as Record<string, TabTitle>) || {} as Record<string, TabTitle>,
      urlTitles: (result.urlTitles as Record<string, UrlTitle>) || {} as Record<string, UrlTitle>,
      domainTitles: (result.domainTitles as Record<string, DomainTitle>) || {} as Record<string, DomainTitle>,
      regexPatterns: (result.regexPatterns as RegexPattern[]) || [] as RegexPattern[],
      settings: (result.settings as Settings) || DEFAULT_SETTINGS,
    };

    debugLog('Parsed storage data:', {
      tabTitlesCount: Object.keys(data.tabTitles).length,
      urlTitlesCount: Object.keys(data.urlTitles).length,
      domainTitlesCount: Object.keys(data.domainTitles).length,
      regexPatternsCount: data.regexPatterns.length,
    });

    // Update cache
    this.dataCache = data;
    this.cacheTimestamp = Date.now();

    return data;
  }

  /**
   * Save data to storage with quota error handling
   */
  private async setData(data: Partial<StorageData>): Promise<void> {
    debugLog('Saving to storage:', {
      keys: Object.keys(data),
      data: data
    });

    try {
      await chrome.storage.sync.set(data);
      debugLog('Storage save complete');

      // Invalidate cache after successful write
      this.invalidateCache();

      // Check quota after successful save and warn if approaching limit
      const quotaInfo = await this.getQuotaInfo();
      if (quotaInfo.percentUsed >= QUOTA_WARNING_THRESHOLD * 100) {
        console.warn(`Storage quota warning: ${quotaInfo.percentUsed.toFixed(1)}% used (${quotaInfo.bytesInUse}/${QUOTA_BYTES} bytes)`);
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes('QUOTA_EXCEEDED')) {
        const quotaInfo = await this.getQuotaInfo();
        const message = `Storage quota exceeded! Used: ${quotaInfo.bytesInUse}/${QUOTA_BYTES} bytes. Please delete some saved titles to free up space.`;
        console.error(message);
        throw new Error(message);
      }
      throw error;
    }
  }

  /**
   * Get storage quota information
   */
  async getQuotaInfo(): Promise<{
    bytesInUse: number;
    totalBytes: number;
    percentUsed: number;
    itemCount: number;
    maxItems: number;
    isApproachingLimit: boolean;
    isOverLimit: boolean;
  }> {
    const bytesInUse = await chrome.storage.sync.getBytesInUse(null);
    const allData = await chrome.storage.sync.get(null);
    const itemCount = Object.keys(allData).length;
    const percentUsed = (bytesInUse / QUOTA_BYTES) * 100;

    return {
      bytesInUse,
      totalBytes: QUOTA_BYTES,
      percentUsed,
      itemCount,
      maxItems: MAX_ITEMS,
      isApproachingLimit: percentUsed >= QUOTA_WARNING_THRESHOLD * 100,
      isOverLimit: bytesInUse >= QUOTA_BYTES || itemCount >= MAX_ITEMS,
    };
  }

  /**
   * Check if adding data would exceed quota limits
   */
  async canAddData(estimatedBytes: number): Promise<{ canAdd: boolean; reason?: string }> {
    const quotaInfo = await this.getQuotaInfo();

    if (quotaInfo.bytesInUse + estimatedBytes > QUOTA_BYTES) {
      return {
        canAdd: false,
        reason: `Adding this data would exceed storage quota (${quotaInfo.bytesInUse + estimatedBytes}/${QUOTA_BYTES} bytes)`,
      };
    }

    if (quotaInfo.itemCount >= MAX_ITEMS) {
      return {
        canAdd: false,
        reason: `Maximum number of storage items reached (${MAX_ITEMS})`,
      };
    }

    return { canAdd: true };
  }

  /**
   * Get bookmark title for a URL
   */
  private async getBookmarkTitle(url: string): Promise<string | null> {
    try {
      const bookmarks = await chrome.bookmarks.search({ url });
      return bookmarks[0]?.title || null;
    } catch (error) {
      console.error('Error fetching bookmark:', error);
      return null;
    }
  }

  /**
   * Update settings
   */
  async updateSettings(settings: Partial<StorageData['settings']>): Promise<void> {
    const data = await this.getData();
    data.settings = { ...data.settings, ...settings };
    await this.setData({ settings: data.settings });
    debugLog('Updated settings:', data.settings);
  }

  /**
   * Get current settings
   */
  async getSettings(): Promise<StorageData['settings']> {
    const data = await this.getData();
    return data.settings;
  }
}
