# Implementation Plan: Pagination Previous/Next Buttons

**Branch**: `013-pagination-prev-next` | **Date**: 2026-02-12 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/013-pagination-prev-next/spec.md`

## Summary

Add Previous/Next page navigation buttons to the pagination controls in both weapons and items table pages. The buttons will use Lucide icons (chevron-left/chevron-right) positioned at the edges of the pagination group, with disabled states when navigation is not possible (first/last page).

## Technical Context

**Language/Version**: TypeScript 5.8.3 (Angular 20.3.15 frontend), Rust edition 2021 (Tauri 2.x backend)
**Primary Dependencies**: Angular v20.3.15, Tauri 2.x, Transloco 8.x (i18n), DaisyUI v5.5.14, Tailwind CSS v4.1.18, Lucide Angular v0.562.0
**Storage**: N/A (client-side state in Signals)
**Testing**: Manual verification
**Target Platform**: Desktop (Tauri), supports 800×600 to 3840×2160 resolutions
**Project Type**: Desktop web application
**Performance Goals**: Instant UI response, no page reload
**Constraints**: Desktop-first UI, 800×600 minimum resolution support
**Scale/Scope**: Small change affecting 2 component templates

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Desktop-First UI Design | ✓ PASS | Buttons will be sized appropriately for desktop (btn-xs), work at all resolutions |
| II. Internationalization (i18n) | ✓ PASS | Button labels will use transloco keys; icons are universal |
| III. Theme Adaptability | ✓ PASS | Using DaisyUI btn classes, automatic theme support |
| IV. Signal-Based State Management | ✓ PASS | No state changes needed, uses existing pagination signals |
| V. Documentation-Driven Development | ✓ PASS | Following speckit workflow |
| VI. Icon Management | ✓ PASS | Using Lucide icons (chevron-left, chevron-right) via centralized registry |
| VII. Tailwind-First Styling | ✓ PASS | Using DaisyUI btn classes and Tailwind utilities |

**Result**: All gates pass. No violations.

## Project Structure

### Documentation (this feature)

```text
specs/013-pagination-prev-next/
├── plan.md              # This file
├── spec.md              # Feature specification
├── research.md          # Phase 0 output
├── quickstart.md        # Phase 1 output
└── checklists/
    └── requirements.md  # Quality checklist
```

### Source Code (repository root)

```text
src/
├── app/
│   ├── features/
│   │   └── data/
│   │       ├── weapons/
│   │       │   └── weapons.component.html  # Add prev/next buttons
│   │       └── items/
│   │           └── items.component.html    # Add prev/next buttons
│   └── shared/
│       └── icons/
│           └── index.ts                    # Verify chevron-left/right icons
└── assets/
    └── i18n/
        ├── en.json                         # Add i18n keys
        └── zh.json                         # Add i18n keys
```

**Structure Decision**: Frontend-only change affecting HTML templates and i18n files. No backend changes required.

## Complexity Tracking

> No constitution violations. No complexity justification needed.
