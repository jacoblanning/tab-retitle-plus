import { type Page, expect } from '@playwright/test';
import { BasePage } from './base-page';

/**
 * Page Object Model for the Tab ReTitle+ popup
 * 
 * Encapsulates all interactions with the popup UI
 */
export class PopupPage extends BasePage {
  // Locators
  readonly titleInput = () => this.page.locator('#title-input');
  readonly previewContainer = () => this.page.locator('#preview-container');
  readonly titlePreview = () => this.page.locator('#title-preview');
  readonly saveButton = () => this.page.locator('#save-btn');
  readonly clearButton = () => this.page.locator('#clear-btn');
  readonly currentUrl = () => this.page.locator('#current-url');
  readonly currentTitle = () => this.page.locator('#current-title');
  readonly existingRulesContainer = () => this.page.locator('#existing-rules-container');
  readonly existingRulesList = () => this.page.locator('#existing-rules-list');
  readonly optionsLink = () => this.page.locator('#open-options');

  // Storage type radio buttons
  readonly storageTypeOnce = () => this.page.locator('input[name="storage-type"][value="once"]');
  readonly storageTypeTab = () => this.page.locator('input[name="storage-type"][value="tab"]');
  readonly storageTypeUrl = () => this.page.locator('input[name="storage-type"][value="url"]');
  readonly storageTypeDomain = () => this.page.locator('input[name="storage-type"][value="domain"]');

  constructor(page: Page) {
    super(page);
  }

  /**
   * Navigate to popup
   * Creates a real tab to interact with (more realistic testing)
   */
  async goto(extensionId: string, options?: { tabUrl?: string; tabTitle?: string }): Promise<void> {
    const browserContext = this.page.context();

    // Create a real tab that the popup can interact with
    const targetPage = await browserContext.newPage();
    const targetUrl = options?.tabUrl || 'https://example.com';

    // Navigate to the target URL (or use a data URL with custom title)
    if (options?.tabTitle) {
      // Create a simple HTML page with the desired title
      const html = `<!DOCTYPE html><html><head><title>${options.tabTitle}</title></head><body>Test Page</body></html>`;
      await targetPage.goto(`data:text/html,${encodeURIComponent(html)}`);
    } else {
      await targetPage.goto(targetUrl).catch(() => {
        // If navigation fails (blocked URL), use data URL
        const html = `<!DOCTYPE html><html><head><title>Test Page</title></head><body>Test</body></html>`;
        return targetPage.goto(`data:text/html,${encodeURIComponent(html)}`);
      });
    }

    // Wait for page to be ready
    await targetPage.waitForLoadState('domcontentloaded');

    // Get all tabs and find the one matching our target page URL
    const tabs = await browserContext.evaluate(() => {
      return new Promise<chrome.tabs.Tab[]>((resolve) => {
        chrome.tabs.query({}, (tabs) => {
          resolve(tabs);
        });
      });
    });

    const targetPageUrl = targetPage.url();
    const matchingTab = tabs.find(tab => tab.url === targetPageUrl);
    const tabId = matchingTab?.id || tabs[tabs.length - 1]?.id || 1;

    // Now open the popup with the real tab context
    // Use the desired targetUrl, not the actual page URL (which might be a data URL)
    const params = new URLSearchParams({
      testMode: 'true',
      tabId: tabId.toString(),
      tabUrl: targetUrl, // Use the targetUrl option, not targetPage.url()
      tabTitle: await targetPage.title(),
    });

    await this.page.goto(`chrome-extension://${extensionId}/popup.html?${params.toString()}`);
    await this.waitForReady();
    // Wait for popup to initialize
    await this.titleInput().waitFor({ state: 'visible' });

    // Store reference to target page and tab ID for tests that need it
    (this.page as any)._targetPage = targetPage;
    (this.page as any)._targetTabId = tabId;
  }

  /**
   * Get the target page created for this popup test
   */
  getTargetPage(): any {
    return (this.page as any)._targetPage;
  }

  /**
   * Get the target tab ID
   */
  getTargetTabId(): number {
    return (this.page as any)._targetTabId;
  }

  /**
   * Enter title in the input field
   */
  async enterTitle(title: string): Promise<void> {
    await this.titleInput().fill(title);
  }

  /**
   * Get current title value
   */
  async getTitle(): Promise<string> {
    return await this.titleInput().inputValue();
  }

  /**
   * Select storage type
   */
  async selectStorageType(type: 'once' | 'tab' | 'url' | 'domain'): Promise<void> {
    const radioMap = {
      once: this.storageTypeOnce(),
      tab: this.storageTypeTab(),
      url: this.storageTypeUrl(),
      domain: this.storageTypeDomain(),
    };
    await radioMap[type].check();
  }

  /**
   * Get selected storage type
   */
  async getSelectedStorageType(): Promise<string | null> {
    const checked = await this.page.locator('input[name="storage-type"]:checked').first();
    return await checked.getAttribute('value');
  }

  /**
   * Click save button
   */
  async save(): Promise<void> {
    await this.saveButton().click();
  }

  /**
   * Click clear button
   */
  async clear(): Promise<void> {
    await this.clearButton().click();
  }

  /**
   * Check if preview is visible
   */
  async isPreviewVisible(): Promise<boolean> {
    return await this.previewContainer().isVisible();
  }

  /**
   * Get preview text
   */
  async getPreviewText(): Promise<string> {
    return await this.titlePreview().textContent() || '';
  }

  /**
   * Wait for success message
   */
  async expectSuccess(): Promise<void> {
    await expect(this.saveButton()).toHaveText('Saved!', { timeout: 2000 });
  }

  /**
   * Wait for error message
   */
  async expectError(message?: string): Promise<void> {
    if (message) {
      await expect(this.saveButton()).toHaveText(message, { timeout: 2000 });
    } else {
      // Just check that button text changed (indicating error)
      const text = await this.saveButton().textContent();
      expect(text).not.toBe('Save Title');
    }
  }

  /**
   * Get current URL displayed in popup
   */
  async getDisplayedUrl(): Promise<string> {
    return await this.currentUrl().textContent() || '';
  }

  /**
   * Get current title displayed in popup
   */
  async getDisplayedTitle(): Promise<string> {
    return await this.currentTitle().textContent() || '';
  }

  /**
   * Check if existing rules are displayed
   */
  async hasExistingRules(): Promise<boolean> {
    return await this.existingRulesContainer().isVisible();
  }

  /**
   * Get count of existing rules
   */
  async getExistingRulesCount(): Promise<number> {
    if (!(await this.hasExistingRules())) {
      return 0;
    }
    const rules = await this.existingRulesList().locator('div').count();
    return rules;
  }

  /**
   * Edit an existing rule by index
   */
  async editRule(index: number): Promise<void> {
    const editButtons = await this.existingRulesList().locator('.edit-rule-btn').all();
    if (editButtons[index]) {
      await editButtons[index].click();
    }
  }

  /**
   * Delete an existing rule by index
   */
  async deleteRule(index: number): Promise<void> {
    const deleteButtons = await this.existingRulesList().locator('.delete-rule-btn').all();
    if (deleteButtons[index]) {
      await deleteButtons[index].click();
    }
  }

  /**
   * Open options page
   */
  async openOptions(): Promise<void> {
    await this.optionsLink().click();
  }

  /**
   * Wait for popup to close (after save)
   */
  async waitForClose(): Promise<void> {
    // Popup closes after successful save
    await this.page.waitForEvent('close', { timeout: 5000 }).catch(() => {
      // Popup might not close in test environment
    });
  }
}
