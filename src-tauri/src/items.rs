//! Items directory scanner module
//!
//! Scans RWR game directory for item XML files (.carry_item, .visual_item, etc.),
//! parses them, and returns structured item data to the frontend.

use quick_xml::de::from_str;
use serde::{Deserialize, Serialize};
use std::collections::HashSet;
use std::path::Path;

/// Unified item structure (all item types)
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Item {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub key: Option<String>,
    pub name: String,
    #[serde(rename = "itemType")]
    pub item_type: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub encumbrance: Option<f64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub price: Option<f64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub can_respawn_with: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub in_stock: Option<bool>,
    #[serde(rename = "filePath")]
    pub file_path: String,
    #[serde(rename = "sourceFile")]
    pub source_file: String,
    #[serde(rename = "packageName")]
    pub package_name: String,
    // CarryItem-specific
    #[serde(skip_serializing_if = "Option::is_none")]
    pub slot: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub transform_on_consume: Option<String>,
    #[serde(rename = "timeToLive")]
    #[serde(skip_serializing_if = "Option::is_none")]
    pub time_to_live: Option<f64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub draggable: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub modifiers: Option<Vec<ItemModifier>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub hud_icon: Option<String>,
    #[serde(rename = "modelFilename")]
    #[serde(skip_serializing_if = "Option::is_none")]
    pub model_filename: Option<String>,
    // VisualItem-specific
    #[serde(rename = "meshFilenames")]
    #[serde(skip_serializing_if = "Option::is_none")]
    pub mesh_filenames: Option<Vec<String>>,
    #[serde(rename = "effectRef")]
    #[serde(skip_serializing_if = "Option::is_none")]
    pub effect_ref: Option<String>,
    // Extended attributes (capacity, commonness)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub capacity: Option<ItemCapacity>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub commonness: Option<ItemCommonness>,
}

/// Item modifier
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ItemModifier {
    #[serde(rename = "class")]
    pub modifier_class: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub value: Option<f64>,
    #[serde(rename = "inputCharacterState")]
    #[serde(skip_serializing_if = "Option::is_none")]
    pub input_character_state: Option<String>,
    #[serde(rename = "outputCharacterState")]
    #[serde(skip_serializing_if = "Option::is_none")]
    pub output_character_state: Option<String>,
    #[serde(rename = "consumesItem")]
    #[serde(skip_serializing_if = "Option::is_none")]
    pub consumes_item: Option<bool>,
}

/// Item capacity/spawn requirements
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ItemCapacity {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub value: Option<f64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub source: Option<String>,
    #[serde(rename = "sourceValue", skip_serializing_if = "Option::is_none")]
    pub source_value: Option<f64>,
}

/// Item spawn frequency settings
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ItemCommonness {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub value: Option<f64>,
    #[serde(rename = "inStock")]
    pub in_stock: Option<bool>,
    #[serde(rename = "canRespawnWith")]
    pub can_respawn_with: Option<bool>,
}

/// Error during item scanning
#[derive(Debug, Serialize)]
pub struct ScanError {
    pub file: String,
    pub error: String,
    pub severity: String,
}

/// Item scan result
#[derive(Debug, Serialize)]
pub struct ItemScanResult {
    pub items: Vec<Item>,
    pub errors: Vec<ScanError>,
    #[serde(rename = "duplicateKeys")]
    pub duplicate_keys: Vec<String>,
    #[serde(rename = "scanTime")]
    pub scan_time: u64,
}

/// Raw carry_item XML structure (for parsing)
#[derive(Debug, Deserialize, Default)]
struct RawCarryItem {
    #[serde(rename = "@key", default)]
    key: Option<String>,
    #[serde(rename = "@name", default)]
    name: Option<String>,
    #[serde(rename = "@slot", default)]
    slot: Option<String>,
    #[serde(rename = "@transform_on_consume", default)]
    transform_on_consume: Option<String>,
    #[serde(rename = "@time_to_live_out_in_the_open", default)]
    time_to_live: Option<f64>,
    #[serde(rename = "@draggable", default)]
    draggable: Option<String>,
    #[serde(rename = "@player_death_drop_owner_lock_time", default)]
    player_death_drop_owner_lock_time: Option<f64>,
    #[serde(rename = "hud_icon", default)]
    hud_icon: Option<RawHudIcon>,
    #[serde(rename = "capacity", default)]
    capacities: Vec<RawCapacity>,
    #[serde(rename = "inventory", default)]
    inventory: Option<RawInventory>,
    #[serde(rename = "commonness", default)]
    commonness: Option<RawCommonness>,
    #[serde(rename = "modifier", default)]
    modifiers: Vec<RawItemModifier>,
    #[serde(rename = "model", default)]
    model: Option<RawModel>,
}

