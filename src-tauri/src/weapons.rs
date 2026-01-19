//! Weapons directory scanner module
//!
//! Scans RWR game directory for weapon XML files, parses them with template inheritance resolution,
//! and returns structured weapon data to the frontend.

use quick_xml::de::from_str;
use serde::{Deserialize, Serialize};
use std::collections::{HashMap, HashSet};
use std::path::{Path, PathBuf};
use walkdir::WalkDir;

const MAX_TEMPLATE_DEPTH: usize = 10;

/// Main weapon structure with all attributes from XML
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")] // Apply camelCase to all fields by default
pub struct Weapon {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub key: Option<String>,
    pub name: String,
    /// Weapon type tag from <tag name="..."/> element (e.g., "assault", "smg")
    #[serde(rename = "tag")]
    pub tag: String,
    /// Weapon class numeric value from <specification class="..."/> attribute (e.g., 0, 1, 2)
    #[serde(rename = "class")]
    pub class: i32,
    /// Icon filename from <hud_icon filename="..."/> element (e.g., "hud_ak47.png")
    #[serde(skip_serializing_if = "Option::is_none")]
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
}

/// Stance accuracy values
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StanceAccuracy {
    pub stance: String,
    pub accuracy: f64,
}

/// Error during weapon scanning
#[derive(Debug, Serialize)]
pub struct ScanError {
    pub file: String,
    pub error: String,
    pub severity: String,
}

/// Result from weapon scanning
#[derive(Debug, Serialize)]
pub struct WeaponScanResult {
    pub weapons: Vec<Weapon>,
    pub errors: Vec<ScanError>,
    #[serde(rename = "duplicateKeys")]
    pub duplicate_keys: Vec<String>,
    #[serde(rename = "scanTime")]
    pub scan_time: u64,
}

/// Validation result for game path
#[derive(Debug, Serialize)]
pub struct ValidationResult {
    pub valid: bool,
    #[serde(rename = "weaponsPath")]
    pub weapons_path: String,
    pub package_count: usize,
}

/// Raw weapon XML structure (for parsing)
/// All attributes use @ prefix to map XML attributes correctly
#[derive(Debug, Deserialize, Default)]
struct RawWeapon {
    #[serde(rename = "@key", default)]
    key: Option<String>,
    #[serde(rename = "@file", default)]
    template_file: Option<String>,
    #[serde(rename = "tag", default)]
    tags: Vec<RawTag>,
    #[serde(rename = "specification", default)]
    specification: RawSpecification,
    #[serde(rename = "hud_icon", default)]
    hud_icon: Option<RawHudIcon>,
    #[serde(rename = "inventory", default)]
    inventory: Option<RawInventory>,
    #[serde(rename = "projectile", default)]
    projectile: Option<RawProjectile>,
    #[serde(rename = "modifier", default)]
    modifiers: Vec<RawModifier>,
    #[serde(rename = "nextInChain", default)]
    chain_variants: Vec<String>,
    #[serde(rename = "stance", default)]
    stances: Vec<RawStance>,
}

#[derive(Debug, Deserialize, Default, Clone)]
struct RawTag {
    #[serde(rename = "@name", default)]
    name: Option<String>,
}

#[derive(Debug, Deserialize, Default, Clone)]
struct RawHudIcon {
    #[serde(rename = "@filename", default)]
    filename: Option<String>,
}

#[derive(Debug, Deserialize, Default)]
struct RawSpecification {
    #[serde(rename = "@retrigger_time", default)]
    retrigger_time: Option<f64>,
    #[serde(rename = "@accuracy_factor", default)]
    accuracy_factor: Option<f64>,
    #[serde(rename = "@sustained_fire_grow_step", default)]
    sustained_fire_grow_step: Option<f64>,
    #[serde(rename = "@sustained_fire_diminish_rate", default)]
    sustained_fire_diminish_rate: Option<f64>,
    #[serde(rename = "@magazine_size", default)]
    magazine_size: Option<f64>,
    #[serde(rename = "@can_shoot_standing", default)]
    can_shoot_standing: Option<String>,
    #[serde(rename = "@suppressed", default)]
    suppressed: Option<String>,
    #[serde(rename = "@name", default)]
    name: Option<String>,
    #[serde(rename = "@class", default)]
    class: Option<String>,
    #[serde(rename = "@projectile_speed", default)]
    projectile_speed: Option<f64>,
}

