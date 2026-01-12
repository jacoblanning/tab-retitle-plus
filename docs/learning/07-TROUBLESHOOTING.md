# 07 - Troubleshooting

## 🎯 What You'll Learn

- Common problems and solutions
- How to diagnose issues
- Where to look for help
- How to prevent problems

## 🚨 Common Problems

### Extension Won't Load

**Symptoms:**
- Error when loading in Chrome
- "Could not load manifest"
- Extension doesn't appear

**Solutions:**

1. **Check manifest.json exists**
   ```bash
   ls dist/manifest.json
   ```
   Should exist. If not, rebuild.

2. **Check build completed**
   ```bash
   npm run build
   ```
   Should complete without errors.

3. **Check dist/ folder structure**
   ```bash
   ls dist/
   ```
   Should have: `popup.html`, `options.html`, `manifest.json`, JS files

4. **Check file paths in manifest**
   - Open `dist/manifest.json`
   - Verify paths match actual files
   - Check for typos

5. **Clear Chrome extension cache**
   - Remove extension
   - Restart Chrome
   - Reload extension

### Extension Loads But Doesn't Work

**Symptoms:**
- Extension icon appears
- Clicking does nothing
- No errors visible

**Solutions:**

1. **Check service worker**
   - Go to `chrome://serviceworker-internals/`
   - Find your extension
   - Check if it's running
   - Check console for errors

2. **Check popup.html exists**
   ```bash
   ls dist/popup.html
   ```

3. **Check JavaScript errors**
   - Right-click extension icon → Inspect popup
   - Check Console tab
   - Look for red errors

4. **Verify build**
   - Rebuild: `npm run build`
   - Reload extension

### Build Fails

**Symptoms:**
- `npm run build` shows errors
- TypeScript errors
- Build stops

**Solutions:**

1. **Check TypeScript errors**
   ```bash
   npm run type-check
   ```
   Fix errors shown

2. **Common TypeScript errors:**
   - **"Cannot find module"** → Check import path
   - **"Property does not exist"** → Check spelling/type
   - **"Type error"** → Check types match

3. **Check file paths**
   - Verify all imports are correct
   - Check files exist

4. **Clear and rebuild**
   ```bash
   rm -rf dist/
   npm run build
   ```

### Changes Don't Appear

**Symptoms:**
- Made changes but nothing changed
- Old behavior still happens

**Solutions:**

1. **Did you rebuild?**
   ```bash
   npm run build
   ```

2. **Did you reload extension?**
   - Go to `chrome://extensions/`
   - Click reload icon 🔄

3. **Are you editing the right files?**
   - Edit files in `src/`, not `dist/`
   - `dist/` is generated

4. **Check browser cache**
   - Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
   - Or clear cache

5. **Service worker might be cached**
   - Go to `chrome://serviceworker-internals/`
   - Find extension
   - Click "Unregister"
   - Reload extension

### Popup Doesn't Open

**Symptoms:**
- Click extension icon
- Nothing happens
- No popup appears

**Solutions:**

1. **Check popup.html exists**
   ```bash
   ls dist/popup.html
   ```

2. **Check manifest.json**
   - Verify `"default_popup": "popup.html"` exists
   - Check path is correct

3. **Check JavaScript errors**
   - Right-click icon → Inspect popup
   - Check console

4. **Check file paths in popup.html**
   - Open `dist/popup.html`
   - Verify script paths: `./popup.js` (not `/popup.js`)

### Titles Don't Save

**Symptoms:**
- Save title
- Refresh page
- Title reverts

**Solutions:**

1. **Check storage type**
   - "Once" doesn't persist
   - Use "Tab", "URL", or "Domain" for persistence

2. **Check Chrome storage**
   - Open DevTools (F12)
   - Application tab → Storage → Chrome Sync
   - Check if data is saved

3. **Check service worker**
   - Verify it's running
   - Check for errors

4. **Check storage quota**
   - Chrome sync has limits
   - Try clearing old data

### Content Script Doesn't Run

**Symptoms:**
- Title doesn't change on pages
- No errors visible

