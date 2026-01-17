mod directories;
mod hotkeys;
mod items;
mod ping;
mod rwrmi;
mod weapons;

use serde::{Deserialize, Serialize};
use std::time::Duration;
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

/// Platform-specific theme detection
fn detect_theme_for_platform(platform: &str) -> Result<String, String> {
    match platform {
        "macos" => detect_theme_macos(),
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
            weapons::open_file_in_editor,
            weapons::get_texture_path,
            items::scan_items,
            directories::validate_directory
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
