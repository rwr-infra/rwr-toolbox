# Weapons API Contracts

**Feature**: 001-fix-data-scanning
**Module**: `src-tauri/src/weapons.rs`

## Tauri Commands

### scan_weapons

Scans weapon XML files from game directory with cross-package template resolution.

**Command**:
```rust
#[tauri::command]
pub async fn scan_weapons(
    game_path: String,
    directory: Option<String>,
) -> Result<WeaponScanResult, String>
```

**Parameters**:
| Name | Type | Required | Description |
|------|------|----------|-------------|
| game_path | String | Yes | Full path to game directory (e.g., `/path/to/RWR.app/Contents/Resources/media`) |
| directory | Option\<String\> | No | Direct path to packages directory (if provided, skips `game_path/packages` resolution) |

**Returns**: `WeaponScanResult`
```rust
pub struct WeaponScanResult {
    pub weapons: Vec<Weapon>,
    pub errors: Vec<ScanError>,
    pub duplicate_keys: Vec<String>,
    pub scan_time: u64,
}
```

**Behavior**:
- Discovers all `.weapon` files using `walkdir`
- Parses XML files with `quick-xml`
- Resolves template inheritance via `@file` attribute
- Supports cross-package template references with fallback to `vanilla/weapons/`
- Continues parsing on template errors (stores in `template_error` field)
- Uses `rayon` for parallel XML parsing

**Template Resolution Logic**:
```rust
fn resolve_template(
    base_dir: &Path,      // Parent directory of weapon file
    template_file: &str,  // Relative path from @file attribute
    visited: &mut HashSet<PathBuf>,
) -> Result<RawWeapon, anyhow::Error>
```

1. Try to resolve template relative to `base_dir`
2. If not found, try `packages_root/vanilla/weapons/template_file`
3. Detect circular references (track visited paths)
4. Enforce max depth of 10 template levels
5. Return error if both attempts fail (caller continues with partial data)

### validate_game_path

Validates game directory and counts package subdirectories.

**Command**:
```rust
#[tauri::command]
pub async fn validate_game_path(path: String) -> Result<ValidationResult, String>
```

**Parameters**:
| Name | Type | Required | Description |
|------|------|----------|-------------|
| path | String | Yes | Path to validate (either game root or packages directory) |

**Returns**: `ValidationResult`
```rust
pub struct ValidationResult {
    pub valid: bool,
    pub weapons_path: String,
    pub package_count: usize,     // Number of package subdirectories
    pub error_code: Option<String>,
    pub message: Option<String>,
}
```

**Behavior**:
1. Check if path exists
2. If path ends with "packages", use directly
3. Otherwise, append "packages" to path
4. Count immediate subdirectories (packages) using `walkdir` with `max_depth=1`
5. Return validation result with package count

## Data Models

### Weapon

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
    pub burst_shots: Option<f64>,
    pub spread_range: Option<f64>,
    pub sight_range_modifier: Option<f64>,
    pub projectile_speed: Option<f64>,
    pub barrel_offset: Option<f64>,
    pub encumbrance: Option<f64>,
    pub price: Option<f64>,
    pub suppressed: bool,
    pub can_respawn_with: bool,
    pub in_stock: bool,
    pub chain_variants: Vec<String>,
    pub stance_accuracies: Vec<StanceAccuracy>,
    pub file_path: String,
    pub source_file: String,
    pub package_name: String,
    /// NEW: Error message if template resolution failed
    #[serde(skip_serializing_if = "Option::is_none")]
    #[serde(rename = "templateError")]
    pub template_error: Option<String>,
}
```

### ScanError

```rust
#[derive(Debug, Serialize)]
pub struct ScanError {
    pub file: String,
    pub error: String,
    pub severity: String,  // "error" | "warning"
}
```

### StanceAccuracy

```rust
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StanceAccuracy {
    pub stance: String,
    pub accuracy: f64,
}
```

## Error Handling

### Template Resolution Errors

When template resolution fails:
1. Weapon is NOT excluded from results
2. `template_error` field contains error message
3. Frontend displays warning in detail drawer
4. Scan continues to next file

**Error Format**:
```
"Template resolution failed: No such file or directory (os error 2)"
```

### Circular Reference Detection

**Behavior**:
- Track visited template paths in `HashSet<PathBuf>`
- Return error if path already in visited set
- Error message: `"Circular reference detected: {template_file}"`

**Example**:
```
weapon_a.weapon → weapon_b.weapon → weapon_a.weapon
```

### Depth Limit Exceeded

**Behavior**:
- Enforce `MAX_TEMPLATE_DEPTH = 10`
- Return error if depth exceeded
- Error message: `"Template depth exceeded limit (>10)"`

## Performance Characteristics

### Parallel Scanning

- Uses `rayon` for CPU-bound XML parsing
- `par_bridge()` converts `walkdir` iterator to parallel
- Expected speedup: 3-4x on 4-core CPU

### Memory Usage

- Sequential: ~50MB for 1000 files
- Parallel: ~200MB for 1000 files (4 threads)

### Scan Time Estimates

| Files | Sequential | Parallel (4-core) |
|-------|------------|-------------------|
| 100   | ~1s        | ~0.3s             |
| 500   | ~5s        | ~1.5s             |
| 1000  | ~10s       | ~3s               |
