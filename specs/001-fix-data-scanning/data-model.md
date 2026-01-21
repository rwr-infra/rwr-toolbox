# Data Model: Fix Data Scanning Errors and UX Improvements

**Feature**: 001-fix-data-scanning
**Date**: 2025-01-21

## Entity Definitions

### ScanDirectory

Extended directory configuration with active state and package count.

**Location**: `src/app/shared/models/directory.models.ts`

```typescript
export interface ScanDirectory {
    /** Unique identifier for this directory configuration */
    id: string;

    /** Full file system path to the directory */
    path: string;

    /** Current validation status */
    status: DirectoryStatus;

    /** Display name (extracted from path or user-provided) */
    displayName: string;

    /** Timestamp when this directory was added */
    addedAt: number;

    /** Timestamp of last successful scan (0 if never scanned) */
    lastScannedAt: number;

    /** Number of items found in last scan */
    itemCount?: number;

    /** Number of weapons found in last scan */
    weaponCount?: number;

    /** NEW: Include this directory in scans (default: true) */
    active?: boolean;

    /** NEW: Number of package subdirectories */
    packageCount?: number;

    /** Last validation error if status is 'invalid' */
    lastError?: ValidationResult;
}
```

**State Transitions**:

```
[NEW] active: true  ←→  active: false
        ↓                  ↓
   Scanned           Ignored in scans
```

**Validation Rules**:
- `id`: Must be unique across all directories
- `path`: Must exist on filesystem
- `active`: Defaults to `true` for new directories
- `packageCount`: Must be ≥ 0

---

### ValidationResult (Frontend)

Extended validation result with package count.

**Location**: `src/app/shared/models/directory.models.ts`

```typescript
export interface ValidationResult {
    /** Whether the directory is valid for scanning */
    valid: boolean;

    /** Error code if validation failed */
    errorCode: DirectoryErrorCode | null;

    /** Localized error message for display */
    message: string;

    /** Optional: Additional context */
    details?: {
        /** Whether the path exists */
        pathExists: boolean;
        /** Whether the path is a directory */
        isDirectory: boolean;
        /** Whether the path is readable */
        isReadable: boolean;
        /** Whether media subdirectory exists */
        hasMediaSubdirectory: boolean;
    };

    /** NEW: Number of package subdirectories found */
    packageCount?: number;
}
```

---

### ValidationResult (Backend)

Extended validation result for serialization.

**Location**: `src-tauri/src/directories.rs`

```rust
#[derive(Debug, Serialize)]
pub struct ValidationResult {
    pub valid: bool,
    pub weapons_path: String,
    pub package_count: usize,     // NEW
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error_code: Option<String>,  // NEW
    #[serde(skip_serializing_if = "Option::is_none")]
    pub message: Option<String>,     // NEW
}
```

**Field Mappings** (Backend → Frontend):
- `valid` → `valid`
- `weapons_path` → Not used in frontend
- `package_count` → `packageCount`
- `error_code` → `errorCode`
- `message` → `message`

---

### Weapon (Extended with template_error)

Core weapon entity extended with template error tracking for UI warning display.

**Location**: `src-tauri/src/weapons.rs`

```rust
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Weapon {
    pub key: Option<String>,
    pub name: String,
    pub tag: String,
    pub class: i32,
    pub hud_icon: Option<String>,
    pub magazine_size: f64,
    pub kill_probability: f64,
    pub retrigger_time: f64,
    // ... other fields
    pub file_path: String,
    pub source_file: String,
    pub package_name: String,
    /// NEW: Error message if template resolution failed
    #[serde(skip_serializing_if = "Option::is_none")]
    #[serde(rename = "templateError")]
    pub template_error: Option<String>,
}
```

**Frontend TypeScript Model** (`src/app/shared/models/weapons.models.ts`):

```typescript
export interface Weapon {
    // ... existing fields ...
    /** NEW: Error message if template resolution failed */
    templateError?: string;
}
```

