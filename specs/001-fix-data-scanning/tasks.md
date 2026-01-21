# Tasks: Fix Data Scanning Errors and UX Improvements

**Input**: Design documents from `/specs/001-fix-data-scanning/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/tauri-commands.yaml

**Tests**: No explicit test tasks requested - feature relies on manual testing with real RWR game data.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1-US5)
- Include exact file paths in descriptions

## Path Conventions

- **Backend (Rust)**: `src-tauri/src/`
- **Frontend (Angular)**: `src/app/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Add new dependencies and prepare project structure

- [X] T001 Add rayon dependency to src-tauri/Cargo.toml for parallel file scanning
- [X] T002 Run cargo check to verify rayon dependency compiles correctly

**Checkpoint**: Dependencies ready, build passes

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core data model changes that ALL user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T003 Add active field to ScanDirectory interface in src/app/shared/models/directory.models.ts
- [X] T004 Add packageCount field to ScanDirectory interface in src/app/shared/models/directory.models.ts
- [X] T005 Add packageCount field to ValidationResult interface in src/app/shared/models/directory.models.ts
- [X] T006 [P] Add package_count field to ValidationResult struct in src-tauri/src/directories.rs
- [X] T007 [P] Add error_code field to ValidationResult struct in src-tauri/src/directories.rs
- [X] T008 [P] Add message field to ValidationResult struct in src-tauri/src/directories.rs
- [X] T009 Update validate_game_path command to count package subdirectories and return package_count in src-tauri/src/directories.rs
- [X] T010 [P] Register ToggleLeft icon in src/app/shared/icons/index.ts for active state toggle

**Checkpoint**: Data models updated, backend ready to return package counts

---

## Phase 3: User Story 1 - Fix Template File Resolution (Priority: P1) 🎯 MVP

**Goal**: Fix "No such file or directory" errors when scanning weapon/item files with template references

**Independent Test**: Scan a directory with weapon files containing `@file` template references; verify zero template resolution errors

### Implementation for User Story 1

- [X] T011 [P] [US1] Modify resolve_template function signature to accept base_dir parameter in src-tauri/src/weapons.rs
- [X] T012 [US1] Update parse_weapon_file to pass weapon file parent directory to resolve_template in src-tauri/src/weapons.rs
- [X] T013 [US1] Update all resolve_template call sites in weapons.rs to pass base_dir parameter in src-tauri/src/weapons.rs
- [X] T011a [P] [US1] Add template_error field to Weapon struct in src-tauri/src/weapons.rs
- [X] T011b [P] [US1] Add templateError field to Weapon interface in src/app/shared/models/weapons.models.ts
- [X] T011c [US1] Modify parse_weapon_file to catch template errors and continue parsing with partial data in src-tauri/src/weapons.rs
- [X] T011d [P] [US1] Add template error warning alert in weapons detail drawer in src/app/features/data/weapons/weapons.component.html
- [X] T011e [P] [US1] Register Copy icon in src/app/shared/icons/index.ts
- [X] T011f [P] [US1] Add "Copy Path" and "Open in Editor" buttons to weapons detail drawer in src/app/features/data/weapons/weapons.component.html
- [X] T011g [P] [US1] Add "Copy Path" and "Open in Editor" buttons to items detail drawer in src/app/features/data/items/items.component.html
- [X] T014 [P] [US1] N/A - Items do not use template references (confirmed in research.md)
- [X] T015 [US1] N/A - Items do not use template references (confirmed in research.md)
- [X] T016 [US1] N/A - Items do not use template references (confirmed in research.md)
- [X] T017 [P] [US1] Add use rayon::prelude statement in src-tauri/src/weapons.rs
- [X] T018 [US1] Convert discover_weapons to use par_bridge for parallel iteration in src-tauri/src/weapons.rs
- [X] T019 [US1] Update scan_weapons to use parallel file collection with partition_result in src-tauri/src/weapons.rs
- [X] T020 [P] [US1] Add use rayon::prelude statement in src-tauri/src/items.rs
- [X] T021 [US1] Convert item file discovery to use par_bridge for parallel iteration in src-tauri/src/items.rs
- [X] T022 [US1] Update scan_items to use parallel file collection in src-tauri/src/items.rs
- [X] T023 [US1] Run cargo clippy to verify no warnings from parallel scanning changes

