# Tasks: Optimize Table Column Width for Long Keys

**Feature**: 001-optimize-table-column-width
**Branch**: `001-optimize-table-column-width`
**Date**: 2026-02-05
**Total Tasks**: 8

## Implementation Strategy

**MVP-First Approach**:

1. Start with User Story 1 (core readability issue) - provides immediate value
2. Complete User Story 2 (tooltip functionality) - completes UX
3. Validate with User Story 3 (performance testing) - confirms no degradation

**Incremental Delivery**:

- Each user story is independently testable and deployable
- P1 stories (US1, US2) form the complete solution
- P2 story (US3) validates non-functional requirements
- No new infrastructure required - direct component modifications

**Parallel Opportunities**:

- Weapons and items component changes are independent and can be done in parallel
- TypeScript and HTML changes can be done in parallel within each component
- Testing across components can be done in parallel

## Phase 1: Setup

_No setup tasks required - all infrastructure already exists._

## Phase 2: Foundational

_No foundational tasks required - no blocking prerequisites._

## Phase 3: User Story 1 - View Tables with Readable Content (P1)

**Story Goal**: Users can view all table columns clearly without long keys squeezing other columns, making all information readable at a glance.

**Independent Test**: Open weapons or items page and verify that:

- All columns are visible and readable
- Key column does not compress other columns below minimum readable width
- Table layout is consistent across rows with varying key lengths
- Long keys (50+ characters) are displayed with truncation indicator

### Implementation Tasks

- [x] T001 [US1] Update key column width to 220px in weapons.component.ts
- [x] T002 [P] [US1] Update key column width to 220px in items.component.ts
- [x] T003 [US1] Add CSS truncation styling to weapons key cells in weapons.component.html
- [x] T004 [P] [US1] Add CSS truncation styling to items key cells in items.component.html

---

## Phase 4: User Story 2 - Access Full Key Content on Demand (P1)

**Story Goal**: Users can see complete key value when needed, even if it's truncated in the table view.

**Independent Test**: Hover over truncated keys and verify that:

- Complete key value displays in tooltip on hover
- Tooltip appears within 200ms of mouse hover
- Tooltip shows full text including search highlighting
- Tooltip works consistently across all rows

### Implementation Tasks

- [x] T005 [US2] Add title attribute with key value to weapons key cells in weapons.component.html
- [x] T006 [P] [US2] Add title attribute with key value to items key cells in items.component.html

---

## Phase 5: User Story 3 - Maintain Table Performance with Large Datasets (P2)

**Story Goal**: Solution maintains current performance characteristics when displaying large datasets with virtual scrolling.

**Independent Test**: Load 1000+ items and verify that:

- Table scrolling remains smooth at 60fps
- No jank or performance degradation during rapid scrolling
- Virtual scrolling renders only visible rows
- Truncation and tooltips don't cause lag

### Implementation Tasks

- [x] T007 [US3] Verify virtual scrolling performance with 1000+ items
- [x] T008 [US3] Validate column toggle functionality maintains layout integrity

---

## Phase 6: Polish & Cross-Cutting Concerns

### Testing & Validation

- [x] T009 Manual testing: Verify truncation works for extremely long keys (100+ characters)
- [x] T010 Manual testing: Verify column sorting still works on key column
- [x] T011 Manual testing: Verify column toggle doesn't break with new truncation
- [x] T012 Manual testing: Verify table works in both light and dark themes

### Documentation

- [x] T013 Update AGENTS.md with table column width optimization guidance
- [x] T014 Create quickstart guide with testing scenarios

---

## Dependencies

### Story Completion Order

```
[US1: View Tables with Readable Content]
    ├─→ T001-T004 (independent within story)
    └─→ Delivers: Readable table layout
         ↓
[US2: Access Full Key Content on Demand]
    ├─→ T005-T006 (parallel, depends on US1 HTML structure)
    └─→ Delivers: Complete solution
         ↓
[US3: Maintain Performance]
    ├─→ T007-T008 (validation only, can start after US2)
    └─→ Delivers: Performance validation
```

### Key Dependencies

- US2 depends on US1: Tooltip implementation assumes truncation structure is in place
- US3 depends on US2: Performance testing validates complete solution (truncation + tooltips)
- All other tasks are independent within their stories

## Parallel Execution Examples

### Within User Story 1 (P1)

