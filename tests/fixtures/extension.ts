import { test as base, expect } from '@playwright/test';
import { chromium, type BrowserContext } from 'playwright';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const EXTENSION_DIST = path.resolve(__dirname, '../../dist');

export const test = base.extend<{
  extensionContext: BrowserContext & { evaluate?: (...args: any[]) => Promise<any> };
  extensionId: string;
}>({
  extensionContext: async ({}, use) => {
    if (!fs.existsSync(EXTENSION_DIST)) {
      throw new Error(`Extension build not found at ${EXTENSION_DIST}. Run: npm run build`);
    }

    const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pw-ext-'));
    const context = await chromium.launchPersistentContext(userDataDir, {
      // Chrome extensions don't work properly in headless mode
      // CI requires Xvfb or similar for headed mode
      headless: false,
      viewport: { width: 1280, height: 800 },
      args: [
        `--disable-extensions-except=${EXTENSION_DIST}`,
        `--load-extension=${EXTENSION_DIST}`,
        // Additional args for better CI compatibility
        '--disable-dev-shm-usage', // Overcome limited resource problems
        '--no-sandbox', // Required in most CI environments (Docker)
      ],
    });

    /**
     * context.evaluate polyfill (improved)
     * - If an extension service worker exists, run the function in the worker's context (worker.evaluate).
     * - Else if an extension page exists (chrome-extension://...), run it there (page.evaluate).
     * - Else fallback to opening a temporary page (about:blank) but warn (chrome APIs will be undefined).
     */
    // @ts-ignore
    context.evaluate = async (pageFunction: Function | string, ...args: any[]) => {
      // Try service worker first (MV3 SW)
      const sw = context.serviceWorkers().find((w) => w.url().startsWith('chrome-extension://'));
      if (sw) {
        try {
          return await sw.evaluate(pageFunction as any, ...args);
        } catch (err) {
          // fallthrough to try pages
        }
      }

      // Try any extension page (e.g. options.html, popup background pages)
      const extPage = context.pages().find((p) => p.url().startsWith('chrome-extension://'));
      if (extPage) {
        try {
          return await extPage.evaluate(pageFunction as any, ...args);
        } catch (err) {
          // fallthrough to fallback
        }
      }

      // Fallback: run in temporary content page (chrome.* will NOT be available)
      console.warn('context.evaluate: extension context not found; falling back to a normal page (chrome APIs unavailable).');
      const page = await context.newPage();
      try {
        await page.goto('about:blank');
        return await page.evaluate(pageFunction as any, ...args);
      } finally {
        await page.close();
      }
    };

    // Forward console messages from pages to stdout for debugging.
    const forwardPageConsole = (page: any) => {
      page.on('console', (msg: any) => {
        try {
          console.log(`[EXT PAGE][${page.url()}] ${msg.text()}`);
        } catch {
          // ignore
        }
      });
    };

    for (const p of context.pages()) forwardPageConsole(p);
    context.on('page', forwardPageConsole);

    // Forward service worker console messages (best-effort)
    for (const worker of context.serviceWorkers()) {
      try {
        worker.on('console', (msg: any) => console.log(`[SW][${worker.url()}] ${msg.text()}`));
      } catch {
        /* ignore */
      }
    }

    const discoverExtensionId = async (timeout = 5000) => {
      const start = Date.now();
      while (Date.now() - start < timeout) {
        const sw2 = context.serviceWorkers().find((w) => w.url().startsWith('chrome-extension://'));
        if (sw2) return new URL(sw2.url()).hostname;
        const bgPage = context.pages().find((p) => p.url().startsWith('chrome-extension://'));
        if (bgPage) return new URL(bgPage.url()).hostname;
        await new Promise((r) => setTimeout(r, 100));
      }
      return '';
    };

    try {
      const extensionId = await discoverExtensionId(5000);
      if (!extensionId) {
        console.warn('Service worker event not detected, trying alternative methods...');
      } else {
        console.log('Extension ID detected:', extensionId);
      }

      await use(context as any);
    } finally {
      await context.close().catch(() => {});
      try {
        fs.rmSync(userDataDir, { recursive: true, force: true });
      } catch {
        /* ignore */
      }
    }
  },

  extensionId: async ({ extensionContext }, use) => {
    let id = '';
    const sw = extensionContext.serviceWorkers().find((w) => w.url().startsWith('chrome-extension://'));
    if (sw) id = new URL(sw.url()).hostname;
    if (!id) {
      const page = extensionContext.pages().find((p) => p.url().startsWith('chrome-extension://'));
      if (page) id = new URL(page.url()).hostname;
    }
    await use(id);
  },
});

export { expect };
export default test;