#[derive(Debug, Deserialize, Default)]
struct RawInventory {
    #[serde(rename = "@encumbrance", default)]
    encumbrance: Option<f64>,
    #[serde(rename = "@price", default)]
    price: Option<f64>,
}

#[derive(Debug, Deserialize, Default)]
struct RawProjectile {
    #[serde(rename = "@file", default)]
    file: Option<String>,
    #[serde(rename = "result", default)]
    result: Option<RawProjectileResult>,
}

#[derive(Debug, Deserialize, Default)]
struct RawProjectileResult {
    #[serde(rename = "@class", default)]
    class: Option<String>,
    #[serde(rename = "@kill_probability", default)]
    kill_probability: Option<f64>,
    #[serde(rename = "@kill_decay_start_time", default)]
    kill_decay_start_time: Option<f64>,
    #[serde(rename = "@kill_decay_end_time", default)]
    kill_decay_end_time: Option<f64>,
}

#[derive(Debug, Deserialize, Default)]
struct RawModifier {
    #[serde(rename = "@class", default)]
    class: Option<String>,
    #[serde(rename = "@value", default)]
    value: Option<f64>,
}

/// Individual stance element with state_key and accuracy attributes
/// Format: <stance state_key="running" accuracy="0.3" />
#[derive(Debug, Deserialize, Clone)]
struct RawStance {
    #[serde(rename = "@state_key")]
    state_key: String,
    #[serde(rename = "@accuracy")]
    accuracy: f64,
}

/// Validate game directory path
#[tauri::command]
pub async fn validate_game_path(path: String) -> Result<ValidationResult, String> {
    let input_path = Path::new(&path);

    // Check if input path exists
    if !input_path.exists() {
        return Err(format!("Path does not exist: {}", path));
    }

    // Determine packages directory:
    // - If input ends with "packages", use it directly
    // - Otherwise, join with "packages"
    let packages_dir = if input_path.ends_with("packages") {
        input_path.to_path_buf()
    } else {
        input_path.join("packages")
    };

    // Check if packages directory exists
    if !packages_dir.exists() {
        return Err(format!(
            "packages directory not found. Expected: {}",
            packages_dir.display()
        ));
    }

    // Check if it's a directory
    if !packages_dir.is_dir() {
        return Err(format!(
            "packages path is not a directory: {}",
            packages_dir.display()
        ));
    }

    // Count packages
    let package_count = WalkDir::new(&packages_dir)
        .min_depth(1)
        .max_depth(1)
        .into_iter()
        .filter_map(|e| e.ok())
        .filter(|e| e.path().is_dir())
        .count();

    Ok(ValidationResult {
        valid: true,
        weapons_path: packages_dir.to_string_lossy().to_string(),
        package_count,
    })
}

/// Scan all weapon files from game directory
/// If `directory` is provided, scan that directory directly (it's expected to already be the packages directory)
#[tauri::command]
pub async fn scan_weapons(
    game_path: String,
    directory: Option<String>,
) -> Result<WeaponScanResult, String> {
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

    // Discover all .weapon files
    let weapon_files = discover_weapons(&input_path);

    if weapon_files.is_empty() {
        return Ok(WeaponScanResult {
            weapons: vec![],
            errors: vec![],
            duplicate_keys: vec![],
            scan_time: start_time.elapsed().as_millis() as u64,
        });
    }

    let mut weapons = Vec::new();
    let mut errors = Vec::new();
    let mut all_keys = HashMap::new();

    // Parse each weapon file
    for weapon_file in weapon_files {
        let file_str = weapon_file.to_string_lossy().to_string();

        match parse_weapon_file(&weapon_file, &input_path) {
            Ok(weapon) => {
                // Check for duplicate keys
                if let Some(key) = &weapon.key {
                    if let Some(existing) = all_keys.get(key) {
                        all_keys.insert(key.clone(), existing + 1);
                    } else {
                        all_keys.insert(key.clone(), 1);
                    }
                }

                weapons.push(weapon);
            }
            Err(e) => {
                errors.push(ScanError {
                    file: file_str.clone(),
                    error: e.to_string(),
                    severity: "error".to_string(),
                });
            }
        }
    }

    // Find duplicate keys
    let duplicate_keys: Vec<String> = all_keys
        .into_iter()
        .filter(|(_, count)| *count > 1)
        .map(|(key, _)| key)
        .collect();

    Ok(WeaponScanResult {
        weapons,
        errors,
        duplicate_keys,
        scan_time: start_time.elapsed().as_millis() as u64,
    })
}

