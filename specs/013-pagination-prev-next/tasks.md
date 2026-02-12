# Tasks: Pagination Previous/Next Buttons

**Input**: Design documents from `/specs/013-pagination-prev-next/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, quickstart.md

**Tests**: No tests requested - this is a UI enhancement feature. Manual verification only.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2)
- Include exact file paths in descriptions

---

## Phase 1: Setup

**Purpose**: Verify icons are registered and i18n keys are planned

- [X] T001 Verify `chevron-left` and `chevron-right` icons are registered in `src/app/shared/icons/index.ts`

---

## Phase 2: User Story 1 - Navigate to Previous Page (Priority: P1) 🎯 MVP

**Goal**: Users can click a Previous button to navigate to the previous page, with disabled state on page 1

**Independent Test**: Navigate to page 2 or higher, click Previous button, verify page decrements. Verify button is disabled on page 1.

### Implementation for User Story 1

- [X] T002 [P] [US1] Add "Previous" button before page numbers in `src/app/features/data/weapons/weapons.component.html`
- [X] T003 [P] [US1] Add "Previous" button before page numbers in `src/app/features/data/items/items.component.html`
- [X] T004 [P] [US1] Add `pagination.prev` i18n key to `src/assets/i18n/en.json`
- [X] T005 [P] [US1] Add `pagination.prev` i18n key to `src/assets/i18n/zh.json`

**Checkpoint**: ✅ Previous button works on both weapons and items pages

---

## Phase 3: User Story 2 - Navigate to Next Page (Priority: P1)

**Goal**: Users can click a Next button to navigate to the next page, with disabled state on last page

**Independent Test**: Navigate to any page except last, click Next button, verify page increments. Verify button is disabled on last page.

### Implementation for User Story 2

- [X] T006 [P] [US2] Add "Next" button after page numbers in `src/app/features/data/weapons/weapons.component.html`
- [X] T007 [P] [US2] Add "Next" button after page numbers in `src/app/features/data/items/items.component.html`
- [X] T008 [P] [US2] Add `pagination.next` i18n key to `src/assets/i18n/en.json`
- [X] T009 [P] [US2] Add `pagination.next` i18n key to `src/assets/i18n/zh.json`

**Checkpoint**: ✅ Next button works on both weapons and items pages

---

## Phase 4: Polish & Verification

**Purpose**: Final verification across all components

- [X] T010 Verify Previous/Next buttons work on weapons page (manual test)
- [X] T011 Verify Previous/Next buttons work on items page (manual test)
- [X] T012 Verify disabled states work correctly (first page, last page, single page)
- [X] T013 Verify tooltips display correctly in both English and Chinese

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies - can start immediately
- **Phase 2 (US1)**: Depends on Phase 1 icon verification
- **Phase 3 (US2)**: No dependencies on US1 - can run in parallel
- **Phase 4 (Polish)**: Depends on both US1 and US2 being complete

### User Story Dependencies

- **User Story 1 (P1)**: Independent - no dependencies on other stories
- **User Story 2 (P1)**: Independent - no dependencies on other stories

### Parallel Opportunities

All tasks within each user story are on different files and can run in parallel:

```bash
# Phase 2 - All US1 tasks can run in parallel (different files):
Task: "Add Previous button to weapons.component.html"
Task: "Add Previous button to items.component.html"
Task: "Add pagination.prev to en.json"
Task: "Add pagination.prev to zh.json"

# Phase 3 - All US2 tasks can run in parallel:
Task: "Add Next button to weapons.component.html"
Task: "Add Next button to items.component.html"
Task: "Add pagination.next to en.json"
Task: "Add pagination.next to zh.json"

# Phase 2 and Phase 3 can run in parallel:
# US1 and US2 are independent, both modify same files but different parts of pagination
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Verify icon registration
2. Complete Phase 2: User Story 1 (Previous button)
3. **STOP and VALIDATE**: Test Previous button on both weapons and items pages
4. Deploy/demo if ready

### Incremental Delivery

1. Complete US1 → Previous button works
2. Add US2 → Next button works
3. Each story adds value without breaking previous stories

### Parallel Execution (Recommended)

Since both user stories are P1 and modify the same files in different locations, they can be implemented together:

```
Parallel Track A: US1 (Previous Button) → T002, T003, T004, T005
Parallel Track B: US2 (Next Button) → T006, T007, T008, T009
```

**Note**: Since US1 and US2 modify the same HTML files, it's often more efficient to implement both buttons in a single pass through each file. However, the tasks are separated to maintain traceability to user stories.

---

## Task Summary

| Phase | Tasks | Completed | Story |
|-------|-------|-----------|-------|
| Phase 1: Setup | 1 | 1 | - |
| Phase 2: US1 | 4 | 4 | Previous Button |
| Phase 3: US2 | 4 | 4 | Next Button |
| Phase 4: Polish | 4 | 4 | Verification |
| **Total** | **13** | **13** | - |

---

## Notes

- All [P] tasks modify different files and have no dependencies on each other
- No TypeScript logic changes needed - all changes are template-only
- Icons already registered, no icon changes required
- Manual verification sufficient - no automated tests required
- Commit after each phase for clean git history
