# Feature Specification: Optimize Menu Page Styles

**Feature Branch**: `001-ui-style-optimization`  
**Created**: 2026-01-21  
**Status**: Draft  
**Input**: User description: "根据我们的 UI 规范优化现有所有菜单页面样式, 首先从 @src/app/features/settings/settings.component.html 开始, 其次重点优化 @src/app/features/data/weapons/weapons.component.html 和 @src/app/features/data/items/items.component.html . 要给适当的按钮间距, 查询操作控件尽量在同一个区域内"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Unified Settings Experience (Priority: P1)

As a user, I want a clean and organized settings page so that I can easily configure the application without visual noise.

**Why this priority**: Settings is the entry point for configuration and impacts initial user impression.

**Independent Test**: Can be fully tested by navigating to the Settings page and verifying layout consistency and button spacing.

**Acceptance Scenarios**:

1. **Given** the Settings page, **When** viewed on different screen sizes, **Then** cards and form controls should be consistently spaced and follow DaisyUI patterns.
2. **Given** multiple settings options, **When** action buttons are present, **Then** there should be a visible gap between them.

---

### User Story 2 - Efficient Data Querying (Priority: P1)

As a user, I want search and filter controls for weapons to be grouped together so that I can quickly find specific items without scanning the entire page for buttons.

**Why this priority**: Core functionality of the toolbox is searching through data; efficiency here is critical.

**Independent Test**: Can be fully tested by using the Weapons page filters and verifying they are contained within a single "control area".

**Acceptance Scenarios**:

1. **Given** the Weapons page, **When** looking for search and filter options, **Then** they should be grouped in a single top-level container (e.g., a card or toolbar).
2. **Given** the action buttons (Refresh, Toggle Mode, etc.), **When** displayed alongside search inputs, **Then** they should have consistent spacing and alignment.

---

### User Story 3 - Consistent Item Management (Priority: P2)

As a user, I want the Items page to have the same layout and control grouping as the Weapons page so that I have a consistent experience across all data views.

**Why this priority**: Consistency reduces cognitive load for the user.

**Independent Test**: Can be fully tested by comparing the Items page layout with the optimized Weapons page.

**Acceptance Scenarios**:

1. **Given** the Items page, **When** compared to the Weapons page, **Then** the search/filter area should follow the same structural pattern.

---

### Edge Cases

- **Small Viewports**: How do grouped controls behave on mobile devices? (They should stack or wrap cleanly).
- **Empty States**: Do the grouped control areas remain visible when no results are found? (Yes, they should).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Settings page MUST use consistent card-based layout with standard padding and margins.
- **FR-002**: Weapons page query controls (Search, Tag Filter, Page Size, Refresh, etc.) MUST be grouped in a dedicated container area at the top.
- **FR-003**: Items page query controls MUST be grouped in a dedicated container area mirroring the Weapons page layout.
- **FR-004**: All adjacent buttons MUST have appropriate spacing (using Tailwind `gap` classes).
- **FR-005**: All menu pages MUST adhere to the DaisyUI v5 and Tailwind v4 themes active in the project.

### Key Entities *(include if feature involves data)*

- **Control Area**: A UI container grouping search inputs, selects, and action buttons.
- **Spacing Standard**: A consistent gap value (e.g., `gap-2` or `gap-4`) applied to all action groups.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Search and filter controls on Weapons and Items pages are contained within a single visual "toolbar" or "filter block".
- **SC-002**: A minimum of 8px (`gap-2`) spacing is present between all horizontally or vertically adjacent buttons.
- **SC-003**: 100% of the specified pages (Settings, Weapons, Items) pass a visual check against the project's DaisyUI theme standards.
- **SC-004**: Task completion time for "Finding a specific weapon with filters" is improved by reducing mouse travel between controls.
