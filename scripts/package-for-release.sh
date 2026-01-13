#!/bin/bash
# Package extension for Chrome Web Store submission

set -e  # Exit on error

echo "📦 Packaging Tab ReTitle+ for Chrome Web Store..."
echo ""

# Get version from manifest
VERSION=$(node -p "require('./public/manifest.json').version")
echo "Version: $VERSION"
echo ""

# Clean and build
echo "🧹 Cleaning old builds..."
rm -rf dist/

echo "🔨 Building extension..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed!"
    exit 1
fi

echo ""
echo "✅ Build successful!"
echo ""

# Check dist/ contents
echo "📋 Checking dist/ contents..."
if [ ! -f "dist/manifest.json" ]; then
    echo "❌ manifest.json not found in dist/!"
    exit 1
fi

if [ ! -d "dist/icons" ]; then
    echo "❌ icons/ folder not found in dist/!"
    exit 1
fi

echo "✅ Required files present"
echo ""

# Create ZIP
ZIPNAME="tab-retitle-plus-v${VERSION}.zip"
echo "📦 Creating ${ZIPNAME}..."

# Check if zip command exists
if command -v zip &> /dev/null; then
    cd dist/
    zip -r "../${ZIPNAME}" . -x "*.DS_Store" -x "__MACOSX/*"
    cd ..
elif command -v python3 &> /dev/null; then
    echo "   Using Python to create ZIP (zip command not found)..."
    python3 << 'PYTHON_SCRIPT'
import zipfile
import os
from pathlib import Path

version = os.popen("node -p \"require('./public/manifest.json').version\"").read().strip()
zipname = f"tab-retitle-plus-v{version}.zip"
dist_dir = Path("dist")

with zipfile.ZipFile(zipname, 'w', zipfile.ZIP_DEFLATED) as zipf:
    for file_path in dist_dir.rglob('*'):
        if file_path.is_file() and not file_path.name.startswith('.'):
            arcname = file_path.relative_to(dist_dir)
            zipf.write(file_path, arcname)
print(f"Created {zipname}")
PYTHON_SCRIPT
else
    echo ""
    echo "⚠️  Neither 'zip' nor 'python3' command found!"
    echo ""
    echo "📝 Manual packaging instructions:"
    echo "   1. Navigate to the dist/ folder"
    echo "   2. Select all files and folders inside dist/"
    echo "   3. Right-click and select 'Compress' or 'Create Archive'"
    echo "   4. Name it: tab-retitle-plus-v${VERSION}.zip"
    echo "   5. Move the ZIP to the project root"
    echo ""
    exit 1
fi

if [ -f "${ZIPNAME}" ]; then
    SIZE=$(du -h "${ZIPNAME}" | cut -f1)
    echo ""
    echo "✅ Package created successfully!"
    echo "   File: ${ZIPNAME}"
    echo "   Size: ${SIZE}"
    echo ""
    echo "📝 Next steps:"
    echo "   1. Test the extension by loading ${PWD}/dist in Chrome"
    echo "   2. Upload ${ZIPNAME} to Chrome Web Store Developer Dashboard"
    echo "   3. See RELEASE-CHECKLIST.md for complete submission guide"
else
    echo "❌ Failed to create ZIP file"
    exit 1
fi