#[derive(Debug, Deserialize, Default)]
struct RawHudIcon {
    #[serde(rename = "@filename", default)]
    filename: Option<String>,
}

#[derive(Debug, Deserialize, Default)]
struct RawCapacity {
    #[serde(rename = "@value", default)]
    value: Option<f64>,
    #[serde(rename = "@source", default)]
    source: Option<String>,
    #[serde(rename = "@sourceValue", default)]
    source_value: Option<f64>,
}

#[derive(Debug, Deserialize, Default)]
struct RawInventory {
    #[serde(rename = "@encumbrance", default)]
    encumbrance: Option<f64>,
    #[serde(rename = "@price", default)]
    price: Option<f64>,
}

#[derive(Debug, Deserialize, Default)]
struct RawCommonness {
    #[serde(rename = "@value", default)]
    value: Option<f64>,
    #[serde(rename = "@in_stock", default)]
    in_stock: Option<String>,
    #[serde(rename = "@can_respawn_with", default)]
    can_respawn_with: Option<String>,
}

#[derive(Debug, Deserialize, Default)]
struct RawItemModifier {
    #[serde(rename = "@class", default)]
    class: Option<String>,
    #[serde(rename = "@value", default)]
    value: Option<f64>,
    #[serde(rename = "@input_character_state", default)]
    input_character_state: Option<String>,
    #[serde(rename = "@output_character_state", default)]
    output_character_state: Option<String>,
    #[serde(rename = "@consumes_item", default)]
    consumes_item: Option<String>,
}

#[derive(Debug, Deserialize, Default)]
struct RawModel {
    #[serde(rename = "@mesh_filename", default)]
    mesh_filename: Option<String>,
}

/// Raw visual_item XML structure (for parsing)
#[derive(Debug, Deserialize, Default)]
struct RawVisualItem {
    #[serde(rename = "@key", default)]
    key: Option<String>,
    #[serde(rename = "model", default)]
    models: Vec<RawVisualModel>,
    #[serde(rename = "effect", default)]
    effect: Option<RawEffect>,
}

#[derive(Debug, Deserialize, Default)]
struct RawVisualModel {
    #[serde(rename = "@mesh_filename", default)]
    mesh_filename: Option<String>,
}

#[derive(Debug, Deserialize, Default)]
struct RawEffect {
    #[serde(rename = "@ref", default)]
    effect_ref: Option<String>,
}

/// Scan items from game directory
/// If `directory` is provided, scan that directory directly (it's expected to already be the packages directory)
#[tauri::command]
pub async fn scan_items(
    game_path: String,
    directory: Option<String>,
) -> Result<ItemScanResult, String> {
    let start_time = std::time::Instant::now();

    // Use provided directory if available, otherwise fall back to game_path/packages
    let scan_path = if let Some(dir) = &directory {
        dir.clone()
    } else {
        format!("{}/packages", game_path)
    };
    let input_path = Path::new(&scan_path);

    if !input_path.exists() {
        return Err(format!("Directory not found: {}", scan_path));
    }

    let input_path = input_path.to_path_buf();

    let mut items = Vec::new();
    let mut errors = Vec::new();
    let mut seen_keys = HashSet::new();
    let mut duplicate_keys = Vec::new();

    // Scan for item files in input_path/**/items/
    let items_pattern = input_path.join("**/items/*.carry_item");
    let visual_items_pattern = input_path.join("**/items/*.visual_item");

    // Scan carry_item files
    if let Ok(entries) = glob::glob(&items_pattern.to_string_lossy()) {
        for entry in entries {
            if let Ok(path) = entry {
                if path.is_file() {
                    match parse_carry_item(&path, &input_path) {
                        Ok(items_from_file) => {
                            for item in items_from_file {
                                if let Some(ref key) = item.key {
                                    if seen_keys.contains(key) {
                                        duplicate_keys.push(key.clone());
                                    } else {
                                        seen_keys.insert(key.clone());
                                    }
                                }
                                items.push(item);
                            }
                        }
                        Err(e) => {
                            errors.push(ScanError {
                                file: path.display().to_string(),
                                error: e,
                                severity: "error".to_string(),
                            });
                        }
                    }
                }
            }
        }
    }

    // Scan visual_item files
    if let Ok(entries) = glob::glob(&visual_items_pattern.to_string_lossy()) {
        for entry in entries {
            if let Ok(path) = entry {
                if path.is_file() {
                    match parse_visual_item(&path, &input_path) {
                        Ok(item) => {
                            if let Some(ref key) = item.key {
                                if seen_keys.contains(key) {
                                    duplicate_keys.push(key.clone());
                                } else {
                                    seen_keys.insert(key.clone());
                                }
                            }
                            items.push(item);
                        }
                        Err(e) => {
                            errors.push(ScanError {
                                file: path.display().to_string(),
                                error: e,
                                severity: "error".to_string(),
                            });
                        }
                    }
                }
            }
        }
    }

    let scan_time = start_time.elapsed().as_millis() as u64;

    Ok(ItemScanResult {
        items,
        errors,
        duplicate_keys,
        scan_time,
    })
}

