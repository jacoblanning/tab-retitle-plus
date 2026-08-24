import { test, expect } from '../fixtures/extension';
import { StorageHelper } from '../helpers/storage-helper';
import { OptionsPage } from '../pages/options-page';

test.describe('Options rule management', () => {
  test.beforeEach(async ({ extensionContext }) => {
    const storageHelper = new StorageHelper(extensionContext);
    await storageHelper.clearAll();
  });

  test('edits an existing rule and preserves its metadata', async ({ extensionContext, extensionId }) => {
    const url = 'https://example.com/projects';
    const originalTimestamp = Date.now() - 10_000;
    const storageHelper = new StorageHelper(extensionContext);
    await storageHelper.setStorage({
      urlTitles: {
        [url]: {
          title: '[OLD] {original}',
          originalTitle: 'Projects',
          timestamp: originalTimestamp,
        },
      },
    });

    const page = await extensionContext.newPage();
    const optionsPage = new OptionsPage(page);
    await optionsPage.goto(extensionId);
    await optionsPage.waitForSavedTitles();

    const rule = optionsPage.savedTitleItems().filter({ hasText: url });
    await rule.locator('.edit-title-btn').click();

    await expect(optionsPage.editTitleInput()).toHaveValue('[OLD] {original}');
    await expect(optionsPage.editTitleInput()).toBeFocused();

    await optionsPage.fillEditedTitle('[NEW] {original}');
    await optionsPage.editTitleInput().press('Enter');

    await expect(optionsPage.editTitleInput()).toHaveCount(0);
    await expect(rule.getByText('[NEW] {original}', { exact: true })).toBeVisible();

    const stored = await storageHelper.getStorage('urlTitles');
    expect(stored.urlTitles[url]).toMatchObject({
      title: '[NEW] {original}',
      originalTitle: 'Projects',
    });
    expect(stored.urlTitles[url].timestamp).toBeGreaterThan(originalTimestamp);
  });

  test('keeps invalid edits open and cancels without changing storage', async ({ extensionContext, extensionId }) => {
    const domain = 'example.com';
    const originalTimestamp = Date.now() - 10_000;
    const storageHelper = new StorageHelper(extensionContext);
    await storageHelper.setStorage({
      domainTitles: {
        [domain]: {
          title: '[DOMAIN] {original}',
          originalTitle: 'Example',
          timestamp: originalTimestamp,
        },
      },
    });

    const page = await extensionContext.newPage();
    const optionsPage = new OptionsPage(page);
    await optionsPage.goto(extensionId);
    await optionsPage.waitForSavedTitles();

    const rule = optionsPage.savedTitleItems().filter({ hasText: domain });
    const editButton = rule.locator('.edit-title-btn');
    await editButton.click();
    await optionsPage.fillEditedTitle('   ');
    await optionsPage.saveTitleButton().click();

    await expect(optionsPage.editTitleError()).toHaveText('Title cannot be empty');
    await expect(optionsPage.editTitleError()).toHaveAttribute('role', 'alert');
    await expect(optionsPage.editTitleInput()).toHaveAttribute('aria-invalid', 'true');

    let stored = await storageHelper.getStorage('domainTitles');
    expect(stored.domainTitles[domain].title).toBe('[DOMAIN] {original}');
    expect(stored.domainTitles[domain].timestamp).toBe(originalTimestamp);

    await optionsPage.fillEditedTitle('Unsaved title');
    await optionsPage.editTitleInput().press('Escape');

    await expect(optionsPage.editTitleInput()).toHaveCount(0);
    await expect(rule.getByText('[DOMAIN] {original}', { exact: true })).toBeVisible();
    await expect(editButton).toBeFocused();

    stored = await storageHelper.getStorage('domainTitles');
    expect(stored.domainTitles[domain].title).toBe('[DOMAIN] {original}');
    expect(stored.domainTitles[domain].timestamp).toBe(originalTimestamp);
  });
});
