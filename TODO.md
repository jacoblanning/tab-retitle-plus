# 📋 TODO List

This file tracks tasks, improvements, and ideas for the ReTitle extension.

**How to use:**
- Add new tasks to the appropriate section
- Check off completed tasks: `- [x]`
- Move tasks between sections as priorities change
- Add dates when tasks are completed (optional)

---

## 🔥 High Priority

### Testing & Quality
- [x] Fix Playwright extension fixture (extension ID detection) - 2026-01-12
- [ ] Run first successful Playwright test
- [ ] Add ESLint & Prettier configuration
- [ ] Fix any linting errors in existing code
- [ ] Add pre-commit hooks (optional)

### Build & Development
- [ ] Verify all build outputs are correct
- [ ] Test extension loads correctly in Chrome
- [ ] Verify popup and options pages work

---

## 📝 Medium Priority

### React Migration
- [ ] Convert popup to React (`src/popup/Popup.tsx`)
- [ ] Use shadcn/ui components in popup
- [ ] Convert options page to React
- [ ] Extract shared React components
- [ ] Update tests for React components

### Testing
- [ ] Write tests for all storage types
- [ ] Test priority system
- [ ] Test options page functionality
- [ ] Add unit tests for utilities (Vitest)
- [ ] Test error scenarios

### Error Handling
- [ ] Create centralized error handler
- [ ] Add error boundaries for React (when migrated)
- [ ] Implement structured logging
- [ ] Add user-friendly error messages
- [ ] Add toast notifications (shadcn/ui toast component)

---

## 💡 Low Priority

### Developer Experience
- [ ] Add VS Code settings (format on save)
- [ ] Create development scripts
- [ ] Improve build feedback
- [ ] Add bundle size monitoring

### Documentation
- [ ] Add JSDoc comments to public APIs
- [ ] Document message passing protocol
- [ ] Create component documentation
- [ ] Update README with new features

### UI/UX Improvements
- [ ] Add loading states for async operations
- [ ] Improve empty states (no rules saved, etc.)
- [ ] Add keyboard shortcuts documentation in UI
- [ ] Add dark mode support (shadcn/ui supports it!)

### Technical Debt
- [ ] Remove unused dependencies (`@vercel/analytics`, `tw-animate-css`?)
- [ ] Consolidate CSS files (popup.css, options.css → use globals.css)
- [ ] Remove `app/` directory if not used
- [ ] Resolve CSS conflicts (`app/globals.css` vs `src/styles/globals.css`)
- [ ] Standardize error messages
- [ ] Extract magic numbers to constants

---

## 🐛 Bugs & Issues

_Add bugs and issues here as you discover them_

- [ ] (Example) Extension doesn't work on specific website
- [ ] (Example) Title doesn't persist after browser restart

---

## 💭 Ideas & Future Features

_Add ideas and feature requests here_

- [ ] (Example) Add regex pattern matching for titles
- [ ] (Example) Export/import saved titles
- [ ] (Example) Add keyboard shortcuts for common actions
- [ ] (Example) Sync titles across devices (if using Chrome sync)

---

## ✅ Recently Completed

_Move completed tasks here for reference_

- [x] Fixed Playwright extension fixture for Manifest V3 (2026-01-12)
  - Improved service worker detection using `waitForEvent('serviceworker')`
  - Added multiple fallback methods for extension ID detection
  - Better error messages with troubleshooting steps
- [x] Set up shadcn/ui
- [x] Fixed build configuration (HTML file paths)
- [x] Created Page Object Model structure
- [x] Created learning documentation
- [x] Updated .cursorrules for learning context

---

## 📅 Notes

_Add any notes, context, or reminders here_

- Remember to rebuild (`npm run build`) before testing changes
- Extension needs to be reloaded in Chrome after each build
- Service worker changes require full extension reload

---

## 🎯 Current Focus

**This Week:**
- Testing Playwright setup
- Adding ESLint/Prettier

**This Month:**
- React migration (popup first)
- Expand test coverage

---

**Last Updated:** 2026-01-12

**Tip:** Use `Ctrl+F` to search for specific tasks or keywords.
