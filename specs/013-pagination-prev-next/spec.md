# Feature Specification: Pagination Previous/Next Buttons

**Feature Branch**: `013-pagination-prev-next`
**Created**: 2026-02-12
**Status**: Draft
**Input**: User description: "Add Previous/Next page buttons to pagination controls in items and weapons pages"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Navigate to Previous Page (Priority: P1)

As a user browsing the weapons or items table, I want a "Previous" button to quickly go back to the previous page without having to find and click the specific page number.

**Why this priority**: Sequential page navigation is a common use case when browsing through data. Users often want to go back to review items they just saw.

**Independent Test**: Can be fully tested by navigating to page 2 or higher and clicking the Previous button to verify the page changes to the previous page number.

**Acceptance Scenarios**:

1. **Given** the user is on page 2 or higher, **When** they click the "Previous" button, **Then** the table displays the previous page of data and the page indicator updates accordingly
2. **Given** the user is on page 1, **When** they view the pagination controls, **Then** the "Previous" button is disabled or hidden to indicate no previous page exists

---

### User Story 2 - Navigate to Next Page (Priority: P1)

As a user browsing the weapons or items table, I want a "Next" button to quickly advance to the next page without having to find and click the specific page number.

**Why this priority**: Sequential page navigation is essential for browsing through large datasets. The Next button is the primary way users advance through paginated content.

**Independent Test**: Can be fully tested by being on any page except the last and clicking the Next button to verify the page advances by one.

**Acceptance Scenarios**:

1. **Given** the user is not on the last page, **When** they click the "Next" button, **Then** the table displays the next page of data and the page indicator updates accordingly
2. **Given** the user is on the last page, **When** they view the pagination controls, **Then** the "Next" button is disabled or hidden to indicate no next page exists

---

### Edge Cases

- What happens when there is only one page of data? (Both Previous and Next buttons should be disabled or hidden)
- What happens when the user rapidly clicks Next/Previous? (Should handle gracefully without skipping pages)
- What happens on mobile/touch devices? (Buttons should be large enough to tap easily)

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The pagination controls MUST include a "Previous" button that navigates to the previous page when clicked
- **FR-002**: The pagination controls MUST include a "Next" button that navigates to the next page when clicked
- **FR-003**: The "Previous" button MUST be disabled or visually indicate unavailability when the user is on the first page
- **FR-004**: The "Next" button MUST be disabled or visually indicate unavailability when the user is on the last page
- **FR-005**: Both buttons MUST be consistently styled and positioned at the edges of the pagination control group
- **FR-006**: The buttons MUST be applied to both the weapons page and the items page for consistency
- **FR-007**: The pagination layout MUST maintain a stable width with a fixed 5-slot window pattern:
  - Always show first page, current page window (up to 5 visible pages), and last page
  - Use ellipsis (...) only where there's a gap between first/current window or current window/last
  - Example with 20 total pages:
    - Page 1-3: `< 1 2 3 4 5 ... 20 >`
    - Page 5: `< 1 ... 3 4 5 6 7 ... 20 >`
    - Page 10: `< 1 ... 8 9 10 11 12 ... 20 >`
    - Page 18-20: `< 1 ... 16 17 18 19 20 >`
  - This prevents buttons from shifting position as users navigate

### Key Entities

- **Pagination Control**: UI component containing page number buttons and Previous/Next navigation buttons
- **Page State**: Current page number, total pages, and navigation boundaries (first/last page detection)

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can navigate to adjacent pages with a single click using Previous/Next buttons
- **SC-002**: Visual feedback (disabled state) clearly indicates when navigation is not possible (first/last page)
- **SC-003**: Both weapons and items pages have identical pagination control behavior
- **SC-004**: No regression in existing page number click functionality
- **SC-005**: Pagination maintains stable width across all pages (no button jumping)

## Clarifications

### Session 2026-02-12

- Q: What pagination layout pattern should be used for stable width? → A: Fixed 5-slot window with first page, current window, and last page always visible. Ellipsis used only for gaps.
