# Next Steps & Priorities

## ✅ Completed

1. **shadcn/ui Setup** - React, Tailwind, and shadcn/ui configured
2. **Build Configuration** - Fixed HTML file paths and build output
3. **Page Object Model** - POM structure created for testing
4. **Extension Fixture** - Playwright extension loading fixture ready
5. **Test Structure** - E2E test examples created

## 🎯 Recommended Next Steps (Priority Order)

### 1. **Test & Fix Playwright Setup** (High Priority)
**Why:** Ensure tests actually work before writing more

**Tasks:**
- [ ] Run a simple test to verify extension loading works
- [ ] Fix any extension ID detection issues
- [ ] Verify popup page object methods work correctly
- [ ] Test storage helper functionality

**Commands:**
```bash
# Run a single test
npx playwright test tests/e2e/popup.spec.ts -g "should display popup correctly"

# Run all tests
npx playwright test

# Debug mode
npx playwright test --debug
```

### 2. **Add ESLint & Prettier** (High Priority)
**Why:** Code quality and consistency

**Tasks:**
- [ ] Install ESLint + Prettier
- [ ] Configure for TypeScript + React
- [ ] Add npm scripts (`lint`, `format`)
- [ ] Fix existing code issues
- [ ] Add pre-commit hooks (optional)

**Quick Start:**
```bash
npm install -D eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin \
  eslint-plugin-react eslint-plugin-react-hooks prettier eslint-config-prettier

# Create .eslintrc.json and .prettierrc
```

### 3. **Expand Test Coverage** (Medium Priority)
**Why:** Confidence in changes

**Tasks:**
- [ ] Write tests for all storage types
- [ ] Test priority system
- [ ] Test options page functionality
- [ ] Add unit tests for utilities (Vitest)
- [ ] Test error scenarios

### 4. **React Migration** (Medium Priority)
**Why:** Better UI development with shadcn/ui

**Tasks:**
- [ ] Convert popup to React (`src/popup/Popup.tsx`)
- [ ] Use shadcn/ui components (Button, Input, Card)
- [ ] Convert options page to React
- [ ] Extract shared components
- [ ] Update tests for React components

**Migration Order:**
1. Popup (smaller, simpler)
2. Options page (more complex)

### 5. **Error Handling Improvements** (Medium Priority)
**Why:** Better user experience

**Tasks:**
- [ ] Create centralized error handler
- [ ] Add error boundaries for React
- [ ] Implement structured logging
- [ ] Add user-friendly error messages
- [ ] Show errors in UI (toast notifications)

### 6. **Developer Experience** (Low Priority)
**Why:** Faster development

**Tasks:**
- [ ] Add VS Code settings (format on save)
- [ ] Create development scripts
- [ ] Add hot reload for popup/options
- [ ] Improve build feedback

### 7. **Documentation** (Low Priority)
**Why:** Easier onboarding

**Tasks:**
- [ ] Add JSDoc comments
- [ ] Document message passing protocol
- [ ] Create component documentation
- [ ] Update README with new features

## 🚀 Quick Wins (Do These First)

1. **Run Playwright tests** - Verify they work
2. **Add ESLint** - Catch issues early
3. **Write 2-3 basic tests** - Get test coverage started

## 📋 Testing Checklist

Before considering tests "done":
- [ ] Extension loads correctly in tests
- [ ] Popup opens and displays correctly
- [ ] Can save titles with all storage types
- [ ] Options page loads and functions
- [ ] Storage helper works
- [ ] Tests run in CI (GitHub Actions)

## 🎨 React Migration Checklist

When migrating to React:
- [ ] Install React dependencies (✅ Done)
- [ ] Create Popup.tsx component
- [ ] Replace popup.html with React entry point
- [ ] Use shadcn/ui components
- [ ] Test popup functionality
- [ ] Repeat for options page
- [ ] Update build config if needed

## 💡 Tips

- **Start small** - Don't try to do everything at once
- **Test incrementally** - Write tests as you add features
- **Use POM** - Makes tests maintainable
- **Follow .cursorrules** - Keeps code consistent

## 🔗 Resources

- [Playwright Extension Testing](https://playwright.dev/docs/chrome-extensions)
- [shadcn/ui Components](https://ui.shadcn.com/docs/components)
- [React Migration Guide](https://react.dev/learn)
- [Chrome Extension Docs](https://developer.chrome.com/docs/extensions/)
