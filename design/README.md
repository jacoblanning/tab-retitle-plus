# Browser Tools visual foundations

Retitle+ shares its foundation tokens, geometry, type scale, spacing, and dark
mode conventions with Tab Buoy while retaining its own indigo product signal.
The UI consumes these values through `src/styles/globals.css`.

## Icon sources

- `design/icons/retitle-plus/master.svg` is the canonical outlined mark for
  larger extension surfaces.
- `design/icons/retitle-plus/toolbar.svg` is the filled optical-size variant.
- `npm run assets` generates 16px and Retina 32px toolbar PNGs from the toolbar
  SVG, plus 48px and 128px PNGs from the master.
- Generated PNGs in `public/icons/` are committed consumers, not source files.

Keep behavior-specific UI in the product repository. Shared foundations should
align the family without making Retitle+ and Tab Buoy look functionally
interchangeable.
