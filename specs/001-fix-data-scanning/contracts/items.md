# Items API Contracts

**Feature**: 001-fix-data-scanning
**Module**: `src-tauri/src/items.rs`

## Tauri Commands

### scan_items

Scans item XML files from game directory.

**Command**:
```rust
#[tauri::command]
pub async fn scan_items(
    game_path: String,
    directory: Option<String>,
) -> Result<ItemScanResult, String>
```

**Parameters**:
| Name | Type | Required | Description |
|------|------|----------|-------------|
| game_path | String | Yes | Full path to game directory |
| directory | Option\<String\> | No | Direct path to packages directory |

**Returns**: `ItemScanResult`
```rust
pub struct ItemScanResult {
    pub items: Vec<Item>,
    pub errors: Vec<ScanError>,
    pub duplicate_keys: Vec<String>,
    pub scan_time: u64,
}
```

**Behavior**:
- Discovers all `.carry_item` and `.visual_item` files
- Parses XML files directly (NO template resolution)
- Items do NOT use template inheritance like weapons
- Returns all items found in configured directories

## Data Models

### Item

```rust
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Item {
    pub key: Option<String>,
    pub name: String,
    pub item_type: String,  // "carry_item" | "visual_item"
    pub encumbrance: Option<f64>,
    pub price: Option<f64>,
    pub can_respawn_with: Option<bool>,
    pub in_stock: Option<bool>,
    pub file_path: String,
    pub source_file: String,
    pub package_name: String,
    // CarryItem-specific
    pub slot: Option<String>,
    pub transform_on_consume: Option<String>,
    pub time_to_live: Option<f64>,
    pub draggable: Option<bool>,
    pub modifiers: Option<Vec<ItemModifier>>,
    pub hud_icon: Option<String>,
    pub model_filename: Option<String>,
    // VisualItem-specific
    pub mesh_filenames: Option<Vec<String>>,
    pub effect_ref: Option<String>,
    // Extended attributes
    pub capacity: Option<ItemCapacity>,
    pub commonness: Option<ItemCommonness>,
}
```

**Note**: Item model does NOT have `template_error` field because items do not use template resolution.

## Template Resolution

### Items Do NOT Use Templates

Unlike weapons, items are parsed directly from XML without template inheritance:

```rust
// Direct parsing - no template resolution
let raw: RawCarryItem = from_str(&content)?;
```

**Reason**: Item XML schema does not include an `@file` attribute for template references.

## Error Handling

### Parse Errors

When item parsing fails:
1. Item is excluded from results
2. Error is added to `errors` array
3. Scan continues to next file

**Error Format**:
```
"XML parse error: missing field `name` at line 5"
```
