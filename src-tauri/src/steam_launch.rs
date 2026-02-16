use dirs::home_dir;
use std::fs;
use std::path::{Path, PathBuf};

use tauri_plugin_opener::OpenerExt;

const RWR_APP_ID: &str = "270150";

const ERR_STEAM_UNAVAILABLE: &str = "steam_unavailable";
const ERR_GAME_UNAVAILABLE: &str = "game_unavailable";
const ERR_LAUNCH_FAILED: &str = "launch_failed";

fn encode_launch_args(input: &str) -> String {
    let mut out = String::with_capacity(input.len());

    for b in input.bytes() {
        let keep_raw = b.is_ascii_alphanumeric()
            || matches!(
                b,
                b'-' | b'.' | b'_' | b'~' | b'=' | b':' | b'+' | b'/' | b','
            );

        if keep_raw {
            out.push(char::from(b));
        } else {
            out.push('%');
            out.push_str(&format!("{:02X}", b));
        }
    }

    out
}

fn candidate_steam_roots() -> Vec<PathBuf> {
    let mut roots: Vec<PathBuf> = Vec::new();

    // macOS
    #[cfg(target_os = "macos")]
    {
        if let Some(home) = home_dir() {
            roots.push(home.join("Library/Application Support/Steam"));
        }
    }

    // Linux
    #[cfg(target_os = "linux")]
    {
        if let Some(home) = home_dir() {
            roots.push(home.join(".local/share/Steam"));
            roots.push(home.join(".steam/steam"));
        }
    }

    // Windows
    #[cfg(target_os = "windows")]
    {
        if let Ok(pfx86) = std::env::var("PROGRAMFILES(X86)") {
            roots.push(PathBuf::from(pfx86).join("Steam"));
        }
        if let Ok(pf) = std::env::var("PROGRAMFILES") {
            roots.push(PathBuf::from(pf).join("Steam"));
        }
    }

    // Dedupe
    roots.sort();
    roots.dedup();
    roots
}

fn appmanifest_path_for_root(steam_root: &Path) -> PathBuf {
    steam_root
        .join("steamapps")
        .join(format!("appmanifest_{}.acf", RWR_APP_ID))
}

fn parse_libraryfolders_paths(vdf_text: &str) -> Vec<PathBuf> {
    // Best-effort: find all occurrences of "path" "...".
    // This is sufficient to discover additional Steam libraries for manifest checks.
    let mut paths: Vec<PathBuf> = Vec::new();

    for line in vdf_text.lines() {
        let line = line.trim();
        if !line.starts_with('"') {
            continue;
        }
        // Very small parser for: "path" "C:\\SteamLibrary"
        if let Some(rest) = line.strip_prefix("\"path\"") {
            let rest = rest.trim();
            if let Some(start) = rest.find('"') {
                let rest = &rest[start + 1..];
                if let Some(end) = rest.find('"') {
                    let raw = &rest[..end];
                    let unescaped = raw.replace("\\\\", "\\");
                    paths.push(PathBuf::from(unescaped));
                }
            }
        }
    }

    paths.sort();
    paths.dedup();
    paths
}

fn discover_library_roots(steam_root: &Path) -> Vec<PathBuf> {
    let mut roots: Vec<PathBuf> = vec![steam_root.to_path_buf()];

    let libraryfolders = steam_root.join("steamapps").join("libraryfolders.vdf");
    if let Ok(text) = fs::read_to_string(&libraryfolders) {
        for p in parse_libraryfolders_paths(&text) {
            roots.push(p);
        }
    }

    roots.sort();
    roots.dedup();
    roots
}

fn is_rwr_installed() -> Result<bool, String> {
    let steam_roots = candidate_steam_roots();
    if steam_roots.is_empty() {
        return Err(ERR_STEAM_UNAVAILABLE.to_string());
    }

    for root in steam_roots {
        if !root.exists() {
            continue;
        }

        for lib_root in discover_library_roots(&root) {
            let manifest = appmanifest_path_for_root(&lib_root);
            if manifest.exists() {
                return Ok(true);
            }
        }
    }

    Ok(false)
}

#[tauri::command]
pub async fn steam_check_rwr_available() -> Result<(), String> {
    match is_rwr_installed()? {
        true => Ok(()),
        false => Err(ERR_GAME_UNAVAILABLE.to_string()),
    }
}

#[tauri::command]
pub async fn steam_launch_rwr(app: tauri::AppHandle, args_text: String) -> Result<(), String> {
    // Q4: fail fast when game is clearly unavailable (not installed).
    steam_check_rwr_available().await?;

    let launch_args = args_text.trim();
    let url = if launch_args.is_empty() {
        format!("steam://run/{}/", RWR_APP_ID)
    } else {
        format!(
            "steam://run/{appid}//{args}",
            appid = RWR_APP_ID,
            args = encode_launch_args(launch_args)
        )
    };

    app.opener().open_url(url, None::<String>).map_err(|e| {
        let msg = e.to_string();
        if msg.to_lowercase().contains("scheme") {
            ERR_STEAM_UNAVAILABLE.to_string()
        } else {
            ERR_LAUNCH_FAILED.to_string()
        }
    })
}