/// Discover all .weapon files in packages directory
fn discover_weapons(input_path: &Path) -> Vec<PathBuf> {
    WalkDir::new(input_path)
        .into_iter()
        .filter_map(|e| e.ok())
        .filter(|e| e.path().extension().is_some_and(|ext| ext == "weapon"))
        .map(|e| e.path().to_path_buf())
        .collect()
}

/// Parse a single weapon XML file with template resolution
fn parse_weapon_file(weapon_path: &Path, input_path: &Path) -> Result<Weapon, anyhow::Error> {
    let content = std::fs::read_to_string(weapon_path)?;

    // Get package name from path
    let package_name = weapon_path
        .components()
        .rev()
        .nth(2) // Skip filename and "weapons" directory
        .and_then(|c| c.as_os_str().to_str())
        .unwrap_or("unknown");

    // Parse raw weapon
    let mut raw_weapon: RawWeapon = from_str(&content)?;

    // Resolve template inheritance if needed
    if let Some(template_file) = &raw_weapon.template_file {
        let resolved = resolve_template(input_path, template_file, &mut HashSet::new())?;
        raw_weapon = merge_attributes(resolved, raw_weapon);
    }

    // T007, T008, T009: Extract tag and class as separate fields
    // tag: From <tag name="..."/> element (e.g., "assault", "smg")
    let tag = raw_weapon
        .tags
        .iter()
        .find_map(|t| t.name.as_ref().map(|s| s.to_string()))
        .unwrap_or_default();

    // class: From <specification class="..."/> attribute as i32 (e.g., 0, 1, 2)
    let class = raw_weapon
        .specification
        .class
        .as_ref()
        .and_then(|s| s.parse::<i32>().ok())
        .unwrap_or(0);

    // hud_icon: From <hud_icon filename="..."/> element
    let hud_icon = raw_weapon
        .hud_icon
        .and_then(|hi| hi.filename)
        .filter(|s| !s.is_empty());

    // T011: Fix name derivation priority
    // Priority: specification.@name → root fallback (empty string is valid)
    let name = raw_weapon.specification.name.clone().unwrap_or_default();

    // Extract numeric values from specification
    let retrigger_time = raw_weapon.specification.retrigger_time.unwrap_or(0.0);
    let magazine_size = raw_weapon.specification.magazine_size.unwrap_or(0.0);
    let projectile_speed = raw_weapon.specification.projectile_speed;

    // Extract from inventory
    let encumbrance = raw_weapon.inventory.as_ref().and_then(|i| i.encumbrance);
    let price = raw_weapon.inventory.as_ref().and_then(|i| i.price);

    // T012: Extract kill_probability from projectile/result.@kill_probability
    let kill_probability = raw_weapon
        .projectile
        .as_ref()
        .and_then(|p| p.result.as_ref())
        .and_then(|r| r.kill_probability)
        .unwrap_or(0.0);

    // Determine suppressed status (from specification.@suppressed as "0"/"1")
    let suppressed = raw_weapon
        .specification
        .suppressed
        .as_ref()
        .and_then(|s| s.parse::<i32>().ok())
        .map(|v| v == 1)
        .unwrap_or(false);

    // Convert stances from Vec<RawStance> to Vec<StanceAccuracy>
    let stance_accuracies: Vec<StanceAccuracy> = raw_weapon
        .stances
        .into_iter()
        .map(|s| StanceAccuracy {
            stance: s.state_key,
            accuracy: s.accuracy,
        })
        .collect();

    // Calculate relative file path from packages directory
    // e.g., "vanilla/weapons/ak47.weapon"
    let file_path = weapon_path
        .strip_prefix(input_path)
        .unwrap_or(weapon_path)
        .to_string_lossy()
        .trim_start_matches('/')
        .to_string();

    // Convert to final Weapon structure
    let weapon = Weapon {
        key: raw_weapon.key.filter(|k| !k.is_empty()).or_else(|| {
            weapon_path
                .file_stem()
                .and_then(|s| s.to_str())
                .map(|s| s.to_string())
        }),
        name,
        tag,
        class,
        hud_icon,
        magazine_size,
        kill_probability,
        retrigger_time,
        burst_shots: None,          // Not in current XML structure
        spread_range: None,         // Not in current XML structure
        sight_range_modifier: None, // Not in current XML structure
        projectile_speed,
        barrel_offset: None, // Not in current XML structure
        encumbrance,
        price,
        suppressed,
        can_respawn_with: true, // Default true
        in_stock: true,         // Default true
        chain_variants: raw_weapon.chain_variants,
        stance_accuracies,
        file_path,
        source_file: weapon_path.to_string_lossy().to_string(),
        package_name: package_name.to_string(),
    };

    Ok(weapon)
}

