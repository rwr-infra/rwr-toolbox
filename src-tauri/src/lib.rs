mod ping;

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
    let text = res.text().await.map_err(|e| format!("Read body error: {}", e))?;

    if status.is_success() {
        Ok(text)
    } else {
        Err(format!("HTTP {} {}", status.as_u16(), status.canonical_reason().unwrap_or("")))
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_store::Builder::default().build())
        .invoke_handler(tauri::generate_handler![
            proxy_fetch,
            ping::ping_server
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
