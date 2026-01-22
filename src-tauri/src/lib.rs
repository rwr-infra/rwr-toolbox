mod directories;
mod events;
mod hotkeys;
mod items;
mod ping;
mod rwrmi;
mod weapons;

pub use events::ScanEvent;

use serde::{Deserialize, Serialize};
use std::time::Duration;
use tauri::Manager;
use tauri_plugin_http::reqwest::{Client, Url};

/// System theme detection result
#[derive(Debug, Serialize, Deserialize)]
pub struct SystemTheme {
    /// Detected theme: "light" or "dark" or null if detection failed
    #[serde(rename = "themeType")]
    pub theme_type: Option<String>,
    /// Unix timestamp when detection was performed
    #[serde(rename = "detectedAt")]
    pub detected_at: u64,
    /// Platform where theme was detected
    pub platform: String,
}

/// User's theme preference
#[derive(Debug, Serialize, Deserialize)]
pub struct ThemePreference {
    /// User's selected theme: "light", "dark", or "auto" for OS detection
    #[serde(rename = "themeType")]
    pub theme_type: String,
    /// Whether theme was auto-detected from OS
    #[serde(rename = "isAutoDetect")]
    pub is_auto_detect: bool,
    /// Unix timestamp of last update
    #[serde(rename = "lastUpdated")]
    pub last_updated: u64,
    /// Actual detected OS theme (only set when themeType="auto")
    #[serde(rename = "autoDetectedTheme", skip_serializing_if = "Option::is_none")]
    pub auto_detected_theme: Option<String>,
}

/// Detect the operating system's current theme preference
#[tauri::command]
async fn get_system_theme() -> Result<SystemTheme, String> {
    let platform = std::env::consts::OS;
    let theme_type = detect_theme_for_platform(platform)?;
    let detected_at = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map_err(|e| format!("Time error: {}", e))?
        .as_secs();

    Ok(SystemTheme {
        theme_type: Some(theme_type),
        detected_at,
        platform: platform.to_string(),
    })
}

/// Get the user's saved theme preference from the store
#[tauri::command]
async fn get_theme_preference(app: tauri::AppHandle) -> Result<Option<ThemePreference>, String> {
    use std::fs;
    use std::io::Read;

    let config_dir = app
        .path()
        .app_config_dir()
        .map_err(|e| format!("Failed to get config dir: {}", e))?;

    let theme_file = config_dir.join("theme-preference.json");

    if !theme_file.exists() {
        return Ok(None);
    }

    let mut file =
        fs::File::open(&theme_file).map_err(|e| format!("Failed to open theme file: {}", e))?;

    let mut contents = String::new();
    file.read_to_string(&mut contents)
        .map_err(|e| format!("Failed to read theme file: {}", e))?;

    let preference: ThemePreference = serde_json::from_str(&contents)
        .map_err(|e| format!("Failed to parse theme file: {}", e))?;

    Ok(Some(preference))
}

/// Save the user's theme preference to the store
#[tauri::command]
async fn set_theme_preference(
    app: tauri::AppHandle,
    preference: ThemePreference,
) -> Result<(), String> {
    use std::fs;

    let config_dir = app
        .path()
        .app_config_dir()
        .map_err(|e| format!("Failed to get config dir: {}", e))?;

    // Create config directory if it doesn't exist
    fs::create_dir_all(&config_dir).map_err(|e| format!("Failed to create config dir: {}", e))?;

    let theme_file = config_dir.join("theme-preference.json");

    let json = serde_json::to_string_pretty(&preference)
        .map_err(|e| format!("Failed to serialize preference: {}", e))?;

    fs::write(&theme_file, json).map_err(|e| format!("Failed to write theme file: {}", e))?;

    Ok(())
}

/// Platform-specific theme detection
fn detect_theme_for_platform(platform: &str) -> Result<String, String> {
    match platform {
        #[cfg(target_os = "macos")]
        "macos" => detect_theme_macos(),
        #[cfg(not(target_os = "macos"))]
        "macos" => Ok("light".to_string()),
        "linux" => detect_theme_linux(),
        #[cfg(target_os = "windows")]
        "windows" => detect_theme_windows(),
        #[cfg(not(target_os = "windows"))]
        "windows" => Ok("light".to_string()),
        _ => {
            // Fallback for unknown platforms - default to light
            Ok("light".to_string())
        }
    }
}

