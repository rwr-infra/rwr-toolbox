# Research: Table and Drawer UX Fixes

**Feature**: 012-table-drawer-ux-fixes
**Date**: 2026-02-12

## Issue 1: Image Skeleton Visibility

### Decision
Add an animated loading spinner overlay on top of the skeleton background, plus ensure the skeleton animation is visible.

### Rationale
- DaisyUI skeleton class provides a subtle shimmer effect that may be too faint
- Adding a centered spinner icon makes the loading state unmistakable
- Users can immediately distinguish loading from "no image" state

### Technical Approach
1. Keep existing `[class.skeleton]` on image placeholder container
2. Add a loading spinner icon (`<i-lucide name="loader-2" class="animate-spin">`) when loading
3. Spinner is centered over the placeholder with absolute positioning
4. When loading completes, spinner disappears and image shows (or error icon shows)

### Alternatives Considered
| Alternative | Rejected Because |
|-------------|------------------|
| Thicker skeleton bars | Still subtle, doesn't clearly indicate "loading" vs "empty" |
| Progress bar | Not appropriate for single image load |
| Text "Loading..." | Requires i18n, takes more space |

---

## Issue 2: 4K Column Width Bug

### Decision
Add explicit `min-width` equal to `width` on both header and body tables, and ensure colgroup widths are applied consistently.

### Rationale
- Virtual scroll creates a wrapper with `display: inline-block` and `width: max-content`
- On high-DPI screens, sub-pixel rendering can cause the body table to calculate narrower than header
- Setting `min-width` equal to `width` prevents any shrinkage

### Technical Approach
1. In the template, both tables already use `[style.width.px]` and `[style.minWidth.px]`
2. Verify the virtual scroll content wrapper also respects the width
3. Add explicit width constraint to `.cdk-virtual-scroll-content-wrapper` in SCSS

### Root Cause Analysis
Current SCSS:
```scss
::ng-deep .cdk-virtual-scroll-content-wrapper {
    display: inline-block;
    width: max-content;
}
```

Problem: `width: max-content` allows browser to recalculate width, which may differ on high-DPI.

Fix: Add `min-width: 100%` or ensure the inner table sets the width explicitly.

### Alternatives Considered
| Alternative | Rejected Because |
|-------------|------------------|
| Change table-layout to auto | Breaks fixed column widths |
| Use CSS Grid instead of table | Major refactor, unnecessary |
| JavaScript width sync | Overkill, CSS should handle this |

---

## Issue 3: Drawer Click-Outside Behavior

### Decision
Add an overlay element behind the drawer that intercepts clicks and closes the drawer, while ensuring table row clicks still switch the drawer content.

### Rationale
- Standard UX pattern: clicking overlay closes modal/drawer
- Need to differentiate between "click on overlay" vs "click on table row"
- Table row click should update drawer content without close animation

### Technical Approach
1. Add a fixed-position overlay div when drawer is open:
   ```html
   @if (isDetailPanelOpen()) {
     <div class="fixed inset-0 bg-black/30 z-50" (click)="closeDetailPanel()"></div>
   }
   ```
2. The overlay is at z-index 50, drawer at z-index 100
3. Table row click handler (`selectWeapon`) already sets new content
4. Need to ensure row click doesn't propagate to overlay

### Event Flow
1. User clicks overlay → `closeDetailPanel()` called → drawer closes
2. User clicks table row → `selectWeapon(weapon)` called → drawer content updates
3. Event propagation stopped on row click to prevent overlay trigger

### Alternatives Considered
| Alternative | Rejected Because |
|-------------|------------------|
| Click-outside directive | More complex, overlay approach is simpler |
| Close on ESC key only | Doesn't match expected UX |
| Always close on any click | Loses ability to quickly switch items |

---

## Implementation Checklist

### Weapons Component
- [ ] Add loading spinner to image placeholder
- [ ] Add overlay element for drawer
- [ ] Verify column width on high-DPI
- [ ] Update SCSS for wrapper width constraint

### Items Component
- [ ] Apply same changes as weapons component
- [ ] Verify consistent behavior

## Dependencies
- No new dependencies required
- Uses existing Lucide icons (loader-2)
- Uses existing Tailwind utilities
