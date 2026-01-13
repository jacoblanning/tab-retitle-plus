import { test, expect } from '../fixtures/extension';
import { PopupPage } from '../pages/popup-page';
import { StorageHelper } from '../helpers/storage-helper';

test.describe('Popup Functionality', () => {
  test.beforeEach(async ({ extensionContext, extensionId }) => {
    // Clear storage before each test
    const storageHelper = new StorageHelper(extensionContext);
    await storageHelper.clearAll();
  });

  test('should display popup correctly', async ({ extensionContext, extensionId }) => {
    const popupPage = new PopupPage(await extensionContext.newPage());
    await popupPage.goto(extensionId);

    // Check that all elements are visible
    await expect(popupPage.titleInput()).toBeVisible();
    await expect(popupPage.saveButton()).toBeVisible();
    await expect(popupPage.clearButton()).toBeVisible();
  });

  test('should show preview when entering title', async ({ extensionContext, extensionId }) => {
    const popupPage = new PopupPage(await extensionContext.newPage());
    await popupPage.goto(extensionId);

    await popupPage.enterTitle('[PROD] {original}');
    
    // Preview should be visible
    const isVisible = await popupPage.isPreviewVisible();
    expect(isVisible).toBe(true);

    // Preview should contain text
    const previewText = await popupPage.getPreviewText();
    expect(previewText).toBeTruthy();
  });

  test('should save one-time title', async ({ extensionContext, extensionId }) => {
    const popupPage = new PopupPage(await extensionContext.newPage());
    await popupPage.goto(extensionId);

    await popupPage.enterTitle('Test Title');
    await popupPage.selectStorageType('once');
    await popupPage.save();

    // Should show success message
    await popupPage.expectSuccess();
  });

  test('should save tab-specific title', async ({ extensionContext, extensionId }) => {
    const popupPage = new PopupPage(await extensionContext.newPage());
    await popupPage.goto(extensionId);

    await popupPage.enterTitle('[TAB] Test');
    await popupPage.selectStorageType('tab');
    await popupPage.save();

    await popupPage.expectSuccess();
  });

  test('should save URL-specific title', async ({ extensionContext, extensionId }) => {
    const popupPage = new PopupPage(await extensionContext.newPage());
    await popupPage.goto(extensionId);

    await popupPage.enterTitle('[URL] Test');
    await popupPage.selectStorageType('url');
    await popupPage.save();

    await popupPage.expectSuccess();
  });

  test('should save domain-specific title', async ({ extensionContext, extensionId }) => {
    const popupPage = new PopupPage(await extensionContext.newPage());
    await popupPage.goto(extensionId);

    await popupPage.enterTitle('[DOMAIN] Test');
    await popupPage.selectStorageType('domain');
    await popupPage.save();

    await popupPage.expectSuccess();
  });

  test('should clear input when clear button clicked', async ({ extensionContext, extensionId }) => {
    const popupPage = new PopupPage(await extensionContext.newPage());
    await popupPage.goto(extensionId);

    await popupPage.enterTitle('Test Title');
    await popupPage.clear();

    const title = await popupPage.getTitle();
    expect(title).toBe('');
  });

  test('should display existing rules', async ({ extensionContext, extensionId }) => {
    // Set up storage with existing rules
    // NOTE: example.com navigates to https://example.com/ (with trailing slash)
    const testUrl = 'https://example.com/';
    const storageHelper = new StorageHelper(extensionContext);
    await storageHelper.setUrlTitle(testUrl, '[TEST] Example');

    // Verify storage was set
    const stored = await storageHelper.getStorage();
    if (!stored.urlTitles || !stored.urlTitles[testUrl]) {
      // Give a short retry window if service worker hasn't persisted yet
      await new Promise(r => setTimeout(r, 200));
      const stored2 = await storageHelper.getStorage();
      expect(stored2.urlTitles && stored2.urlTitles[testUrl]).toBeDefined();
    }

    const popupPage = new PopupPage(await extensionContext.newPage());
    // Pass the URL that matches our stored rule
    await popupPage.goto(extensionId, {
      tabUrl: testUrl,
      tabTitle: 'Example Domain'
    });

    // Wait for rules container to become visible (more reliable than fixed timeout)
    await popupPage.existingRulesContainer().waitFor({ state: 'visible', timeout: 2000 });

    const hasRules = await popupPage.hasExistingRules();
    expect(hasRules).toBe(true);
  });
});
