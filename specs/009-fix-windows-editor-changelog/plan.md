# Implementation Plan: Windows Editor Fix & Changelog Integration

**Branch**: `009-fix-windows-editor-changelog` | **Date**: 2026-01-21 | **Spec**: `/specs/009-fix-windows-editor-changelog/spec.md`

## Summary

Addressing Windows-specific file opening issues by migrating to `tauri-plugin-opener`, implementing a project-wide `CHANGELOG.md` with multi-page integration (Dashboard sync and About page display), and cleaning up legacy entry points in the Dashboard while restoring Mod management to the sidebar.

## Technical Context

**Language/Version**: TypeScript 5.8.3, Angular v20, Rust, Tauri v2.x  
**Primary Dependencies**: `tauri-plugin-opener` (Tauri v2 native opener), `quick-xml` (Rust parsing), `lucide-angular`  
**Storage**: Local `CHANGELOG.md` file  
**Testing**: Manual cross-platform verification (Windows/macOS)  
**Target Platform**: Desktop (Windows, Linux, macOS)  
**Project Type**: Desktop Utility Tool  
**Performance Goals**: Instant file opening, <100ms changelog loading  
**Constraints**: Support for paths with spaces on Windows  
**Scale/Scope**: Dashboard, About, Weapons, Items, Sidebar

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

1. **Desktop-First**: YES - Handling system-level file opening and high-density layouts.
2. **i18n**: YES - Using Transloco for all user-facing labels and changelog metadata.
3. **Theme**: YES - Ensuring markdown rendering respects light/dark themes.
4. **Signals**: YES - Utilizing Angular Signals for dashboard state updates.
5. **Documentation**: YES - Following standard spec/plan workflow.
6. **Icons**: YES - Utilizing `APP_ICONS` registry for restored menu items.
7. **Tailwind**: YES - Standard utility-first approach for UI cleanup.

## Project Structure

### Documentation (this feature)

```text
specs/009-fix-windows-editor-changelog/
├── plan.md              # This file
├── research.md          # Implementation decisions
├── data-model.md        # Changelog entity
└── quickstart.md        # Test scenarios
```

### Source Code (repository root)

```text
src-tauri/src/
├── weapons.rs           # Update open_file_in_editor logic
├── lib.rs               # Register get_changelog command
src/app/
├── features/
│   ├── dashboard/       # Sync changelog to activity list
│   ├── about/           # Render full CHANGELOG.md
│   └── shared/          # Update MAIN_MENU_ITEMS
CHANGELOG.md             # Initial project changelog
```

**Structure Decision**: Enhancing existing features (Dashboard, About) and updating the core sidebar configuration.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
| --------- | ---------- | ------------------------------------ |
| None      | N/A        | N/A                                  |