```bash
# Parallel block 1 - TypeScript changes (independent files)
[ ] T001 Update weapons.component.ts key column width
[ ] T002 Update items.component.ts key column width

# Parallel block 2 - HTML changes (after T001, T002 complete)
[ ] T003 Add truncation to weapons.component.html
[ ] T004 Add truncation to items.component.html
```

### Within User Story 2 (P1)

```bash
# Parallel block - HTML changes (independent files)
[ ] T005 Add title attribute to weapons.component.html
[ ] T006 Add title attribute to items.component.html
```

### Across User Stories

```bash
# After US1 complete, start US2 in parallel
[ ] T005 Add title to weapons (US2) # Can start after T003
[ ] T006 Add title to items (US2)   # Can start after T004
[ ] T007 Verify performance (US3)       # Can start after US2 complete
[ ] T008 Validate column toggle (US3) # Can start after US2 complete
```

## Task Details

### T001 - Update key column width to 220px in weapons.component.ts

**File**: `src/app/features/data/weapons/weapons.component.ts`
**Description**: Change `columnWidthPxByKey.key` from 180 to 220
**Acceptance**: Key column displays at 220px width in table

**Change location**:

```typescript
private readonly columnWidthPxByKey: Record<string, number> = {
    image: 56,
    key: 220,  // Changed from 180
    // ... other columns
};
```

---

### T002 - Update key column width to 220px in items.component.ts

**File**: `src/app/features/data/items/items.component.ts`
**Description**: Change `columnWidthPxByKey.key` from 180 to 220
**Acceptance**: Key column displays at 220px width in table

**Change location**:

```typescript
private readonly columnWidthPxByKey: Record<string, number> = {
    image: 56,
    key: 220,  // Changed from 180
    // ... other columns
};
```

---

### T003 - Add CSS truncation styling to weapons key cells in weapons.component.html

**File**: `src/app/features/data/weapons/weapons.component.html`
**Description**: Add `truncate` class to span element wrapping key text (line ~632)
**Acceptance**: Long keys display with ellipsis when exceeding 220px width

**Change location**:

```html
<!-- Line ~632: Find key cell rendering -->
<span
    class="text-xs truncate block"  <!-- Add 'truncate' and 'block' -->
    [innerHTML]="highlight(weapon.key)"
></span>
```

---

### T004 - Add CSS truncation styling to items key cells in items.component.html

**File**: `src/app/features/data/items/items.component.html`
**Description**: Add `truncate` class to span element wrapping key text (line ~511)
**Acceptance**: Long keys display with ellipsis when exceeding 220px width

**Change location**:

```html
<!-- Line ~511: Find key cell rendering -->
<span
    class="text-xs truncate block"  <!-- Add 'truncate' and 'block' -->
    [innerHTML]="highlight(item.key)"
></span>
```

---

### T005 - Add title attribute with key value to weapons key cells in weapons.component.html

**File**: `src/app/features/data/weapons/weapons.component.html`
**Description**: Add `[title]="weapon.key"` to key span element (line ~632)
**Acceptance**: Hovering over truncated key shows full value in tooltip

**Change location**:

```html
<!-- Line ~632: Find key cell rendering -->
<span
    class="text-xs truncate block"
    [title]="weapon.key"  <!-- Add title attribute -->
    [innerHTML]="highlight(weapon.key)"
></span>
```

---

### T006 - Add title attribute with key value to items key cells in items.component.html

**File**: `src/app/features/data/items/items.component.html`
**Description**: Add `[title]="item.key"` to key span element (line ~511)
**Acceptance**: Hovering over truncated key shows full value in tooltip

**Change location**:

```html
<!-- Line ~511: Find key cell rendering -->
<span
    class="text-xs truncate block"
    [title]="item.key"  <!-- Add title attribute -->
    [innerHTML]="highlight(item.key)"
></span>
```

---

### T007 - Verify virtual scrolling performance with 1000+ items

**File**: Manual testing (no code changes)
**Description**: Test table rendering performance with large dataset
**Acceptance**: Scrolling remains smooth at 60fps with 1000+ items

**Test procedure**:

1. Load weapons or items page with 1000+ entries
2. Rapidly scroll up and down through table
3. Monitor for jank, stutter, or performance degradation
4. Verify virtual scrolling only renders visible rows (check DevTools)

---

### T008 - Validate column toggle functionality maintains layout integrity

