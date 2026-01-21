# Research: Windows Editor & Changelog Integration

## Decision: scientific File Opening Command

- **Rationale**: Manual `std::process::Command` calls with `cmd /C start` are error-prone on Windows, especially with spaces in paths. Tauri 2.x provides a first-party plugin `tauri-plugin-opener` for this exact purpose.
- **Implementation**:
    - Use `app.opener().open_path(file_path, None)` in Rust.
    - This ensures cross-platform compatibility (Windows/macOS/Linux) and handles system-default associations automatically.
- **Alternatives Considered**:
    - Fixing `cmd` arguments: Rejected as it's less robust than the native plugin.

## Decision: CHANGELOG.md Storage & Parsing

- **Rationale**: Changelog should be a standard Markdown file at the project root for visibility.
- **Implementation**:
    - `CHANGELOG.md` will be placed in the project root.
    - A new Tauri command `get_changelog` will read the file from the binary's root directory or via a relative path.
    - **Parsing for Dashboard**: `DashboardService` will request the full text and extract the first block starting with `## [Version]` or similar using regex.
- **Alternatives Considered**:
    - Embedding as an asset: Good, but reading from root is easier for updates without re-building if using a portable build (though usually not for Tauri apps). We'll stick to a standard file read.

## Decision: Navigation Restoration

- **Rationale**: User explicitly requested the return of "Local Mod" management.
- **Implementation**:
    - Sidebar: Add `/mods` (icon: `package`) above `Settings`.
    - Dashboard: Replace `Extract` (icon: `download`) with `Local Mods` (icon: `package`).
    - Shortcut mapping: `Ctrl+5` will be assigned to `/mods`, shifting `Hotkeys` to `Ctrl+6`, etc. (Wait, `Hotkeys` is currently `Ctrl+5`). I'll adjust the order to match the sidebar's visual flow.
