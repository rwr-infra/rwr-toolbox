# Implementation Plan: Dashboard & Architectural Refinement

**Branch**: `010-dashboard-refinement` | **Date**: 2026-01-21 | **Spec**: `/specs/010-dashboard-refinement/spec.md`

## Summary

Strengthening the core dashboard experience by providing real-time system stats (API latency, total mod packages) and enforcing navigation security through a robust path-detection guard backed by the Tauri filesystem layer.

## Technical Context

**Language/Version**: TypeScript 5.8.3, Angular v20.3.15, Rust (Tauri 2.x)  
**Primary Dependencies**: lucide-angular, @jsverse/transloco, tauri-apps/api  
**Storage**: Tauri plugin-store (settings.json)  
**Testing**: Manual UI verification and Guard redirection tests  
**Target Platform**: Desktop (Windows/macOS/Linux)  
**Project Type**: Desktop Application  
**Performance Goals**: Dashboard ping refresh < 10s, Guard execution < 50ms  
**Constraints**: 800x600 resolution compatibility  
**Scale/Scope**: Dashboard feature and Routing guards

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

1. **Desktop-First**: YES - Stats grid is optimized for 800x600.
2. **i18n**: YES - Using Transloco for all dashboard labels.
3. **Theme**: YES - Stats cards use DaisyUI variable colors.
4. **Signals**: YES - Aggregated stats use Signal-based state.
5. **Documentation**: YES - specs/010-dashboard-refinement/
6. **Icons**: YES - registered in APP_ICONS.
7. **Tailwind**: YES - Standard utility-first approach.

## Project Structure

### Documentation (this feature)

```text
specs/010-dashboard-refinement/
├── plan.md              # This file
├── research.md          # Implementation decisions
├── data-model.md        # Stats entity
├── quickstart.md        # Test scenarios
└── contracts/           # Tauri command definitions
```

### Source Code

```text
src-tauri/src/
├── main.rs              # Register check_path_exists command
src/app/
├── core/services/       # Add Host detection logic
├── shared/guards/       # Strengthen path-detected.guard
└── features/dashboard/  # Implement stat aggregation
```

**Structure Decision**: Refactoring `DashboardService` to aggregate data from `DirectoryService` and `PingService`.

## Complexity Tracking

| Violation                 | Why Needed                 | Simpler Alternative Rejected Because                             |
| ------------------------- | -------------------------- | ---------------------------------------------------------------- |
| Periodic Network Activity | Real-time latency tracking | Manual refresh button is already present but doesn't feel "live" |
