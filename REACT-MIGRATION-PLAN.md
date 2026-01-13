# React Migration Plan

## Current State Analysis

### What's Working (Vanilla TS):
- ✅ Popup: Functional TypeScript implementation (`popup.ts` + `popup.html`)
- ✅ Options: Functional TypeScript implementation (`options.ts` + `options.html`)
- ✅ Service Worker: Working perfectly
- ✅ Content Script: Working perfectly
- ✅ Tests: All 8 Playwright tests passing
- ✅ Chrome Extension APIs: Fully integrated

### What Exists But Isn't Used (React):
- 📦 React + React DOM (already in dependencies)
- 🎨 Design Components: `src/components/extension-popup.tsx`
- 🎨 Design Components: `src/components/settings-page.tsx`
- 🎨 Tailwind CSS (configured and ready)
- 🎨 lucide-react icons
- 🎨 shadcn/ui style components

### Gap Analysis:
The React components are **design mocks** with:
- ❌ No Chrome extension API integration
- ❌ No real state management (hardcoded values)
- ❌ No message passing to service worker
- ❌ No test mode support
- ❌ No existing rules display
- ⚠️ Different naming conventions (`one-time` vs `once`)

## Migration Strategy

### Recommendation: ✅ YES, Create a Separate Branch

**Reasons:**
1. **Risk Mitigation**: Keep working main branch stable
2. **Testing**: Can test React version thoroughly before merging
3. **Rollback**: Easy to abandon if issues arise
4. **Comparison**: Can A/B test both versions
5. **CI/CD**: Can run tests on both branches

**Branch Name**: `feature/react-ui-migration`

## Migration Scope

### Phase 1: Setup & Infrastructure (1-2 hours)
- [ ] Create feature branch
- [ ] Create React entry points
- [ ] Update Vite config for React builds
- [ ] Add CSS variables for Tailwind theming
- [ ] Test build process

### Phase 2: Popup Migration (3-4 hours)
- [ ] Create `popup-app.tsx` (main React component)
- [ ] Port `ExtensionPopup` design to functional component
- [ ] Integrate Chrome APIs:
  - [ ] `chrome.tabs.query()` for current tab
  - [ ] `chrome.runtime.sendMessage()` for saving
  - [ ] `chrome.runtime.openOptionsPage()` for options link
- [ ] Add test mode support (URL parameters)
- [ ] Implement state management:
  - [ ] Current tab info
  - [ ] Title input
  - [ ] Storage type selection
  - [ ] Preview rendering
  - [ ] Save/error states
  - [ ] Existing rules display
- [ ] Update HTML to mount React
- [ ] Test manually

### Phase 3: Options Migration (3-4 hours)
- [ ] Create `options-app.tsx` (main React component)
- [ ] Port `SettingsPage` design to functional component
- [ ] Integrate Chrome APIs:
  - [ ] `chrome.storage.sync` for settings
  - [ ] `chrome.runtime.sendMessage()` for CRUD
- [ ] Implement state management:
  - [ ] Saved titles list (tab/url/domain/regex)
  - [ ] Settings toggles
  - [ ] Edit/delete functionality
  - [ ] Bulk operations
- [ ] Update HTML to mount React
- [ ] Test manually

### Phase 4: Testing Updates (2-3 hours)
- [ ] Update Playwright tests for new React components
- [ ] Fix any broken selectors (class names may change)
- [ ] Add new tests for React-specific features
- [ ] Ensure all 8 tests still pass
- [ ] Test in CI

### Phase 5: Polish & Cleanup (1-2 hours)
- [ ] Remove old vanilla TS files
- [ ] Update documentation
- [ ] Add component comments
- [ ] Accessibility improvements
- [ ] Final testing

**Total Estimated Time**: 10-15 hours

## Technical Implementation Details

### File Structure (New):
```
src/
├── popup/
│   ├── popup.html          # Update: React mount point
│   ├── popup-app.tsx       # New: Main React component
│   ├── index.tsx           # New: React entry point
│   └── styles/popup.css    # Keep for globals
├── options/
│   ├── options.html        # Update: React mount point
│   ├── options-app.tsx     # New: Main React component
│   ├── index.tsx           # New: React entry point
│   └── styles/options.css  # Keep for globals
├── components/
│   ├── extension-popup.tsx # Refactor: Functional version
│   └── settings-page.tsx   # Refactor: Functional version
└── hooks/                  # New: Custom React hooks
    ├── useCurrentTab.ts    # Hook for chrome.tabs.query
    ├── useExtensionStorage.ts  # Hook for chrome.storage
    └── useMessages.ts      # Hook for chrome.runtime.sendMessage
```

### Vite Config Changes:

