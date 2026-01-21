# Feature Specification: Windows Editor Fix & Changelog Integration

**Feature Branch**: `009-fix-windows-editor-changelog`  
**Created**: 2026-01-21  
**Status**: Draft  
**Input**: User description: "1. 见 @src-tauri/src/weapons.rs 这个 open_file_in_editor 的 tauri 注册指令, 这个命令在 windows 上会执行错误. 思考更科学的命令. 2. 关于页面我们期望附加编写一个 CHANGELOG.md, 每次更新记录日志并且存在本地, 与 @src/app/features/dashboard/ 的\"最近活动\"内容同步, 为项目新增一个初始化的 CHANGELOG.md. 3. @src/app/features/dashboard/dashboard.component.html 的 \"提取\" 功能按钮入口移除, 这个按钮没用了"

## Clarifications

### Session 2026-01-21

- Q: What is the target route for the restored "Local Mod" management entry? → A: Route to `/mods` (Primary mod management page).
- Q: Where should the "Local Mod" management entry be restored in the sidebar? → A: Primary: Top-level sidebar entry (above Settings).

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Robust File Opening (Priority: P1)

As a user on Windows, I want to open XML files in my default editor from the app without errors, so that I can quickly inspect or edit game data.

**Why this priority**: Core functionality for modders. Current implementation fails on Windows due to manually constructed shell commands.

**Independent Test**: Click "Open in Editor" on any weapon/item row on a Windows machine. The system's default editor (e.g., VS Code, Notepad) should open with the correct file.

**Acceptance Scenarios**:

1. **Given** a weapon file path on Windows, **When** I trigger the open command, **Then** the file opens successfully in the default application.
2. **Given** a non-existent file path, **When** I trigger the command, **Then** I receive a clear "File not found" error message.

---

### User Story 2 - Integrated Changelog (Priority: P2)

As a user, I want to see the latest project updates on the dashboard and a full history on the About page, so that I can stay informed about new features and bug fixes.

**Why this priority**: Enhances project transparency and user engagement. Centralizes the update history.

**Independent Test**: Navigate to the About page to see the full changelog. Check the Dashboard's "Recent Activity" section to see the latest version entry.

**Acceptance Scenarios**:

1. **Given** a `CHANGELOG.md` file in the project root, **When** I visit the About page, **Then** the content of the changelog is displayed clearly.
2. **Given** a new entry in `CHANGELOG.md`, **When** I open the app, **Then** the latest version info appears in the Dashboard's "Recent Activity" list.

---

### User Story 3 - Dashboard Cleanup (Priority: P3)

As a user, I want a clean dashboard without obsolete features, so that I am not confused by non-functional buttons.

**Why this priority**: Simplifies the UI and removes dead features.

**Independent Test**: Open the Dashboard and verify that the "Extract" button is no longer present in the Quick Actions area.

**Acceptance Scenarios**:

1. **Given** the Dashboard page, **When** I view the "Quick Actions" card, **Then** the "Extract" button is absent.

---

### Edge Cases

- **Windows path with spaces**: The command must handle paths like `C:\Program Files\Steam\...` correctly.
- **Empty or missing CHANGELOG.md**: The app should handle missing files gracefully without crashing, perhaps showing a "No history available" message.
- **Large CHANGELOG.md**: The About page should use a scrollable area to prevent layout breaking if the history is long.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: System MUST use a robust, cross-platform approach for opening files in the default editor, ensuring compatibility with Windows paths.
- **FR-002**: System MUST provide an initial `CHANGELOG.md` at the project root.
- **FR-003**: The About page MUST load and display the contents of `CHANGELOG.md` via a Tauri command.
- **FR-004**: The Dashboard MUST display the latest entry from `CHANGELOG.md` in the "Recent Activity" timeline.
- **FR-005**: System MUST replace the "Extract" button on the Dashboard with a "Local Mods" entry point routing to `/mods`.
- **FR-006**: System MUST restore "Local Mods" as a top-level sidebar entry positioned above Settings.

### Key Entities _(include if feature involves data)_

- **Changelog Entry**: Represents a single version update, including version number, date, and description.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: 100% success rate for opening files on Windows (given the file exists).
- **SC-002**: Changelog content loads in under 200ms on the About page.
- **SC-003**: Obsolete "Extract" entry point is completely removed from the Dashboard.
