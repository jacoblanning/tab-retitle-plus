# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [3.0.2] - 2026-08-03

### Fixed
- Duplicated template text (e.g. "[Beta] [Beta] Page") when a rule uses `{original}` on a page that changes its own title. The service worker only remembered the single most recent title it set, so a stale custom title reasserted by the content script could be mistaken for a page-authored title and fed back into template processing. The worker now remembers the last several titles it produced per tab and ignores echoes of its own writes entirely.
- Browser-wide freeze (AppHangB1) on pages that repeatedly rewrite their own title, such as Intercom's chat messenger flashing "1 new message" for an unread conversation. The extension previously reasserted the custom title synchronously inside its MutationObserver callback with no limit, creating an unbounded write loop against the page. Title reassertion is now debounced (500ms), capped at 5 reasserts per 10 seconds, and backs off for 30 seconds when a page keeps fighting, then retries. The service worker applies the same per-tab backoff to automatic reapplies, and the fallback injection no longer stacks a new MutationObserver on every injection.

## [3.0.1] - 2026-06-03

### Fixed
- Extension now works in incognito windows when "Allow in Incognito" is enabled. Previously, custom titles were never applied to incognito tabs and persistent titles could not be saved there, regardless of the Chrome setting. All storage types are now supported in incognito. Note that rules saved in incognito persist via Chrome Sync storage, which is shared with normal windows (see [Privacy Policy](./PRIVACY.md)).

## [3.0.0] - 2026-01-11

### Added
- Initial release of Tab ReTitle+ extension for Chrome
- Multiple storage options: one-time, tab-specific, exact URL, domain-wide
- Template variable support: `{original}`, `$0`, `{url}`, `{domain}`
- Live preview of title changes as you type
- Visual management of existing rules in popup with edit/delete functionality
- Priority indicators showing which rule is active
- Customizable keyboard shortcut (default: Ctrl+Shift+E / Cmd+Shift+E)
- Options page for managing all saved titles
- Settings for bookmark titles, context menu, and debug mode
- MutationObserver to handle dynamic title changes (YouTube, Gmail, etc.)
- Service worker loop prevention with in-memory cache
- Fallback mechanism for race condition handling on page load

### Technical
- Built with Manifest V3 for Chrome Web Store compliance
- TypeScript for type safety
- Vite for fast builds with IIFE output for content scripts
- Tailwind CSS for modern styling
- Priority-based title matching system
- Persistent storage using chrome.storage.sync

### Credits
- Inspired by the original [Tab ReTitle extension](https://addons.mozilla.org/en-US/firefox/addon/tab-retitle/) for Firefox by Lazyuki
