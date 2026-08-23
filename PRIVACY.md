# Privacy Policy for Tab ReTitle+

**Last updated:** August 23, 2026

Tab ReTitle+ renames Chrome tab titles according to rules you create. The
extension does not send your data to the developer, sell it, use it for
advertising, or include analytics or tracking.

## Data the extension handles

To rename a tab and match saved rules, Tab ReTitle+ may handle:

- The current tab's URL, domain, page title, and Chrome-assigned tab identifier
- The custom title or title template you enter
- Exact-URL, domain-wide, and tab-specific rules you choose to save
- Extension settings, such as bookmark-title fallback and context-menu options
- A matching bookmark title when bookmark-title fallback is enabled

The extension does not read page body content, form entries, passwords,
cookies, personal communications, financial information, health information,
or precise location.

## Storage and Chrome Sync

- **One-time titles** are applied to the current tab and are not written to
  extension storage.
- **Persistent rules** are stored with `chrome.storage.sync`. A rule can contain
  a custom title or template, an original page title, and either a Chrome tab
  identifier, exact URL, or domain, depending on the rule type you select.
- **Settings** are also stored with `chrome.storage.sync`.

Chrome may sync this data between browsers signed in to the same Google account
when Chrome Sync is enabled. This sync is provided by Chrome; Tab ReTitle+ has
no developer-controlled server and the developer cannot access your synced
extension data.

## Incognito windows

Chrome blocks the extension in incognito unless you explicitly enable **Allow
in Incognito** on the extension's Chrome settings page.

If enabled, one-time titles remain one-time. Persistent rules created in an
incognito window use the same `chrome.storage.sync` area as normal windows.
They can remain after the incognito window closes and can apply in normal
windows or sync to another signed-in Chrome browser.

## Permissions

- **`storage`** stores saved title rules and settings with Chrome Sync.
- **`tabs`** reads the active tab's URL and title, identifies the tab, and
  responds when tabs navigate, update, or close.
- **`scripting`** provides a fallback way to apply a chosen title to a page.
- **`contextMenus`** adds an optional right-click shortcut for opening the title
  editor.
- **`bookmarks`** reads a matching bookmark title only when bookmark-title
  fallback is enabled. Tab ReTitle+ does not create, edit, or delete bookmarks.
- **`<all_urls>`** lets the extension apply a custom title on standard web pages
  across the sites where you choose to use it. It is not used to read page body
  content.

## Network connections and third parties

Tab ReTitle+ does not make requests to a developer server, use third-party APIs,
include ads, or transmit analytics. Chrome Sync is the only browser-provided
sync mechanism used for persistent rules and settings.

## Your controls

You can review and delete persistent rules from the Tab ReTitle+ Options page.
One-time titles are not stored. Uninstalling the extension removes its local
extension data and access; Chrome controls any retention associated with your
Google account's Chrome Sync settings.

## Children, changes, and contact

Tab ReTitle+ does not knowingly collect personal information from anyone,
including children. Material changes to this policy will be reflected here
with a new update date.

Questions or privacy concerns can be filed at:

https://github.com/jacoblanning/tab-retitle-plus/issues

The source code is available at:

https://github.com/jacoblanning/tab-retitle-plus
