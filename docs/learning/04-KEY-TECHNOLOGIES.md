# 04 - Key Technologies

## 🎯 What You'll Learn

- What each technology does
- Why we use it
- How they work together
- When you'd interact with each one

## 🎨 The Technology Stack

Think of building a house:
- **TypeScript** = The blueprint language
- **React** = The modern building materials
- **Vite** = The construction tools
- **Tailwind CSS** = The paint and styling
- **Chrome Extension APIs** = The utilities (plumbing, electricity)

## 📘 TypeScript

### What It Is
**TypeScript** is JavaScript with types. It's like JavaScript but with better error checking.

### Simple Explanation
**JavaScript:**
```javascript
let name = "John";
name = 123; // This works, but might cause bugs later!
```

**TypeScript:**
```typescript
let name: string = "John";
name = 123; // Error! TypeScript catches this mistake
```

### Why We Use It
- **Catches errors early** - Before code runs
- **Better code hints** - Your editor knows what things are
- **Easier maintenance** - Clear what each piece of code does

### When You'll See It
- All `.ts` and `.tsx` files
- Type definitions in `src/shared/types.ts`
- Function parameters with types: `function saveTitle(title: string)`

### You Don't Need To
- Learn all of TypeScript right away
- Understand every type annotation
- Write complex types yourself

**Think of it like:** A spell-checker for code

## ⚛️ React

### What It Is
**React** is a library for building user interfaces. It makes it easier to create interactive UIs.

### Simple Explanation
**Without React (vanilla JavaScript):**
```javascript
// You manually update the page
document.getElementById('title').textContent = newTitle;
document.getElementById('preview').textContent = preview;
// Lots of manual work!
```

**With React:**
```jsx
// React updates automatically when data changes
<TitleInput value={title} onChange={setTitle} />
<TitlePreview text={preview} />
// React handles the updates!
```

### Why We Use It
- **Component-based** - Build UI in reusable pieces
- **Automatic updates** - UI updates when data changes
- **Great ecosystem** - Lots of tools and libraries (like shadcn/ui)

### When You'll See It
- Currently: Being set up for future use
- Future: `src/popup/Popup.tsx`, `src/components/`
- Files ending in `.tsx` (TypeScript + React)

### Current Status
- **Installed:** ✅ Yes
- **Being used:** ⏳ Not yet (popup still uses vanilla JS)
- **Planned:** 🎯 Will migrate popup and options to React

**Think of it like:** LEGO blocks for building interfaces

## ⚡ Vite

### What It Is
**Vite** is a build tool. It takes your source code and packages it for production.

### Simple Explanation
**Without Vite:**
- Write code
- Manually combine files
- Optimize code
- Copy files around
- Lots of manual steps!

**With Vite:**
- Write code
- Run `npm run build`
- Vite does everything automatically!

### Why We Use It
- **Fast** - Builds quickly
- **Modern** - Uses latest standards
- **Simple** - Easy configuration
- **Hot reload** - See changes instantly during development

### When You'll See It
- `vite.config.ts` - Configuration file
- `npm run build` - Uses Vite to build
- `npm run dev` - Uses Vite for development

### What It Does
1. Compiles TypeScript → JavaScript
2. Bundles files together
3. Optimizes code
4. Outputs to `dist/` folder

**Think of it like:** A factory that assembles your product

## 🎨 Tailwind CSS

### What It Is
**Tailwind CSS** is a CSS framework. Instead of writing custom CSS, you use utility classes.

### Simple Explanation
**Traditional CSS:**
```css
.my-button {
  background-color: blue;
  padding: 10px 20px;
  border-radius: 5px;
}
```

**Tailwind CSS:**
```html
<button class="bg-blue-500 px-5 py-2 rounded">
```

### Why We Use It
- **Fast development** - Write styles directly in HTML
- **Consistent** - Predefined spacing and colors
- **Small file size** - Only includes what you use
- **Easy to learn** - Classes are self-explanatory

### When You'll See It
- In HTML files: `class="bg-blue-500 px-4 py-2"`
- `tailwind.config.js` - Theme configuration
- `src/styles/globals.css` - Global Tailwind setup

### Common Classes
- `bg-blue-500` = Blue background
- `px-4` = Horizontal padding
- `rounded` = Rounded corners
- `text-white` = White text
- `hover:bg-blue-600` = Darker blue on hover

**Think of it like:** A box of pre-made style stickers

## 🧩 shadcn/ui

### What It Is
**shadcn/ui** is a collection of pre-built React components that look great and work well.

### Simple Explanation
Instead of building a button from scratch:
```jsx
<Button>Click Me</Button>
```

Instead of writing:
```jsx
<button className="bg-blue-500 px-4 py-2 rounded hover:bg-blue-600">
  Click Me
</button>
```

### Why We Use It
- **Beautiful by default** - Professional-looking components
- **Accessible** - Works with screen readers
- **Customizable** - Can modify to fit your needs
- **Copy-paste** - Components live in your codebase

### When You'll See It
- `src/components/ui/` - Component files
- Future React components will use these
- Add components: `npx shadcn@latest add button`

**Think of it like:** Pre-built furniture that you can customize

## 🔧 Chrome Extension APIs

### What It Is
**Chrome Extension APIs** are tools provided by Chrome for extensions to use.

### Simple Explanation
Chrome gives you tools like:
- `chrome.storage` - Save data
- `chrome.tabs` - Access tabs
- `chrome.runtime` - Send messages
- `chrome.scripting` - Run code on pages

### Why We Use It
- **Required** - This is how extensions work
- **Powerful** - Can do things regular web pages can't
- **Secure** - Chrome manages security

### When You'll See It
- `chrome.storage.sync.set()` - Saving data
- `chrome.tabs.query()` - Getting tab info
- `chrome.runtime.sendMessage()` - Sending messages

**Think of it like:** The tools Chrome gives you to build extensions

## 🔄 How They Work Together

```
You write TypeScript code
    ↓
React components (future)
    ↓
Tailwind CSS for styling
    ↓
Vite builds everything
    ↓
Chrome Extension APIs make it work
    ↓
Extension runs in Chrome!
```

## 📚 Learning Resources

### TypeScript
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html) - Official guide
- Start with: Basic types, interfaces

### React
- [React Docs](https://react.dev/learn) - Official tutorial
- Start with: Components, props, state

### Tailwind CSS
- [Tailwind Docs](https://tailwindcss.com/docs) - Official docs
- Start with: Utility classes, spacing

### Chrome Extensions
- [Chrome Extension Docs](https://developer.chrome.com/docs/extensions/) - Official guide
- Start with: Getting started, manifest

## 🎓 You Don't Need To Master Everything

**Focus on:**
- Understanding what each technology does
- Knowing when to use which one
- Being able to read the code

**You can learn:**
- Details as you need them
- Specific features when you use them
- Advanced concepts later

## 🚀 What's Next?

Now that you know the tools, let's see how they all work together in this project!

**Next:** [05 - How It Works](./05-HOW-IT-WORKS.md)
