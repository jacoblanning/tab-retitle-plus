# Privacy Policy for Tab ReTitle+

**Last Updated**: January 13, 2026

## Overview

Tab ReTitle+ is committed to protecting your privacy. This extension does not collect, transmit, or share any personal data.

## Data Collection

**We do NOT collect:**
- Personal information
- Browsing history
- Analytics or usage statistics
- Crash reports
- Any form of telemetry

## Data Storage

### Local Storage Only

Tab ReTitle+ stores data **only on your device** using Chrome's built-in `chrome.storage.sync` API:

**What is stored:**
- Custom tab titles you create
- Title persistence rules (URL, domain, or tab-specific)
- Extension settings (bookmark integration, context menu, debug mode)

**Where it's stored:**
- Locally on your device
- Automatically synced across your Chrome browsers via Chrome Sync (if you're signed into Chrome)
- No external servers
- No third-party services

**How to clear data:**
- Delete individual rules through the Options page
- Or clear extension data: Chrome Settings → Privacy → Site Settings → View permissions → Tab ReTitle+

## Permissions Explained

Tab ReTitle+ requests the following permissions:

### Required Permissions

1. **`storage`**
   - **Why**: Save your custom title rules locally
   - **Data**: Title templates, persistence settings, options

2. **`tabs`**
   - **Why**: Read tab information (URL, current title) to apply custom titles
   - **Data**: Current tab URL and title (not stored or transmitted)

3. **`scripting`**
   - **Why**: Update page titles in your browser tabs
   - **Data**: None - only modifies the displayed tab title

4. **`contextMenus`**
   - **Why**: Add "Set Custom Title" option to right-click menu (optional feature)
   - **Data**: None

5. **`bookmarks`**
   - **Why**: Optional feature to use bookmark titles
   - **Data**: Read-only access to bookmark titles (if enabled in settings)

6. **`<all_urls>` (Host Permissions)**
   - **Why**: Apply custom titles to any website you visit
   - **Data**: No data collected - only needed to modify tab titles

### No Internet Access

Tab ReTitle+ **does not**:
- Connect to any external servers
- Send any data over the internet
- Use any third-party APIs or services
- Include analytics or tracking code
- Contain ads or monetization

## Third-Party Services

**None.** This extension does not use any third-party services, APIs, or integrations.

## Children's Privacy

Tab ReTitle+ does not collect any data from anyone, including children under 13.

## Changes to Privacy Policy

If we make changes to this privacy policy, we will update the "Last Updated" date above. Continued use of the extension after changes constitutes acceptance of the updated policy.

## Data Deletion

To delete all data:
1. Open Chrome Settings
2. Go to Privacy and Security → Site Settings
3. Click "View permissions and data stored across sites"
4. Find "Tab ReTitle+" and click "Remove"

Or simply uninstall the extension to remove all data.

## Open Source

Tab ReTitle+ is open source. You can review the complete source code to verify these privacy practices:
- GitHub: [Your GitHub URL here]

## Contact

If you have questions about this privacy policy, please:
- Open an issue on GitHub: [Your GitHub URL here]
- Email: [Your email here]

---

## Summary

✅ **No data collection**
✅ **No tracking or analytics**
✅ **No external servers**
✅ **All data stored locally**
✅ **Open source code**

Your privacy is our priority. Tab ReTitle+ is designed to work entirely on your device without any external communication.
