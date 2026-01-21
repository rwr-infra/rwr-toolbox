# Feature Specification: UI and Search Refinements

**Feature Branch**: `008-ui-and-search-refinements`  
**Created**: 2026-01-21  
**Status**: Draft  
**Input**: User description: "1. 设置页面的 Language, Theme 里面不要再起一行的左右输入框 Label 与 Input 布局, 既然卡片第一行信息有标识了, 下一行直接一个输入框就行, 并且移除提示语, 因为我们修改都是实时生效的. 2. 设置页面的 Scan Directories 是一个列表, 不需要保留 radio 单选框. packages 这种信息需要始终显示. 3. 新增 about 页面适当的内容, 贴上 github 地址: `https://github.com/Kreedzt/rwr-toolbox`, 4. data 内容的搜索需要加入搜索高亮, 类似 @src/app/features/servers/servers.component.html 的交互"

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Simplified Settings Cards (Priority: P1)

As a user, I want a more compact and direct settings interface for Language and Theme so that I can see my options clearly without redundant labels or unnecessary instructions.

**Why this priority**: Improves the primary setup experience and reduces visual noise in the settings menu.

**Independent Test**: Navigate to the Settings page and verify that the Language and Theme cards display the selection component directly without an additional label row or hint text.

**Acceptance Scenarios**:

1. **Given** the Settings page, **When** I look at the Language or Theme cards, **Then** I should see the selection input (dropdown/toggle) immediately following the card title.
2. **Given** the Language or Theme cards, **When** I view the card body, **Then** there should be no help text or "real-time save" hints.

---

### User Story 2 - Cleaner Directory Management (Priority: P1)

As a user, I want my scanned directories list to be a simple, informative list without radio buttons, so that I can easily see the status of all added paths.

**Why this priority**: Essential for managing the data sources of the application; clarity on package counts is vital for debugging setup issues.

**Independent Test**: Add multiple directories in Settings and verify the list shows package information for all items without radio selection buttons.

**Acceptance Scenarios**:

1. **Given** the Scan Directories list, **When** I view any directory entry, **Then** I should see the "packages" count or status information prominently displayed.
2. **Given** the directory list, **When** I interact with it, **Then** there should be no radio-style selection mechanism visible.

---

### User Story 3 - Professional About Page (Priority: P2)

As a user, I want to find project information and the source code repository link on the About page so that I can learn more about the tool.

**Why this priority**: Enhances transparency and provides a direct path for user contributions or bug reports on GitHub.

**Independent Test**: Navigate to the About page and click the GitHub link to verify it opens the correct repository.

**Acceptance Scenarios**:

1. **Given** the About page, **When** I open it, **Then** I should see a description of the RWR Toolbox and a clickable link to `https://github.com/Kreedzt/rwr-toolbox`.

---

### User Story 4 - Search Result Highlighting (Priority: P1)

As a user, I want my search terms to be highlighted in the data tables (Weapons, Items) so that I can quickly identify where the match occurred.

**Why this priority**: Significantly improves data discoverability in large tables, bringing consistency with the Servers search experience.

**Independent Test**: Enter a search term in the Weapons or Items table and verify matching text is visually highlighted in the results.

**Acceptance Scenarios**:

1. **Given** a data table, **When** I type "ak47" in the search box, **Then** any occurrence of "ak47" in the table cells should be wrapped in a highlight style.

---

### Edge Cases

- **No match**: Highlighting logic should handle cases where no text matches the search term without breaking the layout.
- **HTML injection**: Highlighting must be implemented safely to prevent XSS if weapon/item names contain special characters (though unlikely in this context).
- **Long URLs**: The GitHub link on the About page should wrap or truncate gracefully on small window sizes.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: System MUST remove the row-based (Label + Input) layout for Language and Theme settings in favor of a direct-stack layout.
- **FR-002**: System MUST remove all descriptive hints or "real-time" notices from the Settings cards.
- **FR-003**: System MUST remove radio buttons from the Scan Directories list.
- **FR-004**: System MUST ensure package count/status information is always visible for every entry in the Scan Directories list.
- **FR-005**: About page MUST display a functional link to `https://github.com/Kreedzt/rwr-toolbox`.
- **FR-006**: Weapons and Items tables MUST implement a highlighting mechanism for search terms matching the input.
- **FR-007**: Highlighting MUST be case-insensitive and apply to all searchable columns.

### Key Entities _(include if feature involves data)_

- **Settings Card**: A UI container for configuration items, now using a simplified internal layout.
- **Scan Directory Item**: A list entry representing a game path, featuring persistent metadata (package count).
- **Search Term**: User input used to filter and highlight table content.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: Settings page vertical scrolling is reduced as cards become more compact.
- **SC-002**: 100% of search matches in data tables display visual highlighting.
- **SC-003**: About page successfully routes users to the GitHub repository.
- **SC-004**: Users report improved clarity in identifying search results (qualitative).
