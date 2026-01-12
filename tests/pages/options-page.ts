import { type Page, expect } from '@playwright/test';
import { BasePage } from './base-page';

/**
 * Page Object Model for the ReTitle options page
 * 
 * Encapsulates all interactions with the options/settings page
 */
export class OptionsPage extends BasePage {
  // Locators
  readonly savedTitlesContainer = () => this.page.locator('#saved-titles');
  readonly customizeShortcutButton = () => this.page.locator('#customize-shortcut-btn');
  readonly enableBookmarkTitles = () => this.page.locator('#enable-bookmark-titles');
  readonly enableContextMenu = () => this.page.locator('#enable-context-menu');
  readonly debugMode = () => this.page.locator('#debug-mode');

  constructor(page: Page) {
    super(page);
  }

  /**
   * Navigate to options page
   */
  async goto(extensionId: string): Promise<void> {
    await this.page.goto(`chrome-extension://${extensionId}/options.html`);
    await this.waitForReady();
    // Wait for options page to load
    await this.savedTitlesContainer().waitFor({ state: 'visible' });
  }

  /**
   * Get count of saved titles
   */
  async getSavedTitlesCount(): Promise<number> {
    const titles = await this.savedTitlesContainer().locator('.saved-title-item').count();
    return titles;
  }

  /**
   * Delete a saved title by index
   */
  async deleteSavedTitle(index: number): Promise<void> {
    const deleteButtons = await this.savedTitlesContainer()
      .locator('.delete-title-btn')
      .all();
    if (deleteButtons[index]) {
      await deleteButtons[index].click();
    }
  }

  /**
   * Edit a saved title by index
   */
  async editSavedTitle(index: number): Promise<void> {
    const editButtons = await this.savedTitlesContainer()
      .locator('.edit-title-btn')
      .all();
    if (editButtons[index]) {
      await editButtons[index].click();
    }
  }

  /**
   * Click customize shortcut button
   */
  async customizeShortcut(): Promise<void> {
    await this.customizeShortcutButton().click();
  }

  /**
   * Toggle bookmark titles setting
   */
  async toggleBookmarkTitles(enabled: boolean): Promise<void> {
    const checkbox = this.enableBookmarkTitles();
    const isChecked = await checkbox.isChecked();
    if (isChecked !== enabled) {
      await checkbox.click();
    }
  }

  /**
   * Toggle context menu setting
   */
  async toggleContextMenu(enabled: boolean): Promise<void> {
    const checkbox = this.enableContextMenu();
    const isChecked = await checkbox.isChecked();
    if (isChecked !== enabled) {
      await checkbox.click();
    }
  }

  /**
   * Toggle debug mode
   */
  async toggleDebugMode(enabled: boolean): Promise<void> {
    const checkbox = this.debugMode();
    const isChecked = await checkbox.isChecked();
    if (isChecked !== enabled) {
      await checkbox.click();
    }
  }

  /**
   * Check if bookmark titles is enabled
   */
  async isBookmarkTitlesEnabled(): Promise<boolean> {
    return await this.enableBookmarkTitles().isChecked();
  }

  /**
   * Check if context menu is enabled
   */
  async isContextMenuEnabled(): Promise<boolean> {
    return await this.enableContextMenu().isChecked();
  }

  /**
   * Check if debug mode is enabled
   */
  async isDebugModeEnabled(): Promise<boolean> {
    return await this.debugMode().isChecked();
  }

  /**
   * Wait for saved titles to load
   */
  async waitForSavedTitles(): Promise<void> {
    // Wait for loading text to disappear
    await this.page.waitForFunction(
      () => {
        const container = document.getElementById('saved-titles');
        return container && !container.textContent?.includes('Loading...');
      },
      { timeout: 5000 }
    );
  }
}
