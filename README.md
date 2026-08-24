# Tab ReTitle+

A modern Chrome extension inspired by [Tab ReTitle](https://addons.mozilla.org/en-US/firefox/addon/tab-retitle/) for Firefox by Lazyuki. Built with React, TypeScript, Vite, and Tailwind CSS. Rename browser tab titles with powerful persistence options.

## 📚 Learning Resources

**New to Chrome extension development?** Check out the [Learning Guide](./docs/learning/00-START-HERE.md) - comprehensive documentation covering Chrome extensions, TypeScript, React, and the modern web development stack.

- **[Start Here](./docs/learning/00-START-HERE.md)** - Introduction and roadmap
- **[Quick Reference](./docs/learning/QUICK-REFERENCE.md)** - Cheat sheet for common tasks
- **[Full Learning Docs](./docs/learning/)** - Complete guide from basics to advanced topics

## Features

- **Multiple Storage Options:**
  - One-time: Session-only title changes
  - Tab-specific: Persists for a specific tab across sessions
  - Exact URL: Applies to that specific URL
  - Domain-wide: Applies to all pages on the same domain

- **Incognito Support:**
  - Works in incognito windows once you enable "Allow in Incognito" on `chrome://extensions`
  - All storage types (including persistent rules) are supported in incognito
  - Note: rules are saved via Chrome Sync storage, which is shared with normal windows — titles you create in incognito persist after the window closes (see [Privacy Policy](./PRIVACY.md))

- **Modern Tech Stack:**
  - React 18 for modern UI development
  - Manifest V3 (required for Chrome Web Store)
  - TypeScript for type safety
  - Vite for fast builds and optimized bundling
  - Tailwind CSS for modern, dark-themed styling

- **Template Variables:**
  - Use `{original}` or `$0` to include the original page title
  - Use `{url}` to include the full URL
  - Use `{domain}` to include the domain name
  - Example: `[PROD] {original}` → `[PROD] GitHub - Homepage`

- **Additional Features:**
  - Live preview of title changes as you type
  - Edit and delete existing rules from the popup or Settings page
  - Bookmark title integration (optional)
  - Context menu integration
  - Customizable keyboard shortcut (default: Ctrl+Shift+E)
  - Options page for managing saved titles
  - Priority-based title matching

## Project Structure

```
tab-retitle-plus/
├── src/
│   ├── background/
│   │   ├── service-worker.ts          # Main service worker
│   │   └── storage-manager.ts         # Storage & priority logic
│   ├── content/
│   │   └── title-updater.ts           # Title modification content script
│   ├── popup/
│   │   ├── popup.html                 # Popup HTML entry point
│   │   ├── index.tsx                  # React root
│   │   └── popup-app.tsx              # Main popup React component
│   ├── options/
│   │   ├── options.html               # Options HTML entry point
│   │   ├── index.tsx                  # React root
│   │   └── options-app.tsx            # Main options React component
│   ├── hooks/
│   │   ├── useCurrentTab.ts           # React hook for current tab
│   │   ├── useExtensionStorage.ts     # React hook for Chrome storage
│   │   └── useMessages.ts             # React hook for message passing
│   ├── shared/
│   │   ├── types.ts                   # TypeScript types
│   │   ├── constants.ts               # Constants
│   │   ├── messages.ts                # Message passing utilities
│   │   └── utils.ts                   # Shared utilities
│   └── styles/
│       └── globals.css                # Global styles & Tailwind config
├── public/
│   ├── manifest.json
│   └── icons/
├── tests/
│   ├── e2e/                           # Playwright E2E tests
│   └── fixtures/                      # Test fixtures
└── dist/                              # Build output (generated)
```

## Installation & Build

### Prerequisites

- Node.js 18+ and npm
- Chrome browser

### Steps

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Build the extension:**
   ```bash
   npm run build
   ```

   This will:
   - Run TypeScript type checking
   - Build all components with Vite
   - Output to `dist/` folder

3. **Load in Chrome:**
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top right)
   - Click "Load unpacked"
   - Select the `dist/` folder

4. **(Optional) Enable in Incognito:**
   - On `chrome://extensions/`, open the extension's "Details" page
   - Turn on "Allow in Incognito"
   - This is required for the extension to run in incognito windows — without it Chrome blocks the extension there entirely

