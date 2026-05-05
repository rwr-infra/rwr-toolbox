# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.0] - 2026-04-30

### Added

- **Mod Archive (Assets)**: New tab for managing archived mod packages.
  - Automatically saves a copy of installed mod zips to a configurable directory after successful installation.
  - Archive deduplication via MD5 hash comparison (skips identical content, renames different content with timestamp).
  - Browse archived mods with metadata (title, version, game version, authors).
  - Re-install archived mods through the full Install wizard (Step 2 → Step 3 with file selection).
  - Delete archived packages with confirmation dialog.
  - New Tauri commands: `archive_mod`, `list_mod_archives`, `delete_mod_archive`.
- **Selective File Installation**: Install mods with granular file-level control.
  - File selection modal in Install Step 2, showing path and size per file.
  - `.txt` files are unchecked by default; all other files are checked by default.
  - Select All / Invert Selection quick actions.
  - Real-time estimated installation size display.
  - Rust `extract_zip` now supports `selected_files` filtering; `read_info` returns `file_entries` with size metadata.
- **Launch Loading Screen**: Pure CSS dual-ring spinner with loading dots animation, displayed before Angular bootstraps.

### Changed

- `ModInstallOptions` now includes `selectedFiles` array for filtered installation.
- `OutputConfig` (Rust) / `ModReadInfo` (TS) now includes `file_entries` with per-file size data.
- Re-install from Assets tab now navigates to the Install wizard instead of direct installation.

### Fixed

- Fixed duplicate archive creation when re-installing from Assets (introduced `skipArchive` flag).
- Fixed `selectAndReadModFile` return type to correctly expose `path` and `info`.

## [0.1.0] - 2026-01-21

### Added

- Multi-directory scanning support for weapons and items.
- Real-time server browser with favorite tracking.
- Global player statistics search across invasion and pacific databases.
- Initial mod management (installation and bundling).
- Hotkey profile management.
- Dynamic theme switching (Light/Dark).
- Search term highlighting in data tables.

### Fixed

- Fixed main thread blocking issue during directory scanning.
- Improved Windows file path handling for editor integration.

### Removed

- Obsolete "Extract" button from Dashboard.
