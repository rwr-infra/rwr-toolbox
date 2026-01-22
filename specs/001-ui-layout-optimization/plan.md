# Implementation Plan: UI Layout and Performance Optimization (Iteration 3)

**Branch**: `001-ui-layout-optimization` | **Date**: 2026-01-22 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-ui-layout-optimization/spec.md` + Research (Iteration 3)

## Summary

Optimize UI layout consistency and achieve "Zero-Blockage" performance. Heavy data processing and IPC communication will be moved to background threads to ensure sidebar navigation and animations are never interrupted.

Technical approach:

1.  **Tauri Channels**: Switch from single-payload IPC to streaming data from Rust.
2.  **Web Workers**: Offload data transformation (mapping XML to TS models) to a background worker.
3.  **Signal Batching**: Update Angular Signals in chunks to minimize change detection cycles.
4.  **Abortable Scans**: Cancel background work immediately upon route change.

## Technical Context

**Language/Version**: TypeScript 5.8.3 (Angular 20.3.15), Rust Edition 2021 (Tauri 2.x)
**Primary Dependencies**: Web Workers, Tauri IPC Channels, Angular Animations, DaisyUI v5
**Storage**: Tauri plugin-store, local XML game files
**Testing**: Chrome DevTools Performance Profiler (Target: No tasks > 50ms during scan)
**Target Platform**: Desktop (Windows/Linux/macOS)
**Project Type**: Web Application
**Performance Goals**: <100ms sidebar response (Zero Blockage), 60fps animations, Progressive list rendering
**Constraints**: 800x600 minimum usable resolution, Signal-based state management

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

| Principle                           | Status  | Notes                                                           |
| ----------------------------------- | ------- | --------------------------------------------------------------- |
| I. Desktop-First UI Design          | ✅ PASS | Progressive loading helps lower-end hardware remain responsive. |
| II. Internationalization (i18n)     | ✅ PASS | Error messages from worker will use i18n keys.                  |
| III. Theme Adaptability             | ✅ PASS | Skeletons already implemented.                                  |
| IV. Signal-Based State Management   | ✅ PASS | Signals updated in batches via immutability.                    |
| V. Documentation-Driven Development | ✅ PASS | Aligned with performance goals in specification.                |
| VI. Icon Management                 | ✅ PASS | Progressive icon resolution strategy.                           |
| VII. Tailwind-First Styling         | ✅ PASS | No changes to styling approach.                                 |

**Result**: All gates passed.

## Project Structure

### Documentation (this feature)

```text
specs/001-ui-layout-optimization/
├── plan.md              # This file
├── research.md          # Streaming & Worker strategy
├── data-model.md        # Worker message types & Channel events
├── quickstart.md        # Profiling instructions
└── tasks.md             # Implementation tasks
```

### Source Code (repository root)

```text
src/app/
├── core/
│   └── workers/
│       └── data-processor.worker.ts # NEW: Web Worker for mapping/filtering
├── features/
│   ├── data/
│   │   ├── weapons/
│   │   │   └── services/weapon.service.ts # Channel + Worker integration
│   │   └── items/
│   │       └── services/item.service.ts   # Channel + Worker integration
src-tauri/
└── src/
    └── commands/
        └── scanner.rs # Update to use Channel<T>
```

**Structure Decision**: Move transformation logic out of Services into a dedicated Web Worker. Use Tauri V2 Channels for progressive data flow.

## Complexity Tracking

> **Not applicable** - No constitution violations.