**File**: Manual testing (no code changes)
**Description**: Test column toggling works with new truncation
**Acceptance**: Toggling columns doesn't break table layout or truncation

**Test procedure**:

1. Open column toggle dropdown
2. Show/hide various column combinations
3. Verify table width recalculates correctly
4. Verify key truncation still works with different column visibility

---

### T009 - Manual testing: Verify truncation works for extremely long keys

**File**: Manual testing (no code changes)
**Description**: Test edge case of extremely long keys (100+ characters)
**Acceptance**: Truncation handles keys up to 200 characters without breaking layout

**Test procedure**:

1. Create or find item with 100+ character key
2. Verify truncation displays with ellipsis
3. Verify hover tooltip shows complete key
4. Verify table layout remains stable

---

### T010 - Manual testing: Verify column sorting still works on key column

**File**: Manual testing (no code changes)
**Description**: Test sorting functionality on key column after changes
**Acceptance**: Clicking key column header sorts by key value

**Test procedure**:

1. Click key column header to sort ascending
2. Click again to sort descending
3. Verify sort order changes correctly
4. Verify truncation doesn't interfere with sorting

---

### T011 - Manual testing: Verify column toggle doesn't break with new truncation

**File**: Manual testing (no code changes)
**Description**: Test column visibility toggling works with truncation
**Acceptance**: Toggling columns doesn't break truncation or tooltips

**Test procedure**:

1. Toggle key column visibility off
2. Toggle other columns on/off
3. Toggle key column visibility back on
4. Verify truncation and tooltips still work

---

### T012 - Manual testing: Verify table works in both light and dark themes

**File**: Manual testing (no code changes)
**Description**: Test truncation and tooltips in both themes
**Acceptance**: Solution works correctly in light and dark modes

**Test procedure**:

1. Switch to light theme
2. Verify truncation displays correctly
3. Verify tooltips work
4. Switch to dark theme
5. Verify truncation displays correctly
6. Verify tooltips work

---

### T013 - Update AGENTS.md with table column width optimization guidance

**File**: `/Users/zhao/Documents/personal-projects/rwr-toolbox/AGENTS.md`
**Description**: Add guidance for future AI agents on table column width management
**Acceptance**: AGENTS.md documents the truncation pattern for future reference

---

### T014 - Create quickstart guide with testing scenarios

**File**: `/Users/zhao/Documents/personal-projects/rwr-toolbox/specs/001-optimize-table-column-width/quickstart.md`
**Description**: Document quickstart guide with testing scenarios for this feature
**Acceptance**: quickstart.md includes all acceptance test procedures

---

## Format Validation

✅ All tasks follow checklist format:

- [x] Checkbox prefix (`- [ ]`)
- [x] Task ID (T001-T014, sequential)
- [x] [P] marker for parallelizable tasks (T002, T004, T006)
- [x] [Story] labels for user story tasks (US1, US2, US3)
- [x] Clear descriptions with file paths
- [x] No story labels for Setup, Foundational, Polish phases

✅ Task count validation:

- Total tasks: 14
- User Story 1: 4 tasks (T001-T004)
- User Story 2: 2 tasks (T005-T006)
- User Story 3: 2 tasks (T007-T008)
- Polish phase: 4 tasks (T009-T012) + 2 documentation (T013-T014)

✅ Parallel opportunities identified:

- T001 & T002: Independent files, can run in parallel
- T003 & T004: Independent files, can run in parallel
- T005 & T006: Independent files, can run in parallel
- T007 & T008: Independent validations, can run in parallel
- T009-T012: Independent manual tests, can run in parallel

✅ Independent test criteria:

- US1: Can test by opening page and verifying column readability
- US2: Can test by hovering over truncated keys
- US3: Can test by loading 1000+ items and scrolling

✅ MVP scope identified:

- Suggested MVP: T001-T006 (User Stories 1 & 2 only)
- MVP delivers: Complete truncation + tooltip solution
- P2 validation (US3) recommended but not blocking

## Summary

**Feature**: Optimize Table Column Width for Long Keys
**Approach**: CSS-based truncation with native tooltips
**Complexity**: Low - 4 file modifications, no new infrastructure
**Risk**: Minimal - uses browser-native features, no breaking changes
**Estimated Effort**: 2-4 hours for MVP (US1 + US2), 1-2 hours for validation (US3)
