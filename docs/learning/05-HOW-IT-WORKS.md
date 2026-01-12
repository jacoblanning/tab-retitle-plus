# 05 - How It Works

## 🎯 What You'll Learn

- Step-by-step how the extension works
- What happens when a user saves a title
- How different parts communicate
- The flow of data through the system

## 🔄 The Complete Flow

Let's trace what happens when a user saves a title:

### Step 1: User Opens Popup
```
User clicks extension icon
    ↓
Chrome opens popup.html
    ↓
popup.ts runs and loads current tab info
    ↓
User sees the popup with current title
```

**Files involved:**
- `src/popup/popup.html` - The UI
- `src/popup/popup.ts` - The logic

### Step 2: User Enters Title
```
User types "[PROD] {original}" in input field
    ↓
popup.ts shows live preview
    ↓
User selects storage type (tab/url/domain)
    ↓
User clicks "Save" button
```

**What happens:**
- Input field updates
- Preview updates in real-time
- Storage type radio button selected

### Step 3: Popup Sends Message
```
popup.ts creates a message:
{
  type: "SAVE_TITLE",
  payload: {
    title: "[PROD] {original}",
    storageType: "tab",
    tabId: 123,
    url: "https://github.com"
  }
}
    ↓
Sends to background script via chrome.runtime.sendMessage()
```

**Files involved:**
- `src/popup/popup.ts` - Creates and sends message
- `src/shared/messages.ts` - Message type definitions

### Step 4: Background Script Receives Message
```
service-worker.ts receives message
    ↓
Checks message type: "SAVE_TITLE"
    ↓
Calls handleMessage() function
    ↓
Determines what to do based on storage type
```

**Files involved:**
- `src/background/service-worker.ts` - Message handler

### Step 5: Save to Storage
```
If storageType is "once":
  → Just update tab directly, don't save
    
If storageType is "tab":
  → Save to chrome.storage.sync with tab ID as key
  
If storageType is "url":
  → Save to chrome.storage.sync with URL as key
  
If storageType is "domain":
  → Extract domain, save with domain as key
```

**Files involved:**
- `src/background/storage-manager.ts` - Handles saving
- Chrome's storage API

### Step 6: Apply Title to Page
```
service-worker.ts sends message to content script:
{
  type: "UPDATE_TITLE",
  payload: {
    title: "[PROD] GitHub - Homepage"
  }
}
    ↓
Content script receives message
    ↓
Updates document.title
    ↓
Sets up MutationObserver to keep title changed
```

**Files involved:**
- `src/background/service-worker.ts` - Sends message
- `src/content/title-updater.ts` - Updates title

### Step 7: Title Changed!
```
Page title now shows: "[PROD] GitHub - Homepage"
    ↓
MutationObserver watches for changes
    ↓
If page tries to change title back, observer restores it
    ↓
Done! ✅
```

## 📊 Data Flow Diagram

```
┌─────────────┐
│   User       │
│  (Chrome)    │
└──────┬───────┘
       │
       │ Clicks icon
       ↓
┌─────────────┐
│   Popup     │  ← popup.html + popup.ts
│  Interface  │
└──────┬───────┘
       │
       │ User enters title & clicks Save
       ↓
┌─────────────┐
│   Message   │  ← chrome.runtime.sendMessage()
│   Passing   │
└──────┬───────┘
       │
       │ "SAVE_TITLE" message
       ↓
┌─────────────┐
│ Background  │  ← service-worker.ts
│   Script    │
└──────┬───────┘
       │
       ├──→ Storage ← storage-manager.ts
       │      ↓
       │   chrome.storage.sync
       │
       └──→ Content Script ← title-updater.ts
              ↓
           document.title = newTitle
```

## 🔍 Deep Dive: Storage Types

### One-Time (Temporary)
```
User saves title
    ↓
Title applied immediately
    ↓
NOT saved to storage
    ↓
Page refresh → Title reverts
```

**Use case:** Quick temporary labels

### Tab-Specific
```
User saves title
    ↓
Saved with tab ID: "tabTitles[123] = title"
    ↓
Title persists when:
  - Page refreshes
  - Tab closed and reopened
    ↓
Does NOT apply to other tabs with same URL
```

