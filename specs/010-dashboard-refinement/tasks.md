# Tasks: Dashboard & Architectural Refinement

**Feature**: Dashboard & Architectural Refinement
**Branch**: `010-dashboard-refinement`
**Status**: Pending

## Phase 1: Setup

- [x] T001 Verify project structure and ensure all required services (Dashboard, Directory, Ping) are available

## Phase 2: Foundational (Backend)

- [x] T002 [P] Implement `check_path_exists` command in `src-tauri/src/lib.rs` to verify physical directory existence

## Phase 3: Accurate Dashboard Stats [US1]

**Goal**: Provide real-time and accurate statistics on the dashboard.
**Independent Test**: Dashboard displays total mod count from all directories and actual API latency in ms.

- [x] T003 [P] [US1] Update `DashboardStats` and `SystemStatus` models in `src/app/features/dashboard/services/dashboard.service.ts`
- [x] T004 [US1] Implement mod counting logic by aggregating `packageCount` from `DirectoryService` in `src/app/features/dashboard/services/dashboard.service.ts`
- [x] T005 [US1] Implement 10s interval API ping to `rwr.runningwithrifles.com` in `src/app/features/dashboard/services/dashboard.service.ts`
- [x] T006 [P] [US1] Update Dashboard component to bind new stat signals in `src/app/features/dashboard/dashboard.component.ts`
- [x] T007 [P] [US1] Update Dashboard template to display mod count and ping value in `src/app/features/dashboard/dashboard.component.html`

## Phase 4: Robust Path Guarding [US2]

**Goal**: Prevent access to data features when no valid game paths are available.
**Independent Test**: Clearing directories in Settings causes a redirect from Weapons/Items back to Settings.

- [x] T008 [US2] Strengthen `pathDetectedGuard` to check both Signal state and physical path existence in `src/app/shared/guards/path-detected.guard.ts`
- [x] T009 [US2] Verify guard redirection logic and ensure it provides a smooth UX during setup

## Phase 5: Maintenance [US3]

**Goal**: Keep project status documentation up to date.
**Independent Test**: `docs/STATUS.md` reflects all completed features.

- [x] T010 [US3] Update `docs/STATUS.md` with completion status for Dashboard sync and Mod refinements

## Phase 6: Polish & Cross-Cutting Concerns

- [x] T011 [P] Ensure Transloco keys are added for any new status labels in `src/assets/i18n/en.json` and `zh.json`
- [x] T012 Verify 800x600 resolution compliance for modified dashboard elements

## Dependencies

- Phase 2 (Backend) is required for Phase 4 (Guards).
- Phase 3 (Dashboard logic) depends on models from T003.

## Parallel Execution

**Story US1 & Foundational**:

- T002 (Backend Command)
- T003, T006, T007 (Dashboard Model and UI updates)

## Implementation Strategy

1. **Backend & Model**: Start with the Tauri command and TypeScript model updates to provide the data contract.
2. **Dashboard Refinement**: Implement the counting and pinging logic.
3. **Security**: Strengthen the routing guard.
4. **Documentation**: Finalize by updating the project status.
