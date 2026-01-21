# Implementation Plan: Fix Data Scanning Errors and UX Improvements

**Branch**: `001-fix-data-scanning` | **Date**: 2025-01-21 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-fix-data-scanning/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Fix critical "No such file or directory" errors during weapon/item scanning by implementing cross-package template resolution with fallback to vanilla package. Enhance UX with auto-scan on startup, multi-directory active state management, package count display, and improved detail drawer layouts with action buttons and template error warnings.

## Technical Context

**Language/Version**: TypeScript 5.8.3 (Angular 20.3.15 frontend), Rust edition 2021 (Tauri 2.x backend)
**Primary Dependencies**: Angular v20.3.15, Tauri 2.x, quick-xml 0.37 (Rust XML parsing), Transloco 8.x (i18n), DaisyUI 5.5.14, Tailwind CSS 4.1.18
**Storage**: File-based XML game data + Tauri plugin-store (settings.json)
**Testing**: cargo test (Rust), karma/Jasmine (Angular - existing)
**Target Platform**: Desktop (macOS, Windows, Linux via Tauri)
**Project Type**: Desktop application (Tauri) with Angular frontend
**Performance Goals**: Scan 1000+ weapon files in <10 seconds using parallel processing (rayon)
**Constraints**: 800×600 minimum resolution, runtime i18n switching, Signal-based state management only
**Scale/Scope**: ~500 weapon files, ~2000 item files across multiple package directories

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Desktop-First UI Design | ✅ PASS | 800×600 minimum resolution maintained; detail drawer images moved inline (w-24) per spec requirement #7 |
| II. Internationalization (i18n) | ✅ PASS | All new UI text uses Transloco keys; en.json updated with packageCount, activeDirectory, etc. |
| III. Theme Adaptability | ✅ PASS | All new UI uses DaisyUI components (alert-warning, btn-ghost, etc.) with CSS variables |
| IV. Signal-Based State Management | ✅ PASS | All services use signal() for state; no BehaviorSubject in data features |
| V. Documentation-Driven Development | ✅ PASS | Spec, clarifications, user stories documented in spec.md |
| VI. Icon Management | ✅ PASS | Copy icon added to APP_ICONS registry; uses lucide-angular components only |
| VII. Tailwind-First Styling | ✅ PASS | All new UI uses Tailwind utility classes (flex, gap, items-center, etc.) |

**Gate Result**: ✅ ALL PASSED - No violations requiring justification

## Project Structure

### Documentation (this feature)

```text
specs/001-fix-data-scanning/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
# Desktop application with Tauri backend + Angular frontend
src/
├── app/
│   ├── core/
│   │   └── services/
│   │       └── settings.service.ts         # Tauri store access
│   ├── features/
│   │   ├── data/
│   │   │   ├── local/
│   │   │   │   └── local.component.ts       # Auto-scan trigger on route entry
│   │   │   ├── weapons/
│   │   │   │   ├── services/
│   │   │   │   │   └── weapon.service.ts    # Weapon scanning with template resolution
│   │   │   │   └── weapons.component.ts     # Detail drawer with action buttons
│   │   │   └── items/
│   │   │       ├── services/
│   │   │       │   └── item.service.ts      # Item scanning
│   │   │       └── items.component.ts       # Detail drawer with action buttons
│   │   └── settings/
│   │       ├── services/
│   │       │   └── directory.service.ts     # Active/inactive state management
│   │       └── settings.component.ts        # Package count display, toggle UI
│   ├── shared/
│   │   ├── models/
│   │   │   ├── weapons.models.ts           # Weapon with templateError field
│   │   │   └── directory.models.ts         # ScanDirectory with active, packageCount
│   │   └── icons/
│   │       └── index.ts                    # Lucide icon registry (Copy icon added)
│   └── assets/
│       └── i18n/
│           ├── en.json                      # English translations
│           └── zh.json                      # Chinese translations

src-tauri/
├── src/
│   ├── weapons.rs                            # Cross-package template resolution with fallback
│   ├── items.rs                              # Item scanning (no templates - N/A for template fix)
│   ├── directories.rs                        # Directory validation with package counting
│   └── lib.rs                                # Tauri command registration
└── Cargo.toml                                # Rust dependencies (quick-xml, rayon, serde)

tests/
├── contract/                                 # API contract tests (Tauri commands)
├── integration/                              # Full scanning flow tests
└── unit/                                     # Unit tests for resolution logic
```

