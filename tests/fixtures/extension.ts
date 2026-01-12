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
    // Get extension ID from service worker (Manifest V3)
    let extensionId = '';

    // Method 1: Wait for service worker to be ready and get ID from it
    try {
      // Wait for service worker to be registered
      const serviceWorker = await extensionContext.waitForEvent('serviceworker', { timeout: 10000 });
      const url = serviceWorker.url();
      const match = url.match(/chrome-extension:\/\/([a-z]{32})\//);
      if (match) {
        extensionId = match[1];
      }
    } catch (e) {
      // Service worker not detected via event, try other methods
      console.log('Service worker event not detected, trying alternative methods...');
    }

    // Method 2: Check service workers directly
    if (!extensionId) {
      // Give service worker time to start
      await new Promise(resolve => setTimeout(resolve, 1000));
      const serviceWorkers = extensionContext.serviceWorkers();
      if (serviceWorkers.length > 0) {
        const url = serviceWorkers[0].url();
        const match = url.match(/chrome-extension:\/\/([a-z]{32})\//);
        if (match) {
          extensionId = match[1];
        }
      }
    }

    // Method 3: Try background pages (for backwards compatibility)
    if (!extensionId) {
      const backgroundPages = extensionContext.backgroundPages();
      if (backgroundPages.length > 0) {
        const url = backgroundPages[0].url();
        const match = url.match(/chrome-extension:\/\/([a-z]{32})\//);
        if (match) {
          extensionId = match[1];
        }
      }
    }

    // Method 4: Check existing pages for extension URLs
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

    // Method 5: Create a page and navigate to the extension to trigger ID detection
    if (!extensionId) {
      try {
        const page = await extensionContext.newPage();
        await page.goto('chrome://extensions/');
        await page.waitForTimeout(500);

        // Try service workers again after navigation
        const serviceWorkers = extensionContext.serviceWorkers();
        if (serviceWorkers.length > 0) {
          const url = serviceWorkers[0].url();
          const match = url.match(/chrome-extension:\/\/([a-z]{32})\//);
          if (match) {
            extensionId = match[1];
          }
        }
        await page.close();
      } catch (e) {
        // Ignore errors
        console.error('Failed to detect extension ID via chrome://extensions', e);
      }
    }

    // If still not found, throw helpful error
    if (!extensionId) {
      throw new Error(
        'Could not determine extension ID. Troubleshooting steps:\n' +
        '1. Ensure extension is built: npm run build\n' +
        '2. Check that dist/ directory exists with manifest.json\n' +
        '3. Verify manifest.json has valid service_worker configuration\n' +
        '4. Try running tests with headless: false to debug'
      );
    }

    console.log(`Extension ID detected: ${extensionId}`);
    await use(extensionId);
  },
});

export { expect } from '@playwright/test';
