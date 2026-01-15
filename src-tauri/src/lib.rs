mod hotkeys;
mod ping;
mod rwrmi;
mod weapons;

use std::time::Duration;
use tauri_plugin_http::reqwest::{Client, Url};

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
            weapons::open_file_in_editor
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
