# Page Object Model (POM) for Chrome Extension Testing

## ✅ Why POM is Beneficial for Chrome Extensions

### Benefits:
1. **Separation of Concerns** - UI selectors isolated from test logic
2. **Reusability** - Page objects can be reused across multiple tests
3. **Maintainability** - When UI changes, update one place (the page object)
4. **Readability** - Tests read like user stories
5. **Extension-Specific** - Handles unique extension contexts (popup, options, content scripts)

### Chrome Extension Challenges POM Solves:
- **Multiple Page Contexts** - Popup, options page, content scripts
- **Extension Loading** - Need to load unpacked extension
- **Service Worker** - Background script testing
- **Message Passing** - Communication between contexts

## 📁 Recommended Structure

```
tests/
├── fixtures/              # Playwright fixtures for extension setup
│   └── extension.ts      # Extension loading helper
├── pages/                 # Page Objects
│   ├── base-page.ts      # Base class for all pages
│   ├── popup-page.ts     # Popup page object
│   ├── options-page.ts   # Options page object
│   └── web-page.ts       # Web page (for content script testing)
├── helpers/               # Test helpers
│   ├── storage-helper.ts # Chrome storage manipulation
│   └── message-helper.ts # Message passing helpers
└── e2e/                   # E2E test specs
    ├── popup.spec.ts
    ├── options.spec.ts
    ├── storage-types.spec.ts
    └── priority.spec.ts
```

## 🎯 Implementation Strategy

### Phase 1: Core Infrastructure
1. Create extension loading fixture
2. Create base page class
3. Create popup page object
4. Create options page object

### Phase 2: Test Coverage
1. Popup functionality tests
2. Options page tests
3. Storage type tests
4. Priority system tests

### Phase 3: Advanced
1. Content script testing
2. Service worker testing
3. Message passing tests
4. Cross-context communication

## 📝 Example Usage

### Before (Without POM):
```typescript
test('save title', async ({ page }) => {
  await page.goto('chrome-extension://.../popup.html');
  await page.fill('#title-input', '[PROD] {original}');
  await page.click('input[value="tab"]');
  await page.click('#save-btn');
  await expect(page.locator('#save-btn')).toHaveText('Saved!');
});
```

### After (With POM):
```typescript
test('save title', async ({ popupPage }) => {
  await popupPage.enterTitle('[PROD] {original}');
  await popupPage.selectStorageType('tab');
  await popupPage.save();
  await popupPage.expectSuccess();
});
```

## 🔧 Extension-Specific Considerations

### 1. Extension Loading
- Use Playwright's `chromium.connectOverCDP()` or load unpacked extension
- Handle extension ID dynamically
- Wait for extension to be ready

### 2. Multiple Contexts
- Popup: Separate page context
- Options: Separate page context
- Content Script: Injected into web pages
- Service Worker: Background script (test via messages)

### 3. Async Operations
- Chrome storage is async
- Message passing is async
- Service worker wake-up is async
- Use proper waits and timeouts

### 4. State Management
- Clear storage between tests
- Reset extension state
- Handle service worker lifecycle

## 📚 Best Practices

1. **One Page Object Per Page** - Popup, Options, Web Page
2. **Base Class** - Shared functionality (waiting, navigation)
3. **Helper Classes** - Storage, Messages, Extension utilities
4. **Locators** - Use data-testid attributes for stable selectors
5. **Actions** - High-level methods (saveTitle, not fillInput)
6. **Assertions** - Page object methods return assertions

## 🚀 Next Steps

1. ✅ Review this recommendation
2. Create extension loading fixture
3. Implement page objects
4. Write tests using POM
5. Refactor existing tests (if any)