**Checkpoint**: Template resolution fixed, parallel scanning working, weapons/items with template references parse successfully

---

## Phase 4: User Story 2 - Auto-Scan on Data Route Entry (Priority: P1)

**Goal**: Display data table instead of empty state when directories are configured and scan is in progress

**Independent Test**: Restart app with configured directories, navigate to /data route; verify tabs display immediately without showing "configure folders" message

### Implementation for User Story 2

- [X] T024 [US2] Update hasNoDirectories method to check scan progress state and initialization state in src/app/features/data/local/local.component.ts
- [X] T024a [US2] Add initializedSig signal to DirectoryService to track service initialization state in src/app/features/settings/services/directory.service.ts
- [X] T024b [US2] Add initialized check to WeaponsComponent.loadWeapons() in src/app/features/data/weapons/weapons.component.ts
- [X] T024c [US2] Add initialized check to ItemsComponent.loadItems() in src/app/features/data/items/items.component.ts
- [X] T024d [US2] Add effect to WeaponsComponent to auto-load when initialization completes in src/app/features/data/weapons/weapons.component.ts
- [X] T024e [US2] Add effect to ItemsComponent to auto-load when initialization completes in src/app/features/data/items/items.component.ts
- [ ] T025 [US2] Test that data page shows tabs when directories exist and scan is in progress or completed (manual test)

**Checkpoint**: Auto-scan displays data correctly on first navigation, no confusing empty state

---

## Phase 5: User Story 3 - Multi-Directory Active State Management (Priority: P2)

**Goal**: Allow users to selectively enable/disable scan directories without deletion

**Independent Test**: Add 3 directories, toggle 2 to inactive, trigger scan; verify only 1 active directory is scanned and progress shows "1 of 1"

### Implementation for User Story 3

- [X] T026 [P] [US3] Add toggleActive method to DirectoryService in src/app/features/settings/services/directory.service.ts
- [X] T027 [US3] Add getActiveDirectories computed signal to DirectoryService in src/app/features/settings/services/directory.service.ts
- [X] T028 [US3] Update scanAllDirectories to use getActiveDirectories instead of getValidDirectories in src/app/features/settings/services/directory.service.ts
- [X] T029 [US3] Add persistActiveState method to DirectoryService to save active states to plugin-store in src/app/features/settings/services/directory.service.ts
- [X] T030 [US3] Update loadDirectories to set active=true as default when loading persisted directories in src/app/features/settings/services/directory.service.ts
- [X] T031 [P] [US3] Add active toggle switch UI element to directory item in src/app/features/settings/settings.component.html
- [X] T032 [US3] Wire toggle change event to toggleActive method in src/app/features/settings/settings.component.ts
- [X] T033 [US3] Add visual styling (opacity) to indicate inactive directory state in src/app/features/settings/settings.component.html
- [X] T034 [P] [US3] Add i18n key settings.activeDirectory to src/assets/i18n/en.json
- [X] T035 [P] [US3] Add i18n key settings.inactiveDirectory to src/assets/i18n/en.json
- [X] T036 [P] [US3] Add Chinese translation for settings.activeDirectory to src/assets/i18n/zh.json
- [X] T037 [P] [US3] Add Chinese translation for settings.inactiveDirectory to src/assets/i18n/zh.json

**Checkpoint**: Users can toggle directories active/inactive, scans only include active directories, state persists across restarts

---

## Phase 6: User Story 4 - Package Count Display in Settings (Priority: P2)

