# Research: Pagination Previous/Next Buttons

**Feature**: 013-pagination-prev-next
**Date**: 2026-02-12

## Research Questions

### Q1: What icons should be used for Previous/Next buttons?

**Decision**: Use `chevron-left` and `chevron-right` from Lucide Angular.

**Rationale**:
- Chevron icons are the standard pattern for pagination navigation
- Already used elsewhere in the application (e.g., chevron-down in accordion headers)
- Lucide Angular is the required icon library per constitution
- Icons are universal and don't require text labels, reducing i18n complexity

**Alternatives Considered**:
- `arrow-left`/`arrow-right`: More commonly used for navigation/back actions, not pagination
- Text-only buttons ("Previous"/"Next"): Would require more space and i18n labels
- `chevrons-left`/`chevrons-right` (double chevrons): Typically used for "first"/"last" page, not adjacent pages

### Q2: Should buttons be disabled or hidden when navigation is not possible?

**Decision**: Use disabled state with visual opacity reduction.

**Rationale**:
- Consistent with DaisyUI button patterns
- Maintains visual layout stability (buttons don't disappear/appear)
- Users can still see the navigation options, just unavailable
- Disabled state is indicated via `[disabled]` attribute and `btn-disabled` class

**Alternatives Considered**:
- Hidden buttons: Would cause layout shift, confusing UX
- Hidden with aria-hidden: Same layout issues

### Q3: How should the buttons integrate with existing pagination?

**Decision**: Add Previous button before page numbers, Next button after page numbers within the same `join` group.

**Rationale**:
- DaisyUI `join` group creates connected button appearance
- Current implementation uses `join` for page numbers
- Adding buttons at edges maintains visual coherence
- Pattern follows standard pagination UX conventions

**Current Structure**:
```html
<div class="join order-1 sm:order-2 shadow-sm border border-base-300">
    @for (page of getPageNumbers(); track page) {
        <!-- page buttons -->
    }
</div>
```

**New Structure**:
```html
<div class="join order-1 sm:order-2 shadow-sm border border-base-300">
    <!-- Previous button -->
    <button class="btn btn-xs join-item bg-base-100"
            [disabled]="pagination().currentPage === 1"
            (click)="onPageChange(pagination().currentPage - 1)">
        <i-lucide name="chevron-left" class="h-4 w-4"></i-lucide>
    </button>
    @for (page of getPageNumbers(); track page) {
        <!-- page buttons -->
    }
    <!-- Next button -->
    <button class="btn btn-xs join-item bg-base-100"
            [disabled]="pagination().currentPage === totalPages()"
            (click)="onPageChange(pagination().currentPage + 1)">
        <i-lucide name="chevron-right" class="h-4 w-4"></i-lucide>
    </button>
</div>
```

### Q4: Are the required icons already registered?

**Decision**: Verify `chevron-left` and `chevron-right` are in the icon registry.

**Research Result**: Need to check `src/app/shared/icons/index.ts` to verify. The `chevron-down` and `chevron-up` icons are already used for sorting indicators, so the chevron family is likely available.

### Q5: Should tooltip/title attributes be added?

**Decision**: Add title attributes for accessibility and user guidance.

**Rationale**:
- Provides context for screen readers
- Shows tooltip on hover for mouse users
- Follows accessibility best practices
- Uses i18n keys: `pagination.prev` and `pagination.next`

## Technical Decisions Summary

| Aspect | Decision | Implementation |
|--------|----------|----------------|
| Icons | chevron-left, chevron-right | Lucide Angular components |
| Disabled state | CSS opacity via [disabled] | DaisyUI btn-disabled class |
| Position | Edges of join group | Before/after page numbers |
| Title | i18n keys | pagination.prev, pagination.next |
| Size | btn-xs | Matches existing page buttons |

## Files to Modify

1. `src/app/shared/icons/index.ts` - Verify/add chevron-left, chevron-right
2. `src/app/features/data/weapons/weapons.component.html` - Add prev/next buttons
3. `src/app/features/data/items/items.component.html` - Add prev/next buttons
4. `src/assets/i18n/en.json` - Add pagination.prev, pagination.next
5. `src/assets/i18n/zh.json` - Add pagination.prev, pagination.next
