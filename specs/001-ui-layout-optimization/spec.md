# Feature Specification: UI Layout and Performance Optimization

**Feature Branch**: `001-ui-layout-optimization`
**Created**: 2026-01-22
**Status**: Draft
**Input**: User description: "优化 UI 布局与性能问题: 1. 现在 data 菜单路由的顶部 Weapons 与 Items 与下方内容的间距过大，需要修复 2. data 菜单路由下: Advanced Search 折叠面板打开存在卡顿 3. data 菜单路由下: 表格下方的分页器始终在屏幕外了，即使我切换布局模式 4. data 菜单路由下: 切换布局模式按钮不够直观，重新挑选 lucide-angular 的合适的 icon 5. players 菜单路由下: Search 与输入框被都挤在了第一行，需要与隔壁的 database 与 per page 的布局一致(上下)"

## Clarifications

### Session 2026-01-22

- Q: Reference implementation for Data pages layout toggle → A: Use src/app/features/players/ as the reference pattern for layout toggle implementation, as it demonstrates the desired behavior
- Q: Players page filter layout grid pattern → A: Use same responsive grid as Servers page: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4` (4 columns on large screens, 2 columns on small, 1 column on mobile)
- Q: Animation approach for Advanced Search panel performance → A: Use DaisyUI collapse component (optimize existing implementation rather than replacing with alternative solutions)
- Q: CSS optimization technique for DaisyUI collapse performance → A: Add GPU acceleration hints (`will-change`, `transform: translateZ(0)`) to collapse-content for smooth 60fps animation
- Q: Scope of GPU acceleration optimization → A: Apply only to Advanced Search panels in weapons and items components (targeted fix, minimal risk)
- Q: Fallback strategy for GPU acceleration issues → A: No fallback needed (96%+ browser support, properties safely ignored if unsupported)
- Q: CSS implementation location for GPU acceleration → A: Component-specific via `:host .collapse .collapse-content` selector in weapons/items components (scoped, co-located)
- Q: Loading feedback style for images in lists and detail panels → A: Skeleton Loaders (gray pulse boxes) to maintain layout stability during asynchronous icon resolution.
- Q: Strategy to prevent data scanning/image resolution from blocking UI route switching → A: Use asynchronous icon resolution and progressive rendering (lazy loading) to ensure the main thread remains responsive for sidebar navigation.
- Q: Technical implementation for keeping the UI responsive during intensive processing → A: Micro-task Yielding (inserting small breaks in loops using `await Promise.resolve()` or similar) to allow the main thread to handle user interaction/navigation events.

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Navigation Tab Spacing (Priority: P1)

When users navigate to Data section, they see Weapons and Items navigation tabs. Currently, there is excessive vertical spacing between these tabs and main content area below, wasting screen real estate and creating a disconnected visual feel.

**Why this priority**: This is a fundamental layout issue that affects the entire Data section and impacts first impressions. The excessive spacing reduces available space for data tables and makes the interface feel poorly designed.

**Independent Test**: Can be fully tested by navigating to the Data section and visually verifying that the navigation tabs are appropriately positioned near the content with no excessive whitespace.

**Acceptance Scenarios**:

1. **Given** a user navigates to the Data section (Weapons or Items route), **When** the page loads, **Then** the navigation tabs should be positioned directly adjacent to the content with minimal spacing (approximately 0.5-1rem of margin)
2. **Given** a user is on the Data section, **When** they resize the browser window, **Then** the spacing between the tabs and content should remain consistent and proportional

---

### User Story 2 - Advanced Search Performance (Priority: P1)

When users want to use advanced filtering options in the Data section, they click to expand the "Advanced Search" collapse panel. Currently, this action causes noticeable lag and delay, creating a poor user experience.

**Why this priority**: Performance issues directly impact user satisfaction and the perceived quality of the application. The lag makes the application feel unresponsive and may discourage users from utilizing advanced search features.

**Independent Test**: Can be fully tested by repeatedly toggling the Advanced Search panel open and closed, measuring the time and observing for any perceptible delay (should be under 100ms).

**Acceptance Scenarios**:

1. **Given** a user is on the Weapons or Items page, **When** they click to expand the Advanced Search panel, **Then** the panel should expand smoothly without perceptible lag (under 100ms)
2. **Given** the Advanced Search panel is open, **When** the user closes it, **Then** the panel should collapse smoothly without lag
3. **Given** the user has entered data in the Advanced Search fields, **When** they toggle the panel, **Then** the expansion/collapse should still perform smoothly without lag

---

### User Story 3 - Pagination Visibility (Priority: P1)

When users view data tables in the Data section, the pagination controls at the bottom are positioned off-screen, requiring scrolling to access them. This persists even when switching layout modes, making navigation through large datasets difficult.

**Why this priority**: Pagination controls are essential for navigating large datasets. When they're not visible, users must scroll to find them, creating friction and potentially causing users to miss the ability to navigate to other pages.

**Independent Test**: Can be fully tested by loading a dataset with multiple pages and verifying that the pagination controls are visible without scrolling, then testing both layout modes.

**Acceptance Scenarios**:

1. **Given** a user is viewing a data table with multiple pages, **When** the page loads, **Then** the pagination controls should be visible within the viewport without requiring scrolling
2. **Given** the pagination controls are visible, **When** the user switches the layout mode, **Then** the pagination controls should remain visible in the new layout mode
3. **Given** the user is on a smaller screen, **When** the page loads, **Then** the pagination controls should still be visible or easily accessible without excessive scrolling

---

### User Story 4 - Layout Mode Toggle Icon (Priority: P2)

When users want to switch between full-page and table-only scrolling modes, they use the toggle button. Currently, the icon used for this button is not intuitive, and users may not understand its purpose without hovering for a tooltip.

**Why this priority**: While the button works functionally, an unintuitive icon reduces discoverability and makes the interface less user-friendly. Users should be able to understand button functions at a glance.

**Independent Test**: Can be fully tested by viewing the toggle button and assessing whether the icon clearly communicates its purpose without requiring tooltips.

**Acceptance Scenarios**:

1. **Given** a user is viewing the Data page, **When** they see the layout mode toggle button, **Then** the icon should clearly represent switching between view modes (using a layout/grid icon that is more intuitive than the current choice)
2. **Given** the layout mode toggle is in table-only mode, **When** the user looks at the icon, **Then** the icon should visually indicate the current state (table-only vs full-page)
3. **Given** the layout mode toggle is in full-page mode, **When** the user looks at the icon, **Then** the icon should visually indicate the current state

---

### User Story 5 - Players Search Layout (Priority: P1)

When users navigate to the Players section, the Search label and input field are arranged horizontally alongside other controls. This creates an inconsistent layout compared to the "Database" and "Per Page" sections, which use vertical stacking (label above input).

**Why this priority**: Layout inconsistency across the application creates a disjointed user experience and makes the interface feel less polished. Consistent patterns help users form mental models of how the application works.

**Independent Test**: Can be fully tested by navigating to the Players page and verifying that all form controls use the same vertical stacking pattern (label above input).

**Acceptance Scenarios**:

1. **Given** a user navigates to the Players section, **When** the page loads, **Then** the Search section should use a vertical layout with the label positioned above the input field
2. **Given** the Search section uses a vertical layout, **When** compared to the Database and Per Page sections, **Then** all three sections should follow the same vertical stacking pattern for visual consistency
3. **Given** the user is on a small screen, **When** viewing the Players page, **Then** the vertical layout should still maintain readability and appropriate spacing

---

### User Story 6 - Non-Blocking Loading & Feedback (Priority: P1)

When the Data section is scanning game files or resolving weapon/item icons, the UI remains unresponsive to sidebar navigation or other interactions. Currently, background processes block the main thread. Additionally, icons appear suddenly without any "loading" state in the list or detail panels.

**Why this priority**: Main thread blockage makes the app feel "frozen" and "broken," which is a critical UX failure. Providing visual feedback for assets like icons improves perceived speed and professional feel.

**Independent Test**: Trigger a "Rescan All" or navigate to a large dataset and verify that clicking a sidebar menu item (e.g., Dashboard or Players) immediately changes the route despite background work. Verify skeleton loaders appear in table cells and detail drawers.

**Acceptance Scenarios**:

1. **Given** a data scan or icon resolution is in progress, **When** the user clicks a sidebar menu item, **Then** the application should immediately navigate to the new route without lag
2. **Given** weapon or item icons are being resolved asynchronously, **When** the list is displayed, **Then** each image cell should show a skeleton loader (gray pulse box) until the icon is ready
3. **Given** the detail side panel is open, **When** an icon is loading, **Then** the image area should show a skeleton loader matching the icon's dimensions

---

### Edge Cases

- What happens when the browser window is resized to very small dimensions (mobile view)?
- How does the system handle high-resolution displays where spacing might appear different?
- What happens when the Advanced Search panel contains large amounts of data during expansion?
- How does the layout behave when there are only a few items (no pagination needed)?
- What happens when users have custom browser zoom levels affecting the perceived spacing?

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: System MUST reduce vertical spacing between Data section navigation tabs (Weapons/Items) and main content area to approximately 0.5-1rem
- **FR-002**: System MUST ensure Advanced Search collapse panel opens and closes within 100ms without perceptible lag, using optimized DaisyUI collapse component with GPU acceleration hints (`will-change: transform, opacity` and `transform: translateZ(0)` on collapse-content) implemented via component-specific `:host .collapse .collapse-content` selector in weapons and items components only
- **FR-003**: System MUST position pagination controls within the viewport when Data pages load, without requiring scrolling
- **FR-004**: System MUST maintain pagination visibility when users switch between layout modes (full-page vs table-only)
- **FR-005**: System MUST replace current layout mode toggle icon with a more intuitive icon from lucide-angular (such as "layout-grid" or "layout-list" variants)
- **FR-006**: System MUST update layout mode toggle icon to visually indicate current active state (different icons for table-only vs full-page)
- **FR-007**: System MUST restructure Players page Search section to use vertical layout with label above input field
- **FR-008**: System MUST ensure consistent vertical stacking pattern across all form controls in Players page (Database, Search, Per Page, Favorites) using same responsive grid pattern as Servers page: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`
- **FR-009**: System MUST maintain responsive behavior for all layout optimizations across different screen sizes
- **FR-010**: System MUST preserve all existing functionality while implementing layout improvements
- **FR-011**: System MUST implement asynchronous, non-blocking icon resolution for Weapons and Items to prevent main-thread blockage during navigation
- **FR-012**: System MUST show skeleton loaders (gray pulse boxes) in image cells of tables while icons are being resolved
- **FR-013**: System MUST show skeleton loaders in the image area of the detail side panels while icons are being resolved
- **FR-014**: System MUST ensure that sidebar route switching remains functional and responsive (<100ms) even while data scanning or icon resolution is in progress
- **FR-015**: System MUST use micro-task yielding during heavy processing loops to prevent thread blocking

### Key Entities

- **Navigation Tab Component**: The UI element displaying Weapons/Items tabs in the Data section
- **Advanced Search Panel**: The collapsible panel containing the advanced filtering options
- **Pagination Component**: The controls for navigating between data pages
- **Layout Mode Toggle**: The button that that switches between full-page and table-only scrolling modes
- **Players Form Controls**: The collection of input fields (Database, Search, Per Page, Favorites) on the Players page

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: Users can navigate to Data pages and see content within 200ms of page load
- **SC-002**: Advanced Search panel expansion completes in under 100ms on 95% of interactions
- **SC-003**: Pagination controls are visible in the viewport on 100% of Data page loads without scrolling
- **SC-004**: At least 80% of users correctly identify the layout mode toggle button function without using tooltips (measured via user testing or feedback)
- **SC-005**: All form controls on the Players page use consistent vertical spacing and alignment
- **SC-006**: Navigation tab spacing is reduced by at least 50% compared to the previous implementation
- **SC-007**: All layout optimizations work correctly on screen sizes from 320px to 2560px wide
- **SC-008**: Sidebar menu clicks trigger route changes in under 100ms during background data processing
- **SC-009**: 100% of image placeholders in Data section show skeleton pulse effect while loading
