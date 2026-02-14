use reqwest::Client;
use serde::{Deserialize, Serialize};
use std::time::SystemTime;
use tauri::AppHandle;
use tauri_plugin_opener::OpenerExt;

/// Settings for version checking functionality
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct VersionCheckSettings {
    pub last_checked: String,
    pub check_frequency: String,
    pub dismissed_version: String,
    pub last_seen_version: String,
}

impl Default for VersionCheckSettings {
    fn default() -> Self {
        Self {
            last_checked: "0".to_string(),
            check_frequency: "weekly".to_string(),
            dismissed_version: String::new(),
            last_seen_version: env!("CARGO_PKG_VERSION").to_string(),
        }
    }
}

/// Current status of version checking
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateStatus {
    pub current_version: String,
    pub available_version: Option<String>,
    pub is_available: bool,
    pub release_url: Option<String>,
    pub last_checked: String,
    pub error: Option<String>,
}

/// Represents a GitHub release
#[derive(Debug, Clone, Serialize, Deserialize)]
struct GitHubRelease {
    tag_name: String,
    html_url: String,
    prerelease: bool,
}

/// Fetch latest stable release from GitHub API
async fn fetch_latest_release() -> Result<GitHubRelease, String> {
    let client = Client::builder()
        .timeout(std::time::Duration::from_secs(10))
        .build()
        .map_err(|e| format!("Failed to create HTTP client: {}", e))?;

    let url = "https://api.github.com/repos/rwr-infra/rwr-toolbox/releases";

    let response = client
        .get(url)
        .header("User-Agent", "rwr-toolbox")
        .send()
        .await
        .map_err(|e| format!("Failed to fetch releases: {}", e))?;

    if !response.status().is_success() {
        let status = response.status();
        if status.as_u16() == 403 {
            return Err("GitHub API rate limit exceeded".to_string());
        }
        return Err(format!("GitHub API returned error: {}", status));
    }

    let releases: Vec<GitHubRelease> = response
        .json()
        .await
        .map_err(|e| format!("Failed to parse response: {}", e))?;

    releases
        .into_iter()
        .filter(|r| !r.prerelease)
        .next()
        .ok_or_else(|| "No stable releases found".to_string())
}

/// Perform full version check, returning update status
async fn check_for_updates(
    current_version: String,
    settings: VersionCheckSettings,
) -> Result<UpdateStatus, String> {
    let now = SystemTime::now()
        .duration_since(SystemTime::UNIX_EPOCH)
        .map_err(|e| format!("System time error: {}", e))?
        .as_secs();

    let release = match fetch_latest_release().await {
        Ok(r) => r,
        Err(e) => {
            return Ok(UpdateStatus {
                current_version: current_version.clone(),
                available_version: None,
                is_available: false,
                release_url: None,
                last_checked: settings.last_checked.clone(),
                error: Some(e),
            });
        }
    };

    let latest_version = match extract_version_from_tag(&release.tag_name) {
        Some(v) => v,
        None => {
            return Ok(UpdateStatus {
                current_version: current_version.clone(),
                available_version: None,
                is_available: false,
                release_url: None,
                last_checked: now.to_string(),
                error: Some(format!(
                    "Failed to parse version from tag: {}",
                    release.tag_name
                )),
            });
        }
    };

    let is_available = is_newer_version(&current_version, &latest_version);
    let is_dismissed = settings.dismissed_version == latest_version;

    Ok(UpdateStatus {
        current_version,
        available_version: Some(latest_version.clone()),
        is_available: is_available && !is_dismissed,
        release_url: Some(release.html_url),
        last_checked: now.to_string(),
        error: None,
    })
}

/// Extract version number from GitHub tag (e.g., "v0.1.0-fix-query" -> "0.1.0")
pub fn extract_version_from_tag(tag: &str) -> Option<String> {
    let tag = tag.strip_prefix('v').unwrap_or(tag);
    let version_part = tag.split('-').next().unwrap_or(tag);

    if version_part.parse::<semver::Version>().is_ok() {
        Some(version_part.to_string())
    } else {
        None
    }
}

/// Compare two version strings, returns true if remote is newer
pub fn is_newer_version(current: &str, remote: &str) -> bool {
    let current_ver = match semver::Version::parse(current) {
        Ok(v) => v,
        Err(_) => return false,
    };

    let remote_ver = match semver::Version::parse(remote) {
        Ok(v) => v,
        Err(_) => return false,
    };

    remote_ver > current_ver
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_extract_version_from_tag() {
        assert_eq!(
            extract_version_from_tag("v0.1.0"),
            Some("0.1.0".to_string())
        );
        assert_eq!(
            extract_version_from_tag("v0.1.0-fix-query"),
            Some("0.1.0".to_string())
        );
        assert_eq!(extract_version_from_tag("0.1.0"), Some("0.1.0".to_string()));
        assert_eq!(extract_version_from_tag("invalid"), None);
    }

    #[test]
    fn test_is_newer_version() {
        assert!(is_newer_version("0.1.0", "0.2.0"));
        assert!(!is_newer_version("0.2.0", "0.1.0"));
        assert!(!is_newer_version("0.1.0", "0.1.0"));
        assert!(!is_newer_version("invalid", "0.2.0"));
    }
}

#[tauri::command]
pub async fn get_update_status(settings: VersionCheckSettings) -> Result<UpdateStatus, String> {
    let current_version = env!("CARGO_PKG_VERSION").to_string();
    check_for_updates(current_version, settings).await
}

#[tauri::command]
pub async fn trigger_version_check(settings: VersionCheckSettings) -> Result<UpdateStatus, String> {
    let current_version = env!("CARGO_PKG_VERSION").to_string();
    check_for_updates(current_version, settings).await
}

#[tauri::command]
pub fn dismiss_update(_version: String) -> Result<(), String> {
    Ok(())
}

#[tauri::command]
pub fn open_releases_url(app: AppHandle, url: String) -> Result<(), String> {
    app.opener()
        .open_url(url, None::<String>)
        .map_err(|e| format!("Failed to open URL: {}", e))
}
