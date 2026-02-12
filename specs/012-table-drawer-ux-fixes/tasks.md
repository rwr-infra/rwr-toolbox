# Tasks: Table and Drawer UX Fixes

**Input**: Design documents from `/specs/012-table-drawer-ux-fixes/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, quickstart.md

**Tests**: No tests requested - this is a visual/UX fix feature. Manual verification only.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup

**Purpose**: Verify existing icons are registered for the feature

- [X] T001 Verify `loader-2` icon is registered in `src/app/shared/icons/index.ts`

---

## Phase 2: User Story 1 - Visible Image Loading Feedback (Priority: P1) 🎯 MVP

**Goal**: Users can clearly see when images are loading, distinguishing loading state from failed/empty state

**Independent Test**: Open weapons/items page and observe visible spinner in image placeholders before images load

### Implementation for User Story 1

- [X] T002 [P] [US1] Add loading spinner overlay to image placeholder in `src/app/features/data/weapons/weapons.component.html`
- [X] T003 [P] [US1] Add loading spinner overlay to image placeholder in `src/app/features/data/items/items.component.html`
- [X] T004 [P] [US1] Add loading spinner overlay to detail panel image placeholder in `src/app/features/data/weapons/weapons.component.html`
- [X] T005 [P] [US1] Add loading spinner overlay to detail panel image placeholder in `src/app/features/data/items/items.component.html`

**Checkpoint**: ✅ Image loading state is now clearly visible with spinner overlay

---

## Phase 3: User Story 2 - Correct Column Width on High-Resolution Screens (Priority: P1)

**Goal**: Table columns render correctly on 4K/high-DPI screens with content filling full column width

**Independent Test**: View table on 4K screen, verify File Path column content matches header width with no blank space

### Implementation for User Story 2

- [X] T006 [P] [US2] Add `min-width: 100%` to `.cdk-virtual-scroll-content-wrapper` in `src/app/features/data/weapons/weapons.component.scss`
- [X] T007 [P] [US2] Add `min-width: 100%` to `.cdk-virtual-scroll-content-wrapper` in `src/app/features/data/items/items.component.scss`

**Checkpoint**: ✅ Table columns display correctly aligned on 4K/high-DPI screens

---

## Phase 4: User Story 3 - Intuitive Drawer Interaction (Priority: P2)

**Goal**: Users can close drawer by clicking outside, and clicking another item switches drawer content

**Independent Test**: Open drawer, click outside → closes. Open drawer, click another row → drawer switches content without closing

### Implementation for User Story 3

- [X] T008 [P] [US3] Add overlay element with click handler before drawer in `src/app/features/data/weapons/weapons.component.html`
- [X] T009 [P] [US3] Add overlay element with click handler before drawer in `src/app/features/data/items/items.component.html`

**Checkpoint**: ✅ Drawer interaction follows expected UX patterns

---

## Phase 5: Polish & Verification

**Purpose**: Final verification across all components

- [X] T010 Verify all three fixes work on weapons page (manual test)
- [X] T011 Verify all three fixes work on items page (manual test)
- [X] T012 Verify no regression in table scrolling performance
- [X] T013 Verify drawer animations still work correctly

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies - can start immediately
- **Phase 2 (US1)**: Depends on Phase 1 - can start immediately after icon verification
- **Phase 3 (US2)**: No dependencies on US1 - can run in parallel
- **Phase 4 (US3)**: No dependencies on US1/US2 - can run in parallel
- **Phase 5 (Polish)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Independent - no dependencies on other stories
- **User Story 2 (P1)**: Independent - no dependencies on other stories
- **User Story 3 (P2)**: Independent - no dependencies on other stories

### Parallel Opportunities

All tasks within each user story are on different files and can run in parallel:

```bash
# Phase 2 - All US1 tasks can run in parallel (different files):
Task: "Add loading spinner to weapons.component.html"
Task: "Add loading spinner to items.component.html"
Task: "Add loading spinner to weapons detail panel"
Task: "Add loading spinner to items detail panel"

# Phase 3 - Both US2 tasks can run in parallel:
Task: "Fix column width in weapons.component.scss"
Task: "Fix column width in items.component.scss"

# Phase 4 - Both US3 tasks can run in parallel:
Task: "Add drawer overlay to weapons.component.html"
Task: "Add drawer overlay to items.component.html"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Verify icon registration
2. Complete Phase 2: User Story 1 (image loading spinner)
3. **STOP and VALIDATE**: Test image loading on both weapons and items pages
4. Deploy/demo if ready

### Incremental Delivery

1. Complete US1 → Image loading feedback improved
2. Add US2 → 4K column width fixed
3. Add US3 → Drawer interaction improved
4. Each story adds value without breaking previous stories

### Parallel Execution (Recommended)

With all three user stories being independent, complete them in any order or in parallel:

```
Parallel Track A: US1 (Image Loading) → T002, T003, T004, T005
Parallel Track B: US2 (4K Columns) → T006, T007
Parallel Track C: US3 (Drawer) → T008, T009
```

---

## Task Summary

| Phase | Tasks | Completed | Story |
|-------|-------|-----------|-------|
| Phase 1: Setup | 1 | 1 | - |
| Phase 2: US1 | 4 | 4 | Image Loading |
| Phase 3: US2 | 2 | 2 | 4K Column Width |
| Phase 4: US3 | 2 | 2 | Drawer Interaction |
| Phase 5: Polish | 4 | 4 | Verification |
| **Total** | **13** | **13** | - |

---

## Notes

- All [P] tasks modify different files and have no dependencies on each other
- No TypeScript logic changes needed - all fixes are template/style only
- No i18n changes needed - no new user-facing text
- Manual verification sufficient - no automated tests required
- Commit after each phase for clean git history