/// Recursively resolve template inheritance with cycle detection
fn resolve_template(
    input_path: &Path,
    template_file: &str,
    visited: &mut HashSet<PathBuf>,
) -> Result<RawWeapon, anyhow::Error> {
    let template_path = input_path.join(template_file);

    // Cycle detection
    if !visited.insert(template_path.clone()) {
        return Err(anyhow::anyhow!(
            "Circular reference detected: {}",
            template_file
        ));
    }

    if visited.len() > MAX_TEMPLATE_DEPTH {
        return Err(anyhow::anyhow!(
            "Template depth exceeded limit (>{})",
            MAX_TEMPLATE_DEPTH
        ));
    }

    let content = std::fs::read_to_string(&template_path)?;
    let mut raw_weapon: RawWeapon = from_str(&content)?;

    // Resolve parent template if exists
    if let Some(parent_file) = &raw_weapon.template_file {
        let parent = resolve_template(input_path, parent_file, visited)?;
        raw_weapon = merge_attributes(parent, raw_weapon);
    }

    visited.remove(&template_path);
    Ok(raw_weapon)
}

/// Merge parent template attributes into child (child overrides parent)
/// T009: Adjust template merge logic to merge stances by state_key
fn merge_attributes(parent: RawWeapon, mut child: RawWeapon) -> RawWeapon {
    // Merge specification fields (parent values used if child's are None)
    merge_specification(&parent.specification, &mut child.specification);

    // Merge inventory if child doesn't have one
    if child.inventory.is_none() && parent.inventory.is_some() {
        child.inventory = parent.inventory;
    }

    // Merge projectile if child doesn't have one
    if child.projectile.is_none() && parent.projectile.is_some() {
        child.projectile = parent.projectile;
    }

    // Merge hud_icon if child doesn't have one
    if child.hud_icon.is_none() && parent.hud_icon.is_some() {
        child.hud_icon = parent.hud_icon;
    }

    // Merge tags (child inherits parent's tags that don't conflict)
    let parent_tags: Vec<_> = parent
        .tags
        .into_iter()
        .filter(|pt| !child.tags.iter().any(|ct| ct.name == pt.name))
        .collect();
    child.tags.extend(parent_tags);

    // T009: Merge stances by state_key (child overrides parent for same state)
    use std::collections::HashMap;
    let mut stance_map: HashMap<String, RawStance> = HashMap::new();

    // Add parent stances first
    for stance in parent.stances {
        stance_map.insert(stance.state_key.clone(), stance);
    }

    // Override with child stances
    for stance in child.stances {
        stance_map.insert(stance.state_key.clone(), stance);
    }

    // Convert back to Vec, sorted by state_key for consistency
    child.stances = {
        let mut entries: Vec<_> = stance_map.into_iter().collect();
        entries.sort_by(|a, b| a.0.cmp(&b.0));
        entries.into_iter().map(|(_, v)| v).collect()
    };

    // Merge chain_variants (extend, not replace)
    child.chain_variants.extend(parent.chain_variants);

    child
}