---

### Item (No Changes)

Core item entity is not modified. Template resolution is an internal parsing concern.

**Location**: `src-tauri/src/items.rs`

```rust
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Item {
    pub key: Option<String>,
    pub name: String,
    pub item_type: String,
    // ... other fields
    pub file_path: String,
    pub source_file: String,
    pub package_name: String,
}
```

---

## Template Resolution Context

### Conceptual Entity

The template resolution context represents the file path from which relative template paths are resolved. This is not a persisted entity but a runtime concept.

**Implementation**: Function parameter in Rust

```rust
fn resolve_template(
    base_dir: &Path,      // Parent directory of file being parsed
    template_file: &str,  // Relative path from @file attribute
    visited: &mut HashSet<PathBuf>,
) -> Result<RawWeapon, anyhow::Error>
```

**Example**:

```
File: packages/vanilla/weapons/ak47.weapon
Template reference: @file="../templates/base.weapon"

base_dir = packages/vanilla/weapons/
template_file = ../templates/base.weapon

Result: packages/vanilla/templates/base.weapon
```

---

## Data Flow Diagrams

### Directory Validation Flow

```
┌─────────────┐
│ User selects│
│  directory  │
└──────┬──────┘
       │
       ▼
┌─────────────────┐
│ validate_game_  │
│    path()       │
│  (Tauri cmd)    │
└──────┬──────────┘
       │
       ▼
┌─────────────────────┐
│ Count packages      │
│ (WalkDir, max_depth=1)
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│ Return ValidationResult│
│ - valid: bool        │
│ - packageCount: usize│
└──────────────────────┘
```

### Active Directory Scanning Flow

```
┌─────────────────┐
│  User clicks    │
│  "Scan All"     │
└──────┬──────────┘
       │
       ▼
┌─────────────────────┐
│ DirectoryService.   │
│ scanAllDirectories()│
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│ Get Active Dirs     │
│ filter(d => d.active)│
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│ Scan each in parallel│
│ (rayon par_bridge)  │
└──────────────────────┘
```

### Template Resolution Flow

```
┌─────────────────────────┐
│ parse_weapon_file()     │
│ - weapon_path: PathBuf  │
└──────┬──────────────────┘
       │
       ▼
┌─────────────────────────┐
│ Read XML content        │
└──────┬──────────────────┘
       │
       ▼
┌─────────────────────────┐
│ Check for @file attribute│
└──────┬──────────────────┘
       │
       ├─ No ──► Return Weapon
       │
       ▼ Yes
┌─────────────────────────┐
│ Get weapon parent dir   │
│ base_dir = weapon_path  │
│   .parent()             │
└──────┬──────────────────┘
       │
       ▼
┌─────────────────────────┐
│ resolve_template()      │
│ base_dir + template_file│
└──────┬──────────────────┘
       │
       ▼
┌─────────────────────────┐
│ Merge attributes        │
│ Return Weapon           │
└─────────────────────────┘
```

---

## Persistence

### Plugin-Store Schema

**File**: `settings.json`

```json
{
  "scan_directories": [
    "/path/to/game/packages"
  ],
  "directory_states": {
    "dir_1234567890": {
      "active": true,
      "lastScannedAt": 1705852800000
    }
  }
}
```

**Note**: Active state is persisted separately from paths to allow path-only array for backward compatibility.

---

## Migration Notes

### Schema Changes

1. **ScanDirectory.active** (NEW):
   - Default: `true` for all existing directories
   - Migration: On first load, set `active = true` if undefined

2. **ScanDirectory.packageCount** (NEW):
   - Default: `undefined`
   - Populated by: `validate_game_path()` command

3. **ValidationResult.packageCount** (NEW):
   - Added to backend response
   - Frontend must handle missing field gracefully

### Backward Compatibility

- Old `scan_directories` array format still supported
- Missing `active` field defaults to `true`
- Missing `packageCount` field displays as "0 packages"
