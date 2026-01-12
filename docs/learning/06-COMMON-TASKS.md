# 06 - Common Tasks

## 🎯 What You'll Learn

- How to build the extension
- How to test changes
- How to make common modifications
- How to debug issues

## 🏗️ Building the Extension

### What Is Building?
**Building** means converting your source code into files Chrome can use.

**Think of it like:** Compiling a book from your notes into a finished PDF.

### How to Build

```bash
npm run build
```

**What happens:**
1. TypeScript checks for errors
2. Vite compiles TypeScript → JavaScript
3. Files are bundled and optimized
4. Output goes to `dist/` folder

### After Building
- Check `dist/` folder exists
- Files should be there: `popup.html`, `options.html`, `manifest.json`, etc.
- Ready to load in Chrome!

### Common Issues

**"Build failed"**
- Check for TypeScript errors: `npm run type-check`
- Look at error messages
- Fix errors and try again

**"dist folder is empty"**
- Make sure build completed successfully
- Check for errors in terminal
- Try deleting `dist/` and rebuilding

## 🧪 Testing Changes

### Quick Test Process

1. **Make your changes** in `src/` folder
2. **Build:** `npm run build`
3. **Reload extension in Chrome:**
   - Go to `chrome://extensions/`
   - Find your extension
   - Click the reload icon 🔄
4. **Test your changes**

### Testing Different Parts

**Testing Popup:**
- Click extension icon
- Popup should open
- Test your changes

**Testing Options Page:**
- Right-click extension icon → Options
- Or go to `chrome://extensions/` → Details → Extension options

**Testing Content Script:**
- Open any webpage
- Extension should work automatically
- Check if title changes

**Testing Background Script:**
- Open `chrome://serviceworker-internals/`
- Find your extension's service worker
- Click "Inspect"
- Check console for errors

## 🔍 Debugging

### Where to Look for Errors

**1. Browser Console (for popup/options)**
- Right-click extension icon → Inspect popup
- Or right-click options page → Inspect
- Check Console tab for errors

**2. Service Worker Console**
- Go to `chrome://serviceworker-internals/`
- Find your extension
- Click "Inspect"
- Check console

**3. Content Script Console**
- Open any webpage
- Press F12 (DevTools)
- Check Console tab
- Errors from content script appear here

**4. Build Errors**
- Run `npm run type-check`
- Fix TypeScript errors
- Rebuild

### Common Debugging Steps

1. **Check for errors** in relevant console
2. **Verify build** - Did `npm run build` succeed?
3. **Reload extension** - Did you reload after building?
4. **Check file paths** - Are files in the right place?
5. **Check permissions** - Does manifest.json have needed permissions?

## ✏️ Making Common Changes

### Change Extension Name

**File:** `public/manifest.json`
```json
{
  "name": "Your New Name"
}
```
Then rebuild.

### Change Extension Icon

1. Create new PNG files:
   - `public/icons/icon16.png` (16x16 pixels)
   - `public/icons/icon48.png` (48x48 pixels)
   - `public/icons/icon128.png` (128x128 pixels)
2. Rebuild
3. Reload extension

### Change Popup Appearance

**Files:**
- `src/popup/popup.html` - Structure
- `src/popup/styles/popup.css` - Styling
- Or use Tailwind classes in HTML

**Example:**
```html
<!-- Change button color -->
<button class="bg-green-500">Save</button>
```

### Add a New Message Type

**1. Define message type** in `src/shared/messages.ts`:
```typescript
export type MessageType = 
  | 'SAVE_TITLE'
  | 'YOUR_NEW_TYPE';  // Add here

export interface YourNewPayload {
  // Define payload structure
}
```

**2. Handle message** in `src/background/service-worker.ts`:
```typescript
case 'YOUR_NEW_TYPE': {
  // Handle it
  return { success: true };
}
```

**3. Send message** from popup/options:
```typescript
chrome.runtime.sendMessage({
  type: 'YOUR_NEW_TYPE',
  payload: { ... }
});
```

### Add a New Storage Type

**1. Update type** in `src/shared/types.ts`:
```typescript
export type StorageType = 'once' | 'tab' | 'url' | 'domain' | 'your-new-type';
```

**2. Add handling** in `src/background/storage-manager.ts`

**3. Add UI** in `src/popup/popup.html` (radio button)

**4. Update popup logic** in `src/popup/popup.ts`

## 📝 Type Checking

### What Is Type Checking?
TypeScript checks your code for errors before building.

### How to Check Types

```bash
npm run type-check
```

**What it does:**
- Checks all TypeScript files
- Reports errors
- Doesn't build, just checks

### Common Type Errors

**"Property X does not exist"**
- Check spelling
- Check if property exists on that object
- Check type definitions

**"Type X is not assignable to type Y"**
- Check what type is expected
- Make sure you're passing the right type

**"Cannot find module"**
- Check import path
- Check if file exists
- Check if module is installed

## 🧹 Cleaning Up

### Delete Build Files

```bash
rm -rf dist/
```

**When to do this:**
- When build seems broken
- When you want a fresh build
- Before committing (dist/ is in .gitignore)

### Delete Node Modules

```bash
rm -rf node_modules/
npm install
```

**When to do this:**
- When dependencies seem broken
- After updating package.json
- When npm install fails

## 📦 Managing Dependencies

### Install a New Package

```bash
npm install package-name
```

**Example:**
```bash
npm install date-fns
```

### Update a Package

```bash
npm update package-name
```

### Remove a Package

```bash
npm uninstall package-name
```

### Check for Updates

```bash
npm outdated
```

## 🎨 Styling Changes

### Using Tailwind Classes

Add classes directly in HTML:
```html
<div class="bg-blue-500 text-white p-4 rounded">
  Hello
</div>
```

### Custom CSS

Add to `src/popup/styles/popup.css` or `src/styles/globals.css`:
```css
.my-custom-class {
  color: red;
}
```

### Change Theme Colors

Edit `tailwind.config.js`:
```javascript
colors: {
  primary: {
    500: '#your-color',
  }
}
```

## 🧪 Running Tests

### Run All Tests

```bash
npx playwright test
```

### Run Specific Test

```bash
npx playwright test tests/e2e/popup.spec.ts
```

### Run Tests in UI Mode

```bash
npx playwright test --ui
```

### Debug Tests

```bash
npx playwright test --debug
```

## 📋 Pre-Change Checklist

Before making changes:

- [ ] Understand what you're changing
- [ ] Know which files are involved
- [ ] Have a way to test the change
- [ ] Know how to undo if needed

## 📋 Post-Change Checklist

After making changes:

- [ ] Run `npm run type-check` (no errors)
- [ ] Run `npm run build` (succeeds)
- [ ] Reload extension in Chrome
- [ ] Test the change works
- [ ] Check for console errors
- [ ] Test related functionality still works

## 🚀 What's Next?

Now that you know how to do common tasks, let's learn how to troubleshoot problems!

**Next:** [07 - Troubleshooting](./07-TROUBLESHOOTING.md)