**Goal**: Display number of package subdirectories instead of item count in settings UI

**Independent Test**: Add a directory with known package structure; verify settings shows "X packages" instead of "0 items"

### Implementation for User Story 4

- [X] T038 [P] [US4] Add i18n key settings.packageCount to src/assets/i18n/en.json with "{count} packages" format
- [X] T039 [P] [US4] Add i18n key settings.packageCount_one to src/assets/i18n/en.json for singular form
- [X] T040 [P] [US4] Add Chinese translation for settings.packageCount to src/assets/i18n/zh.json
- [X] T041 [P] [US4] Add Chinese translation for settings.packageCount_one to src/assets/i18n/zh.json
- [X] T042 [US4] Replace itemCount display with packageCount display in settings component template in src/app/features/settings/settings.component.html
- [X] T043 [US4] Update DirectoryService to map packageCount from ValidationResult during validation in src/app/features/settings/services/directory.service.ts
- [X] T044 [US4] Ensure packageCount displays for inactive directories as well as active ones in src/app/features/settings/settings.component.html

**Checkpoint**: Settings displays accurate package counts, no more "0 items" display

---

## Phase 7: User Story 5 - Drawer Image Layout (Priority: P3)

**Goal**: Move weapon/item images from top of drawer panel to content area first row

**Independent Test**: Click weapon in table, open detail drawer; verify image appears in content area below title, not floating at top

### Implementation for User Story 5

- [X] T045 [P] [US5] Remove standalone image section from top of drawer panel in src/app/features/data/weapons/weapons.component.html
- [X] T046 [P] [US5] Remove standalone image section from top of drawer panel in src/app/features/data/items/items.component.html
- [X] T047 [US5] Add image to first row of content area inline with basic info in weapons drawer in src/app/features/data/weapons/weapons.component.html
- [X] T048 [US5] Add image to first row of content area inline with basic info in items drawer in src/app/features/data/items/items.component.html
- [X] T049 [US5] Reduce image size from w-48 h-48 to w-24 h-24 for inline display in src/app/features/data/weapons/weapons.component.html
- [X] T050 [US5] Reduce image size from w-48 h-48 to w-24 h-24 for inline display in src/app/features/data/items/items.component.html
- [X] T051 [US5] Add conditional rendering to not display broken image placeholders in src/app/features/data/weapons/weapons.component.html
- [X] T052 [US5] Add conditional rendering to not display broken image placeholders in src/app/features/data/items/items.component.html

**Checkpoint**: Drawer images render inline with content, no layout shift, graceful handling of missing icons

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Final validation, documentation updates, and cross-cutting improvements

- [X] T053 Run cargo test and cargo clippy to verify backend code quality
- [X] T054 Run pnpm build to verify frontend compiles without errors
- [ ] T055 Run pnpm tauri dev and test all user stories with real RWR game data (manual test)
- [X] T056 Verify template resolution fix by scanning directory with ../templates/ references
- [ ] T057 Verify parallel scanning performance improvement with 1000+ weapon files (manual test)
- [ ] T058 Verify active directory toggling works and persists across restarts (manual test)
- [ ] T059 Verify package count displays correctly for directories (manual test)
- [ ] T060 Verify drawer image layout is correct for both weapons and items (manual test)
- [ ] T061 Update docs/STATUS.md with feature completion status

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 completion - BLOCKS all user stories
- **User Stories (Phases 3-7)**: All depend on Phase 2 completion
  - US1 (Phase 3) - P1: Can start after Phase 2 - No dependencies on other stories
  - US2 (Phase 4) - P1: Can start after Phase 2 - Independent of US1
  - US3 (Phase 5) - P2: Can start after Phase 2 - Independent of US1/US2
  - US4 (Phase 6) - P2: Can start after Phase 2 - Independent of other stories
  - US5 (Phase 7) - P3: Can start after Phase 2 - Independent of other stories
- **Polish (Phase 8)**: Depends on all desired user stories being complete

