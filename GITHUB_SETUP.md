# GitHub Setup Instructions

## Quick Start

Your repository is ready for GitHub! Follow these steps to push to a new GitHub repository:

### 1. Create GitHub Repository

1. Go to https://github.com/new
2. Repository name: `retitle-extension` (or your preferred name)
3. Description: "Modern Chrome extension for renaming tab titles with persistence options"
4. Choose Public or Private
5. **Do NOT initialize** with README, .gitignore, or license (we already have these)
6. Click "Create repository"

### 2. Push to GitHub

GitHub will show you commands after creating the repo. Use these:

```bash
# Add the remote (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/retitle-extension.git

# Push to GitHub
git branch -M main
git push -u origin main
```

### 3. Verify Upload

Visit your repository on GitHub and verify all files are present:
- Source code in `src/`
- Configuration files (package.json, tsconfig.json, etc.)
- Documentation (README.md, CHANGELOG.md, LICENSE)
- Icons in `public/icons/`

**Note:** `node_modules/`, `dist/`, and test files are excluded via `.gitignore` (as intended).

## Repository Topics (Recommended)

Add these topics to your GitHub repository to improve discoverability:
- `chrome-extension`
- `manifest-v3`
- `typescript`
- `vite`
- `tailwind-css`
- `browser-extension`
- `tab-management`

To add topics:
1. Go to your repository on GitHub
2. Click the gear icon next to "About" in the right sidebar
3. Add topics in the "Topics" field

## Optional Enhancements

### Add GitHub Actions

Consider adding a GitHub Actions workflow for automated builds:

**File:** `.github/workflows/build.yml`
```yaml
name: Build

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run type-check
      - run: npm run build
```

### Add a Screenshot

Enhance the README by adding a screenshot:
1. Take a screenshot of the extension popup
2. Save as `screenshot.png` in a `docs/` folder
3. Add to README.md under "Features" section:
   ```markdown
   ## Screenshots

   ![ReTitle Popup](docs/screenshot.png)
   ```

### Create Releases

When you're ready to publish:
1. Build the extension: `npm run build`
2. Create a zip of the `dist/` folder
3. Create a GitHub release with the zip file
4. Users can download and install the unpacked extension

## Current Status

✅ Git repository initialized
✅ All source files committed
✅ .gitignore configured
✅ README.md with comprehensive documentation
✅ LICENSE file (ISC)
✅ CHANGELOG.md for version tracking
✅ Clean project structure

**Ready to push to GitHub!**