**Structure Decision**: Desktop application (Tauri) with Angular frontend. Backend Rust code in `src-tauri/src/`, frontend Angular code in `src/app/`. This is a Tauri desktop application using the standard project structure.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| N/A | N/A | N/A |

**No complexity tracking required - all gates passed.**

---

## Phase 0: Research Findings

### Template Resolution Strategy

**Decision**: Implement fallback mechanism in `resolve_template()` to try `vanilla/weapons/` directory when template not found in same package.

**Rationale**: Cross-package template references are common in RWR game data (e.g., `man_vs_zombies` weapons reference templates in `vanilla`). Original code only looked in same directory, causing "file not found" errors.

**Alternatives Considered**:
1. **Fail-fast with error**: Rejected - would hide valid weapons from users
2. **Search all packages**: Rejected - performance concerns with 50+ packages
3. **Configurable search path**: Rejected - unnecessary complexity for this specific use case

### Template Error Handling

**Decision**: Catch template resolution errors and continue parsing with partial data. Store error message in `template_error` field for UI warning display.

**Rationale**: Per clarification #1, weapons with missing templates MUST still be displayed in list. The warning in detail drawer informs users of incomplete data.

**Alternatives Considered**:
1. **Skip weapons with template errors**: Rejected - violates clarification requirement
2. **Store errors separately**: Rejected - complicates frontend; field approach simpler

### Auto-Scan Trigger Strategy

**Decision**: Move scan trigger from `ngOnInit()` to router guard or check scan state on route entry.

**Rationale**: Current implementation shows empty state even when directories are configured. Auto-scan should run when user navigates to `/data` route.

**Alternatives Considered**:
1. **Scan on app startup**: Rejected - may slow initial app load
2. **Manual scan only**: Rejected - poor UX, violates requirement #3

### Package Count Implementation

**Decision**: Return `package_count` from `validate_directory()` Rust command, store in `ScanDirectory.packageCount`, display as "{x} packages" in settings.

**Rationale**: Current "0 items" display is unhelpful. Package count gives users meaningful info about their game data structure.

**Alternatives Considered**:
1. **Count weapons/items**: Rejected - expensive to scan on validation
2. **Count on-demand**: Rejected - inconsistent display, confusing UX

---

## Phase 1: Design Artifacts

### Data Model Updates

#### Extended ScanDirectory Model

```typescript
interface ScanDirectory {
    id: string;
    path: string;
    valid: boolean;
    validated: boolean;
    active: boolean;           // NEW: Include/exclude from scans
    packageCount: number;      // NEW: Number of package subdirectories
    lastScanned?: Date;
    error?: DirectoryErrorCode;
}
```

#### Extended Weapon Model

```typescript
interface Weapon {
    // ... existing fields ...
    templateError?: string;    // NEW: Error message if template resolution failed
}
```

### API Contracts

#### Tauri Commands

**validate_directory(path: String) -> ValidationResult**
```rust
pub struct ValidationResult {
    pub valid: bool,
    pub package_count: usize,  // NEW: Count of package subdirectories
    pub error_code: Option<DirectoryErrorCode>,
    pub message: String,
}
```

**scan_weapons(game_path: String, directory: Option<String>) -> WeaponScanResult**
```rust
pub struct Weapon {
    // ... existing fields ...
    pub template_error: Option<String>,  // NEW: Template error message
}
```

### Quickstart Guide

See [quickstart.md](./quickstart.md) for development setup and testing procedures.

---

## Phase 2: Implementation Tasks

See [tasks.md](./tasks.md) for the complete task breakdown (generated by `/speckit.tasks` command).