**Use case:** Labeling specific tabs

### URL-Specific
```
User saves title
    ↓
Saved with URL: "urlTitles['https://github.com'] = title"
    ↓
Applies to ALL tabs with this exact URL
    ↓
Persists across browser sessions
```

**Use case:** Consistent labeling for specific pages

### Domain-Wide
```
User saves title
    ↓
Saved with domain: "domainTitles['github.com'] = title"
    ↓
Applies to ALL pages on github.com
    ↓
Works for any URL on that domain
```

**Use case:** Labeling entire websites

## 🎯 Priority System

When multiple rules could apply, priority order is:

1. **Tab-specific** (highest priority)
2. **Exact URL**
3. **Domain**
4. **Regex patterns** (if any)
5. **Bookmark titles** (if enabled)
6. **Original title** (fallback)

**Example:**
```
You have:
- Domain rule: "github.com" → "[GITHUB] {original}"
- URL rule: "github.com/trending" → "[TRENDING] {original}"

When you visit github.com/trending:
→ Uses URL rule (higher priority)
→ Shows: "[TRENDING] GitHub Trending"

When you visit github.com/explore:
→ Uses domain rule
→ Shows: "[GITHUB] GitHub Explore"
```

## 🔄 Title Updates

### When Tabs Change
```
User navigates to new page
    ↓
Chrome fires "tabs.onUpdated" event
    ↓
service-worker.ts receives event
    ↓
Checks if there's a saved title for this tab/URL/domain
    ↓
If found, sends UPDATE_TITLE message to content script
    ↓
Content script updates title
```

### Dynamic Title Changes
Some websites change titles dynamically (YouTube, Gmail):
```
Page loads with title "Gmail"
    ↓
Extension applies custom title: "[EMAIL] Gmail"
    ↓
Gmail updates title to "Gmail - Inbox (5)"
    ↓
MutationObserver detects change
    ↓
Restores custom title: "[EMAIL] Gmail - Inbox (5)"
```

**Files involved:**
- `src/content/title-updater.ts` - MutationObserver

## 💬 Message Passing

### Message Types

**SAVE_TITLE**
- From: Popup
- To: Background Script
- Purpose: Save a new title

**UPDATE_TITLE**
- From: Background Script
- To: Content Script
- Purpose: Change the page title

**GET_SAVED_TITLES**
- From: Options Page
- To: Background Script
- Purpose: Get all saved titles

**DELETE_TITLE**
- From: Options Page
- To: Background Script
- Purpose: Remove a saved title

### How Messages Work
```typescript
// Sending a message
chrome.runtime.sendMessage({
  type: 'SAVE_TITLE',
  payload: { title: '...', storageType: 'tab' }
});

// Receiving a message
chrome.runtime.onMessage.addListener((message) => {
  if (message.type === 'SAVE_TITLE') {
    // Handle it
  }
});
```

## 🎨 Template Variables

Users can use special variables in titles:

**`{original}`** or **`$0`**
- Replaced with the original page title
- Example: `"[PROD] {original}"` → `"[PROD] GitHub - Homepage"`

**`{url}`**
- Replaced with the full URL
- Example: `"{url}"` → `"https://github.com/trending"`

**`{domain}`**
- Replaced with the domain name
- Example: `"[{domain}] {original}"` → `"[github.com] GitHub - Homepage"`

**Processing:**
```typescript
// In src/shared/utils.ts
processTitleTemplate(template, originalTitle, url)
```

## 🔐 Storage Structure

Data is stored in Chrome's sync storage:

```typescript
{
  tabTitles: {
    "123": { title: "...", originalUrl: "...", timestamp: ... }
  },
  urlTitles: {
    "https://github.com": { title: "...", timestamp: ... }
  },
  domainTitles: {
    "github.com": { title: "...", timestamp: ... }
  },
  regexPatterns: [...],
  settings: {
    enableBookmarkTitles: false,
    enableContextMenu: true,
    debugMode: false
  }
}
```

## 🚀 What's Next?

Now that you understand how it works, let's learn how to do common tasks!

**Next:** [06 - Common Tasks](./06-COMMON-TASKS.md)
