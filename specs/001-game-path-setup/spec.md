# Feature Specification: Game Path Setup

**Feature Branch**: `001-game-path-setup`  
**Created**: 2026-01-22  
**Status**: Draft  
**Input**: User description: "以上问题已修复, 新增游戏路径设置, 我们的 'local mod' 功能依赖游戏安装目录功能, 对于现有的 'scan Directories' 目录列表做保留, 我们的 data 页面的 items 和 weapons 扫描是针对这两者的目录组合扫描. 如果游戏目录不配置, 在 'local mod' 页面做出提示(现在应该存在). 首页的 @src/app/features/dashboard/ 也做配置游戏目录引导"

## User Scenarios & Testing _(mandatory)_

## Clarifications

### Session 2026-01-22

- Q: Data page scanning sources when scan directories are empty? → A: Scan when either Game Install Directory OR any Extra Scan Directories are configured.
- Q: Priority and naming of scan directories? → A: Scan directories are secondary and renamed to “Extra Scan Directories”; they only affect Data browsing, not Local Mod.
- Q: Local Mod navigation structure? → A: Local Mod has top tabs (Install default, Bundle secondary), similar to Data page.

### User Story 1 - Configure Game Install Directory (Priority: P1)

As a user, I can set (and later change) the game installation directory so that features that depend on the base game files can work reliably.

**Why this priority**: This is the prerequisite for Local Mod and some combined scanning behaviors.

**Independent Test**: Start with no game directory configured, configure it, and verify the configuration is persisted and reflected in the UI.

**Acceptance Scenarios**:

1. **Given** the app has no game installation directory configured, **When** the user navigates to Settings and sets a valid game directory, **Then** the app stores it and shows it as configured.
2. **Given** the app has a configured game installation directory, **When** the user changes it to a different valid directory, **Then** the app updates the stored path and uses the new value for dependent features.
3. **Given** the user selects an invalid directory, **When** they attempt to save it, **Then** the app rejects the value and shows a clear error state.

---

### User Story 2 - Local Mod Tabs + Missing Game Dir Prompt (Priority: P2)

As a user, Local Mod has top tabs (Install default, Bundle secondary), and if I open it without a configured game installation directory, I see a clear prompt that explains what is missing and how to fix it.

**Why this priority**: Prevents confusion and reduces support/debug time.

**Independent Test**: Remove/clear game directory setting, open Local Mod page, verify the guidance is displayed.

**Acceptance Scenarios**:

1. **Given** no game installation directory is configured, **When** the user opens the Local Mod page, **Then** the page shows a clear “game path required” prompt and a direct navigation path to configure it.
2. **Given** a game installation directory is configured, **When** the user opens the Local Mod page, **Then** the prompt is not shown.

---

### User Story 3 - Dashboard Onboarding Prompt (Priority: P3)

As a user, when I land on the Dashboard without a configured game installation directory, I see a lightweight onboarding prompt that guides me to configure it.

**Why this priority**: Makes first-run experience smoother and reduces dead-ends.

**Independent Test**: Clear game directory, open Dashboard, verify the prompt appears and can be dismissed by configuring the directory.

**Acceptance Scenarios**:

1. **Given** no game installation directory is configured, **When** the user opens the Dashboard, **Then** the UI shows a call-to-action to configure the directory.
2. **Given** the directory becomes configured, **When** the user revisits the Dashboard, **Then** the onboarding prompt is no longer shown.

---

### Edge Cases

- What happens when the previously configured game directory is deleted or becomes inaccessible?
- What happens when the user has scan directories configured, but no game directory configured?
- What happens when scan directories include duplicate content (same package appearing in multiple locations)?
- How does the app behave when the user clears the game directory setting after having previously configured it?

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: The system MUST allow the user to configure a single “game installation directory” setting.
- **FR-002**: The system MUST validate that the configured game installation directory is usable (exists, is a directory, and contains the expected game content structure).
- **FR-003**: The system MUST persist the configured game installation directory across application restarts.
- **FR-004**: The system MUST preserve the existing “scan directories” list, renamed to “extra scan directories” (no migration that removes or invalidates it).
- **FR-005**: The Data pages (Weapons/Items) MUST scan when either (game installation directory) OR (one or more extra scan directories) are configured.
- **FR-006**: The Data pages (Weapons/Items) MUST scan using the combined directory set of (game installation directory, if configured) + (extra scan directories list).
- **FR-007**: The Data pages (Weapons/Items) MUST avoid duplicate results when the combined directory set overlaps.
- **FR-008**: Local Mod MUST rely on the game installation directory only; extra scan directories MUST NOT be required for Local Mod.
- **FR-009**: If the game installation directory is not configured, the Local Mod page MUST show a clear prompt explaining it is required and how to configure it.
- **FR-010**: If the game installation directory is not configured, the Dashboard MUST show an onboarding prompt guiding the user to configure it.
- **FR-011**: Local Mod MUST provide a top-level tab switch (Install default, Bundle secondary) similar to Data page tabs.

### Key Entities _(include if feature involves data)_

- **Game Installation Directory**: A single user-configured directory that represents the base game install location.
- **Extra Scan Directories**: A user-managed list of additional directories used for Data scanning and aggregation (not required for Local Mod).

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: A first-time user without configuration can find and set the game installation directory from the app within 30 seconds.
- **SC-002**: When opening Local Mod without a configured game installation directory, users receive a clear guidance message (no blank/undefined states).
- **SC-003**: Data pages do not trigger unnecessary asset/path requests for offscreen rows; navigation remains responsive (no noticeable freeze when switching sidebar routes).
- **SC-004**: When both game directory and extra scan directories are configured, Weapons and Items datasets include content from both sources with no duplicates.
- **SC-005**: When only the game installation directory is configured (and extra scan directories are empty), Weapons and Items datasets still load and show results.
