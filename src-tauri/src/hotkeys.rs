use serde::{Deserialize, Serialize};
use std::fs;
use std::path::Path;
use std::process::Command;

/// Raw XML hotkey item
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct HotkeyRawItem {
    #[serde(rename = "index")]
    pub index: String,
    #[serde(rename = "text")]
    pub key_combination: String,
    #[serde(rename = "$text")]
    pub label: String,
}

/// Raw XML configuration root node
#[derive(Debug, Serialize, Deserialize)]
pub struct HotkeyRawConfig {
    pub hotkeys: Vec<HotkeyRawItem>,
}

/// Hotkey configuration item (internal format)
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct HotkeyConfigItem {
    pub label: String,
    pub value: String,
}

/// Profile configuration
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct HotkeyProfile {
    pub id: String,
    pub title: String,
    pub config: Vec<HotkeyConfigItem>,
    pub created_at: u64,
    pub updated_at: u64,
}

/// All profiles configuration
#[derive(Debug, Serialize, Deserialize)]
pub struct HotkeyProfilesConfig {
    pub profiles: Vec<HotkeyProfile>,
    pub active_profile_id: Option<String>,
}

/// Read game hotkeys.xml
#[tauri::command]
pub fn read_hotkeys(game_path: String) -> Result<String, String> {
    let hotkeys_path = Path::new(&game_path).join("hotkeys.xml");

    if !hotkeys_path.exists() {
        return Err("hotkeys.xml not found".to_string());
    }

    let content = fs::read_to_string(&hotkeys_path)
        .map_err(|e| format!("Failed to read hotkeys.xml: {}", e))?;

    Ok(content)
}

/// Parse hotkeys.xml content
#[tauri::command]
pub fn parse_hotkeys(xml_content: String) -> Result<String, String> {
    use quick_xml::de::from_str;

    let raw_config: HotkeyRawConfig =
        from_str(&xml_content).map_err(|e| format!("Failed to parse XML: {}", e))?;

    let config: Vec<HotkeyConfigItem> = raw_config
        .hotkeys
        .into_iter()
        .map(|item| HotkeyConfigItem {
            label: item.label,
            value: item.key_combination,
        })
        .collect();

    serde_json::to_string(&config).map_err(|e| format!("Failed to serialize: {}", e))
}

/// Generate hotkeys.xml content
#[tauri::command]
pub fn generate_hotkeys(config: Vec<HotkeyConfigItem>) -> Result<String, String> {
    use quick_xml::se::to_string;

    let raw_config: HotkeyRawConfig = HotkeyRawConfig {
        hotkeys: config
            .into_iter()
            .enumerate()
            .map(|(idx, item)| HotkeyRawItem {
                index: idx.to_string(),
                key_combination: item.value,
                label: item.label,
            })
            .collect(),
    };

    to_string(&raw_config).map_err(|e| format!("Failed to generate XML: {}", e))
}

/// Write hotkeys to game directory
#[tauri::command]
pub fn write_hotkeys(game_path: String, xml_content: String) -> Result<(), String> {
    let hotkeys_path = Path::new(&game_path).join("hotkeys.xml");

    fs::write(&hotkeys_path, xml_content)
        .map_err(|e| format!("Failed to write hotkeys.xml: {}", e))?;

    Ok(())
}

/// Read all profiles (from local storage)
#[tauri::command]
pub fn read_profiles() -> Result<String, String> {
    let profiles_path = get_profiles_path()?;

    if !profiles_path.exists() {
        // Return empty config
        let empty_config = HotkeyProfilesConfig {
            profiles: vec![],
            active_profile_id: None,
        };
        return serde_json::to_string(&empty_config)
            .map_err(|e| format!("Failed to serialize: {}", e));
    }

    let content = fs::read_to_string(&profiles_path)
        .map_err(|e| format!("Failed to read profiles: {}", e))?;

    Ok(content)
}

/// Save profiles (to local storage)
#[tauri::command]
pub fn save_profiles(profiles_json: String) -> Result<(), String> {
    let profiles_path = get_profiles_path()?;

    // Ensure parent directory exists
    if let Some(parent) = profiles_path.parent() {
        fs::create_dir_all(parent)
            .map_err(|e| format!("Failed to create profiles directory: {}", e))?;
    }

    fs::write(&profiles_path, profiles_json)
        .map_err(|e| format!("Failed to save profiles: {}", e))?;

    Ok(())
}

/// Export profile as JSON file
#[tauri::command]
pub fn export_profile(profile_json: String, file_path: String) -> Result<(), String> {
    fs::write(&file_path, profile_json).map_err(|e| format!("Failed to export profile: {}", e))?;

    Ok(())
}

/// Import profile from file
#[tauri::command]
pub fn import_profile(file_path: String) -> Result<String, String> {
    let content =
        fs::read_to_string(&file_path).map_err(|e| format!("Failed to import profile: {}", e))?;

    // Validate JSON format
    let _profile: HotkeyProfile =
        serde_json::from_str(&content).map_err(|e| format!("Invalid profile format: {}", e))?;

    Ok(content)
}

/// Get the profiles storage path
fn get_profiles_path() -> Result<std::path::PathBuf, String> {
    let data_dir = dirs::data_dir().ok_or_else(|| "Cannot find data directory".to_string())?;

    Ok(data_dir.join("rwr-toolbox").join("hotkeys-profiles.json"))
}

/// Open hotkeys.xml in external editor
#[tauri::command]
pub fn open_hotkeys_in_editor(game_path: String) -> Result<(), String> {
    let hotkeys_path = Path::new(&game_path).join("hotkeys.xml");

    if !hotkeys_path.exists() {
        return Err("hotkeys.xml not found".to_string());
    }

    // Open with default editor based on platform
    #[cfg(target_os = "macos")]
    {
        Command::new("open")
            .arg("-a")
            .arg("TextEdit")
            .arg(&hotkeys_path)
            .spawn()
            .map_err(|e| format!("Failed to open editor: {}", e))?;
    }

    #[cfg(target_os = "windows")]
    {
        Command::new("notepad.exe")
            .arg(&hotkeys_path)
            .spawn()
            .map_err(|e| format!("Failed to open editor: {}", e))?;
    }

    #[cfg(target_os = "linux")]
    {
        Command::new("xdg-open")
            .arg(&hotkeys_path)
            .spawn()
            .map_err(|e| format!("Failed to open editor: {}", e))?;
    }

    Ok(())
}