/// Parse a carry_item XML file (may contain multiple carry_item elements)
fn parse_carry_item(path: &Path, input_path: &Path) -> Result<Vec<Item>, String> {
    let content =
        std::fs::read_to_string(path).map_err(|e| format!("Failed to read file: {}", e))?;

    // Parse as <carry_items> root with multiple <carry_item> children
    let raw_root: RawCarryItemsRoot =
        from_str(&content).map_err(|e| format!("XML parse error: {}", e))?;

    let file_name = path
        .file_stem()
        .and_then(|s| s.to_str())
        .unwrap_or("")
        .to_string();

    let package_name = path
        .ancestors()
        .skip_while(|p| *p != input_path)
        .skip(1)
        .next()
        .and_then(|p| p.file_name())
        .and_then(|n| n.to_str())
        .unwrap_or("unknown")
        .to_string();

    // Calculate relative file path from packages directory
    // e.g., "vanilla/items/vest2.carry_item"
    let file_path = path
        .strip_prefix(input_path)
        .unwrap_or(path)
        .to_string_lossy()
        .trim_start_matches('/')
        .to_string();

    // Parse ALL carry_item elements from the file
    let mut items = Vec::new();
    for (index, raw) in raw_root.items.iter().enumerate() {
        let modifiers = raw
            .modifiers
            .iter()
            .map(|m| ItemModifier {
                modifier_class: m.class.clone().unwrap_or_default(),
                value: m.value,
                input_character_state: m.input_character_state.clone(),
                output_character_state: m.output_character_state.clone(),
                consumes_item: m.consumes_item.as_ref().and_then(|s| s.parse().ok()),
            })
            .collect();

        // Ensure unique key: use raw.key if present, otherwise generate unique key from filename + index
        let item_key = if raw.key.is_some() {
            raw.key.clone()
        } else {
            // Generate unique key: "filename_index" format to avoid duplicates in multi-item files
            Some(format!("{}_{}", file_name, index))
        };

        let item = Item {
            key: item_key,
            name: raw.name.clone().unwrap_or_default(),
            item_type: "carry_item".to_string(),
            encumbrance: raw.inventory.as_ref().and_then(|i| i.encumbrance),
            price: raw.inventory.as_ref().and_then(|i| i.price),
            can_respawn_with: raw.commonness.as_ref().and_then(|c| {
                c.can_respawn_with.as_ref().and_then(|s| match s.trim() {
                    "1" => Some(true),
                    "0" => Some(false),
                    _ => None,
                })
            }),
            in_stock: raw.commonness.as_ref().and_then(|c| {
                c.in_stock.as_ref().and_then(|s| match s.trim() {
                    "1" => Some(true),
                    "0" => Some(false),
                    _ => None,
                })
            }),
            file_path: file_path.clone(),
            source_file: path.display().to_string(),
            package_name: package_name.clone(),
            slot: raw.slot.clone(),
            transform_on_consume: raw.transform_on_consume.clone(),
            time_to_live: raw.time_to_live,
            draggable: raw
                .draggable
                .as_ref()
                .and_then(|s| s.parse::<u8>().ok())
                .map(|v| v == 1),
            modifiers: Some(modifiers),
            hud_icon: raw.hud_icon.as_ref().and_then(|h| h.filename.clone()),
            model_filename: raw.model.as_ref().and_then(|m| m.mesh_filename.clone()),
            mesh_filenames: None,
            effect_ref: None,
            capacity: raw.capacities.first().map(|rc| ItemCapacity {
                value: rc.value,
                source: rc.source.clone(),
                source_value: rc.source_value,
            }),
            commonness: raw.commonness.as_ref().map(|rc| ItemCommonness {
                value: rc.value,
                in_stock: rc.in_stock.as_ref().and_then(|s| match s.trim() {
                    "1" => Some(true),
                    "0" => Some(false),
                    _ => None,
                }),
                can_respawn_with: rc.can_respawn_with.as_ref().and_then(|s| match s.trim() {
                    "1" => Some(true),
                    "0" => Some(false),
                    _ => None,
                }),
            }),
        };
        items.push(item);
    }

    Ok(items)
}

