import { test as base, chromium, type BrowserContext } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

// ES module compatible __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Extension fixture for loading the Chrome extension in tests
 * 
 * Usage:
 * ```typescript
 * test('my test', async ({ extensionContext, extensionId }) => {
 *   const popupPage = await extensionContext.newPage();
 *   await popupPage.goto(`chrome-extension://${extensionId}/popup.html`);
 * });
 * ```
 */
export const test = base.extend<{
  extensionContext: BrowserContext;
  extensionId: string;
}>({
  extensionContext: async ({}, use) => {
    const pathToExtension = path.join(__dirname, '../../dist');
    const context = await chromium.launchPersistentContext('', {
      headless: false,
      args: [
        `--disable-extensions-except=${pathToExtension}`,
        `--load-extension=${pathToExtension}`,
      ],
    });

    // Wait for extension to load and get its ID
    // Extension ID is typically available after a short delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    await use(context);
    await context.close();
  },

  extensionId: async ({ extensionContext }, use) => {
    // Get extension ID from the background page
    // In Chrome, extensions are loaded with a specific ID
    // We can find it by checking the extension pages
    let extensionId = '';

    // Wait a bit for extension to fully load
    await new Promise(resolve => setTimeout(resolve, 500));

    // Try to get extension ID from service worker (background pages)
    const backgroundPages = extensionContext.backgroundPages();
    if (backgroundPages.length > 0) {
      const url = backgroundPages[0].url();
      const match = url.match(/chrome-extension:\/\/([a-z]{32})\//);
      if (match) {
        extensionId = match[1];
      }
    }

    // Fallback: try to find it from extension pages
    if (!extensionId) {
      const pages = extensionContext.pages();
      for (const page of pages) {
        const url = page.url();
        const match = url.match(/chrome-extension:\/\/([a-z]{32})\//);
        if (match) {
          extensionId = match[1];
          break;
        }
      }
    }

    // Another fallback: try to access extension via chrome.runtime
    if (!extensionId) {
      try {
        const page = await extensionContext.newPage();
        await page.goto('about:blank');
        extensionId = await page.evaluate(() => {
          return new Promise<string>((resolve) => {
            // Try to get extension ID from chrome.runtime
            if (typeof chrome !== 'undefined' && chrome.runtime) {
              resolve(chrome.runtime.id);
            } else {
              resolve('');
            }
          });
        });
        await page.close();
      } catch (e) {
        // Ignore errors
      }
    }

    // If still not found, throw error
    if (!extensionId) {
      throw new Error(
        'Could not determine extension ID. Make sure extension is built and manifest.json exists in dist/.'
      );
    }

    await use(extensionId);
  },
});

export { expect } from '@playwright/test';
