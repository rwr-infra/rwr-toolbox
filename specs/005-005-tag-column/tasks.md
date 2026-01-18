# Implementation Tasks: Tag Column Rename and Data Reading Fix

**Feature**: 005-tag-column-fix
**Branch**: `005-tag-column-fix`
**Date**: 2026-01-18
**Status**: Ready for Implementation

---

## Overview

This task list implements the fix for the tag column data reading bug and UI label rename. The root cause is a field name mismatch between Rust backend (`tag`) and TypeScript frontend (`classTag`).

**User Stories**:
- **US1 (P1)**: Fix Tag Column Data Reading Bug - align TypeScript field names with Rust serialization
- **US2 (P2)**: Rename "Class Tag" to "Tag" - update UI labels for clarity

**Total Tasks**: 14 tasks across 5 phases

---

## Phase 1: Setup

**Goal**: Verify development environment and branch readiness.

**Acceptance**: Branch `005-tag-column-fix` is checked out and ready for changes.

- [ ] T001 Verify current branch is `005-tag-column-fix`
- [ ] T002 Verify build succeeds before making changes (`pnpm build`)

---

## Phase 2: Foundational (Data Model Changes)

**Goal**: Update TypeScript interfaces to match Rust serialization.

**Acceptance**: All TypeScript interfaces use `tag` instead of `classTag`.

**Dependencies**: This phase MUST complete before US1 and US2 can proceed.

### Model Updates

- [ ] T003 Rename `classTag: string` to `tag: string` in Weapon interface in `src/app/shared/models/weapons.models.ts`
- [ ] T004 Update `WeaponColumnKey` type from `'classTag'` to `'tag'` in `src/app/shared/models/weapons.models.ts`
- [ ] T005 Update `AdvancedFilters.classTag` to `tag` in `src/app/shared/models/weapons.models.ts`

---

## Phase 3: User Story 1 - Fix Tag Column Data Reading Bug (P1)

**Goal**: Fix the data reading bug by updating component logic to use `tag` field, including localStorage migration.

**Independent Test**: Scan any weapon directory and verify Tag column displays correct values (assault, smg, sniper, etc.).

**Blocking**: Requires Phase 2 (model changes) to complete first.

### Column Configuration

- [ ] T006 [US1] Update column `key` from `'classTag'` to `'tag'` in `src/app/features/data/weapons/weapon-columns.ts`
- [ ] T007 [US1] Update column `field` from `'classTag'` to `'tag'` in `src/app/features/data/weapons/weapon-columns.ts`
- [ ] T008 [US1] Update column `i18nKey` from `weapons.columns.classTag` to `weapons.columns.tag` in `src/app/features/data/weapons/weapon-columns.ts`

### Component Logic with Migration

- [ ] T009 [US1] Rename `selectedClassTag` signal to `selectedTag` in `src/app/features/data/weapons/weapons.component.ts`
- [ ] T010 [US1] Rename `availableClassTags` computed to `availableTags` and update to read `w.tag` instead of `w.classTag` in `src/app/features/data/weapons/weapons.component.ts`
- [ ] T011 [US1] Rename `onClassTagFilter` method to `onTagFilter` in `src/app/features/data/weapons/weapons.component.ts`
- [ ] T012 [US1] Update `updateAdvancedFilters` to use `tag: this.selectedTag()` instead of `classTag: this.selectedClassTag()` in `src/app/features/data/weapons/weapons.component.ts`
- [ ] T013 [US1] Update `onClearFilters` to use `this.selectedTag.set(undefined)` instead of `this.selectedClassTag.set(undefined)` in `src/app/features/data/weapons/weapons.component.ts`
- [ ] T014 [US1] Add localStorage migration logic in constructor (migrate `classTag` → `tag` columnId) in `src/app/features/data/weapons/weapons.component.ts`

### HTML Template Updates