```typescript
// vite.config.ts
export default defineConfig({
  // ... existing config
  build: {
    rollupOptions: {
      input: {
        popup: resolve(__dirname, 'src/popup/popup.html'),
        options: resolve(__dirname, 'src/options/options.html'),
        // Remove these - they'll be imported by React entry points:
        // 'popup-ts': resolve(__dirname, 'src/popup/popup.ts'),
        // 'options-ts': resolve(__dirname, 'src/options/options.ts'),
      },
    },
  },
});
```

### Sample React Entry Point:

```typescript
// src/popup/index.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { PopupApp } from './popup-app';
import '../styles/globals.css';

const root = document.getElementById('root');
if (root) {
  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <PopupApp />
    </React.StrictMode>
  );
}
```

### Sample Custom Hook:

```typescript
// src/hooks/useCurrentTab.ts
import { useState, useEffect } from 'react';

export function useCurrentTab() {
  const [tab, setTab] = useState<chrome.tabs.Tab | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for test mode
    const url = new URL(window.location.href);
    if (url.searchParams.get('testMode') === 'true') {
      setTab({
        id: parseInt(url.searchParams.get('tabId') || '1'),
        url: url.searchParams.get('tabUrl') || '',
        title: url.searchParams.get('tabTitle') || '',
        // ... mock tab
      } as chrome.tabs.Tab);
      setLoading(false);
      return;
    }

    // Production mode
    chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
      setTab(tab);
      setLoading(false);
    });
  }, []);

  return { tab, loading };
}
```

## Benefits of React Migration

### Developer Experience:
- ✅ Type-safe component props
- ✅ Easier state management
- ✅ Component reusability
- ✅ Modern development tools
- ✅ Hot reload (with Vite)

### User Experience:
- ✅ More polished UI (shadcn/ui style)
- ✅ Better animations
- ✅ Consistent design system
- ✅ Improved accessibility
- ✅ Modern look and feel

### Maintainability:
- ✅ Declarative UI
- ✅ Easier to test
- ✅ Better component isolation
- ✅ Cleaner code organization

## Risks & Mitigation

### Risk 1: Breaking Tests
**Impact**: High
**Probability**: Medium
**Mitigation**:
- Keep test structure identical
- Use same IDs for elements
- Update selectors incrementally
- Test frequently

### Risk 2: Bundle Size Increase
**Impact**: Medium
**Probability**: High
**Mitigation**:
- React + ReactDOM ~130KB (gzipped)
- Extension popup loads once, not performance critical
- Use code splitting if needed
- Monitor build size

### Risk 3: Chrome API Issues
**Impact**: High
**Probability**: Low
**Mitigation**:
- Chrome APIs work fine in React
- Use hooks to abstract complexity
- Test thoroughly
- Keep service worker unchanged

### Risk 4: Test Mode Compatibility
**Impact**: High
**Probability**: Medium
**Mitigation**:
- Implement test mode in hooks
- Test early in migration
- Document test mode usage

## Decision Points

### Question 1: All at Once or Incremental?
**Recommendation**: All at once (popup + options together)
- Ensures consistent UX
- Easier to test as a unit
- One build config change
- Less back-and-forth

### Question 2: Keep Vanilla Version?
**Recommendation**: No, replace completely
- Maintaining both is complex
- React version is superior
- Full commit to React
- Cleaner codebase

### Question 3: Merge Strategy?
**Recommendation**: Feature branch → PR → Review → Merge
- Allows thorough review
- CI runs on PR
- Easy to iterate
- Clear merge point

## Success Criteria

### Before Merge:
- [ ] All 8 Playwright tests passing
- [ ] Manual testing checklist complete
- [ ] Bundle size acceptable (<500KB total)
- [ ] No console errors
- [ ] Accessibility verified
- [ ] Performance acceptable (no lag)
- [ ] Works in test mode
- [ ] CI passing

## Next Steps

1. **Decision**: Confirm approach with stakeholders
2. **Branch**: Create `feature/react-ui-migration`
3. **Spike**: 2-hour spike to prove viability
   - Build popup in React
   - Test Chrome APIs
   - Verify build process
4. **Implementation**: Follow phase plan
5. **Review**: PR review before merge
6. **Deploy**: Merge to main, release

## Alternative: Keep Both

If you want to be extra cautious:
- Keep vanilla files as `popup-vanilla.ts`
- Build both versions
- Switch via manifest change
- Deprecate vanilla after React stable

**Not recommended** - adds complexity.

## Conclusion

**Recommended Path**:
1. ✅ Create feature branch `feature/react-ui-migration`
2. ✅ Migrate popup + options to React
3. ✅ Update tests
4. ✅ Thorough testing
5. ✅ PR review
6. ✅ Merge to main

**Timeline**: 2-3 days of focused work

**Risk Level**: Low-Medium (mitigated by branch strategy)

**ROI**: High (better UX, maintainability, modern codebase)
