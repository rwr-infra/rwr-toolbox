# Research: Fix Data Scanning Errors and UX Improvements

**Feature**: 001-fix-data-scanning
**Date**: 2025-01-21

## Research Topics

### 1. Rust Parallel File Scanning with rayon

**Question**: How to implement parallel XML file parsing for weapon/item scanning?

**Decision**: Use `rayon` with `walkdir::IntoIter::par_bridge()`

**Rationale**:
- XML parsing is CPU-bound, not I/O-bound
- `rayon` provides work-stealing thread pool for efficient CPU utilization
- `par_bridge()` converts walkdir iterator to parallel iterator
- Simpler than tokio for this use case (no async overhead)
- Automatically utilizes all available CPU cores

**Alternatives Considered**:
| Alternative | Pros | Cons | Decision |
|-------------|------|------|----------|
| tokio::fs async | Good for I/O | Overhead for CPU-bound task | Rejected |
| Sequential scan | Simple | Too slow for 1000+ files | Rejected |
| Manual thread pool | Full control | Complex implementation | Rejected |

**Implementation Pattern**:
```rust
use rayon::prelude::*;

// Parallel file discovery and parsing
let (weapons, errors): (Vec<_>, Vec<_>) = WalkDir::new(input_path)
    .into_iter()
    .par_bridge()
    .filter_map(|e| e.ok())
    .filter(|e| e.path().extension().is_some_and(|ext| ext == "weapon"))
    .map(|e| parse_weapon_file(e.path(), input_path))
    .partition_result();

// partition_result is from itertools
```

---

### 2. Template Resolution Path Handling

**Question**: How to correctly resolve relative template file paths in weapon/item XML?

**Decision**: Resolve templates relative to the parent directory of the file being parsed

