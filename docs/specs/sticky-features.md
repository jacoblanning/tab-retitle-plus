# Tab ReTitle+ — Sticky/Reliability Features Spec

> Status: Draft · Owner: @jrlanng · Scope: v3.x feature set
> Theme: **durability** — make titles stick where they currently slip, and make rules portable and predictable.

These five features are grouped because they share infrastructure (the content script, the
storage model in `src/shared/types.ts`, and the matching logic in `src/background/storage-manager.ts`).
Each section is self-contained and independently shippable. Suggested sequencing is at the end.

---

## Feature 1 — SPA Title Reapply

### Problem Statement
On single-page apps (Gmail, Linear, Jira, Notion, YouTube), the page rewrites `document.title`
on in-app navigation without a full reload. The current observer in
[`title-updater.ts:56`](../../src/content/title-updater.ts) re-applies a *static* cached title, which
fails in two ways: (1) it doesn't re-run rule matching when the **URL changes** via the History API,
so an exact-URL/path rule for the new route never fires; (2) if the SPA **replaces the `<title>`
element** entirely, the observer is left watching a detached node and stops working. The net user
experience is "the rename randomly stops working on the sites I keep open all day" — likely the
single largest source of perceived flakiness.

### Goals
- A title rule re-applies within ~200ms of an SPA route change, with no manual re-trigger.
- The observer survives `<title>` element replacement (re-attaches automatically).
- On URL change, the **correct** rule for the new URL is matched and applied (not the stale one).
- Zero measurable jank: no title "thrash" / flicker loop on pages that legitimately update their title.

### Non-Goals
- Watching arbitrary DOM content for template variables (that's the content-derived `{selector:…}`
  idea — separate spec). Out of scope: too broad, perf-sensitive.
- Supporting iframes / cross-origin frames. Rare for title use; adds complexity.
- Detecting navigations in non-SPA contexts (full reloads already work via normal injection).

### User Stories
- As a Gmail/Linear user, I want my renamed tab to stay renamed as I click between views, so I don't
  have to re-apply the rule every few minutes.
- As a user with a path-prefix rule (see Feature 3), I want navigating from `/board/1` to `/board/2`
  to apply the right title for the new path automatically.

### Requirements

**Must-Have (P0)**
- Detect SPA navigations by patching/observing `history.pushState`, `history.replaceState`, and the
  `popstate` event; debounce to a single re-evaluation per navigation.
  - *Acceptance:* Given a domain/path rule exists, when the SPA calls `pushState` to a new matching
    URL, then the content script requests a fresh match from the service worker and applies the result.
- Re-attach the `MutationObserver` if the observed `<title>` node is removed/replaced.
  - *Acceptance:* Given the page swaps out the `<title>` element, when it later sets a new title,
    then the custom title is still reapplied.
- Guard against thrash: only reapply when `document.title !== expected`, and never enter a tight
  reapply loop (cap reapplies per navigation, e.g. coalesce within an animation frame).
  - *Acceptance:* On a page that updates its title once per second legitimately to a value we override,
    CPU stays negligible and no infinite mutation loop occurs.

**Nice-to-Have (P1)**
- Observe `<head>` with `childList: true` to catch `<title>` insertion/replacement directly, rather
  than polling.
- A per-rule "aggressive reapply" toggle for pathological sites, defaulting off.

**Future Considerations (P2)**
- Surface a content-script ↔ worker heartbeat so the popup can show "rule active on this tab."

### Open Questions
- *(eng)* Patch `history.pushState` in the page's main world (requires injected script) vs. rely on
  the `navigation` API where available — what's our minimum Chrome version?
- *(eng)* Debounce window: 100ms vs. rAF-coalesced — measure on Gmail.

---

## Feature 2 — Import / Export Rules (JSON)

### Problem Statement
Rules live only in `chrome.storage.sync` and are invisible/unportable. Users who reinstall, switch
machines outside the same Chrome profile, or want to back up before experimenting have no recovery
path. There's also no way to share a curated rule set (e.g. a team's Jira/Confluence conventions).

### Goals
- A user can export all rules to a single JSON file and re-import it on any install.
- Import is non-destructive by default (merge), with an explicit "replace all" option.
- Round-trip is lossless: export → wipe → import reproduces identical behavior.

### Non-Goals
- Cloud sync / accounts / a sharing backend. File-based only for v1.
- Partial/selective export UI (pick individual rules). v1 is all-or-nothing; revisit if requested.
- Importing from the original Firefox Tab ReTitle format. Separate converter if there's demand.

### User Stories
- As a user setting up a new machine, I want to import my rules from a file so I don't recreate them
  by hand.
- As a cautious user, I want to export a backup before bulk-editing, so I can roll back.
- As a power user, I want to share a `.json` of my domain rules with a teammate.

### Requirements

**Must-Have (P0)**
- "Export rules" action in the options page downloads a versioned JSON blob containing
  `tabTitles`, `urlTitles`, `domainTitles`, `regexPatterns`, and `settings` (matching `StorageData`).
  - *Acceptance:* Given existing rules, when the user clicks Export, then a `.json` file downloads with
    a top-level `version` and `exportedAt` field.
