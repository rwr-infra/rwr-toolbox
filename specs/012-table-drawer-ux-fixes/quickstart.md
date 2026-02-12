# Quickstart: Table and Drawer UX Fixes

**Feature**: 012-table-drawer-ux-fixes
**Date**: 2026-02-12

## Summary

Fix three UX issues in weapons and items table pages:
1. **Image skeleton visibility** - Add loading spinner overlay
2. **4K column width** - Fix table width calculation for high-DPI
3. **Drawer click-outside** - Add overlay for close behavior

## Files to Modify

| File | Purpose |
|------|---------|
| `src/app/features/data/weapons/weapons.component.html` | Add overlay, enhance image placeholder |
| `src/app/features/data/weapons/weapons.component.ts` | No logic changes needed |
| `src/app/features/data/weapons/weapons.component.scss` | Add wrapper width constraint |
| `src/app/features/data/items/items.component.html` | Same changes as weapons |
| `src/app/features/data/items/items.component.scss` | Same changes as weapons |

## Implementation Steps

### Step 1: Image Loading Spinner

In both `weapons.component.html` and `items.component.html`, modify the image placeholder:

```html
<!-- Before -->
<div class="w-10 h-10 bg-base-200/50 rounded flex items-center justify-center p-1"
     [class.skeleton]="loadingIcons().has(weapon.key || '')">

<!-- After -->
<div class="w-10 h-10 bg-base-200/50 rounded flex items-center justify-center p-1 relative"
     [class.skeleton]="loadingIcons().has(weapon.key || '')">
    @if (loadingIcons().has(weapon.key || '')) {
        <i-lucide name="loader-2" class="absolute h-4 w-4 animate-spin text-base-content/50"></i-lucide>
    }
    <!-- existing image/error handling -->
</div>
```

### Step 2: Drawer Overlay

Add overlay before the drawer in both templates:

```html
<!-- Drawer Overlay -->
@if (isDetailPanelOpen()) {
    <div
        class="fixed inset-0 bg-black/30 z-50"
        (click)="closeDetailPanel()"
    ></div>
}

<!-- Detail Side Panel -->
@if (isDetailPanelOpen() && selectedWeapon()) {
    <aside @slideIn class="fixed ... z-[100]" ...>
```

### Step 3: 4K Column Width Fix

Update both `.scss` files:

```scss
::ng-deep .cdk-virtual-scroll-content-wrapper {
    display: inline-block;
    width: max-content;
    min-width: 100%; // Add this line
}
```

## Verification

1. **Image loading**: Open weapons/items page, observe spinner in image placeholders before images load
2. **4K column width**: On 4K display, verify File Path column content matches header width
3. **Drawer overlay**: Open drawer, click outside → closes. Click another row → drawer switches content.

## No Tests Required

This is a visual/UX fix with no business logic changes. Manual verification sufficient.
