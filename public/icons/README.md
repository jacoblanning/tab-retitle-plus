# Extension Icons

## IMPORTANT: Icons Required

You need to create three PNG icon files before loading the extension:

- `icon16.png` (16x16 pixels) - Used in the browser toolbar
- `icon48.png` (48x48 pixels) - Used in the extension management page
- `icon128.png` (128x128 pixels) - Used in the Chrome Web Store

**Note:** The extension will work without icons, but Chrome will show warnings and use a default icon.

## Quick Creation Options

### Option 1: ImageMagick (if installed)

```bash
cd public/icons
convert -size 128x128 xc:#2563eb -gravity center -pointsize 80 -fill white -annotate +0+0 "RT" icon128.png
convert -size 48x48 xc:#2563eb -gravity center -pointsize 30 -fill white -annotate +0+0 "RT" icon48.png
convert -size 16x16 xc:#2563eb -gravity center -pointsize 10 -fill white -annotate +0+0 "RT" icon16.png
```

### Option 2: Python with Pillow

```bash
pip install Pillow
python3 -c "
from PIL import Image, ImageDraw
for size in [16, 48, 128]:
    img = Image.new('RGB', (size, size), color='#2563eb')
    draw = ImageDraw.Draw(img)
    img.save(f'icon{size}.png')
"
```

### Option 3: Online Tool

Use a free online icon generator like:
- https://www.favicon-generator.org/
- https://realfavicongenerator.net/

### Option 4: Graphic Design Tool

Use any image editor (GIMP, Photoshop, Figma, Canva, etc.) to create custom icons.

## Icon Guidelines

- Use a simple, recognizable design
- Ensure good contrast for visibility
- Use the same design at all sizes (just scaled)
- PNG format with transparency recommended
- Main color: #2563eb (blue) to match the extension theme
