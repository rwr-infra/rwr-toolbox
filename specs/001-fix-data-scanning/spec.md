# Feature Specification: Fix Data Scanning Errors and UX Improvements

**Feature Branch**: `001-fix-data-scanning`
**Created**: 2025-01-21
**Status**: Draft
**Input**: User description: "现在存在如下问题需要修复:
1. 现在扫描武器时发现有错误, 具体错误是 `No such file or directory (os error 2)`, 但是这个文件扫描是真实存在的, 见 @src/app/features/data/weapons/services/weapon.service.ts 上的 log, 我们 log 中的单项值如下:
```
error: "No such file or directory (os error 2)"

file: "/Users/zhao/Steam/rwr_game_source/RunningWithRifles.app/Contents/Resources/media/packages/man_vs_zombies/weapons/m202_flash.weapon"

severity: "error"
```
2. items 同上, 也需要修复
3. 现在启动后即使配置是有扫描的文件夹, 首次进入 'data' 路由也会显示请先配置文件夹而不是触发扫描
4. 设置中的扫描文件夹应该是多选项可激活可删除, 所以对应的 data 的页面 weapons 和 items 都是扫描所有激活的目录
5. 设置中的扫描文件夹列表的单项 UI 一直显示 0 items, 我现在期望显示 packages 的目录列表, 改为显示 "{x} packages"
6. 根据最新的 UI 规范优化 'data' 内页面的 UI
7. weapon 和 item 的单项抽屉详情现在图片很大, 所以不要独立显示在上面, 应该显示在标题下(也就是内容区域)第一行"

## Clarifications

### Session 2025-01-21

- **Q**: How should items/weapons with missing template files be handled in the UI list vs detail view?
  **A**: Items/weapons with missing templates MUST still be displayed in the list/table (not hidden or filtered out). In the detail drawer, show a warning/indicator that the template could not be resolved, but still display the available data.

- **Q**: Should the detail view have action buttons matching the list view?
  **A**: Yes, the detail drawer MUST include "Copy Path" and "Open in Editor" buttons for both weapons and items, matching the actions available in the list/table view.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Fix Template File Resolution (Priority: P1)

Users scan weapon/item XML files that contain template references (`@file` attribute). The system must correctly resolve these relative template paths to prevent "file not found" errors.

**Why this priority**: Critical bug preventing proper data scanning - users cannot see weapons/items that use template inheritance, which is common in the game data structure.

**Independent Test**: Can be fully tested by scanning a directory containing weapon/item files with `@file` template references and verifying all files parse without errors.

**Acceptance Scenarios**:

1. **Given** a weapon file at `packages/vanilla/weapons/ak47.weapon` with template reference `@file="../templates/base.weapon"`, **When** scanning weapons, **Then** the system correctly resolves the template at `packages/vanilla/templates/base.weapon` without error
2. **Given** an item file with a nested template reference (template references another template), **When** scanning items, **Then** the system resolves all templates in the chain up to the maximum depth limit
3. **Given** a weapon file with a circular template reference, **When** scanning weapons, **Then** the system reports a clear "circular reference detected" error for that file only without crashing the scan
4. **Given** a weapon file referencing a non-existent template, **When** scanning weapons, **Then** the system reports a specific "template file not found" error for that weapon file but continues scanning other files

---

### User Story 2 - Auto-Scan on Data Route Entry (Priority: P1)

Users navigate to the Data page and expect to see their weapon/item data immediately if they have previously configured scan directories.

**Why this priority**: High user experience issue - users are confused when they see "configure folders" message despite already having configured directories.

**Independent Test**: Can be fully tested by configuring scan directories, restarting the application, and navigating to /data route.

**Acceptance Scenarios**:

1. **Given** the application has been initialized with one or more valid scan directories from previous session, **When** user navigates to the /data route for the first time, **Then** the data page displays the weapons/items tab (not the empty state)
2. **Given** the user has configured directories but scanning is still in progress, **When** navigating to /data route, **Then** a loading indicator is shown and data appears when scan completes
3. **Given** all configured directories are invalid, **When** navigating to /data route, **Then** the empty state message is displayed with a link to settings

---

### User Story 3 - Multi-Directory Active State Management (Priority: P2)

Users configure multiple scan directories and want to selectively enable/disable which directories are included in scans without deleting them.

**Why this priority**: Medium priority usability feature - allows users to keep workshop directories configured but only scan base game when desired.

**Independent Test**: Can be fully tested by adding multiple directories, toggling their active state, and verifying scans only include active directories.

**Acceptance Scenarios**:

1. **Given** a user has configured 3 scan directories, **When** they uncheck 2 of them (mark as inactive), **Then** scanning only includes the 1 active directory
2. **Given** a user marks a directory as inactive, **When** they trigger a scan, **Then** the scan progress shows "1 of 1 directories" instead of "1 of 3 directories"
3. **Given** a user re-activates a previously inactive directory, **When** they trigger a scan, **Then** the newly active directory is included in the scan
4. **Given** a user has a mix of active and inactive directories, **When** viewing the directory list in settings, **Then** each directory clearly shows its active/inactive state with a toggle switch

---

