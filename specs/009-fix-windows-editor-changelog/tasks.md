# Tasks: Windows Editor Fix & Changelog Integration

**Feature**: Windows Editor Fix & Changelog Integration
**Branch**: `009-fix-windows-editor-changelog`
**Status**: Completed

## Phase 1: Setup

- [x] T001 Initialize project root `CHANGELOG.md` with version 0.1.0 entry in CHANGELOG.md
- [x] T002 Verify `tauri-plugin-opener` is correctly configured in src-tauri/Cargo.toml and src-tauri/capabilities/default.json

## Phase 2: Foundational (Backend)

- [x] T003 Implement `get_changelog` Tauri command to read root CHANGELOG.md in src-tauri/src/lib.rs
- [x] T004 Refactor `open_file_in_editor` command to use `app.opener().open_path()` in src-tauri/src/weapons.rs

## Phase 3: Robust File Opening [US1]

**Goal**: Ensure "Open in Editor" works reliably on Windows.
**Independent Test**: Clicking "Open in Editor" on a weapon row successfully opens the file in the system's default application on Windows.

- [x] T005 [P] [US1] Verify and update Weapon icon click handler to use robust backend command in src/app/features/data/weapons/weapons.component.ts
- [x] T006 [P] [US1] Verify and update Item icon click handler to use robust backend command in src/app/features/data/items/items.component.ts

## Phase 4: Dashboard Cleanup & Mod Menu Restoration [US3]

**Goal**: Restore Local Mods navigation and clean up obsolete Dashboard buttons.
**Independent Test**: Sidebar shows "Local Mods" above Settings, and Dashboard "Extract" button is replaced by "Local Mods".

- [x] T007 [US3] Restore "Local Mods" entry and update keyboard shortcuts (Ctrl+1-7) in src/app/shared/constants/menu-items.ts
- [x] T008 [US3] Update Dashboard template to replace "Extract" button with "Local Mods" (routing to /mods) in src/app/features/dashboard/dashboard.component.html
- [x] T009 [US3] Update shortcut handling logic to support shifted menu indices in src/app/app.component.ts

## Phase 5: Integrated Changelog [US2]

**Goal**: Display version history on Dashboard and About page.
**Independent Test**: Latest CHANGELOG.md entry appears in Dashboard activity list; full history is visible on About page.

- [x] T010 [US2] Implement changelog parsing and activity sync logic in src/app/features/dashboard/services/dashboard.service.ts
- [x] T011 [US2] Update Dashboard component to trigger changelog sync on initialization in src/app/features/dashboard/dashboard.component.ts
- [x] T012 [US2] Implement changelog display area in About component in src/app/features/about/about.component.html
- [x] T013 [US2] Fetch and bind changelog data to the view in src/app/features/about/about.component.ts

## Phase 6: Polish & Cross-Cutting Concerns

- [x] T014 Ensure changelog markdown rendering respects light/dark themes on the About page
- [x] T015 [P] Verify that file paths with spaces open correctly from the UI on Windows
- [x] T016 [P] Verify Transloco keys for new "Local Mods" button on Dashboard

## Dependencies

- Phase 2 must be completed before Phase 3 and Phase 5.
- US1, US2, and US3 are functionally independent and can be developed in parallel once foundational work is done.

## Parallel Execution

**Foundational vs Setup**:

- T001, T002 (Setup)
- T003, T004 (Foundational Backend)

**Feature Implementation**:

- T005, T006 (US1)
- T007, T008, T009 (US3)
- T010, T011, T012, T013 (US2)

## Implementation Strategy

1. **Backend First**: Secure the file opening and changelog reading capabilities.
2. **Navigation Fix**: Restore the sidebar and clean up the Dashboard to align with user expectations.
3. **Information Sync**: Connect the changelog to the UI components for visibility.
4. **Final Verification**: Focus on cross-platform robustness.
