# Tasks: UI and Search Refinements

**Feature**: UI and Search Refinements
**Branch**: `008-ui-and-search-refinements`
**Status**: Completed

## Phase 1: Setup

- [x] T001 Verify project structure and ensure all required components (Settings, About, Weapons, Items) exist in src/app/features/

## Phase 2: Foundational

- [x] T002 Research existing highlighting logic in src/app/features/servers/servers.component.ts to prepare for replication

## Phase 3: Simplified Settings Cards [US1]

**Goal**: Streamline Language and Theme cards by removing redundant labels and hint text.
**Independent Test**: Language and Theme cards display selection components directly without separate label rows or descriptive hints.

- [x] T003 [P] [US1] Update Settings template to remove row-based layout for Language selection in src/app/features/settings/settings.component.html
- [x] T004 [P] [US1] Update Settings template to remove row-based layout for Theme selection in src/app/features/settings/settings.component.html
- [x] T005 [P] [US1] Remove all help text and "real-time save" hint elements from Settings cards in src/app/features/settings/settings.component.html

## Phase 4: Cleaner Directory Management [US2]

**Goal**: Remove radio buttons and ensure package metadata is always visible in the scan directories list.
**Independent Test**: Directory list shows package info for all entries and contains no radio selection buttons.

- [x] T006 [US2] Modify directory list template to remove radio selection inputs in src/app/features/settings/settings.component.html
- [x] T007 [US2] Ensure package count/status badges are always rendered for every directory item in src/app/features/settings/settings.component.html

## Phase 5: Professional About Page [US3]

**Goal**: Add project description and a functional link to the GitHub repository.
**Independent Test**: About page displays tool description and a clickable link to https://github.com/Kreedzt/rwr-toolbox.

- [x] T008 [US3] Update About component template with project description and styled GitHub repository link in src/app/features/about/about.component.html

## Phase 6: Search Result Highlighting [US4]

**Goal**: Implement visual highlighting for search matches in Weapons and Items tables.
**Independent Test**: Typing a term in the search box results in visually highlighted text within the matching table cells.

- [x] T009 [P] [US4] Implement `highlight`, `escapeRegExp`, and `escapeHtml` helper methods in src/app/features/data/weapons/weapons.component.ts
- [x] T010 [P] [US4] Implement `highlight`, `escapeRegExp`, and `escapeHtml` helper methods in src/app/features/data/items/items.component.ts
- [x] T011 [P] [US4] Update Weapons table template to use `[innerHTML]` with the highlight method for all searchable columns in src/app/features/data/weapons/weapons.component.html
- [x] T012 [P] [US4] Update Items table template to use `[innerHTML]` with the highlight method for all searchable columns in src/app/features/data/items/items.component.html

## Phase 7: Polish & Cross-Cutting Concerns

- [x] T013 Verify 800x600 resolution compliance for all modified components (Settings, About, Weapons, Items)
- [x] T014 [P] Ensure case-insensitive matching for highlighting across both Weapons and Items features
- [x] T015 Verify visual consistency of highlighting style with the Servers component

## Dependencies

- Phase 3, 4, 5, and 6 are largely independent and can be implemented in any order once Phase 2 research is complete.
- US4 (Phase 6) implementation depends on findings from T002.

## Parallel Execution

**Story US1 & US4**:

- T003, T004, T005 (Settings layout)
- T009, T010, T011, T012 (Data highlighting helper methods and template updates)

## Implementation Strategy

1. **MVP First**: Implement US1 (Settings simplification) and US3 (About page) as they provide immediate visual cleanup.
2. **Incremental Delivery**: Proceed with US2 (Directory list) then US4 (Search highlighting) to enhance data exploration.
3. **Verification**: Manual UI testing using `pnpm start` after each story phase.
