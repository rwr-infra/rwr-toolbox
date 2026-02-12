# Feature Specification: Table and Drawer UX Fixes

**Feature Branch**: `012-table-drawer-ux-fixes`
**Created**: 2026-02-12
**Status**: Draft
**Input**: User description: "Fix table and drawer UX issues in weapons and items pages: image skeleton visibility, 4K screen column width, drawer click-outside behavior"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Visible Image Loading Feedback (Priority: P1)

As a user viewing the weapons or items table, I want to clearly see when images are loading so that I know the system is working and images haven't failed to load.

**Why this priority**: Users currently cannot distinguish between "loading" and "failed to load" states, leading to confusion and negative perception of app reliability. This directly impacts user trust and experience.

**Independent Test**: Can be fully tested by opening the weapons/items page and observing that all image placeholders show a clear, visible loading animation or skeleton effect before images appear.

**Acceptance Scenarios**:

1. **Given** the weapons/items table is displayed with images loading, **When** images are being fetched, **Then** a clearly visible skeleton/animation effect is displayed in each image placeholder
2. **Given** an image is loading, **When** the user observes the placeholder, **Then** the loading indicator is immediately noticeable and distinct from an empty/failed state
3. **Given** an image fails to load, **When** loading completes with error, **Then** the placeholder shows a distinct "no image" icon (different from loading state)

---

### User Story 2 - Correct Column Width on High-Resolution Screens (Priority: P1)

As a user on a 4K or high-DPI screen, I want the File Path column (and all columns) to render correctly with content filling the full column width so that the table looks consistent and professional.

**Why this priority**: The current bug makes the application appear broken on high-end displays, which is particularly noticeable to power users who are likely to use such displays. This impacts perceived quality.

**Independent Test**: Can be fully tested by viewing the table on a 4K screen and verifying that the File Path column content renders at full width matching the header, with no blank space on the right side.

**Acceptance Scenarios**:

1. **Given** the table is displayed on a 4K/high-DPI screen, **When** the user scrolls horizontally, **Then** the File Path column content fills the full column width matching the header
2. **Given** the table is displayed, **When** the user scrolls to any position, **Then** all column content widths remain aligned with their respective headers
3. **Given** the table content area is scrolled, **When** scrolling occurs, **Then** column alignment is maintained (no visual disconnect between header and content)

---

### User Story 3 - Intuitive Drawer Interaction (Priority: P2)

As a user with the detail drawer open, I want to be able to close it by clicking outside, but if I click on another item, I want the drawer to switch to show that item's details instead of just closing.

**Why this priority**: This improves workflow efficiency - users can quickly browse through multiple items without manually closing and reopening the drawer. Standard click-outside-to-close behavior is expected UX.

**Independent Test**: Can be fully tested by opening the drawer, clicking outside (closes drawer), then opening drawer again and clicking a different item (drawer switches content without closing).

**Acceptance Scenarios**:

1. **Given** the detail drawer is open showing an item's details, **When** the user clicks on the background/overlay area outside the drawer, **Then** the drawer closes
2. **Given** the detail drawer is open, **When** the user clicks on a different weapon/item row in the table, **Then** the drawer immediately displays the newly selected item's details without closing first
3. **Given** the detail drawer is open showing item A, **When** the user clicks on item B in the table, **Then** the selection highlight updates to item B and drawer shows item B's details

---

### Edge Cases

- What happens when an image takes an unusually long time to load? (Loading indicator should persist until load completes or fails)
- What happens when rapidly clicking multiple items while drawer animation is playing? (Should handle gracefully, showing the last clicked item)
- What happens when the table is empty? (Drawer should not open)
- What happens on very narrow viewports? (Drawer behavior should remain consistent)

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST display a clearly visible loading indicator in image placeholders while images are being fetched
- **FR-002**: The system MUST distinguish visually between "loading", "loaded", and "failed" states for images
- **FR-003**: The system MUST render table column content at full width matching the header width on all screen resolutions including 4K/high-DPI displays
- **FR-004**: The system MUST maintain column alignment between header and content during horizontal scrolling
- **FR-005**: The system MUST close the detail drawer when the user clicks outside the drawer on the background area
- **FR-006**: The system MUST switch the drawer content to show a different item's details when the user clicks on another item while the drawer is open (instead of closing)
- **FR-007**: All fixes MUST be applied consistently to both the weapons page and the items page

### Key Entities

- **Image Placeholder**: Visual container for item/weapon images with distinct loading, loaded, and error states
- **Detail Drawer**: Side panel showing expanded information about a selected item/weapon
- **Table Row**: Clickable row representing an item/weapon that can trigger drawer actions

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can distinguish between "loading" and "failed" image states at a glance without confusion
- **SC-002**: Table columns display correctly aligned on 4K screens (3840x2160 resolution) with no blank space on the right side of the File Path column
- **SC-003**: Drawer interaction follows expected behavior: click-outside closes, click-other-item switches content
- **SC-004**: All three fixes work identically on both weapons and items pages
- **SC-005**: No regression in existing table scrolling performance or drawer open/close animations
