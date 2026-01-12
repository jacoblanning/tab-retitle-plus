import type { StorageData, TitleMatch, StorageType, TabTitle, UrlTitle, DomainTitle, RegexPattern, Settings } from '@shared/types';
import { DEFAULT_SETTINGS, PRIORITY } from '@shared/constants';
import { getDomain, isValidRegex, debugLog, processTitleTemplate } from '@shared/utils';

export class StorageManager {
  private static instance: StorageManager;

  private constructor() {}

  static getInstance(): StorageManager {
    if (!this.instance) {
      this.instance = new StorageManager();
    }
    return this.instance;
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
      const template = data.tabTitles[tabId].title;
      const processedTitle = processTitleTemplate(template, originalTitle, url);
      return {
        title: processedTitle,
        type: 'tab',
        priority: PRIORITY.TAB,
      };
    }

    // Priority 2: Exact URL
    if (data.urlTitles[url]) {
      debugLog('Match found: Exact URL');
      const template = data.urlTitles[url].title;
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
      const template = data.domainTitles[domain].title;
      const processedTitle = processTitleTemplate(template, originalTitle, url);
      return {
        title: processedTitle,
        type: 'domain',
        priority: PRIORITY.DOMAIN,
      };
    }

    // Priority 4: Regex patterns
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
    context: { tabId?: number; url?: string; domain?: string }
  ): Promise<void> {
    const data = await this.getData();

    switch (type) {
      case 'tab':
        if (context.tabId && context.url) {
          data.tabTitles[context.tabId.toString()] = {
            title,
            originalUrl: context.url,
            timestamp: Date.now(),
          };
          debugLog('Saved tab-specific title:', { tabId: context.tabId, title });
        }
        break;

      case 'url':
        if (context.url) {
          data.urlTitles[context.url] = {
            title,
            timestamp: Date.now(),
          };
          debugLog('Saved URL title:', { url: context.url, title });
        }
        break;

      case 'domain':
        if (context.domain) {
          data.domainTitles[context.domain] = {
            title,
            timestamp: Date.now(),
          };
          debugLog('Saved domain title:', { domain: context.domain, title });
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
   * Get or initialize storage data
   */
  private async getData(): Promise<StorageData> {
    const result = await chrome.storage.sync.get(null);

    debugLog('Raw storage data:', result);

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

    return data;
  }

  /**
   * Save data to storage
   */
  private async setData(data: Partial<StorageData>): Promise<void> {
    debugLog('Saving to storage:', {
      keys: Object.keys(data),
      data: data
    });
    await chrome.storage.sync.set(data);
    debugLog('Storage save complete');
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