/// Detect theme on macOS using defaults command
#[cfg(target_os = "macos")]
fn detect_theme_macos() -> Result<String, String> {
    use std::process::Command;

    let output = Command::new("defaults")
        .args(&["read", "-g", "AppleInterfaceStyle"])
        .output();

    match output {
        Ok(out) if String::from_utf8_lossy(&out.stdout).contains("Dark") => Ok("dark".to_string()),
        Ok(_) => Ok("light".to_string()),
        Err(_) => Ok("light".to_string()), // Fallback if command fails
    }
}

/// Detect theme on Linux using gsettings (GNOME)
fn detect_theme_linux() -> Result<String, String> {
    use std::process::Command;

    let output = Command::new("gsettings")
        .args(&["get", "org.gnome.desktop.interface", "gtk-theme"])
        .output();

    match output {
        Ok(out) => {
            let theme = String::from_utf8_lossy(&out.stdout);
            // Check if theme name contains "dark" (case-insensitive)
            if theme.to_lowercase().contains("dark") {
                Ok("dark".to_string())
            } else {
                Ok("light".to_string())
            }
        }
        Err(_) => Ok("light".to_string()), // Fallback if gsettings not available
    }
}

/// Detect theme on Windows using registry
/// Note: This is a simplified version - full implementation requires windows-rs crate
#[cfg(target_os = "windows")]
fn detect_theme_windows() -> Result<String, String> {
    // Default to light for now - full implementation would read:
    // HKEY_CURRENT_USER\Software\Microsoft\Windows\CurrentVersion\Themes\Personalize
    // AppsUseLightTheme: 0 = dark, 1 = light
    Ok("light".to_string())
}

/// Simple text fetch proxy to bypass WebView CORS.
#[tauri::command]
async fn proxy_fetch(url: &str, timeout_ms: Option<u64>) -> Result<String, String> {
    let parsed = Url::parse(url).map_err(|e| format!("Invalid URL: {}", e))?;

    let builder = Client::builder();
    let builder = if let Some(ms) = timeout_ms {
        builder.timeout(Duration::from_millis(ms))
    } else {
        builder
    };

    let client = builder
        .build()
        .map_err(|e| format!("Client build error: {}", e))?;

    let res = client
        .get(parsed)
        .send()
        .await
        .map_err(|e| format!("Request error: {}", e))?;

    let status = res.status();
    let text = res
        .text()
        .await
        .map_err(|e| format!("Read body error: {}", e))?;

    if status.is_success() {
        Ok(text)
    } else {
        Err(format!(
            "HTTP {} {}",
            status.as_u16(),
            status.canonical_reason().unwrap_or("")
        ))
    }
}

/// Get project changelog from root CHANGELOG.md
#[tauri::command]
async fn get_changelog(app: tauri::AppHandle) -> Result<String, String> {
    use std::fs;
    // In development, the file is in the project root.
    // In production, it should be bundled with the application.
    let resource_path = app
        .path()
        .resource_dir()
        .map_err(|e| format!("Failed to get resource dir: {}", e))?
        .join("CHANGELOG.md");

    let path = if resource_path.exists() {
        resource_path
    } else {
        // Fallback to current directory (dev mode)
        std::env::current_dir()
            .map_err(|e| format!("Failed to get current dir: {}", e))?
            .join("CHANGELOG.md")
    };

    if !path.exists() {
        return Err("CHANGELOG.md not found".to_string());
    }

    fs::read_to_string(path).map_err(|e| format!("Failed to read CHANGELOG.md: {}", e))
}

/// Check if a directory path exists on disk
#[tauri::command]
async fn check_path_exists(path: String) -> bool {
    let p = std::path::Path::new(&path);
    p.exists() && p.is_dir()
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_store::Builder::default().build())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            proxy_fetch,
            get_system_theme,
            get_theme_preference,
            set_theme_preference,
            get_changelog,
            check_path_exists,
            ping::ping_server,
            rwrmi::bundle_mod,
            rwrmi::generate_mod_config,
            rwrmi::read_info,
            rwrmi::install_mod,
            rwrmi::make_backup,
            rwrmi::recover_backup,
            hotkeys::read_hotkeys,
            hotkeys::parse_hotkeys,
            hotkeys::generate_hotkeys,
            hotkeys::write_hotkeys,
            hotkeys::read_profiles,
            hotkeys::save_profiles,
            hotkeys::export_profile,
            hotkeys::import_profile,
            hotkeys::open_hotkeys_in_editor,
            weapons::validate_game_path,
            weapons::scan_weapons,
            weapons::scan_weapons_collect,
            weapons::open_file_in_editor,
            weapons::get_texture_path,
            weapons::get_weapon_icon_base64,
            items::scan_items,
            items::scan_items_collect,
            items::get_item_texture_path,
            items::get_item_icon_base64,
            directories::validate_directory,
            directories::validate_game_install_directory
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
