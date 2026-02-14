//! Items directory scanner module
//!
//! Scans RWR game directory for item XML files (.carry_item, .visual_item, etc.),
//! parses them, and returns structured item data to the frontend.

use crate::utils::resolve_packages_dirs;
use crate::ScanEvent;
use quick_xml::de::from_str;
use rayon::prelude::*;
use serde::{Deserialize, Serialize};
use std::collections::HashSet;
use std::path::{Path, PathBuf};
use tauri::ipc::Channel;
use walkdir::WalkDir;

const BATCH_SIZE: usize = 50;
const MAX_TEMPLATE_DEPTH: usize = 10;

/// Unified item structure (all item types)
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Item {
    pub id: String,
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
    #[serde(rename = "sourceDirectory")]
    pub source_directory: String,
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
#[derive(Debug, Serialize, Clone)]
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
    #[serde(rename = "@file", default)]
    template_file: Option<String>,
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
    #[allow(dead_code)]
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
    #[allow(dead_code)]
    key: Option<String>,
    #[serde(rename = "@file", default)]
    template_file: Option<String>,
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

/// Scan items from a game/workshop directory.
///
/// `directory` / `game_path` may be either:
/// - the `packages` directory
/// - the game/workshop root that contains `media/` (we'll scan `media/packages`)
#[tauri::command]
pub async fn scan_items(
    game_path: String,
    directory: Option<String>,
    on_event: Channel<ScanEvent<Item>>,
) -> Result<(), String> {
    let source_directory = directory.clone().unwrap_or_else(|| game_path.clone());
    let package_roots = resolve_packages_dirs(Path::new(&source_directory));

    #[cfg(debug_assertions)]
    {
        eprintln!(
            "[scan_items] source_directory={} roots={}",
            source_directory,
            package_roots
                .iter()
                .map(|p| p.display().to_string())
                .collect::<Vec<_>>()
                .join(" | ")
        );
    }

    if package_roots.iter().all(|p| !p.exists()) {
        let paths = package_roots
            .iter()
            .map(|p| p.display().to_string())
            .collect::<Vec<_>>()
            .join(", ");
        return Err(format!("Directory not found (tried: {paths})"));
    }

    // Collect all relevant files across possible packages roots (macOS app bundle + external media).
    let mut files: Vec<(PathBuf, PathBuf)> = Vec::new();
    for root in &package_roots {
        if !root.exists() {
            continue;
        }
        for entry in WalkDir::new(root).into_iter().filter_map(|e| e.ok()) {
            let path = entry.path();
            if path
                .extension()
                .is_some_and(|ext| ext == "carry_item" || ext == "visual_item")
            {
                files.push((root.clone(), path.to_path_buf()));
            }
        }
    }

    let send_event = |evt: ScanEvent<Item>| -> Result<(), String> {
        on_event
            .send(evt)
            .map_err(|e| format!("Failed to send scan event: {e}"))
    };

    #[cfg(debug_assertions)]
    {
        eprintln!("[scan_items] discovered_files={}", files.len());
    }

    if files.is_empty() {
        // Nothing to scan, but still notify the frontend so it can stop loading.
        send_event(ScanEvent::Finished)?;
        return Ok(());
    }

    let total = files.len();
    send_event(ScanEvent::Progress { current: 0, total })?;

    // Parallel processing using rayon.
    // Note: carry_item files may contain multiple <carry_item> elements, so we return Vec<Item>.
    let all_results: Vec<Result<Vec<Item>, String>> = files
        .into_par_iter()
        .enumerate()
        .map(|(index, (packages_root, path))| {
            let file_str = path.to_string_lossy().to_string();
            let is_carry_item = path.extension().is_some_and(|ext| ext == "carry_item");
            let base_id = format!("{}_{}", file_str, index);

            if is_carry_item {
                parse_carry_item(&path, &packages_root, base_id, &source_directory)
            } else {
                parse_visual_item(&path, &packages_root, base_id, &source_directory)
                    .map(|i| vec![i])
            }
        })
        .collect();

    #[cfg(debug_assertions)]
    {
        let ok_count = all_results.iter().filter(|r| r.is_ok()).count();
        let err_count = all_results.len() - ok_count;
        let item_count: usize = all_results
            .iter()
            .filter_map(|r| r.as_ref().ok())
            .map(|v| v.len())
            .sum();
        eprintln!(
            "[scan_items] parsed_ok={} parsed_err={} parsed_items={}",
            ok_count, err_count, item_count
        );
    }

    // Send in batches
    for (i, chunk) in all_results.chunks(BATCH_SIZE).enumerate() {
        let items: Vec<Item> = chunk
            .iter()
            .filter_map(|r| r.as_ref().ok())
            .flat_map(|v| v.iter().cloned())
            .collect();
        let errors: Vec<String> = chunk
            .iter()
            .filter_map(|r| r.as_ref().err().cloned())
            .collect();

        if !items.is_empty() {
            send_event(ScanEvent::Chunk(items))?;
        }

        for error in errors {
            send_event(ScanEvent::Error(error))?;
        }

        send_event(ScanEvent::Progress {
            current: ((i + 1) * BATCH_SIZE).min(total),
            total,
        })?;
    }

    send_event(ScanEvent::Finished)?;

    Ok(())
}

/// Fallback scan API (no IPC `Channel`).
#[tauri::command]
pub async fn scan_items_collect(
    game_path: String,
    directory: Option<String>,
) -> Result<ItemScanResult, String> {
    let started = std::time::Instant::now();

    let source_directory = directory.clone().unwrap_or_else(|| game_path.clone());
    let package_roots = resolve_packages_dirs(Path::new(&source_directory));

    if package_roots.iter().all(|p| !p.exists()) {
        let paths = package_roots
            .iter()
            .map(|p| p.display().to_string())
            .collect::<Vec<_>>()
            .join(", ");
        return Err(format!("Directory not found (tried: {paths})"));
    }

    let mut files: Vec<(PathBuf, PathBuf)> = Vec::new();
    for root in &package_roots {
        if !root.exists() {
            continue;
        }
        for entry in WalkDir::new(root).into_iter().filter_map(|e| e.ok()) {
            let path = entry.path();
            if path
                .extension()
                .is_some_and(|ext| ext == "carry_item" || ext == "visual_item")
            {
                files.push((root.clone(), path.to_path_buf()));
            }
        }
    }

    if files.is_empty() {
        return Ok(ItemScanResult {
            items: vec![],
            errors: vec![],
            duplicate_keys: vec![],
            scan_time: started.elapsed().as_millis() as u64,
        });
    }

    let all_results: Vec<Result<Vec<Item>, ScanError>> = files
        .into_par_iter()
        .enumerate()
        .map(|(index, (packages_root, path))| {
            let file_str = path.to_string_lossy().to_string();
            let is_carry_item = path.extension().is_some_and(|ext| ext == "carry_item");
            let base_id = format!("{}_{}", file_str, index);

            let parsed = if is_carry_item {
                parse_carry_item(&path, &packages_root, base_id, &source_directory)
            } else {
                parse_visual_item(&path, &packages_root, base_id, &source_directory)
                    .map(|i| vec![i])
            };

            parsed.map_err(|e| ScanError {
                file: file_str,
                error: e,
                severity: "error".to_string(),
            })
        })
        .collect();

    let items: Vec<Item> = all_results
        .iter()
        .filter_map(|r| r.as_ref().ok())
        .flat_map(|v| v.iter().cloned())
        .collect();
    let errors: Vec<ScanError> = all_results
        .iter()
        .filter_map(|r| r.as_ref().err().cloned())
        .collect();

    Ok(ItemScanResult {
        items,
        errors,
        duplicate_keys: vec![],
        scan_time: started.elapsed().as_millis() as u64,
    })
}

#[derive(Debug, Clone)]
struct CarryTemplateSelector {
    key: Option<String>,
    index: usize,
}

fn resolve_item_template_path(base_dir: &Path, template_file: &str) -> PathBuf {
    let candidate = base_dir.join(template_file);
    if candidate.exists() {
        return candidate;
    }

    if let Some(packages_dir) = base_dir.ancestors().nth(2) {
        let vanilla_candidate = packages_dir.join("vanilla/items").join(template_file);
        if vanilla_candidate.exists() {
            return vanilla_candidate;
        }
    }

    candidate
}

fn resolve_carry_item_template(
    base_dir: &Path,
    template_file: &str,
    selector: &CarryTemplateSelector,
    visited: &mut HashSet<PathBuf>,
) -> Result<RawCarryItem, String> {
    let template_path = resolve_item_template_path(base_dir, template_file);

    if !visited.insert(template_path.clone()) {
        return Err(format!(
            "Circular carry_item template reference detected: {}",
            template_file
        ));
    }

    if visited.len() > MAX_TEMPLATE_DEPTH {
        return Err(format!(
            "carry_item template depth exceeded limit (>{})",
            MAX_TEMPLATE_DEPTH
        ));
    }

    let content = std::fs::read_to_string(&template_path).map_err(|e| {
        format!(
            "Failed to read carry_item template '{}': {e}",
            template_path.display()
        )
    })?;
    let root: RawCarryItemsRoot =
        from_str(&content).map_err(|e| format!("carry_item template XML parse error: {e}"))?;
    let mut template_items = root.items;

    let mut current = if let Some(key) = selector.key.as_ref() {
        template_items
            .iter()
            .position(|item| item.key.as_ref() == Some(key))
            .and_then(|idx| {
                if idx < template_items.len() {
                    Some(template_items.remove(idx))
                } else {
                    None
                }
            })
            .or_else(|| template_items.into_iter().nth(selector.index))
            .ok_or_else(|| {
                format!(
                    "Cannot select carry_item from template '{}': key='{}', index={}",
                    template_path.display(),
                    key,
                    selector.index
                )
            })?
    } else if template_items.len() == 1 {
        template_items.into_iter().next().ok_or_else(|| {
            format!(
                "Template '{}' does not contain carry_item entries",
                template_path.display()
            )
        })?
    } else if selector.index < template_items.len() {
        template_items
            .into_iter()
            .nth(selector.index)
            .ok_or_else(|| {
                format!(
                    "Cannot select carry_item index {} from template '{}'",
                    selector.index,
                    template_path.display()
                )
            })?
    } else {
        return Err(format!(
            "Ambiguous carry_item template '{}': {} entries but index {} is out of range",
            template_path.display(),
            template_items.len(),
            selector.index
        ));
    };

    if let Some(parent_file) = current.template_file.clone() {
        let template_parent = template_path.parent().ok_or_else(|| {
            format!(
                "Cannot resolve parent directory for carry_item template '{}'",
                template_path.display()
            )
        })?;
        let next_selector = CarryTemplateSelector {
            key: current.key.clone().or_else(|| selector.key.clone()),
            index: selector.index,
        };
        let parent =
            resolve_carry_item_template(template_parent, &parent_file, &next_selector, visited)?;
        current = merge_carry_item_attributes(parent, current);
    }

    visited.remove(&template_path);
    Ok(current)
}

fn resolve_visual_item_template(
    base_dir: &Path,
    template_file: &str,
    visited: &mut HashSet<PathBuf>,
) -> Result<RawVisualItem, String> {
    let template_path = resolve_item_template_path(base_dir, template_file);

    if !visited.insert(template_path.clone()) {
        return Err(format!(
            "Circular visual_item template reference detected: {}",
            template_file
        ));
    }

    if visited.len() > MAX_TEMPLATE_DEPTH {
        return Err(format!(
            "visual_item template depth exceeded limit (>{})",
            MAX_TEMPLATE_DEPTH
        ));
    }

    let content = std::fs::read_to_string(&template_path).map_err(|e| {
        format!(
            "Failed to read visual_item template '{}': {e}",
            template_path.display()
        )
    })?;
    let mut current: RawVisualItem =
        from_str(&content).map_err(|e| format!("visual_item template XML parse error: {e}"))?;

    if let Some(parent_file) = current.template_file.clone() {
        let template_parent = template_path.parent().ok_or_else(|| {
            format!(
                "Cannot resolve parent directory for visual_item template '{}'",
                template_path.display()
            )
        })?;
        let parent = resolve_visual_item_template(template_parent, &parent_file, visited)?;
        current = merge_visual_item_attributes(parent, current);
    }

    visited.remove(&template_path);
    Ok(current)
}

fn merge_carry_item_attributes(parent: RawCarryItem, mut child: RawCarryItem) -> RawCarryItem {
    if child.key.is_none() {
        child.key = parent.key;
    }
    if child.name.is_none() {
        child.name = parent.name;
    }
    if child.slot.is_none() {
        child.slot = parent.slot;
    }
    if child.template_file.is_none() {
        child.template_file = parent.template_file;
    }
    if child.transform_on_consume.is_none() {
        child.transform_on_consume = parent.transform_on_consume;
    }
    if child.time_to_live.is_none() {
        child.time_to_live = parent.time_to_live;
    }
    if child.draggable.is_none() {
        child.draggable = parent.draggable;
    }

    child.hud_icon = merge_hud_icon(parent.hud_icon, child.hud_icon);
    child.inventory = merge_inventory(parent.inventory, child.inventory);
    child.commonness = merge_commonness(parent.commonness, child.commonness);
    child.model = merge_model(parent.model, child.model);

    if child.capacities.is_empty() {
        child.capacities = parent.capacities;
    }
    if child.modifiers.is_empty() {
        child.modifiers = parent.modifiers;
    }

    child
}

fn merge_visual_item_attributes(parent: RawVisualItem, mut child: RawVisualItem) -> RawVisualItem {
    if child.key.is_none() {
        child.key = parent.key;
    }
    if child.template_file.is_none() {
        child.template_file = parent.template_file;
    }
    if child.models.is_empty() {
        child.models = parent.models;
    }
    if child.effect.is_none() {
        child.effect = parent.effect;
    }
    child
}

fn merge_hud_icon(parent: Option<RawHudIcon>, child: Option<RawHudIcon>) -> Option<RawHudIcon> {
    match (parent, child) {
        (Some(parent), Some(mut child)) => {
            if child.filename.is_none() {
                child.filename = parent.filename;
            }
            Some(child)
        }
        (Some(parent), None) => Some(parent),
        (_, Some(child)) => Some(child),
        (None, None) => None,
    }
}

fn merge_inventory(
    parent: Option<RawInventory>,
    child: Option<RawInventory>,
) -> Option<RawInventory> {
    match (parent, child) {
        (Some(parent), Some(mut child)) => {
            if child.encumbrance.is_none() {
                child.encumbrance = parent.encumbrance;
            }
            if child.price.is_none() {
                child.price = parent.price;
            }
            Some(child)
        }
        (Some(parent), None) => Some(parent),
        (_, Some(child)) => Some(child),
        (None, None) => None,
    }
}

fn merge_commonness(
    parent: Option<RawCommonness>,
    child: Option<RawCommonness>,
) -> Option<RawCommonness> {
    match (parent, child) {
        (Some(parent), Some(mut child)) => {
            if child.value.is_none() {
                child.value = parent.value;
            }
            if child.in_stock.is_none() {
                child.in_stock = parent.in_stock;
            }
            if child.can_respawn_with.is_none() {
                child.can_respawn_with = parent.can_respawn_with;
            }
            Some(child)
        }
        (Some(parent), None) => Some(parent),
        (_, Some(child)) => Some(child),
        (None, None) => None,
    }
}

fn merge_model(parent: Option<RawModel>, child: Option<RawModel>) -> Option<RawModel> {
    match (parent, child) {
        (Some(parent), Some(mut child)) => {
            if child.mesh_filename.is_none() {
                child.mesh_filename = parent.mesh_filename;
            }
            Some(child)
        }
        (Some(parent), None) => Some(parent),
        (_, Some(child)) => Some(child),
        (None, None) => None,
    }
}

/// Parse a carry_item XML file (may contain multiple carry_item elements)
fn parse_carry_item(
    path: &Path,
    input_path: &Path,
    base_id: String,
    source_directory: &str,
) -> Result<Vec<Item>, String> {
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
        .nth(1)
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

    let mut items = Vec::new();
    let item_parent = path
        .parent()
        .ok_or_else(|| "Cannot get parent directory of carry_item file".to_string())?;

    for (index, raw_item) in raw_root.items.into_iter().enumerate() {
        let mut raw = raw_item;

        if let Some(template_file) = raw.template_file.clone() {
            let selector = CarryTemplateSelector {
                key: raw.key.clone(),
                index,
            };
            if let Ok(parent) = resolve_carry_item_template(
                item_parent,
                &template_file,
                &selector,
                &mut HashSet::new(),
            ) {
                raw = merge_carry_item_attributes(parent, raw);
            }
        }

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

        let item_key = if raw.key.is_some() {
            raw.key.clone()
        } else {
            Some(format!("{}_{}", file_name, index))
        };

        let item = Item {
            id: format!("{}_{}", base_id, index),
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
            source_directory: source_directory.to_string(),
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
fn parse_visual_item(
    path: &Path,
    input_path: &Path,
    id: String,
    source_directory: &str,
) -> Result<Item, String> {
    let content =
        std::fs::read_to_string(path).map_err(|e| format!("Failed to read file: {}", e))?;

    let mut raw: RawVisualItem =
        from_str(&content).map_err(|e| format!("XML parse error: {}", e))?;

    if let Some(template_file) = raw.template_file.clone() {
        let item_parent = path
            .parent()
            .ok_or_else(|| "Cannot get parent directory of visual_item file".to_string())?;
        if let Ok(parent) =
            resolve_visual_item_template(item_parent, &template_file, &mut HashSet::new())
        {
            raw = merge_visual_item_attributes(parent, raw);
        }
    }

    let file_name = path
        .file_stem()
        .and_then(|s| s.to_str())
        .unwrap_or("")
        .to_string();

    let package_name = path
        .ancestors()
        .skip_while(|p| *p != input_path)
        .nth(1)
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
        id,
        key: Some(file_name.clone()),
        name: file_name.clone(),
        item_type: "visual_item".to_string(),
        encumbrance: None,
        price: None,
        can_respawn_with: None,
        in_stock: None,
        file_path,
        source_file: path.display().to_string(),
        source_directory: source_directory.to_string(),
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