### User Story Dependencies

All user stories are **INDEPENDENT** and can be implemented in parallel after Phase 2 completes:
- **US1**: Template resolution fix (backend Rust changes)
- **US2**: Auto-scan trigger fix (frontend TypeScript change)
- **US3**: Active state management (frontend TypeScript + UI)
- **US4**: Package count display (frontend TypeScript + UI, backend already modified in Phase 2)
- **US5**: Drawer layout (frontend HTML changes only)

### Within Each User Story

- Phase 2 foundational tasks must complete first
- Models/services before UI implementation
- All stories can proceed in parallel after Phase 2

### Parallel Opportunities

**Phase 1 (Setup)**:
```bash
# Can run in parallel:
T001: Add rayon dependency
T002: Run cargo check
```

**Phase 2 (Foundational)**:
```bash
# Model changes (can run in parallel):
T003: Add active to ScanDirectory (TS)
T004: Add packageCount to ScanDirectory (TS)
T005: Add packageCount to ValidationResult (TS)
T006: Add package_count to ValidationResult (Rust)
T007: Add error_code to ValidationResult (Rust)
T008: Add message to ValidationResult (Rust)

# After models complete:
T009: Update validate_game_path command
T010: Register ToggleLeft icon
```

**After Phase 2, all user stories can run in parallel**:

```bash
# US1 (Template Resolution):
T011, T014: Modify resolve_template signatures (weapons.rs, items.rs)
T012, T015: Update parse functions to pass parent dir
T013, T016: Update call sites
T017, T020: Add rayon imports
T018, T021: Convert to par_bridge
T019, T022: Update scan commands

# US2 (Auto-Scan):
T024: Update hasNoDirectories method
T025: Test verification

# US3 (Active State):
T026, T027: Add service methods
T028, T029, T030: Update service logic
T031: Add toggle UI
T032-T037: Add i18n translations

# US4 (Package Count):
T038-T041: Add i18n translations
T042-T044: Update UI and service mapping

# US5 (Drawer Layout):
T045, T046: Remove old image sections
T047, T048: Add inline images
T049, T050: Reduce image sizes
T051, T052: Add conditional rendering
```

---

## Parallel Example: User Story 1

```bash
# Template resolution signature changes (parallel):
Task: "T011 [P] [US1] Modify resolve_template function in weapons.rs"
Task: "T014 [P] [US1] Modify resolve_template function in items.rs"

# Parallel scanning setup (parallel):
Task: "T017 [P] [US1] Add rayon import to weapons.rs"
Task: "T020 [P] [US1] Add rayon import to items.rs"
```

---

## Implementation Strategy

### MVP First (User Stories 1 + 2 Only - P1 Priority)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1 (Template resolution)
4. Complete Phase 4: User Story 2 (Auto-scan trigger)
5. **STOP and VALIDATE**: Test template resolution and auto-scan with real game data
6. Deploy/demo if ready

**Value**: Fixes critical bugs preventing proper data scanning

### Incremental Delivery (Full Feature)

1. Complete Setup + Foundational → Data models ready
2. Add US1 + US2 → Fix scanning bugs → Deploy/Demo (MVP!)
3. Add US3 → Active directory management → Deploy/Demo
4. Add US4 → Package count display → Deploy/Demo
5. Add US5 → Improved drawer layout → Deploy/Demo
6. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers after Phase 2 completes:

1. **Developer A**: US1 (Template resolution + parallel scanning)
2. **Developer B**: US3 (Active state management)
3. **Developer C**: US4 (Package count display)
4. **Developer D**: US5 (Drawer layout)

All stories integrate independently through shared data models from Phase 2.

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- US1 (template resolution) and US2 (auto-scan) are P1 - highest priority
- US3 and US4 are P2 - medium priority
- US5 is P3 - lower priority visual improvement
- Phase 2 (Foundational) is CRITICAL and must complete before any user story work
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
