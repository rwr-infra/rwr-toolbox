# Feature Specification: I18n Key Cleanup, Sticky Table Header, Changelog

**Feature Branch**: `001-i18n-table-changelog`  
**Created**: 2026-01-22  
**Status**: Draft  
**Input**: User description: "1. 优化首页的翻译key没有国际化翻译问题 2. @src/app/features/data/ 中的 @src/app/features/data/weapons/weapons.component.html 与 @src/app/features/data/items/items.component.html 之前做过一次性能优化, 但是现在表头在滚动时会突然消失, 需要修复 3. 新建一个 CHANGELOG.md 文件用于 @src/app/features/about/ 页面展示更新日志, 这个文件也用于首页的 @src/app/features/dashboard/dashboard.component.html 展示部分 4. "

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Data Tables Keep Headers Visible While Scrolling (Priority: P1)

As a user viewing the Items and Weapons data tables, I can scroll through large lists while the table header stays visible and does not flicker or disappear.

**Why this priority**: The table header is required to understand columns; disappearing headers blocks core usage of these pages.

**Independent Test**: Open the Items and Weapons pages, scroll continuously through the table, and confirm the header remains visible and stable.

**Acceptance Scenarios**:

1. **Given** the user is on the Items table, **When** the user scrolls vertically through the list, **Then** the column header row remains visible and does not disappear.
2. **Given** the user is on the Weapons table, **When** the user scrolls vertically through the list, **Then** the column header row remains visible and does not disappear.
3. **Given** the user scrolls quickly (trackpad/page down) and slowly (drag scrollbar), **When** scrolling occurs, **Then** the header behavior is consistent (no flicker, no sudden blank header area).

---

### User Story 2 - Dashboard Shows Fully Localized Text (Priority: P2)

As a user on the homepage (dashboard), I see localized, readable text instead of raw translation keys or missing/incorrect strings.

**Why this priority**: The homepage is a primary entry point; untranslated strings reduce clarity and perceived quality.

**Independent Test**: Switch application language (at least two supported locales) and verify the dashboard displays human-readable translations for all visible labels.

**Acceptance Scenarios**:

1. **Given** the dashboard is opened in a supported language, **When** all dashboard UI elements render, **Then** no raw translation keys (e.g., dotted/underscored keys) are shown to the user.
2. **Given** the user switches to another supported language, **When** the dashboard re-renders, **Then** all dashboard labels remain properly translated.

---

### User Story 3 - Users Can View Update Log in About and See Latest Updates on Dashboard (Priority: P3)

As a user, I can view a chronological update log on the About page, and I can also see a small “latest updates” preview on the dashboard.

**Why this priority**: Clear updates reduce confusion and support requests (users can self-check what changed).

**Independent Test**: Provide an update log with multiple entries and verify About shows the full list while the dashboard shows a short preview.

**Acceptance Scenarios**:

1. **Given** an update log exists with at least one entry, **When** the user opens the About page, **Then** the user can read the update log in chronological order.
2. **Given** an update log exists with multiple entries, **When** the user opens the dashboard, **Then** the user sees a preview of the most recent updates.
3. **Given** the update log is empty or unavailable, **When** the user opens About or dashboard, **Then** the UI shows a clear empty-state message (and the page remains usable).

---

### Edge Cases

- The user scrolls extremely fast through Items/Weapons: header remains visible without flicker.
- The visible columns set changes (e.g., user toggles columns): header remains visible and reflects current columns.
- The dataset is empty: header remains visible (or the UI clearly communicates empty state without layout glitches).
- The dashboard contains a translation key that is missing in one locale: UI displays a safe, readable fallback rather than exposing raw keys.
- The update log file is malformed or contains unexpected formatting: UI shows a readable error/empty-state and does not break the page.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: The dashboard MUST display localized, human-readable text for all user-visible labels and messages.
- **FR-002**: The system MUST NOT show raw translation keys to users on the dashboard in any supported language.
- **FR-003**: The Items data table MUST keep its column header visible and stable during vertical scrolling.
- **FR-004**: The Weapons data table MUST keep its column header visible and stable during vertical scrolling.
- **FR-005**: Users MUST be able to view an update log on the About page.
- **FR-006**: The dashboard MUST provide a preview of the most recent update log entries.
- **FR-007**: If the update log is empty, missing, or cannot be parsed, the system MUST show a clear fallback state on both About and dashboard (without breaking navigation).

**Assumptions**: The app already supports at least two locales; the update log is intended to be human-authored and updated with releases.

### Key Entities _(include if feature involves data)_

- **Translation Key**: A stable identifier used to map UI labels/messages to localized strings in each supported language.
- **Update Log Entry**: A chronological record item describing a change (e.g., title/summary, date/version, optional details).

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: In supported languages, 0 instances of raw translation keys are visible on the dashboard during a standard walkthrough of the page.
- **SC-002**: During a 30-second continuous scroll on Items and Weapons tables, the header remains continuously visible (no disappearance events).
- **SC-003**: Users can locate and read the most recent update information from the dashboard within 10 seconds.
- **SC-004**: The About page displays the update log successfully for 100% of valid update-log entries used in testing, and provides a readable fallback for invalid/empty input.