- "Import rules" accepts a file, validates the schema, and **merges** into existing storage.
  - *Acceptance:* Given a valid export file, when imported in merge mode, then new rules are added and
    existing untouched rules remain.
  - *Acceptance:* Given an invalid/corrupt file, when imported, then a clear error is shown and no
    storage mutation occurs.
- Conflict handling on merge: same key (e.g. same URL) — last-write-wins with a count summary
  ("12 added, 3 overwritten").
- "Replace all" mode behind an explicit confirm.

**Nice-to-Have (P1)**
- Show a pre-import diff/summary ("This file contains 40 rules: 12 new, 3 conflicts").
- Schema migration: if `version` is older, upgrade on import.

**Future Considerations (P2)**
- Selective export (checkbox list).
- Sync-storage 100KB quota guardrail: warn if an import would exceed quota (ties into Feature 4's
  local-storage option as an escape valve).

### Open Questions
- *(eng/product)* Do we export `tabTitles` (ephemeral, tab-id keyed)? They won't be meaningful on a
  different machine — recommend excluding tab-scoped entries from export by default.
- *(eng)* Validation: hand-rolled type guards vs. a small schema lib (zod) — bundle size tradeoff.

---

## Feature 3 — Wildcard / Path-Prefix Rules

### Problem Statement
There's a sharp cliff between **Exact URL** (too narrow — breaks on any query/hash change) and
**Domain-wide** (too broad — one title for an entire site). The realistic middle case — "every repo
under `github.com/anthropics/*`" or "all of `localhost:3000/admin/*`" — currently forces users into
hand-written regex (`regexPatterns`), which is error-prone and intimidating.

### Goals
- Users can write `*`/`**`-style patterns without learning regex.
- Pattern matching slots cleanly into the existing priority order in `storage-manager.ts`.
- Match precedence is predictable: more specific patterns win over less specific.

### Non-Goals
- Replacing the existing regex feature (it stays for power users).
- Full glob spec (`{a,b}` alternation, character classes). Keep the syntax tiny: `*` and `**`.

### User Stories
- As a developer, I want `localhost:*/admin/**` to title all admin pages on any dev port.
- As a GitHub user, I want `github.com/anthropics/*` to prefix every repo in the org.
- As a user, I want a more specific pattern (`/anthropics/claude*`) to override a broader one
  (`/anthropics/*`).

### Requirements

**Must-Have (P0)**
- New rule type `pattern` (alongside `tab`/`url`/`domain`). Add a `PatternTitle`/glob entry to
  `StorageData` and a `'pattern'` arm to `TitleMatch['type']`.
  - Syntax: `*` matches within a path segment (no `/`); `**` matches across segments; matching is
    against the normalized URL (scheme optional, host + path; query/hash ignored unless explicitly
    included).
  - *Acceptance:* Given a rule `github.com/anthropics/*`, when visiting
    `https://github.com/anthropics/claude-code`, then the rule matches.
  - *Acceptance:* Given the same rule, when visiting `https://github.com/anthropics/claude-code/issues`,
    then it does **not** match (single `*` is one segment), but `…/anthropics/**` does.
- Precedence: insert `pattern` into the priority chain between `url` (exact) and `domain`. Among
  competing patterns, the one with the longest literal (non-wildcard) prefix wins.
  - *Acceptance:* Given both `/anthropics/*` and `/anthropics/claude*`, when on `/anthropics/claude-code`,
    then the `claude*` rule applies.
- Patterns compiled to anchored regex internally; compilation is cached.

**Nice-to-Have (P1)**
- Live "does this pattern match the current tab?" tester in the popup/options (reuses the existing
  live-preview affordance).
- Optionally include query string when the pattern contains `?`.

**Future Considerations (P2)**
- Per-pattern enable/disable toggle (pairs with a broader rule-management pass).

### Open Questions
- *(product)* Default `*` semantics — segment-scoped (recommended, matches gitignore/most users'
  mental model) vs. greedy. Spec assumes segment-scoped `*`, cross-segment `**`.
- *(eng)* How to present this as a 5th option in the storage-type selector without crowding the popup.

---

## Feature 4 — Flicker Prevention + Per-Rule Sync/Local Storage

Two related durability fixes bundled because both touch the injection timing / storage layer.

### Problem Statement
**Flicker:** On normal page loads the original title flashes before our override applies, because the
title is set after the content script reacts to messaging round-trips. It's cosmetic but cheap to fix
and very visible. **Storage leak:** The README already flags that rules created in incognito are saved
to `chrome.storage.sync` and therefore persist into normal windows — a privacy footgun. Users have no
way to say "keep this rule on this device only / don't sync it."

### Goals
- Eliminate the original-title flash on matched pages in the common case.
- Let users mark a rule (or all incognito rules) as **local-only**, so it never touches Sync.
- No regression to existing synced rules; migration is invisible.

### Non-Goals
- Encrypting stored rules. Out of scope.
- A full storage backend swap. We layer `chrome.storage.local` alongside `sync`, not replace it.