/// Helper to merge specification fields
fn merge_specification(parent: &RawSpecification, child: &mut RawSpecification) {
    if child.retrigger_time.is_none() && parent.retrigger_time.is_some() {
        child.retrigger_time = parent.retrigger_time;
    }
    if child.accuracy_factor.is_none() && parent.accuracy_factor.is_some() {
        child.accuracy_factor = parent.accuracy_factor;
    }
    if child.sustained_fire_grow_step.is_none() && parent.sustained_fire_grow_step.is_some() {
        child.sustained_fire_grow_step = parent.sustained_fire_grow_step;
    }
    if child.sustained_fire_diminish_rate.is_none() && parent.sustained_fire_diminish_rate.is_some()
    {
        child.sustained_fire_diminish_rate = parent.sustained_fire_diminish_rate;
    }
    if child.magazine_size.is_none() && parent.magazine_size.is_some() {
        child.magazine_size = parent.magazine_size;
    }
    if child.can_shoot_standing.is_none() && parent.can_shoot_standing.is_some() {
        child.can_shoot_standing = parent.can_shoot_standing.clone();
    }
    if child.suppressed.is_none() && parent.suppressed.is_some() {
        child.suppressed = parent.suppressed.clone();
    }
    if child.name.is_none() && parent.name.is_some() {
        child.name = parent.name.clone();
    }
    if child.class.is_none() && parent.class.is_some() {
        child.class = parent.class.clone();
    }
    if child.projectile_speed.is_none() && parent.projectile_speed.is_some() {
        child.projectile_speed = parent.projectile_speed;
    }
}

/// Open a file in the system's default editor
#[tauri::command]
pub async fn open_file_in_editor(file_path: String) -> Result<(), String> {
    // Check if file exists
    let path = Path::new(&file_path);
    if !path.exists() {
        return Err(format!("File not found: {}", file_path));
    }

    // Use platform-specific command to open file
    #[cfg(target_os = "macos")]
    {
        std::process::Command::new("open")
            .arg("-t") // Open with default text editor
            .arg(&file_path)
            .spawn()
            .map_err(|e| format!("Failed to open file: {}", e))?;
    }

    #[cfg(target_os = "linux")]
    {
        // Try xdg-open first, then common editors as fallback
        let result = std::process::Command::new("xdg-open")
            .arg(&file_path)
            .spawn();

        if result.is_err() {
            // Fallback: try common text editors
            for editor in &["code", "gedit", "kate", "nano", "vim"] {
                if std::process::Command::new(editor)
                    .arg(&file_path)
                    .spawn()
                    .is_ok()
                {
                    return Ok(());
                }
            }
            return Err("Failed to open file: No suitable editor found".to_string());
        }
    }

    #[cfg(target_os = "windows")]
    {
        std::process::Command::new("cmd")
            .args(["/C", "start", "", "\"\"", &file_path])
            .spawn()
            .map_err(|e| format!("Failed to open file: {}", e))?;
    }

    Ok(())
}

/// Get the absolute path to a texture file for icon rendering
/// Navigates from weapon file location to textures/ folder (sibling directory)
#[tauri::command]
pub async fn get_texture_path(
    weapon_file_path: String,
    icon_filename: String,
) -> Result<String, String> {
    // Navigate from weapon file to textures folder
    let weapon_path = PathBuf::from(&weapon_file_path);
    let weapon_dir = weapon_path
        .parent()
        .ok_or("Invalid weapon path: cannot get parent directory")?;

    // textures/ is a sibling to weapons/ folder
    // weapon_file_path = ".../packages/vanilla/weapons/ak47.weapon"
    // we need to go to ".../packages/vanilla/textures/hud_ak47.png"
    let textures_dir = weapon_dir
        .parent()
        .ok_or("Invalid weapon path: cannot get grandparent directory")?
        .join("textures");

    let icon_path = textures_dir.join(&icon_filename);

    // Check if icon file exists
    if !icon_path.exists() {
        return Err(format!(
            "Icon file not found: {} (expected at: {})",
            icon_filename,
            icon_path.display()
        ));
    }

    // Get canonical absolute path
    let canonical = icon_path
        .canonicalize()
        .map_err(|e| format!("Failed to resolve icon path: {}", e))?;

    Ok(canonical.to_string_lossy().to_string())
}

/// Get weapon icon as base64 data URL
/// This bypasses asset:// protocol encoding issues
#[tauri::command]
pub async fn get_weapon_icon_base64(
    weapon_file_path: String,
    icon_filename: String,
) -> Result<String, String> {
    use base64::Engine;
    use std::fs;

    // Navigate from weapon file to textures folder
    let weapon_path = PathBuf::from(&weapon_file_path);
    let weapon_dir = weapon_path
        .parent()
        .ok_or("Invalid weapon path: cannot get parent directory")?;

    let textures_dir = weapon_dir
        .parent()
        .ok_or("Invalid weapon path: cannot get grandparent directory")?
        .join("textures");

    let icon_path = textures_dir.join(&icon_filename);

    // Check if icon file exists
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
