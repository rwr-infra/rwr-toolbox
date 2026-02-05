# Feature Specification: Optimize Table Column Width for Long Keys

**Feature Branch**: `001-optimize-table-column-width`
**Created**: 2026-02-05
**Status**: Draft
**Input**: User description: "现在存在部分 key 过长导致挤压其他列的问题, 思考有啥合适的方案优化, 见 @src/app/features/data/weapons/weapons.component.html 与 @src/app/features/data/items/items.component.html"

## User Scenarios & Testing _(mandatory)_

### User Story 1 - View Tables with Readable Content (Priority: P1)

Users browsing weapons and items tables should be able to see all columns clearly without long keys squeezing other columns, making all information readable at a glance.

**Why this priority**: This is the core usability issue - users cannot properly view table data when columns are compressed. It affects the primary functionality of viewing and comparing weapons/items.

**Independent Test**: Can be fully tested by opening either the weapons or items page and verifying that all columns are visible and readable, even when some keys are very long.

**Acceptance Scenarios**:

1. **Given** a table with items having long keys (e.g., 50+ characters), **When** the table renders, **Then** the key column should not compress other columns below their minimum readable width
2. **Given** a row with a key longer than the column width, **When** the user views the row, **Then** the key content should be visually complete or clearly indicate truncation with hover access to full content
3. **Given** a table with varying key lengths, **When** the table displays, **Then** all columns should maintain consistent alignment and readability across all rows

---

### User Story 2 - Access Full Key Content on Demand (Priority: P1)

Users should be able to see the complete key value when needed, even if it's truncated in the table view.

**Why this priority**: While showing truncated content helps with layout, users still need to see the full key for reference, copying, or verification purposes.

**Independent Test**: Can be fully tested by hovering over truncated keys and verifying the full content is visible via tooltip or other mechanism.

**Acceptance Scenarios**:

1. **Given** a truncated key in the table, **When** the user hovers over it, **Then** the complete key value should be displayed in a tooltip
2. **Given** a user needs the full key for copying, **When** they click or use a dedicated action on the key cell, **Then** the full key value should be accessible

---

### User Story 3 - Maintain Table Performance with Large Datasets (Priority: P2)

The solution should maintain the current performance characteristics when displaying large datasets with virtual scrolling.

**Why this priority**: Performance is critical for user experience, especially when dealing with hundreds or thousands of weapons/items. Any solution should not degrade the current virtual scrolling performance.

**Independent Test**: Can be fully tested by loading a large dataset (500+ items) and scrolling through the table, verifying smooth rendering and no lag.

**Acceptance Scenarios**:

1. **Given** a table with 1000+ items, **When** the user scrolls rapidly through the table, **Then** the table should render smoothly without jank or performance degradation
2. **Given** virtual scrolling is active, **When** the viewport changes, **Then** only visible rows should be processed/rendered

---

### Edge Cases

- What happens when a key is extremely long (e.g., 200+ characters)?
- How does the solution behave when multiple consecutive rows have very long keys?
- What happens when the table is resized or the window is made very narrow?
- How does the solution handle empty key values or null keys?
- What happens when the table has no visible items/weapons?

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: System MUST display keys in the weapons and items tables without compressing other columns below their minimum readable width
- **FR-002**: System MUST provide a way for users to view the complete key value when a key is truncated in the table view
- **FR-003**: System MUST maintain table layout consistency across all rows regardless of key length variation
- **FR-004**: System MUST support the existing column toggle functionality without breaking when keys are long
- **FR-005**: System MUST preserve the current virtual scrolling performance when rendering large datasets
- **FR-006**: System MUST handle extremely long keys (100+ characters) gracefully without breaking layout
- **FR-007**: System MUST maintain sortable functionality on the key column after implementing the optimization

### Key Entities

- **Weapon Table**: Displays weapon data including keys, names, attributes, and images
- **Item Table**: Displays item data including keys, names, attributes, and images
- **Table Column**: Represents a single column in the table (e.g., key, name, image, etc.)
- **Table Row**: Represents a single weapon or item displayed in the table

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: Users can view all columns in the weapons and items tables without horizontal scrolling or unreadable compression, regardless of key length
- **SC-002**: When keys exceed the column width, the full key is accessible via hover tooltip within 200ms of mouse hover
- **SC-003**: Table scrolling remains smooth (60fps) when displaying 1000+ items with varying key lengths
- **SC-004**: Column toggling functionality works correctly and maintains layout integrity when showing/hiding columns
- **SC-005**: Users report no issues with table readability or key visibility in usability testing (90%+ satisfaction)
- **SC-006**: Key column sorting continues to work correctly after the optimization is implemented
- **SC-007**: The solution handles keys up to 200 characters without breaking table layout

## Assumptions

- The current virtual scrolling implementation using Angular CDK should be preserved
- Column width calculations should respect both minimum and maximum constraints
- The solution should work consistently across both weapons and items tables
- Tooltip functionality for showing full keys is acceptable and user-friendly
- Truncation with ellipsis (e.g., "very_long_ke...") is a standard and expected pattern for this use case
