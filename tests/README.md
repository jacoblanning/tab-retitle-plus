# Testing Guide

This directory contains all tests for the ReTitle Chrome Extension.

## Structure

```
tests/
├── fixtures/              # Playwright fixtures
│   └── extension.ts      # Extension loading fixture
├── pages/                # Page Object Models
│   ├── base-page.ts     # Base class for all pages
│   ├── popup-page.ts    # Popup page object
│   └── options-page.ts  # Options page object
├── helpers/              # Test helpers
│   └── storage-helper.ts # Chrome storage manipulation
├── e2e/                  # E2E test specs
│   └── popup.spec.ts    # Popup tests
└── README.md            # This file
```

## Running Tests

### Prerequisites
1. Build the extension: `npm run build`
2. Ensure `dist/` directory exists with built extension

### Run All Tests
```bash
npx playwright test
```

### Run Specific Test File
```bash
npx playwright test tests/e2e/popup.spec.ts
```

### Run Tests in UI Mode
```bash
npx playwright test --ui
```

### Run Tests in Debug Mode
```bash
npx playwright test --debug
```

## Page Object Model (POM)

We use the Page Object Model pattern for maintainable tests. See `POM_RECOMMENDATION.md` for details.

### Example Usage

```typescript
import { test, expect } from '../fixtures/extension';
import { PopupPage } from '../pages/popup-page';

test('save title', async ({ extensionContext, extensionId }) => {
  const popupPage = new PopupPage(await extensionContext.newPage());
  await popupPage.goto(extensionId);
  await popupPage.enterTitle('[PROD] {original}');
  await popupPage.selectStorageType('tab');
  await popupPage.save();
  await popupPage.expectSuccess();
});
```

## Extension Fixture

The extension fixture automatically loads the extension for each test:

```typescript
test('my test', async ({ extensionContext, extensionId }) => {
  // extensionContext: BrowserContext with extension loaded
  // extensionId: The extension ID (for building URLs)
});
```

## Writing New Tests

1. **Create page object** (if needed) in `tests/pages/`
2. **Use existing page objects** for UI interactions
3. **Use StorageHelper** for setting up test data
4. **Clear storage** in `beforeEach` hooks
5. **Use descriptive test names** that explain what's being tested

### Example: New Test

```typescript
import { test, expect } from '../fixtures/extension';
import { PopupPage } from '../pages/popup-page';
import { StorageHelper } from '../helpers/storage-helper';

test.describe('My Feature', () => {
  test.beforeEach(async ({ extensionContext }) => {
    const storageHelper = new StorageHelper(extensionContext);
    await storageHelper.clearAll();
  });

  test('should do something', async ({ extensionContext, extensionId }) => {
    const popupPage = new PopupPage(await extensionContext.newPage());
    await popupPage.goto(extensionId);
    // ... test logic
  });
});
```

## Debugging Tests

### View Test Execution
```bash
npx playwright test --headed
```

### Debug Specific Test
```bash
npx playwright test --debug tests/e2e/popup.spec.ts
```

### Take Screenshots
Page objects have a `screenshot()` method:
```typescript
await popupPage.screenshot('test-name');
```

### Console Logs
Check browser console in debug mode or use:
```typescript
page.on('console', msg => console.log(msg.text()));
```

## Common Issues

### Extension Not Loading
- Ensure `dist/` directory exists and is built
- Check that `manifest.json` is in `dist/`
- Verify extension path in fixture is correct

### Tests Timing Out
- Add explicit waits for async operations
- Use `waitFor()` for elements that load dynamically
- Increase timeout if needed: `test.setTimeout(10000)`

### Storage Not Clearing
- Ensure `beforeEach` clears storage
- Check that StorageHelper is working correctly
- Verify Chrome storage APIs are available

## Best Practices

1. **Isolation**: Each test should be independent
2. **Cleanup**: Clear storage/data before each test
3. **Page Objects**: Use page objects for all UI interactions
4. **Descriptive Names**: Test names should explain what's tested
5. **Wait Strategically**: Wait for elements, not arbitrary timeouts
6. **Test Data**: Use helpers to set up test data
7. **Assertions**: Use Playwright's expect API

## Resources

- [Playwright Documentation](https://playwright.dev/)
- [Page Object Model Pattern](https://playwright.dev/docs/pom)
- [Chrome Extension Testing](https://playwright.dev/docs/chrome-extensions)