**Root Cause**: Current code at [weapons.rs:468](../../../../src-tauri/src/weapons.rs#L468) joins template path with `input_path` (packages root):
```rust
// BROKEN: Always joins with packages root
let template_path = input_path.join(template_file);
```

This fails for templates in subdirectories because:
- Weapon at `packages/vanilla/weapons/ak47.weapon`
- Template reference: `@file="../templates/base.weapon"`
- Expected: `packages/vanilla/templates/base.weapon`
- Actual (broken): `packages/../templates/base.weapon` → invalid

**Solution**:
```rust
// FIXED: Joins with weapon file's parent directory
let weapon_parent = weapon_path
    .parent()
    .ok_or_else(|| anyhow::anyhow!("Cannot get parent directory"))?;
let template_path = weapon_parent.join(template_file);
```

**Alternatives Considered**:
| Alternative | Pros | Cons | Decision |
|-------------|------|------|----------|
| Use packages root | Simple | Fails for subdirs | Rejected |
| Canonicalize all paths | Robust | Performance overhead | Rejected |
| Store absolute paths | No resolution needed | Game data format fixed | Rejected |

**Impact**: Affects both `weapons.rs` and `items.rs`, requires changing `resolve_template()` signature.

---

### 3. Angular Route Guard Timing for Auto-Scan

**Question**: Why does /data route show empty state even when directories are configured?

**Root Cause**: `hasNoDirectories()` in [local.component.ts:31](../../../../src/app/features/data/local/local.component.ts#L31) only checks directory count:
```typescript
hasNoDirectories(): boolean {
    return this.directoryService.directoriesSig().length === 0;
}
```

This returns `true` during initial load because `DirectoryService.initialize()` loads from storage asynchronously.

**Solution**: Also check scan progress state:
```typescript
hasNoDirectories(): boolean {
    const dirs = this.directoryService.directoriesSig();
    const progress = this.directoryService.scanProgressSig();
    return dirs.length === 0 && progress.state === 'idle';
}
```

**Alternatives Considered**:
| Alternative | Pros | Cons | Decision |
|-------------|------|------|----------|
| Route resolver | Clean separation | More complex | Rejected |
| Add loading state | Clear UX | Duplicate of scan progress | Rejected |
| Check scan state | Simple, reuses existing | None | **Selected** |

---

### 4. Multi-Directory Active State Pattern

**Question**: How to implement selective scanning of configured directories?

**Decision**: Add `active: boolean` field to `ScanDirectory` entity with toggle UI

**Pattern**:
- Default: `active: true` for new directories
- Scan: Filter `directoriesSig()` by `active === true`
- UI: Toggle switch in settings (radio button replacement)
- Storage: Persist to plugin-store

**Data Flow**:
```
User clicks toggle → DirectoryService.toggleActive(id) →
Update signal → Persist to store → Next scan uses filtered list
```

**Alternatives Considered**:
| Alternative | Pros | Cons | Decision |
|-------------|------|------|----------|
| Separate list | Clean separation | Duplicate data | Rejected |
| Selected ID (current) | Already exists | Only supports one | Rejected |
| Active boolean | Simple, supports multi | New field | **Selected** |

---

### 5. Package Count Display

**Question**: How to show number of packages instead of items in settings?

**Current Issue**: `itemCount` is never populated correctly, displays "0 items"

**Solution Backend**: Count package subdirectories during validation:
```rust
let package_count = WalkDir::new(&packages_dir)
    .min_depth(1)
    .max_depth(1)
    .into_iter()
    .filter_map(|e| e.ok())
    .filter(|e| e.path().is_dir())
    .count();
```

**Solution Frontend**: Display `packageCount` in template:
```html
<span>{{ 'settings.packageCount' | transloco: { count: dir.packageCount } }}</span>
```

**i18n Keys**:
```json
{
  "settings": {
    "packageCount": "{count} packages",
    "packageCount_one": "{count} package"
  }
}
```

---

## Performance Considerations

### Parallel Scanning Performance

Expected improvement with rayon:
- 4-core CPU: ~3-4x faster for XML parsing
- 8-core CPU: ~6-7x faster for XML parsing
- Scan time reduction: 50%+ (per SC-006)

### Memory Usage

- Sequential: ~50MB for 1000 files
- Parallel: ~200MB for 1000 files (4 threads)
- Still within acceptable bounds for desktop application

---

## Security Considerations

### Path Traversal Protection

Template resolution must prevent escaping packages directory:
```rust
let template_path = weapon_parent.join(template_file);
let canonical = template_path.canonicalize()?;

// Verify result is within packages directory
if !canonical.starts_with(input_path.canonicalize()?) {
    return Err(anyhow::anyhow!("Template path outside packages directory"));
}
```

---

## Dependencies

### New Dependencies

```toml
# Cargo.toml
[dependencies]
rayon = "1.10"  # For parallel file scanning
```

### Existing Dependencies (Confirmed)

```toml
quick-xml = "0.37"  # XML parsing - confirmed working
walkdir = "2.5"     # Directory traversal - confirmed working
serde = "1"         # Serialization - confirmed working
```

---

## Clarifications Research (Session 2025-01-21)

### 6. Template Error Handling Strategy

**Question**: How should items/weapons with missing template files be handled?

**Clarification**: Items/weapons with missing templates MUST still be displayed in the list/table (not hidden or filtered out). In the detail drawer, show a warning/indicator that the template could not be resolved.

**Decision**: Modify `parse_weapon_file()` to catch template resolution errors and continue parsing with partial data:

```rust
let mut template_error: Option<String> = None;
if let Some(template_file) = &raw_weapon.template_file {
    match resolve_template(weapon_parent, template_file, &mut HashSet::new()) {
        Ok(resolved) => {
            raw_weapon = merge_attributes(resolved, raw_weapon);
        }
        Err(e) => {
            template_error = Some(format!("Template resolution failed: {}", e));
        }
    }
}
// Continue parsing with available data...
```

**Data Model Extension**:
```rust
pub struct Weapon {
    // ... existing fields ...
    #[serde(skip_serializing_if = "Option::is_none")]
    #[serde(rename = "templateError")]
    pub template_error: Option<String>,
}
```

**UI Implementation**: DaisyUI `alert-warning` component in detail drawer:
```html
@if (selectedWeapon()!.templateError) {
    <div class="alert alert-warning mx-4 mt-4">
        <lucide-icon name="alert-triangle" class="h-5 w-5"></lucide-icon>
        <div>
            <h4 class="font-bold text-sm">Template Error</h4>
            <span class="text-xs">{{ selectedWeapon()!.templateError }}</span>
        </div>
    </div>
}
```

---

### 7. Detail Drawer Action Buttons

**Question**: Should the detail view have action buttons matching the list view?

**Clarification**: Yes, the detail drawer MUST include "Copy Path" and "Open in Editor" buttons for both weapons and items.

**Current State**: Action buttons exist in table view but missing in detail drawer.

**Decision**: Add action buttons to detail drawer's file path section using lucide-angular icons.

**Icon Registration** (`src/app/shared/icons/index.ts`):
```typescript
import {
    // ... existing icons
    SquarePen,  // For "Open in Editor"
    Copy,        // For "Copy Path"
} from 'lucide-angular';

export const APP_ICONS = {
    // ... existing exports
    SquarePen,
    Copy,
};
```

**Implementation Pattern**:
```html
<div class="flex items-center gap-2">
    <div class="text-xs font-mono break-all flex-1">{{ filePath }}</div>
    <button class="btn btn-ghost btn-xs btn-circle" (click)="onOpenInEditor(item)">
        <lucide-icon name="square-pen" class="h-4 w-4"></lucide-icon>
    </button>
    <button class="btn btn-ghost btn-xs btn-circle" (click)="onCopyPath(item)">
        <lucide-icon name="copy" class="h-4 w-4"></lucide-icon>
    </button>
</div>
```

---

### 8. Items Template Handling

**Question**: Do items use template references like weapons?

**Analysis**: Review of `items.rs` module shows that items are parsed directly from XML without template resolution:
- `carry_item` files: Parsed directly with `from_str()`
- `visual_item` files: Parsed directly with `from_str()`
- No `@file` attribute for template inheritance in item XML schema

**Conclusion**: Items do NOT use template references. No template resolution changes needed for items.

**Template Error Field**: Only `Weapon` model needs `template_error` field. `Item` model does not need this field.

---

## Updated Summary of Technical Decisions

| Decision | Implementation | Files Modified |
|----------|----------------|----------------|
| Cross-package template resolution | Fallback to `vanilla/weapons/` | `src-tauri/src/weapons.rs` |
| Template error handling | Continue parsing, store error | `src-tauri/src/weapons.rs`, `Weapon` model |
| Detail drawer action buttons | Add buttons with lucide icons | `weapons/items.component.html`, `icons/index.ts` |
| Items template support | N/A - items don't use templates | None |

---

## Implementation Status

As of 2025-01-21, the following has been implemented:
- ✅ Cross-package template resolution fallback
- ✅ Template error field in Weapon model
- ✅ Template error parsing with partial data
- ✅ Detail drawer action buttons (weapons + items)
- ✅ Copy icon registered in APP_ICONS
- ✅ Warning UI in weapons detail drawer
