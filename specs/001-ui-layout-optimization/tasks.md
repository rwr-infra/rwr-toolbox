# Tasks: UI Layout and Performance Optimization (Iteration 3)

## Feature: UI Layout and Performance Optimization

**Branch**: `001-ui-layout-optimization`
**Status**: Revised Task List for Zero-Blockage Architecture

## Phase 1: Setup

- [x] T001 Initialize Web Worker scaffolding in `src/app/core/workers/data-processor.worker.ts`
- [x] T002 Register data processor worker in Angular environment configuration

## Phase 2: Foundational

- [x] T003 Define `ScanEvent` Rust serializable enum with tagging in `src-tauri/src/main.rs` (or dedicated commands module)
- [x] T004 Update Rust scanner commands to support `tauri::ipc::Channel` for streaming in `src-tauri/src/main.rs`

## Phase 3: [US6] Non-Blocking Loading & Infrastructure

**Goal**: Offload all heavy data parsing and mapping to a background thread to ensure main-thread responsiveness.
**Independent Test**: Start a data scan and verify sidebar navigation remains instant (<100ms response).

- [x] T005 [US6] Implement XML-to-Model mapping and attribute parsing logic in `src/app/core/workers/data-processor.worker.ts`
- [x] T006 [P] [US6] Refactor WeaponService to invoke Tauri commands via Channels and delegate results to worker in `src/app/features/data/weapons/services/weapon.service.ts`
- [x] T007 [P] [US6] Refactor ItemService to invoke Tauri commands via Channels and delegate results to worker in `src/app/features/data/items/services/item.service.ts`
- [x] T008 [US6] Implement "Buffer & Flush" batching strategy for Signal updates (e.g., update every 100 items) in `src/app/features/data/weapons/services/weapon.service.ts`
- [x] T009 [US6] Implement "Buffer & Flush" batching strategy for Signal updates in `src/app/features/data/items/services/item.service.ts`
- [x] T010 [US6] Implement scan cancellation/abort logic triggered by route changes in `src/app/core/workers/data-processor.worker.ts`
- [x] T011 [P] [US6] Add skeleton loaders (DaisyUI `skeleton`) for async icon cells in `src/app/features/data/weapons/weapons.component.html`
- [x] T012 [P] [US6] Add skeleton loaders for async icon cells in `src/app/features/data/items/items.component.html`

## Phase 4: [US2] Advanced Search Performance

**Goal**: Fix lag during panel expansion using GPU acceleration and efficient state management.
**Independent Test**: Toggle Advanced Search panel; animation must be 60fps with zero main-thread blockage.

- [x] T013 [US2] Apply GPU acceleration CSS (`will-change`, `translateZ`) to collapse panels via `:host` selector in `src/app/features/data/weapons/weapons.component.scss`
- [x] T014 [US2] Apply GPU acceleration CSS to collapse panels in `src/app/features/data/items/items.component.scss`

## Phase 5: [US1] Navigation Tab Spacing

**Goal**: Reduce excessive whitespace between tabs and content.
**Independent Test**: Navigate to Data section and verify spacing visually (~0.5-1rem).

- [x] T015 [US1] Reduce vertical margin between tab container and content area in `src/app/features/data/local/local.component.html`

## Phase 6: [US3] Pagination Visibility

**Goal**: Ensure controls stay within viewport at 800x600 resolution.
**Independent Test**: Load Weapons table on 800x600; pagination must be visible without scrolling the main page.

- [x] T016 [US3] Update table container `max-height` and overflow settings for 800x600 compliance in `src/app/features/data/weapons/weapons.component.html`
- [x] T017 [US3] Update table container `max-height` and overflow settings for 800x600 compliance in `src/app/features/data/items/items.component.html`

## Phase 7: [US4] Layout Mode Toggle Icon

**Goal**: Use intuitive icons from lucide-angular.
**Independent Test**: Verify icons change correctly when toggling (List vs Grid).

- [x] T018 [US4] Update view mode toggle button to use `layout-grid` and `layout-list` icons in `src/app/features/data/weapons/weapons.component.html`
- [x] T019 [US4] Update view mode toggle button in `src/app/features/data/items/items.component.html`

## Phase 8: [US5] Players Search Layout

**Goal**: Standardize vertical stacking for search controls.
**Independent Test**: Verify Players search label is above the input field, matching other sections.

- [x] T020 [US5] Restructure search filter group to use responsive vertical grid in `src/app/features/players/players.component.html`

## Phase 9: Polish & Validation

- [x] T021 Run TypeScript check: `pnpm tsc -p tsconfig.app.json --noEmit`
- [x] T022 Format code: `pnpm format:all`
- [x] T023 Final visual verification of all layout fixes on 800x600 resolution
- [x] T024 Performance profile verification: Ensure no "Long Tasks" (>50ms) during data scanning

## Dependencies

1. Phase 1 & 2 are prerequisites for Phase 3 (Worker infrastructure).
2. Phase 3 (Streaming/Worker) is highly recommended before polishing US2/US6.
3. Layout tasks (Phases 5-8) are independent and can be done in parallel.

## Parallel Execution Examples

- T006, T007 (Refactoring services to use Worker)
- T011, T012 (Skeleton loader UI updates)
- T016, T017 (Pagination height adjustments)

## Implementation Strategy

1. **Infrastructure First**: Implement the Web Worker and Tauri Channel streaming to solve the root cause of UI blockage.
2. **Batching & Skeletons**: Add the progressive loading UX (batches + skeletons) to improve perceived performance.
3. **Layout Polish**: Finish with the visual spacing, icon, and 800x600 resolution fixes.