## Development

### Available Scripts

```bash
# Type checking only (no build)
npm run type-check

# Build for production
npm run build

# Start Vite dev server (for popup/options development)
npm run dev
```

### Development Workflow

1. Make changes to source files in `src/`
2. Run `npm run build` to rebuild
3. Click the refresh icon in `chrome://extensions/` for your extension
4. Test changes

**Note:** Service worker and content script changes require a full extension reload. The popup and options pages are React applications and can be developed using Vite's dev server for hot reload (though Chrome extension APIs won't be available in dev mode).

## Testing

### Automated Testing

The extension includes end-to-end tests using Playwright:

```bash
# Run all E2E tests
npx playwright test

# Run tests in headed mode (visible browser)
npx playwright test --headed

# Run specific test file
npx playwright test tests/e2e/popup.spec.ts
```

**Test Coverage:**
- Popup functionality (all storage types)
- Title preview
- Existing rules display
- Clear functionality

**Note:** Chrome extensions require headed mode for testing. The CI uses `xvfb` for virtual display support.

### Manual Testing Checklist

#### Basic Functionality

**One-time Title:**
1. Open any webpage
2. Press Ctrl+Shift+E (or Cmd+Shift+E on Mac) or click extension icon
3. Enter custom title, select "One-time"
4. Click Save
5. Verify title changes
6. Refresh page → title should revert to original

**Tab-specific Title:**
1. Set title with "Tab-specific" option
2. Refresh page → title should persist
3. Open same URL in new tab → should show original title
4. Close and reopen tab → custom title should reappear

**Exact URL Title:**
1. Navigate to specific URL
2. Set title with "Exact URL" option
3. Navigate to different URL on same domain → should show original
4. Return to exact URL → custom title should appear

**Domain-wide Title:**
1. Set title with "Domain-wide" option
2. Navigate to different pages on same domain → all should show custom title

**Incognito:**
1. Enable "Allow in Incognito" for the extension (see Installation step 4)
2. Open an incognito window and navigate to any webpage
3. Set a title using any storage type → title should change
4. Confirm persistent rules (URL/domain) created in a normal window also apply in incognito

#### Priority System Testing

1. Set domain title for `github.com`
2. Set exact URL title for `https://github.com/trending`
3. Navigate to `https://github.com/trending` → should show URL title
4. Navigate to `https://github.com/explore` → should show domain title

#### Dynamic Title Handling

Test on sites that change titles dynamically:
- YouTube (titles change during playback)
- Gmail (unread count updates)

Custom titles should persist despite dynamic changes.

#### Service Worker Lifecycle

1. Set custom title for a site
2. Go to `chrome://serviceworker-internals/`
3. Find Tab ReTitle+ service worker
4. Click "Stop"
5. Navigate to the site → service worker should wake up and apply title

### Debugging

**Service Worker Console:**
- `chrome://serviceworker-internals/` → Find extension → Inspect

**Content Script Console:**
- Regular DevTools (F12) on any page

**Popup Console:**
- Right-click extension icon → Inspect popup

**Options Page Console:**
- Right-click on options page → Inspect

## Architecture

### React UI Components

**Popup** (`src/popup/popup-app.tsx`):
- Custom React hooks for Chrome APIs (`useCurrentTab`, `useMessages`)
- Real-time preview of title changes
- Storage type selector with custom radio buttons
- Existing rules management
- Dark-themed UI matching design mocks

**Options Page** (`src/options/options-app.tsx`):
- Settings management (bookmark titles, context menu, debug mode)
- Saved titles display and deletion
- Keyboard shortcut customization
- Real-time storage updates

**Custom Hooks**:
- `useCurrentTab`: Manages current tab state with test mode support
- `useExtensionStorage`: React wrapper for `chrome.storage.sync`
- `useMessages`: Typed message passing to service worker

### Service Worker (Background Script)

**Key Features:**
- Stateless design (Manifest V3 requirement)
- Top-level event listeners for `chrome.tabs.onUpdated` and `chrome.tabs.onRemoved`
- In-memory cache for loop prevention
- Message-based communication with content scripts

