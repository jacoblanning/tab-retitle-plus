import { type Page, expect } from '@playwright/test';
import { BasePage } from './base-page';

/**
 * Page Object Model for the ReTitle popup
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
   */
  async goto(extensionId: string): Promise<void> {
    await this.page.goto(`chrome-extension://${extensionId}/popup.html`);
    await this.waitForReady();
    // Wait for popup to initialize
    await this.titleInput().waitFor({ state: 'visible' });
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
