import { test as base, chromium, type BrowserContext } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import os from 'os';

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
    // console.log(`[DEBUG] Loading extension from: ${pathToExtension}`);

    // Create a temporary user data directory
    const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'chrome-user-data-'));

    const context = await chromium.launchPersistentContext(userDataDir, {
      headless: false, // We must tell Playwright we are headed to allow extensions
      // dumpio: true, // Capture browser logs - uncomment for debugging
      args: [
        `--disable-extensions-except=${pathToExtension}`,
        `--load-extension=${pathToExtension}`,
        '--headless=new', // But we tell Chrome to run in new headless mode
        '--no-sandbox', // Recommended for CI
        '--disable-gpu', // Recommended for CI
      ],
    });

    await use(context);
    await context.close();

    // Clean up user data directory
    try {
      fs.rmSync(userDataDir, { recursive: true, force: true });
    } catch (e) {
      // Ignore cleanup errors
    }
  },

  extensionId: async ({ extensionContext }, use) => {
    // Get extension ID from service worker (Manifest V3)
    let extensionId = '';

    // Helper to log what we see
    const logDebugInfo = () => {
      const workers = extensionContext.serviceWorkers();
      console.log(`[DEBUG] Found ${workers.length} service workers.`);
      workers.forEach((w, i) => console.log(`[DEBUG] Worker ${i}: ${w.url()}`));

      const backgroundPages = extensionContext.backgroundPages();
      console.log(`[DEBUG] Found ${backgroundPages.length} background pages.`);
      backgroundPages.forEach((p, i) => console.log(`[DEBUG] Background Page ${i}: ${p.url()}`));
    };

    // Strategy 1: Check existing service workers (in case it already started)
    const checkServiceWorkers = () => {
      const serviceWorkers = extensionContext.serviceWorkers();
      for (const worker of serviceWorkers) {
        const url = worker.url();
        const match = url.match(/chrome-extension:\/\/([a-z]{32})\//);
        if (match) {
          return match[1];
        }
      }
      return null;
    };

    extensionId = checkServiceWorkers() || '';

    // Strategy 2: Wait for service worker event
    if (!extensionId) {
      try {
        const worker = await extensionContext.waitForEvent('serviceworker', { timeout: 5000 });
        const url = worker.url();
        const match = url.match(/chrome-extension:\/\/([a-z]{32})\//);
        if (match) {
          extensionId = match[1];
        }
      } catch (e) {
        // Ignore timeout
      }
    }

    // Strategy 3: Poll for service worker
    if (!extensionId) {
      for (let i = 0; i < 10; i++) {
        await new Promise(resolve => setTimeout(resolve, 200));
        extensionId = checkServiceWorkers() || '';
        if (extensionId) break;
      }
    }

    // Fallback Debugging
    if (!extensionId) {
      logDebugInfo();
      throw new Error(
        'Could not determine extension ID. Troubleshooting steps:\n' +
        '1. Ensure extension is built: npm run build\n' +
        '2. Check that dist/ directory exists with manifest.json\n' +
        '3. Verify manifest.json has valid service_worker configuration\n' +
        '4. Try running tests with headless: false to debug'
      );
    }

    await use(extensionId);
  },
});

export { expect } from '@playwright/test';
