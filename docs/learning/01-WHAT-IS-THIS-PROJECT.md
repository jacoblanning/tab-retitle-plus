# 01 - What is This Project?

## 🎯 The Big Picture

**Tab ReTitle+** is a Chrome browser extension that lets users **rename browser tab titles** with powerful options for saving those changes.

## 🤔 What Problem Does It Solve?

Have you ever had 10 tabs open and couldn't tell which one is which? Or wanted to add a label like `[PROD]` or `[REVIEW]` to a tab title?

**Tab ReTitle+ solves this** by letting you:
- Change any tab's title to something more meaningful
- Save those changes so they persist (don't disappear when you refresh)
- Apply rules automatically (e.g., all GitHub tabs get a prefix)

## 📱 Real-World Example

**Before:**
```
Tab 1: "GitHub"
Tab 2: "GitHub"  
Tab 3: "GitHub"
```
*(Which one is production? Which is staging?)*

**After using Tab ReTitle+:**
```
Tab 1: "[PROD] GitHub - Dashboard"
Tab 2: "[STAGING] GitHub - Pull Requests"
Tab 3: "[DEV] GitHub - Issues"
```
*(Much clearer!)*

## 🏗️ What Kind of Project Is This?

This is a **Chrome Extension** - a small program that runs inside your Chrome browser to add extra features.

Think of it like:
- **Browser** = Your house
- **Extension** = A new appliance (like a smart doorbell)
- **This extension** = A tool that labels your rooms (tabs) better

## 🎨 What Can Users Do?

1. **Quick rename** - Click the extension icon, type a new title, save
2. **Save for later** - Choose how long to remember the title:
   - Just this session (temporary)
   - This specific tab (persists when you close/reopen)
   - This exact URL (works every time you visit)
   - This entire website (all pages on the domain)
3. **Use templates** - Include the original title: `[PROD] {original}` becomes `[PROD] GitHub - Homepage`

## 🔧 Technical Summary (Simple Version)

- **Language:** TypeScript (JavaScript with types)
- **UI Framework:** React (for building the popup interface)
- **Styling:** Tailwind CSS (for making it look nice)
- **Build Tool:** Vite (packages everything together)
- **Type:** Chrome Extension Manifest V3 (the latest standard)

## 📊 Project Stats

- **Size:** Small to medium project
- **Complexity:** Moderate (good for learning!)
- **Maintenance:** Regular updates needed as Chrome changes

## 🎓 Why This Is Good to Learn From

1. **Real project** - Not a tutorial, actual working code
2. **Modern stack** - Uses current best practices
3. **Well-organized** - Code is structured clearly
4. **Manageable scope** - Not too big, not too small

## 🚀 What's Next?

Now that you know **what** this project is, let's learn **how** Chrome extensions work!

**Next:** [02 - Chrome Extensions Basics](./02-CHROME-EXTENSIONS-BASICS.md)