**Solutions:**

1. **Check content script is injected**
   - Open any webpage
   - Open DevTools (F12)
   - Console tab
   - Check for content script messages

2. **Check manifest.json**
   - Verify `content_scripts` section exists
   - Check `matches` includes the site

3. **Check content script file**
   ```bash
   ls dist/content-title-updater.js
   ```

4. **Reload extension**
   - Content scripts need extension reload

## 🔍 Diagnostic Steps

### Step 1: Check Build
```bash
npm run build
```
Should complete without errors.

### Step 2: Check Files
```bash
ls dist/
```
Should have all expected files.

### Step 3: Check Console
- Popup: Right-click icon → Inspect
- Options: Right-click page → Inspect
- Service Worker: `chrome://serviceworker-internals/`
- Content Script: F12 on any page

### Step 4: Check Manifest
Open `dist/manifest.json`:
- Verify structure is valid JSON
- Check all paths exist
- Verify permissions

### Step 5: Test in Clean State
1. Remove extension
2. Clear `dist/` folder
3. Rebuild
4. Reload extension

## 🛠️ Debugging Tools

### Chrome DevTools

**For Popup:**
- Right-click extension icon → Inspect popup

**For Options:**
- Right-click options page → Inspect

**For Content Script:**
- Open any webpage
- Press F12
- Console shows content script output

### Service Worker Inspector

1. Go to `chrome://serviceworker-internals/`
2. Find your extension
3. Click "Inspect"
4. See console and network

### Extension Management

1. Go to `chrome://extensions/`
2. Enable "Developer mode"
3. See extension details
4. Check errors
5. Reload extension

## 📝 Error Messages Guide

### "Cannot find module"
**Meaning:** Import path is wrong or file doesn't exist
**Fix:** Check import path, verify file exists

### "Property does not exist"
**Meaning:** Typo or wrong type
**Fix:** Check spelling, check type definitions

### "Type is not assignable"
**Meaning:** Types don't match
**Fix:** Check what type is expected, fix your code

### "Manifest is invalid"
**Meaning:** JSON syntax error in manifest.json
**Fix:** Check JSON syntax, validate with JSON validator

### "Could not load options page"
**Meaning:** options.html missing or path wrong
**Fix:** Check file exists, check path in manifest

## 🆘 Getting More Help

### Check These First

1. **Error messages** - Read them carefully
2. **Console logs** - Check all consoles
3. **Build output** - Look for warnings/errors
4. **Documentation** - Check relevant docs

### Ask for Help

When asking for help, include:
- What you're trying to do
- What error you're seeing
- What you've tried
- Relevant code/files
- Console output/errors

### Resources

- **Chrome Extension Docs:** https://developer.chrome.com/docs/extensions/
- **TypeScript Docs:** https://www.typescriptlang.org/docs/
- **React Docs:** https://react.dev/
- **Playwright Docs:** https://playwright.dev/

## 🎓 Learning from Errors

**Good approach:**
1. Read the error message
2. Understand what it means
3. Check relevant files
4. Try to fix
5. Learn from the process

**Don't:**
- Panic
- Randomly change things
- Ignore error messages
- Give up too quickly

## ✅ Prevention Checklist

To avoid problems:

- [ ] Run `npm run type-check` before building
- [ ] Test changes incrementally
- [ ] Keep backups of working code
- [ ] Read error messages carefully
- [ ] Check console for warnings
- [ ] Test in clean state occasionally

## 🚀 What's Next?

Congratulations! You've completed the learning guide! 🎉

**You now know:**
- ✅ What the project is
- ✅ How Chrome extensions work
- ✅ Project structure
- ✅ Key technologies
- ✅ How it all works together
- ✅ How to do common tasks
- ✅ How to troubleshoot

**Next steps:**
- Start making small changes
- Experiment with the code
- Build your understanding
- Ask questions when stuck
- Keep learning!

**Remember:** Learning takes time. Don't rush. You've got this! 💪

---

**Back to:** [Start Here](./00-START-HERE.md)
