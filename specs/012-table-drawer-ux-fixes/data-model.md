# Data Model: Table and Drawer UX Fixes

**Feature**: 012-table-drawer-ux-fixes
**Date**: 2026-02-12

## Overview

This feature is a UI bug fix with no new data models. All changes are to existing component state and templates.

## Existing State Affected

### WeaponsComponent / ItemsComponent

| Signal | Type | Usage |
|--------|------|-------|
| `loadingIcons` | `Signal<Set<string>>` | Tracks which item icons are currently loading |
| `isDetailPanelOpen` | `Signal<boolean>` | Controls drawer visibility |
| `selectedWeapon` / `selectedItem` | `Signal<Weapon \| Item \| null>` | Currently selected item for drawer |

## State Transitions

### Image Loading States

```
[Initial] → [Loading] → [Loaded] or [Error]
     ↓           ↓            ↓
  (empty)   (spinner)    (image) or (error-icon)
```

### Drawer States

```
[Closed] → [Open with Item A] → [Open with Item B] → [Closed]
                ↓                      ↓
         (show overlay)         (overlay stays, content changes)
```

## No New Entities

This feature modifies existing component behavior without introducing new data structures.

## Template Binding Changes

### Image Placeholder

**Before:**
```html
<div class="w-10 h-10 bg-base-200/50 rounded ..." [class.skeleton]="loadingIcons().has(key)">
  @if (getIconUrl(item)) {
    <img ... />
  }
</div>
```

**After:**
```html
<div class="w-10 h-10 bg-base-200/50 rounded relative ..." [class.skeleton]="loadingIcons().has(key)">
  @if (loadingIcons().has(key)) {
    <i-lucide name="loader-2" class="absolute inset-0 m-auto h-4 w-4 animate-spin opacity-50"></i-lucide>
  }
  @if (getIconUrl(item)) {
    <img ... />
  }
</div>
```

### Drawer Overlay

**Added:**
```html
@if (isDetailPanelOpen()) {
  <div class="fixed inset-0 bg-black/30 z-50" (click)="closeDetailPanel()"></div>
}

@if (isDetailPanelOpen() && selectedWeapon()) {
  <aside class="fixed ... z-[100]" ...>
    ...
  </aside>
}
```

## No Database/Storage Changes

All changes are in-memory component state. No Tauri plugin-store or localStorage changes required.