### User Stories
- As a user, I want the renamed title to appear immediately on load, without the real title flashing first.
- As an incognito user, I want a rule I create privately to stay on this device and not appear in my
  normal windows.
- As a multi-device user, I want to choose per rule whether it syncs.

### Requirements

**Must-Have (P0) — Flicker**
- Apply the override at `document_start` using a `chrome.scripting.registerContentScripts` /
  `run_at: document_start` injection that reads a cached match synchronously where possible, falling
  back to the current message flow.
  - *Acceptance:* Given an exact-URL/domain/pattern rule for a page, when the page loads, then the
    custom title is the first title painted (no original-title frame), verified via a Playwright trace.
- Cache the resolved title per URL/tab so `document_start` can apply without waiting on a worker round-trip.

**Must-Have (P0) — Storage scope**
- Add a `storageScope: 'sync' | 'local'` field to persisted rule types and to `Settings`
  (default `sync` to preserve current behavior).
- Reads merge from both `local` and `sync`; on conflict, `local` wins (it's device-intentional).
  - *Acceptance:* Given a `local` rule and a `sync` rule for the same URL, when matching, then the
    `local` rule's title is used.
- Incognito default: rules created in an incognito window default to `storageScope: 'local'`.
  - *Acceptance:* Given a rule created in incognito, when opening a normal window, then that rule is
    not present.

**Nice-to-Have (P1)**
- A per-rule toggle in the options list to flip an existing rule between sync and local.
- A one-time prompt/banner explaining the incognito default change.

**Future Considerations (P2)**
- "Local-only mode" global switch for privacy-conscious users (nothing ever syncs).

### Open Questions
- *(eng)* Can we reliably read a cached match synchronously at `document_start` under MV3 service-worker
  cold starts? May need the cache in `storage.session` or a declarative approach.
- *(product)* Migration messaging: changing the incognito default is a behavior change — surface it in
  CHANGELOG and possibly a first-run note.

---

## Feature 5 — Emoji / Favicon Prefix on Renamed Tabs

### Problem Statement
Renamed tabs are easy to *read* but not easy to *spot* in a crowded tab strip — every tab is text.
A small visual marker (an emoji prefix in the title, and/or a favicon override) makes "the prod tab"
or "the on-call dashboard" instantly scannable. This is the one item from the brainstorm that's
visual rather than durability, but it directly reinforces the "find my important tab" job.

### Goals
- A rule can prepend an emoji to the title with one tap.
- Optionally override the tab's favicon to a colored dot / emoji glyph.
- Works through the same persistence + reapply path as titles (so it's also "sticky").

### Non-Goals
- Custom uploaded favicon images. v1 is emoji/preset dots only — avoids storage-size and security
  concerns with arbitrary image data.
- Changing the actual tab group color (separate Chrome tab-groups feature).

### User Stories
- As a user, I want to prefix a rule's title with 🔴 so my production tab is obvious.
- As a user, I want a renamed tab's favicon shown as a colored dot so I can find it even when the
  title is truncated.

### Requirements

**Must-Have (P0)**
- An optional `emoji` field on a rule; when set, the applied title becomes `${emoji} ${title}`.
  - *Acceptance:* Given a rule with emoji 🔴 and title "Prod", when applied, then `document.title`
    is `🔴 Prod`.
- A compact emoji picker (curated small set: status dots, common symbols) in the popup — not a full
  unicode keyboard.

**Nice-to-Have (P1)**
- Favicon override via injecting/replacing `<link rel="icon">` with a generated emoji/colored-dot
  data URI; reapplied by the same observer that protects the title.
  - *Acceptance:* Given favicon override enabled, when the SPA changes its favicon, then ours is reapplied.

**Future Considerations (P2)**
- Auto-derive a dot color from the rule scope (e.g. domain rules = blue).
- Custom uploaded favicons (deferred for the storage/security reasons above).

### Open Questions
- *(eng)* Favicon override reliability varies by site (some set icons via JS continuously) — scope P1
  to "best effort, reapplied" rather than guaranteed.
- *(design)* Curated emoji set — which ~12 glyphs ship by default?

---

## Suggested Sequencing

Ordered by impact-to-effort and dependency:

1. **Feature 1 (SPA reapply)** — highest reliability payoff; partially scaffolded already in
   `title-updater.ts`. Ship first; everything else benefits from a robust reapply path.
2. **Feature 2 (Import/Export)** — low risk, self-contained, high user-trust value. Good parallel track.
3. **Feature 3 (Wildcard rules)** — extends the data model and matching; do before Feature 4's caching
   so the cache accounts for the new rule type.
4. **Feature 4 (Flicker + storage scope)** — touches injection timing and the storage layer; benefits
   from the matching/caching work being settled.
5. **Feature 5 (Emoji/favicon)** — rides on the Feature 1 reapply path; smallest scope, ship as a
   delighter once the durability work lands.

## Cross-Cutting Notes
- Features 1, 4, and 5 all rely on a solid reapply loop — build it once, in the content script, and
  reuse. Avoid three separate observers.
- Features 2, 3, and 4 all change `StorageData` / persisted types — version the storage schema now
  (add a top-level `schemaVersion`) so Import (F2) and migrations stay sane.
