import { type BrowserContext, type Worker } from '@playwright/test';

/**
 * Helper for manipulating Chrome extension storage in tests
 */
export class StorageHelper {
  constructor(private context: BrowserContext) {}

  /**
   * Get the service worker or a background page to execute scripts in
   */
  private async getWorker(): Promise<Worker> {
    // Try to get service worker
    const workers = this.context.serviceWorkers();
    if (workers.length > 0) {
      return workers[0];
    }

    // Wait for a service worker if none exist
    try {
      return await this.context.waitForEvent('serviceworker', { timeout: 5000 });
    } catch (e) {
      throw new Error('No service worker found to execute storage commands');
    }
  }

  /**
   * Clear all extension storage
   */
  async clearAll(): Promise<void> {
    const worker = await this.getWorker();
    await worker.evaluate(() => {
      return new Promise<void>((resolve) => {
        chrome.storage.sync.clear(() => {
          chrome.storage.local.clear(() => {
            resolve();
          });
        });
      });
    });
  }

  /**
   * Set storage data
   */
  async setStorage(data: Record<string, any>): Promise<void> {
    const worker = await this.getWorker();
    await worker.evaluate((storageData) => {
      return new Promise<void>((resolve) => {
        chrome.storage.sync.set(storageData, () => {
          resolve();
        });
      });
    }, data);
  }

  /**
   * Get storage data
   */
  async getStorage(keys?: string | string[]): Promise<Record<string, any>> {
    const worker = await this.getWorker();
    return await worker.evaluate((storageKeys) => {
      return new Promise<Record<string, any>>((resolve) => {
        chrome.storage.sync.get(storageKeys || null, (items) => {
          resolve(items);
        });
      });
    }, keys);
  }

  /**
   * Set a tab-specific title
   */
  async setTabTitle(tabId: string, title: string, originalUrl: string): Promise<void> {
    const data = await this.getStorage();
    const tabTitles = data.tabTitles || {};
    tabTitles[tabId] = {
      title,
      originalUrl,
      timestamp: Date.now(),
    };
    await this.setStorage({ ...data, tabTitles });
  }

  /**
   * Set a URL-specific title
   */
  async setUrlTitle(url: string, title: string): Promise<void> {
    const data = await this.getStorage();
    const urlTitles = data.urlTitles || {};
    urlTitles[url] = {
      title,
      timestamp: Date.now(),
    };
    await this.setStorage({ ...data, urlTitles });
  }

  /**
   * Set a domain-specific title
   */
  async setDomainTitle(domain: string, title: string): Promise<void> {
    const data = await this.getStorage();
    const domainTitles = data.domainTitles || {};
    domainTitles[domain] = {
      title,
      timestamp: Date.now(),
    };
    await this.setStorage({ ...data, domainTitles });
  }
}