/// Parse a visual_item XML file
fn parse_visual_item(path: &Path, input_path: &Path) -> Result<Item, String> {
    let content =
        std::fs::read_to_string(path).map_err(|e| format!("Failed to read file: {}", e))?;

    let raw: RawVisualItem = from_str(&content).map_err(|e| format!("XML parse error: {}", e))?;

    let file_name = path
        .file_stem()
        .and_then(|s| s.to_str())
        .unwrap_or("")
        .to_string();

    let package_name = path
        .ancestors()
        .skip_while(|p| *p != input_path)
        .skip(1)
        .next()
        .and_then(|p| p.file_name())
        .and_then(|n| n.to_str())
        .unwrap_or("unknown")
        .to_string();

    let mesh_filenames: Vec<String> = raw
        .models
        .iter()
        .filter_map(|m| m.mesh_filename.clone())
        .collect();

    // Calculate relative file path from packages directory
    // e.g., "vanilla/items/mesh_name.visual_item"
    let file_path = path
        .strip_prefix(input_path)
        .unwrap_or(path)
        .to_string_lossy()
        .trim_start_matches('/')
        .to_string();

    Ok(Item {
        key: Some(file_name.clone()),
        name: file_name.clone(),
        item_type: "visual_item".to_string(),
        encumbrance: None,
        price: None,
        can_respawn_with: None,
        in_stock: None,
        file_path,
        source_file: path.display().to_string(),
        package_name,
        slot: None,
        transform_on_consume: None,
        time_to_live: None,
        draggable: None,
        modifiers: None,
        hud_icon: None,
        model_filename: None,
        mesh_filenames: Some(mesh_filenames),
        effect_ref: raw.effect.and_then(|e| e.effect_ref),
        capacity: None,
        commonness: None,
    })
}

/// Root container for carry_item XML files
#[derive(Debug, Deserialize)]
struct RawCarryItemsRoot {
    #[serde(rename = "carry_item")]
    items: Vec<RawCarryItem>,
}

/// Get the absolute path to a texture file for item icon rendering
/// Navigates from item file location to textures/ folder (sibling directory)
#[tauri::command]
pub async fn get_item_texture_path(
    item_file_path: String,
    icon_filename: String,
) -> Result<String, String> {
    use std::path::PathBuf;

    let item_path = PathBuf::from(&item_file_path);
    let item_dir = item_path
        .parent()
        .ok_or("Invalid item path: cannot get parent directory")?;

    // textures/ is a sibling to items/ folder
    let textures_dir = item_dir
        .parent()
        .ok_or("Invalid item path: cannot get grandparent directory")?
        .join("textures");

    let icon_path = textures_dir.join(&icon_filename);

    if !icon_path.exists() {
        return Err(format!(
            "Icon file not found: {} (expected at: {})",
            icon_filename,
            icon_path.display()
        ));
    }

    let canonical = icon_path
        .canonicalize()
        .map_err(|e| format!("Failed to resolve icon path: {}", e))?;

    Ok(canonical.to_string_lossy().to_string())
}

/// Get item icon as base64 data URL
/// This bypasses asset:// protocol encoding issues
#[tauri::command]
pub async fn get_item_icon_base64(
    item_file_path: String,
    icon_filename: String,
) -> Result<String, String> {
    use base64::Engine;
    use std::fs;
    use std::path::PathBuf;

    let item_path = PathBuf::from(&item_file_path);
    let item_dir = item_path
        .parent()
        .ok_or("Invalid item path: cannot get parent directory")?;

    // textures/ is a sibling to items/ folder
    let textures_dir = item_dir
        .parent()
        .ok_or("Invalid item path: cannot get grandparent directory")?
        .join("textures");

    let icon_path = textures_dir.join(&icon_filename);

    if !icon_path.exists() {
        return Err(format!(
            "Icon file not found: {} (expected at: {})",
            icon_filename,
            icon_path.display()
        ));
    }

    // Read image file
    let image_data =
        fs::read(&icon_path).map_err(|e| format!("Failed to read icon file: {}", e))?;

    // Detect MIME type from extension
    let mime_type = match icon_path.extension().and_then(|e| e.to_str()) {
        Some("png") => "image/png",
        Some("jpg") | Some("jpeg") => "image/jpeg",
        Some("gif") => "image/gif",
        Some("webp") => "image/webp",
        _ => "image/png", // Default to PNG
    };

    // Encode to base64
    let base64_string = base64::engine::general_purpose::STANDARD.encode(&image_data);

    Ok(format!("data:{};base64,{}", mime_type, base64_string))
}