### User Story 4 - Package Count Display in Settings (Priority: P2)

Users want to see how many game packages (mod packs) are available in each configured scan directory, not the total item count.

**Why this priority**: Medium priority information display issue - current "0 items" display is unhelpful, package count gives users meaningful information about their game data.

**Independent Test**: Can be fully tested by adding a directory and verifying the display shows the correct package count.

**Acceptance Scenarios**:

1. **Given** a scan directory with 5 package subdirectories (vanilla, man_vs_zombies, etc.), **When** the directory validation completes, **Then** the settings display shows "5 packages"
2. **Given** a user has multiple directories with different package counts, **When** viewing the directory list, **Then** each entry shows its respective package count
3. **Given** a scan is in progress, **When** the scan completes, **Then** the package count is displayed and remains visible even when the directory is inactive
4. **Given** a directory with no packages, **When** displayed in settings, **Then** it shows "0 packages" (not "0 items")

---

### User Story 5 - Drawer Image Layout (Priority: P3)

Users viewing weapon/item details in the side drawer see the weapon/item image positioned prominently within the content area, not floating independently at the top.

**Why this priority**: Lower priority visual improvement - doesn't affect functionality but improves visual consistency and readability of detail views.

**Independent Test**: Can be fully tested by opening a weapon detail drawer and verifying the image position.

**Acceptance Scenarios**:

1. **Given** a user clicks on a weapon in the weapons table, **When** the detail drawer opens, **Then** the weapon icon appears in the first row of the content area (below the title)
2. **Given** a weapon with no associated icon, **When** the detail drawer opens, **Then** no broken image placeholder is shown and the content area flows naturally
3. **Given** a user views an item with an associated image, **When** the drawer opens, **Then** the image is sized appropriately (not full-width) and positioned inline with other metadata
4. **Given** a user navigates between items using next/previous buttons, **When** each item loads, **Then** the image appears in the consistent position without layout shift

---

### Edge Cases

- What happens when a template file path uses absolute path syntax instead of relative?
- How does system handle weapon files with template references that point outside the packages directory (path traversal attempts)?
- What happens when scan directories are removed while a scan is in progress?
- How does system behave when all active directories become invalid (e.g., external drive disconnected)?
- What happens when package count is very large (100+ packages) - does the UI handle the number display correctly?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST resolve template file paths relative to the parent weapon/item file location, not the packages root directory
- **FR-002**: System MUST handle template chains up to 10 levels deep before failing with "template depth exceeded" error
- **FR-003**: System MUST detect and report circular template references with the specific template file names in the error chain
- **FR-004**: System MUST continue scanning remaining files when individual file parsing fails due to template resolution errors
- **FR-005**: System MUST automatically trigger directory revalidation and scan on application startup if directories are configured
- **FR-006**: System MUST display the data table (not empty state) when user navigates to /data route if scan is in progress or has completed
- **FR-007**: System MUST support an "active" boolean state on each ScanDirectory configuration
- **FR-008**: System MUST only scan directories marked as "active" during scan operations
- **FR-009**: System MUST preserve inactive directory configurations across application restarts
- **FR-010**: System MUST display the count of package subdirectories for each scan directory in settings UI
- **FR-011**: System MUST update package count display after directory validation completes
- **FR-012**: System MUST display weapon/item icons in the first row of detail drawer content area (below title)
- **FR-013**: System MUST gracefully handle missing icons by not displaying broken image placeholders
- **FR-014**: System MUST provide a toggle switch UI element for activating/deactivating directories in settings

### Key Entities

- **ScanDirectory**: Extended with `active: boolean` property to indicate whether directory should be included in scans; extended with `packageCount: number` to store the number of package subdirectories discovered during validation
- **ValidationResult**: Extended to include `packageCount: number` field returned from backend validation
- **Weapon/Item**: No changes to core entities; affected by template resolution fixes in parsing logic
- **Template Resolution Context**: New conceptual entity representing the file path context (weapon file location) from which relative template paths should be resolved

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: All weapon/item files with valid template references parse successfully with 0 template resolution errors
- **SC-002**: Users with configured directories see data on /data route within 3 seconds of navigation (scan in progress or completed)
- **SC-003**: Users can activate/deactivate directories with single click and state persists across application restarts
- **SC-004**: Settings UI displays package count (not item count) within 500ms of directory validation completion
- **SC-005**: Detail drawer images render in correct position without layout shift or overflow issues
- **SC-006**: Scans complete 50% faster when inactive directories are excluded from scan process
- **SC-007**: Template error messages clearly indicate which file and which template reference failed

## Assumptions

1. Template file paths in game data use relative path syntax (e.g., "../templates/base.weapon") relative to the weapon/item file location
2. Maximum template depth of 10 levels is sufficient for all game data
3. Package subdirectories are immediate children of the packages directory (no nested package structures)
4. Users typically have 1-5 scan directories configured
5. Auto-scan on startup should run in background without blocking UI rendering
6. Active/inactive directory state is independent of valid/invalid validation status
7. Icon image files (if present) are located in a textures/ sibling directory to the items/weapons directory
8. Latest UI standards refer to existing DaisyUI component patterns used elsewhere in the application
