# Quickstart: Pagination Previous/Next Buttons

**Feature**: 013-pagination-prev-next
**Date**: 2026-02-12

## Overview

This feature adds Previous/Next navigation buttons to the pagination controls in the weapons and items table pages. The buttons are positioned at the edges of the pagination group and use chevron icons for universal recognition.

## Implementation Summary

### Files to Modify

| File | Change |
|------|--------|
| `src/app/features/data/weapons/weapons.component.html` | Add prev/next buttons |
| `src/app/features/data/items/items.component.html` | Add prev/next buttons |
| `src/assets/i18n/en.json` | Add pagination.prev, pagination.next |
| `src/assets/i18n/zh.json` | Add pagination.prev, pagination.next |

### Prerequisites

- ✅ `chevron-left` icon registered in `src/app/shared/icons/index.ts`
- ✅ `chevron-right` icon registered in `src/app/shared/icons/index.ts`
- ✅ Existing pagination signals: `pagination().currentPage`, `totalPages()`
- ✅ Existing method: `onPageChange(page: number)`

## Test Scenarios

### Scenario 1: Previous Button Navigation

**Prerequisites**: Data loaded with multiple pages, currently on page 2+

1. Navigate to weapons or items page
2. Ensure table has multiple pages of data
3. Navigate to page 2 or higher (click page number)
4. Click the Previous button (chevron-left)
5. **Expected**: Table shows page 1 content, page 1 is highlighted

**Edge Case - First Page**:
1. Ensure current page is 1
2. **Expected**: Previous button is disabled (opacity reduced, not clickable)

### Scenario 2: Next Button Navigation

**Prerequisites**: Data loaded with multiple pages, not on last page

1. Navigate to weapons or items page
2. Ensure table has multiple pages of data
3. Ensure current page is not the last page
4. Click the Next button (chevron-right)
5. **Expected**: Table shows next page content, page number increments

**Edge Case - Last Page**:
1. Navigate to the last page (click highest page number)
2. **Expected**: Next button is disabled (opacity reduced, not clickable)

### Scenario 3: Single Page Data

**Prerequisites**: Data loaded with only one page

1. Load data that fits on a single page (or set page size high enough)
2. **Expected**: Both Previous and Next buttons are disabled

### Scenario 4: Rapid Clicking

**Prerequisites**: Multiple pages available

1. Rapidly click Next button multiple times
2. **Expected**: Only one page advances per click, no skipped pages

## Visual Verification

### Light Theme
- Verify buttons match DaisyUI light theme
- Verify disabled state has reduced opacity

### Dark Theme
- Verify buttons match DaisyUI dark theme
- Verify disabled state is still visible but clearly inactive

## Code Pattern

### Template Structure

```html
<!-- Page Navigation -->
<div class="join order-1 sm:order-2 shadow-sm border border-base-300">
    <!-- Previous Button -->
    <button
        class="btn btn-xs join-item bg-base-100"
        [disabled]="pagination().currentPage === 1"
        [title]="'pagination.prev' | transloco"
        (click)="onPageChange(pagination().currentPage - 1)"
    >
        <i-lucide name="chevron-left" class="h-4 w-4"></i-lucide>
    </button>

    <!-- Page Numbers (existing) -->
    @for (page of getPageNumbers(); track page) {
        <!-- ... existing page number buttons ... -->
    }

    <!-- Next Button -->
    <button
        class="btn btn-xs join-item bg-base-100"
        [disabled]="pagination().currentPage === totalPages()"
        [title]="'pagination.next' | transloco"
        (click)="onPageChange(pagination().currentPage + 1)"
    >
        <i-lucide name="chevron-right" class="h-4 w-4"></i-lucide>
    </button>
</div>
```

### i18n Keys

```json
// en.json
{
  "pagination": {
    "prev": "Previous page",
    "next": "Next page"
  }
}

// zh.json
{
  "pagination": {
    "prev": "上一页",
    "next": "下一页"
  }
}
```

## Success Criteria

- [ ] Previous button navigates to previous page when not on page 1
- [ ] Previous button is disabled when on page 1
- [ ] Next button navigates to next page when not on last page
- [ ] Next button is disabled when on last page
- [ ] Both buttons disabled when only one page exists
- [ ] Buttons styled consistently with page number buttons
- [ ] Both weapons and items pages updated identically
- [ ] Works in both light and dark themes
- [ ] Tooltips display correctly in both languages
