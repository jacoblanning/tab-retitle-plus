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
      // Keep headless: false to use full Chromium (not headless shell)
      // Use --headless=new flag to run Chrome in headless mode with extension support
      headless: false,
      args: [
        `--headless=new`, // Chrome's new headless mode supports extensions
        `--disable-extensions-except=${pathToExtension}`,
        `--load-extension=${pathToExtension}`,
        '--enable-features=NetworkService,NetworkServiceInProcess',
        '--disable-features=BackgroundFetch',
      ],
    });

    // Wait for extension to load and get its ID
    // Extension ID is typically available after a short delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    await use(context);
    await context.close();
  },

  extensionId: async ({ extensionContext }, use) => {
    // Get extension ID - retry with multiple methods
    let extensionId = '';

    // Create a page to trigger extension loading
    const page = await extensionContext.newPage();
    await page.goto('data:text/html,<h1>Extension Loading</h1>');

    // Retry logic: Try multiple times with delays
    const maxRetries = 10;
    for (let i = 0; i < maxRetries && !extensionId; i++) {
      await page.waitForTimeout(500);

      // Method 1: Check service workers
      const serviceWorkers = extensionContext.serviceWorkers();
      if (serviceWorkers.length > 0) {
        for (const sw of serviceWorkers) {
          const url = sw.url();
          if (url.includes('chrome-extension://')) {
            const match = url.match(/chrome-extension:\/\/([a-z]{32})\//);
            if (match) {
              extensionId = match[1];
              break;
            }
          }
        }
      }

      // Method 2: Check background pages
      if (!extensionId) {
        const backgroundPages = extensionContext.backgroundPages();
        if (backgroundPages.length > 0) {
          for (const bg of backgroundPages) {
            const url = bg.url();
            if (url.includes('chrome-extension://')) {
              const match = url.match(/chrome-extension:\/\/([a-z]{32})\//);
              if (match) {
                extensionId = match[1];
                break;
              }
            }
          }
        }
      }

      // Method 3: Check all pages for extension URLs
      if (!extensionId) {
        const pages = extensionContext.pages();
        for (const p of pages) {
          const url = p.url();
          if (url.includes('chrome-extension://')) {
            const match = url.match(/chrome-extension:\/\/([a-z]{32})\//);
            if (match) {
              extensionId = match[1];
              break;
            }
          }
        }
      }

      if (i === 0 || i === 5) {
        console.log(`Attempt ${i + 1}/${maxRetries}: Looking for extension ID...`);
      }
    }

    await page.close();

    // If still not found, throw helpful error
    if (!extensionId) {
      throw new Error(
        'Could not determine extension ID after ' + maxRetries + ' attempts. Troubleshooting steps:\n' +
        '1. Ensure extension is built: npm run build\n' +
        '2. Check that dist/ directory exists with manifest.json\n' +
        '3. Verify manifest.json has valid service_worker configuration\n' +
        '4. Try running tests with headless: false to debug\n' +
        '5. Check that the extension loaded properly in the browser context\n' +
        '6. Verify Chrome supports extensions in headless mode with --headless=new flag'
      );
    }

    console.log(`Extension ID detected: ${extensionId}`);
    await use(extensionId);
  },
});

export { expect } from '@playwright/test';
