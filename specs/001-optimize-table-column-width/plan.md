# Implementation Plan: Optimize Table Column Width for Long Keys

**Branch**: `001-optimize-table-column-width` | **Date**: 2026-02-05 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/001-optimize-table-column-width/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for execution workflow.

## Summary

This feature addresses the issue where long keys in weapons and items tables squeeze other columns, making them difficult to read. The solution involves implementing column width constraints with truncation and tooltip functionality. Key columns will have a maximum width constraint and will truncate text with ellipsis when content exceeds the column width. Users can view the complete key by hovering over truncated cells, which will display the full value in a tooltip. The implementation preserves existing virtual scrolling performance and column toggle functionality while ensuring all columns remain readable.

## Technical Context

**Language/Version**: TypeScript 5.8.3 (Angular v20.3.15)
**Primary Dependencies**: Angular CDK ScrollingModule, DaisyUI v5.5.14, Tailwind CSS v4.1.18, Lucide Angular v0.562.0
**Storage**: Tauri plugin-store (settings.json)
**Testing**: Angular TestBed, Jasmine/Karma
**Target Platform**: Desktop (Tauri 2.x) - Windows/macOS/Linux
**Project Type**: single (Angular frontend + Tauri backend)
**Performance Goals**: 60fps smooth scrolling with 1000+ items, <16ms render time per row
**Constraints**: Minimum resolution 800×600, offline-capable, no horizontal scrolling for main content area
**Scale/Scope**: 2 data features (weapons, items), ~2000 total items across both tables

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

### I. Desktop-First UI Design (NON-NEGOTIABLE)

✅ **Compliant**: Fixed table layout with explicit column widths ensures 800×600 usability. No horizontal scrolling introduced.

### II. Internationalization (i18n) (NON-NEGOTIABLE)

✅ **Compliant**: All new UI text will use Transloco keys. Tooltip labels and truncation indicators will be i18n-compliant.

### III. Theme Adaptability (NON-NEGOTIABLE)

✅ **Compliant**: Styling will use Tailwind utilities and DaisyUI CSS variables for automatic theme adaptation.

### IV. Signal-Based State Management (NON-NEGOTIABLE)

✅ **Compliant**: Column visibility and table layout already use signals. No state management changes needed.

### V. Documentation-Driven Development (NON-NEGOTIABLE)

✅ **Compliant**: Implementation will align with existing `docs/UI.md` and `docs/CONSTRUCTION.md` guidance.

### VI. Icon Management (NON-NEGOTIABLE)

✅ **Compliant**: No new icons required. If tooltip icons needed, will use Lucide via centralized registry.

### VII. Tailwind-First Styling (NON-NEGOTIABLE)

✅ **Compliant**: All styling will use Tailwind utility classes. Custom CSS only for tooltip animations if necessary.

## Project Structure

### Documentation (this feature)

```text
specs/001-optimize-table-column-width/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
src/
├── app/
│   ├── features/
│   │   ├── data/
│   │   │   ├── weapons/
│   │   │   │   ├── weapons.component.ts       # Update column width logic
│   │   │   │   ├── weapons.component.html     # Add truncation styles
│   │   │   │   └── weapon-columns.ts         # Keep unchanged
│   │   │   └── items/
│   │   │       ├── items.component.ts          # Update column width logic
│   │   │       ├── items.component.html        # Add truncation styles
│   │   │       └── item-columns.ts            # Keep unchanged
│   │   └── shared/
│   │       ├── services/
│   │       │   └── scrolling-mode.service.ts   # No changes
│   └── shared/
│       ├── adapters/
│       │   └── virtual-scroll.adapter.ts      # No changes
│       └── icons/
│           └── index.ts                       # No new icons needed
└── assets/
    └── i18n/
        ├── en.json                           # Add tooltip keys
        └── zh.json                           # Add tooltip keys
```

**Structure Decision**: Angular single-project structure. Modifications to existing weapons and items components only. New i18n keys for tooltips. No new services or adapters required.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No constitution violations identified. No complexity tracking required.
