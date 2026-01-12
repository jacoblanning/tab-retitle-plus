# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [3.0.0] - 2026-01-11

### Added
- Initial release of modern ReTitle extension
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
- Modern clone of the original [ReTitle extension](https://github.com/Lazyuki/ReTitle) by Lazyuki
