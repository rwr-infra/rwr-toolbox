---
description: 'Task list for optimizing menu page styles in Settings, Weapons, and Items features.'
---

# Tasks: Optimize Menu Page Styles

**Input**: Design documents from `/specs/001-ui-style-optimization/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Tests are NOT explicitly requested in the specification, so none are generated for this feature.

**Organization**: Tasks are grouped by user story (Settings, Weapons, Items) to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Initial verification and preparation.

- [x] T001 [P] Verify current 800x600 resolution behavior in `src/app/app.component.html`
- [x] T002 [P] Verify Lucide icon availability in `src/app/shared/icons/index.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared UI patterns or configuration needed for all stories.

- [x] T003 Define `Control Area` shared Tailwind classes in `src/styles.css` if necessary for reuse

---

## Phase 3: User Story 1 - Unified Settings Experience (Priority: P1) 🎯 MVP

**Goal**: Clean and organized settings page with consistent card layouts and button spacing.

**Independent Test**: Navigate to Settings and verify that Language, Theme, and Directory sections are in consistent cards and buttons have gaps.

### Implementation for User Story 1

- [x] T004 [US1] Update Language settings card layout in `src/app/features/settings/settings.component.html`
- [x] T005 [US1] Update Theme settings card layout in `src/app/features/settings/settings.component.html`
- [x] T006 [US1] Standardize Directory Management card layout and toolbar in `src/app/features/settings/settings.component.html`
- [x] T007 [US1] Apply `gap-2` to Directory action buttons in `src/app/features/settings/settings.component.html`
- [x] T008 [US1] Ensure responsive wrapping for all settings cards in `src/app/features/settings/settings.component.html`

**Checkpoint**: Settings page should now be fully optimized and visually consistent.

---

## Phase 4: User Story 2 - Efficient Weapons Data Querying (Priority: P1)

**Goal**: Group Weapons page query controls (Search, Filters, Actions) into a unified toolbar area.

**Independent Test**: Verify that all Weapons search and filter controls are contained within a single `bg-base-200` container with proper spacing.

### Implementation for User Story 2

- [x] T009 [US2] Wrap primary query controls (Search, Tag, Page Size) in a `bg-base-200` container in `src/app/features/data/weapons/weapons.component.html`
- [x] T010 [US2] Integrate action buttons (Mode Toggle, Refresh) into the new toolbar in `src/app/features/data/weapons/weapons.component.html`
- [x] T011 [US2] Apply consistent `gap-4` between control groups and `gap-2` between internal controls in `src/app/features/data/weapons/weapons.component.html`
- [x] T012 [US2] Ensure the toolbar uses `flex-wrap` and `items-end` for proper alignment and 800x600 support in `src/app/features/data/weapons/weapons.component.html`
- [x] T013 [US2] Adjust Advanced Search collapse styling to match the new toolbar in `src/app/features/data/weapons/weapons.component.html`

**Checkpoint**: Weapons page query controls should be unified and efficient.

---

## Phase 5: User Story 3 - Consistent Items Data Querying (Priority: P2)

**Goal**: Mirror the Weapons page toolbar layout on the Items page for consistency.

**Independent Test**: Verify the Items page has the same background-colored toolbar and control grouping as the Weapons page.

### Implementation for User Story 3

- [x] T014 [US3] Wrap Items query controls (Search, Type, Page Size) in a `bg-base-200` container in `src/app/features/data/items/items.component.html`
- [x] T015 [US3] Integrate action buttons (Mode Toggle, Refresh) into the Items toolbar in `src/app/features/data/items/items.component.html`
- [x] T016 [US3] Apply consistent `gap-4` and `gap-2` spacing in `src/app/features/data/items/items.component.html`
- [x] T017 [US3] Ensure `flex-wrap` and `items-end` alignment in `src/app/features/data/items/items.component.html`
- [x] T018 [US3] Align Items Advanced Search styling with the new toolbar in `src/app/features/data/items/items.component.html`

**Checkpoint**: Items page should now be consistent with the Weapons page.

---

## Phase 7: Performance Optimization (Scanning & Responsiveness)

**Purpose**: Fix main thread blocking issues reported by the user.

- [x] T022 Move `id` and `sourceDirectory` generation to Rust backend in `src-tauri/src/weapons.rs` and `src-tauri/src/items.rs`
- [x] T023 Update TypeScript models `Weapon` and `GameItem` to reflect backend fields in `src/app/shared/models/`
- [x] T024 Remove synchronous `map` operations from `WeaponService` and `ItemService`
- [x] T025 Parallelize directory scanning in `DirectoryService.scanAllDirectories()`
- [x] T026 Implement batched data fetching in `WeaponService` and `ItemService` to update signals only once
- [x] T027 Optimize `computed` signals for filtering and sorting to minimize main thread work
- [x] T028 Verify UI responsiveness (sidebar navigation) during multi-directory scan

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies.
- **Foundational (Phase 2)**: Depends on Setup.
- **User Stories (Phase 3+)**: All depend on Foundational (Phase 2).
    - US1 and US2 can proceed in parallel (separate files).
    - US3 depends on the structural pattern established in US2.

### Parallel Opportunities

- T001 and T002 can run in parallel.
- US1 (Settings) and US2 (Weapons) implementation can run in parallel.
- T019, T020, and T021 can run in parallel.

---

## Implementation Strategy

### MVP First (User Story 1 & 2)

1. Complete Phase 1 & 2.
2. Implement User Story 1 (Settings) as it's the simplest and establishes the "Card" pattern.
3. Implement User Story 2 (Weapons) to establish the "Toolbar" pattern.
4. Validate both independently.

### Incremental Delivery

1. Foundation → Done.
2. Settings Optimized → Done.
3. Weapons Optimized → Done.
4. Items Optimized (mirroring Weapons) → Done.
