# Chrome Web Store listing — Tab ReTitle+

## Product details

- **Name:** Tab ReTitle+
- **Category:** Productivity
- **Language:** English (United States)
- **Support URL:** https://github.com/jacoblanning/tab-retitle-plus/issues
- **Privacy policy:** https://github.com/jacoblanning/tab-retitle-plus/blob/main/PRIVACY.md

## Summary

Rename Chrome tabs once, for one tab, an exact URL, or a whole domain—with live
preview, templates, and no developer servers.

## Detailed description

Make noisy tab titles useful again.

Tab ReTitle+ gives any standard web page a title that makes sense to you. Change
the current tab once, keep a name for one tab, or create an automatic rule for
an exact URL or an entire domain.

CHOOSE HOW LONG A TITLE LASTS

• One-time — change the current tab without saving a rule
• Tab-specific — keep the title for the current Chrome tab
• Exact URL — reapply the title when that precise URL opens
• Domain-wide — use one rule across a whole site

BUILT FOR REAL WORKFLOWS

• Preview a new title before saving it
• Use {original}, {url}, and {domain} inside reusable title templates
• Keep custom titles in place on sites that update their own titles dynamically
• Review and delete saved rules from a dedicated Options page
• Open the popup with Cmd+Shift+E on Mac or Ctrl+Shift+E elsewhere
• Optionally use bookmark titles as a fallback or open the editor from a
  right-click menu

PRIVATE AND TRANSPARENT

Tab ReTitle+ has no developer server, analytics, ads, or tracking. One-time
titles are not stored. Persistent rules and settings use Chrome's built-in Sync
storage, so Chrome may sync them between browsers signed in to your Google
account. Depending on the rule you choose, that stored data can include your
custom title, the original page title, an exact URL, a domain, or a Chrome tab
identifier. The developer cannot access that synced extension data.

If you enable the extension in incognito, persistent rules created there use
the same Chrome Sync storage as normal windows and can remain after the
incognito window closes. Use One-time for a title that should not be saved.

Tab ReTitle+ is open source, so its behavior and privacy claims can be reviewed
directly.

## Single purpose

Tab ReTitle+ renames browser tab titles and reapplies them according to
user-selected tab, exact-URL, or domain rules.

## Permission justifications

### storage

Stores saved title rules and settings in `chrome.storage.sync`. Persistent rules
can contain a custom title or template, an original page title, and a tab
identifier, exact URL, or domain, depending on the user's selected rule type.

### tabs

Reads the active tab's current URL, title, and Chrome tab identifier so the
extension can preview, match, apply, and clean up title rules. Also listens for
tab navigation, updates, and closure so rules remain accurate.

### scripting

Provides a fallback injection path for setting `document.title` when the normal
content script cannot apply a requested title.

### contextMenus

Adds the optional **Set Custom Title** right-click action. The setting can be
disabled from the Options page.

### bookmarks

Reads a bookmark title for the current URL only when the optional bookmark-title
fallback is enabled. The extension never creates, edits, or deletes bookmarks.

### Host permission: all URLs

Allows the content script to set and maintain a user-chosen `document.title` on
standard web pages across the sites where the extension is used. The extension
does not read page body content or transmit page data to the developer.

## Privacy questionnaire notes

- Disclose handling of URLs/domains and page titles under the dashboard's web
  history or website-content categories if those categories are presented.
- The handled data is used only for the extension's single purpose and is not
  transferred to the developer or third parties.
- Persistent data is stored with Chrome Sync; one-time titles are not stored.
- No personally identifiable information, authentication information,
  financial information, health information, personal communications, precise
  location, analytics, or general browsing-history log is collected.
- No data is sold or used for advertising, profiling, or credit decisions.

## Asset inventory

- Store icon: `public/icons/icon128.png`
- Screenshot 1: `store/assets/screenshot-1-rename.png`
- Screenshot 2: `store/assets/screenshot-2-rules.png`
- Screenshot 3: `store/assets/screenshot-3-manage.png`
- Small promo tile: `store/assets/small-promo-440x280.png`

All Store art is generated from the checked-in SVG icon and the same flat
family tokens used by the extension. Run `npm run store:assets` to regenerate
it.
