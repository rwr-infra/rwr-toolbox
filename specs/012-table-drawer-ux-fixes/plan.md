# Implementation Plan: Table and Drawer UX Fixes

**Branch**: `012-table-drawer-ux-fixes` | **Date**: 2026-02-12 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/012-table-drawer-ux-fixes/spec.md`

## Summary

Fix three UX issues in weapons and items table pages: (1) improve image loading skeleton visibility so users can distinguish loading from failed states, (2) fix File Path column width on 4K/high-DPI screens where content appears truncated, (3) implement drawer click-outside-to-close with smart item switching behavior.

## Technical Context

**Language/Version**: TypeScript 5.8.3 (Angular 20.3.15 frontend), Rust edition 2021 (Tauri 2.x backend)
**Primary Dependencies**: Angular v20.3.15, Angular CDK v20.2.14 (virtual scrolling), Tailwind CSS v4.1.18, DaisyUI v5.5.14, Lucide Angular v0.562.0
**Storage**: Tauri plugin-store (settings.json)
**Testing**: Jest via Angular CLI
**Target Platform**: Desktop (Windows/macOS/Linux via Tauri 2.x)
**Project Type**: Desktop application with Angular frontend
**Performance Goals**: 60fps scrolling, instant drawer transitions
**Constraints**: Must work on 4K (3840x2160) and 800x600 minimum, DaisyUI theme compatibility
**Scale/Scope**: Two component files (weapons/items) with shared patterns

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Desktop-First UI Design | PASS | Fixes improve 4K support, no minimum resolution regression |
| II. Internationalization (i18n) | PASS | No new user-facing text, existing patterns preserved |
| III. Theme Adaptability | PASS | All fixes use DaisyUI CSS variables |
| IV. Signal-Based State Management | PASS | Uses existing signals pattern |
| V. Documentation-Driven Development | PASS | This plan documents approach |
| VI. Icon Management | PASS | No new icons required |
| VII. Tailwind-First Styling | PASS | Styling uses Tailwind utilities |

**Gate Result**: PASS - No constitution violations

## Project Structure

### Documentation (this feature)

```text
specs/012-table-drawer-ux-fixes/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

```text
src/app/features/data/
├── weapons/
│   ├── weapons.component.ts      # Modify: drawer click-outside, image skeleton
│   ├── weapons.component.html    # Modify: template updates
│   └── weapons.component.scss    # Modify: skeleton animation, column width fix
└── items/
    ├── items.component.ts        # Modify: same as weapons
    ├── items.component.html      # Modify: same as weapons
    └── items.component.scss      # Modify: same as weapons

src/assets/i18n/
├── en.json                       # No changes needed
└── zh.json                       # No changes needed
```

**Structure Decision**: Modify existing weapons and items components in-place. No new files required.

## Complexity Tracking

> No constitution violations - complexity tracking not needed.

## Implementation Approach

### Issue 1: Image Skeleton Visibility

**Current State**: Skeleton class applied via `[class.skeleton]` but DaisyUI skeleton effect may be too subtle.

**Approach**:
- Add more prominent animated loading state with pulse effect
- Add explicit loading spinner icon overlay during load
- Ensure distinct visual difference between loading/loaded/error states

### Issue 2: 4K Column Width Bug

**Current State**: Table uses `tableWidthPx` computed signal with fixed column widths. Virtual scroll content wrapper uses `display: inline-block; width: max-content`.

**Root Cause Hypothesis**: On high-DPI displays, the inline-block width calculation may not account for sub-pixel rendering differences, causing content table to render narrower than header table.

**Approach**:
- Ensure both header and body tables use identical width calculation
- Add explicit `min-width` matching `width` to prevent shrinkage
- Verify `colgroup` widths are applied consistently

### Issue 3: Drawer Click-Outside Behavior

**Current State**: Drawer is a fixed positioned side panel with no overlay or click-outside handling.

**Approach**:
- Add semi-transparent overlay behind drawer
- Implement click-outside handler on overlay that closes drawer
- Ensure table row clicks during drawer open state switch content instead of closing

## Key Files to Modify

| File | Changes |
|------|---------|
| `weapons.component.html` | Add overlay element, enhance image placeholder |
| `weapons.component.ts` | Add click-outside logic, handle row click with open drawer |
| `weapons.component.scss` | Add skeleton animation, overlay styles |
| `items.component.html` | Same as weapons |
| `items.component.ts` | Same as weapons |
| `items.component.scss` | Same as weapons |