- [ ] T015 [US1] Update filter dropdown binding from `selectedClassTag()` to `selectedTag()` in `src/app/features/data/weapons/weapons.component.html`
- [ ] T016 [US1] Update filter dropdown event handler from `onClassTagFilter` to `onTagFilter` in `src/app/features/data/weapons/weapons.component.html`

---

## Phase 4: User Story 2 - Rename "Class Tag" to "Tag" (P2)

**Goal**: Update UI labels from "Class Tag" to "Tag" for clarity.

**Independent Test**: Open Weapons table and verify column header shows "Tag" (EN) / "标签" (ZH).

**Blocking**: Requires Phase 2 and 3 to complete first.

### i18n Translations

- [ ] T017 [P] [US2] Rename `weapons.columns.classTag` key to `weapons.columns.tag` and update value to "Tag" in `src/assets/i18n/en.json`
- [ ] T018 [P] [US2] Rename `weapons.columns.classTag` key to `weapons.columns.tag` and update value to "标签" in `src/assets/i18n/zh.json`

---

## Phase 5: Polish & Cross-Cutting Concerns

**Goal**: Build, test, and document the changes.

**Acceptance**: Build succeeds, manual testing passes, documentation updated.

- [ ] T019 Run build to verify no TypeScript compilation errors (`pnpm build`)
- [ ] T020 Manual testing: Verify tag values display correctly in Weapons table
- [ ] T021 Manual testing: Verify column header shows "Tag" / "标签" (not "Class Tag")
- [ ] T022 Manual testing: Verify tag filter in advanced search works
- [ ] T023 Manual testing: Verify column visibility preferences migrated correctly
- [ ] T024 Update `docs-ai/PROGRESS.md` with feature completion entry

---

## Dependencies

```
Phase 1 (Setup)
    ↓
Phase 2 (Foundational - Model Changes)
    ↓
    ├─→ Phase 3 (US1 - Component Logic) ─┐
    │                                    ↓
    └─→ Phase 4 (US2 - i18n Labels) ───→ Phase 5 (Polish)
```

**Story Dependencies**:
- US1 and US2 can be implemented in parallel after Phase 2
- Phase 5 requires both US1 and US2 to complete

---

## Parallel Execution Examples

### Within Phase 2 (Model Changes):
```bash
# T003, T004, T005 can be done together (same file, sequential edits)
# All three edits are in weapons.models.ts
```

### Within Phase 4 (i18n - US2):
```bash
# T017 and T018 are fully parallel (different files, no dependencies)
T017: Edit src/assets/i18n/en.json
T018: Edit src/assets/i18n/zh.json
```

---

## Implementation Strategy

### MVP Scope (Minimum Viable Product)

**MVP = Phase 1 + Phase 2 + Phase 3 (US1 only)**

This delivers:
- Fixed data reading bug (tag values display correctly)
- LocalStorage migration (existing preferences preserved)
- Column toggle still shows old label (acceptable for MVP)

**To complete full feature**: Add Phase 4 (US2) for UI label polish.

### Incremental Delivery

1. **Sprint 1**: Phase 1 + 2 (Setup + Models) - Foundation
2. **Sprint 2**: Phase 3 (US1) - Bug fix + migration
3. **Sprint 3**: Phase 4 (US2) - UI polish
4. **Sprint 4**: Phase 5 (Polish) - Testing + documentation

### Risk Mitigation

- **Migration risk**: T014 includes migration logic to preserve user preferences
- **Build risk**: T002 verifies baseline build before changes
- **i18n risk**: T017/T018 are independent and can be reverted if needed

---

## Format Validation

✅ All tasks follow checklist format: `- [ ] [TaskID] [P?] [Story?] Description with file path`

✅ Total tasks: 24

✅ Task breakdown by phase:
- Phase 1 (Setup): 2 tasks
- Phase 2 (Foundational): 3 tasks
- Phase 3 (US1): 11 tasks
- Phase 4 (US2): 2 tasks (parallelizable)
- Phase 5 (Polish): 6 tasks

✅ Parallel opportunities:
- T017, T018 in Phase 4 (i18n files)
