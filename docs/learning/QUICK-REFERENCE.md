# Quick Reference Guide

A cheat sheet for common tasks and information.

## 🚀 Common Commands

```bash
# Build the extension
npm run build

# Check for TypeScript errors
npm run type-check

# Run tests
npx playwright test

# Run tests in UI mode
npx playwright test --ui
```

## 📁 Important File Locations

| What | Where |
|------|-------|
| Extension config | `public/manifest.json` |
| Popup UI | `src/popup/popup.html` |
| Popup logic | `src/popup/popup.ts` |
| Background script | `src/background/service-worker.ts` |
| Storage logic | `src/background/storage-manager.ts` |
| Content script | `src/content/title-updater.ts` |
| Type definitions | `src/shared/types.ts` |
| Message types | `src/shared/messages.ts` |
| Built files | `dist/` |

## 🔧 Common Tasks

### Change Extension Name
Edit `public/manifest.json` → `"name"` field

### Change Colors
Edit `tailwind.config.js` → `colors` section

### Add New Message Type
1. Add to `src/shared/messages.ts`
2. Handle in `src/background/service-worker.ts`

### Test Changes
1. `npm run build`
2. Reload extension in `chrome://extensions/`
3. Test functionality

## 🐛 Debugging Locations

| What | Where |
|------|-------|
| Popup errors | Right-click icon → Inspect popup |
| Options errors | Right-click page → Inspect |
| Service worker | `chrome://serviceworker-internals/` |
| Content script | F12 on any webpage |
| Build errors | Terminal output |

## 📚 Learning Paths

**Just need basics:** 01 → 05  
**Making changes:** 01 → 03 → 06 → 07  
**Full understanding:** Read all docs in order

## 🆘 Quick Troubleshooting

**Extension won't load?**
→ Check `dist/manifest.json` exists, rebuild

**Changes don't appear?**
→ Rebuild and reload extension

**Build fails?**
→ Run `npm run type-check`, fix errors

**Popup doesn't open?**
→ Check `dist/popup.html` exists, check manifest

## 📋 Task Management

- **[TODO.md](../../TODO.md)** - Current tasks and priorities
- **[NEXT_STEPS.md](../../NEXT_STEPS.md)** - Detailed recommendations

## 📖 Full Documentation

See numbered guides in `docs/learning/`:
- `00-START-HERE.md` - Introduction
- `01-WHAT-IS-THIS-PROJECT.md` - Project overview
- `02-CHROME-EXTENSIONS-BASICS.md` - Extension concepts
- `03-PROJECT-STRUCTURE.md` - Code organization
- `04-KEY-TECHNOLOGIES.md` - Tech stack
- `05-HOW-IT-WORKS.md` - System flow
- `06-COMMON-TASKS.md` - How-to guide
- `07-TROUBLESHOOTING.md` - Problem solving
