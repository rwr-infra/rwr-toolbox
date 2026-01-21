# Directories API Contracts

**Feature**: 001-fix-data-scanning
**Module**: `src-tauri/src/directories.rs`

## Tauri Commands

### validate_directory

Validates a directory for game data scanning and counts package subdirectories.

**Command**:
```rust
#[tauri::command]
pub fn validate_directory(path: String) -> DirectoryValidationResult
```

**Parameters**:
| Name | Type | Required | Description |
|------|------|----------|-------------|
| path | String | Yes | Full path to directory to validate |

**Returns**: `DirectoryValidationResult`
```rust
#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DirectoryValidationResult {
    pub valid: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error_code: Option<DirectoryErrorCode>,
    pub message: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub details: Option<ValidationDetails>,
}
```

**Behavior**:
1. Check if path exists → `PathNotFound` if not
2. Check if path is a directory → `NotADirectory` if not
3. Check if path is readable → `AccessDenied` if not
4. Check if `media/` subdirectory exists → `MissingMediaSubdirectory` if not
5. Count package subdirectories using `walkdir` with `min_depth=1, max_depth=1`

**Package Counting**:
```rust
let package_count = WalkDir::new(&path)
    .min_depth(1)
    .max_depth(1)
    .into_iter()
    .filter_map(|e| e.ok())
    .filter(|e| e.path().is_dir())
    .count();
```

### get_item_texture_path

Gets absolute path to item icon image file.

**Command**:
```rust
#[tauri::command]
pub async fn get_item_texture_path(
    item_file_path: String,
    icon_filename: String,
) -> Result<String, String>
```

**Parameters**:
| Name | Type | Required | Description |
|------|------|----------|-------------|
| item_file_path | String | Yes | Full path to item XML file |
| icon_filename | String | Yes | Icon filename from hud_icon element |

**Returns**: Absolute path to icon image file

**Path Resolution**:
```
item_file_path: /path/to/packages/vanilla/items/vest.carry_item
icon_filename: hud_vest.png

Result: /path/to/packages/vanilla/textures/hud_vest.png
```

### get_item_icon_base64

Gets item icon as base64 data URL (bypasses asset:// protocol issues).

**Command**:
```rust
#[tauri::command]
pub async fn get_item_icon_base64(
    item_file_path: String,
    icon_filename: String,
) -> Result<String, String>
```

**Returns**: Data URL like `data:image/png;base64,iVBORw0KG...`

## Data Models

### DirectoryErrorCode

```rust
#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum DirectoryErrorCode {
    PathNotFound,
    NotADirectory,
    AccessDenied,
    MissingMediaSubdirectory,
}
```

### ValidationDetails

```rust
#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ValidationDetails {
    pub path_exists: bool,
    pub is_directory: bool,
    pub is_readable: bool,
    #[serde(rename = "hasMediaSubdirectory")]
    pub has_media_subdirectory: bool,
}
```

## Frontend Models

### ScanDirectory

```typescript
export interface ScanDirectory {
    id: string;
    path: string;
    valid: boolean;
    validated: boolean;
    /** NEW: Include/exclude from scans */
    active: boolean;
    /** NEW: Number of package subdirectories */
    packageCount: number;
    lastScanned?: Date;
    error?: DirectoryErrorCode;
}
```

## Active Directory Filtering

### Scan Only Active Directories

When scanning weapons/items:
```typescript
const activeDirectories = directoriesSig().filter(d => d.active);
// Scan only active directories
```

### Toggle Active State

```typescript
async toggleActive(directoryId: string): Promise<void> {
    const dirs = this.directoriesSig();
    const updated = dirs.map(d => 
        d.id === directoryId ? { ...d, active: !d.active } : d
    );
    this.directoriesSig.set(updated);
    await this.saveScanDirs(updated);
}
```

## Package Count Display

### i18n Keys

```json
{
  "settings": {
    "packageCount": "{count} packages",
    "packageCount_one": "{count} package"
  }
}
```

### Template Usage

```html
<span>{{ 'settings.packageCount' | transloco: { count: dir.packageCount } }}</span>
```

**Output Examples**:
- `0 packages`
- `1 package`
- `5 packages`