**Loop Prevention:**
When we update a title, `tabs.onUpdated` fires again. We use an in-memory cache to track titles we just set and skip processing if the title matches the cached value.

### Storage Priority System

1. **Tab-specific** (highest priority)
2. **Exact URL match**
3. **Domain match**
4. **Regex patterns**
5. **Bookmark title** (if enabled)
6. **Original title**

### Content Script

- Listens for `UPDATE_TITLE` messages from service worker
- Updates `document.title`
- Sets up `MutationObserver` to re-apply custom title if page tries to change it
- Handles dynamic sites like YouTube and Gmail

## Customization

### Keyboard Shortcut

The default keyboard shortcut is **Ctrl+Shift+E** (Cmd+Shift+E on Mac).

To customize:
1. Click the extension icon or use the shortcut to open the popup
2. Click "Options" link at the bottom
3. Click "Customize Keyboard Shortcut" button
4. This opens Chrome's shortcuts page where you can set your preferred key combination

**Note:** If the default shortcut doesn't work, it may conflict with another extension or Chrome feature. Use the customization option above to change it.

### Icons

Placeholder blue icons are included in `dist/icons/`. To customize:

1. Create PNG icons at 16x16, 48x48, and 128x128 pixels
2. Replace files in `public/icons/`
3. Rebuild: `npm run build`

See `public/icons/README.md` for icon creation instructions.

### Styling

The extension uses Tailwind CSS with a dark theme. To modify styles:

1. Edit Tailwind classes in React components (`src/popup/popup-app.tsx`, `src/options/options-app.tsx`)
2. Modify theme colors in `src/styles/globals.css` (CSS variables)
3. Update Tailwind config in `tailwind.config.js`
4. Rebuild: `npm run build`

The extension uses semantic color tokens (e.g., `bg-card`, `text-foreground`) that adapt based on the dark mode theme defined in `globals.css`.

Primary color: `hsl(217.2 91.2% 59.8%)` (blue)

## Troubleshooting

### Extension won't load

- Check that `dist/manifest.json` exists
- Verify all required files are in `dist/`
- Check Chrome console for errors

### Titles not persisting

- Check service worker console for errors
- Verify storage type selection
- Check `chrome.storage.sync` quota (limited to 8KB per item)

### Extension not working in incognito

- Open the extension's "Details" page on `chrome://extensions/` and enable "Allow in Incognito" — Chrome blocks the extension in incognito windows until this is turned on
- After enabling, reopen the incognito window (the setting doesn't apply to already-open windows)

### Service worker not waking up

- Verify event listeners are at top level
- Check manifest.json has correct `service_worker` path
- Look for errors in service worker console

### Build errors

- Run `npm run type-check` to see TypeScript errors
- Verify Node.js version (18+ required)
- Clear `node_modules` and reinstall: `rm -rf node_modules && npm install`

## Technical Details

### Manifest V3 Migration

This extension uses Manifest V3, which has several key differences from V2:

- **Service Workers** instead of background pages (stateless)
- **`chrome.scripting.executeScript`** instead of `chrome.tabs.executeScript`
- **`host_permissions`** separate from `permissions`
- **Event listeners must be at top level** (not inside async functions)

### Message Passing

All communication between components uses typed messages:

```typescript
interface Message<T = any> {
  type: MessageType;
  payload: T;
}
```

Message types:
- `UPDATE_TITLE`: Service worker → Content script
- `SAVE_TITLE`: Popup → Service worker
- `DELETE_TITLE`: Options → Service worker
- `GET_SAVED_TITLES`: Options → Service worker

## License

ISC

## Credits

This Chrome extension is inspired by the original [Tab ReTitle extension](https://addons.mozilla.org/en-US/firefox/addon/tab-retitle/) for Firefox by Lazyuki.

Built with:
- [React](https://react.dev/) - UI library
- [TypeScript](https://www.typescriptlang.org/) - Type safety
- [Vite](https://vitejs.dev/) - Build tool
- [Tailwind CSS](https://tailwindcss.com/) - Styling
- [Lucide React](https://lucide.dev/) - Icons
- [Playwright](https://playwright.dev/) - E2E testing
- [Chrome Extensions API](https://developer.chrome.com/docs/extensions/)
