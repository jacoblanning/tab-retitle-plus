# 02 - Chrome Extensions Basics

## 🎯 What You'll Learn

- What Chrome extensions are
- How they're structured
- The different parts of an extension
- How they interact with web pages

## 🤔 What Is a Chrome Extension?

A **Chrome extension** is a small program that adds features to your Chrome browser.

**Think of it like:**
- Chrome = Your car
- Extension = A GPS system you add to your car
- This extension = A custom GPS that labels your destinations better

## 🏗️ Extension Structure (Simple Version)

Every Chrome extension has these main parts:

### 1. **Manifest File** (`manifest.json`)
**What it is:** The "instruction manual" for Chrome
**What it does:** Tells Chrome:
- What the extension is called
- What permissions it needs
- Where the files are located
- What it can do

**Example:**
```json
{
  "name": "Tab ReTitle+",
  "version": "3.0.0",
  "permissions": ["storage", "tabs"]
}
```

### 2. **Background Script** (Service Worker)
**What it is:** The "brain" that runs in the background
**What it does:**
- Listens for events (like when tabs change)
- Manages data storage
- Coordinates between different parts
- Runs even when you're not looking at it

**Think of it like:** A security guard watching everything

### 3. **Popup** (`popup.html`)
**What it is:** The small window that appears when you click the extension icon
**What it does:**
- Shows the user interface
- Lets users enter information
- Displays current settings

**Think of it like:** A control panel

### 4. **Content Script**
**What it is:** Code that runs on web pages
**What it does:**
- Can read and modify web page content
- In our case: Changes the page title
- Runs automatically when pages load

**Think of it like:** An invisible helper on each webpage

### 5. **Options Page** (`options.html`)
**What it is:** A settings page users can open
**What it does:**
- Shows saved titles
- Lets users manage settings
- More space than the popup

**Think of it like:** A full settings menu

## 🔄 How They Work Together

```
User clicks extension icon
    ↓
Popup opens
    ↓
User enters title and clicks "Save"
    ↓
Popup sends message to Background Script
    ↓
Background Script saves to storage
    ↓
Background Script sends message to Content Script
    ↓
Content Script changes the page title
    ↓
Done! ✅
```

## 📦 Manifest V3 (What We're Using)

**Manifest V3** is the latest version of Chrome's extension system.

**Key differences from older versions:**
- Uses "service workers" instead of background pages (more efficient)
- Stricter security (better for users)
- More modern approach

**Why it matters:** We're using the newest standard, so the extension will work for years to come.

## 🔐 Permissions

Extensions need to ask permission for things like:
- **`storage`** - Save data (like your custom titles)
- **`tabs`** - Access tab information
- **`scripting`** - Run code on web pages
- **`<all_urls>`** - Work on any website

**Think of it like:** Asking for keys to different rooms

## 🎨 Extension Lifecycle

1. **Installation** - User adds extension to Chrome
2. **Activation** - Extension starts running
3. **Background Script** - Starts listening for events
4. **User Interaction** - User clicks icon, popup opens
5. **Action** - Extension does its job
6. **Update** - Extension can be updated without reinstalling

## 🛠️ Development vs Production

**Development:**
- Code lives in `src/` folder
- You edit TypeScript files
- Run `npm run build` to create `dist/` folder

**Production:**
- `dist/` folder is what Chrome actually uses
- Contains compiled JavaScript
- This is what gets loaded in Chrome

**Think of it like:**
- `src/` = Your recipe (source code)
- `npm run build` = Cooking (compiling)
- `dist/` = The finished meal (what Chrome eats)

## 📝 Key Concepts

### **Message Passing**
Different parts of the extension talk to each other using "messages"
- Like passing notes between rooms
- Popup → Background: "Save this title"
- Background → Content Script: "Change title to X"

### **Storage**
Extensions can save data using Chrome's storage API
- Like a small database
- Persists even after browser closes
- Limited size (but enough for our needs)

### **Events**
Extensions listen for browser events
- Tab opened
- Tab title changed
- Page loaded
- Extension icon clicked

## 🎓 Common Questions

**Q: Can extensions see my passwords?**
A: Only if you give them permission, and good extensions don't ask for that.

**Q: Do extensions slow down Chrome?**
A: Well-made extensions (like this one) have minimal impact.

**Q: Can I break my browser with an extension?**
A: Extensions run in a sandbox - they can't break Chrome itself.

**Q: How do I test my extension?**
A: Load the `dist/` folder in Chrome's extension manager (Developer Mode).

## 🚀 What's Next?

Now that you understand Chrome extensions, let's look at how THIS project is organized!

**Next:** [03 - Project Structure](./03-PROJECT-STRUCTURE.md)
