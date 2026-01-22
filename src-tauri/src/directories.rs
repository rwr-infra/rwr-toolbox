//! Directory validation module
//!
//! Validates user-selected game/workshop directories for scanning.
//! Checks for path existence, directory type, read permissions, and media subdirectory.

use serde::{Deserialize, Serialize};
use std::path::Path;

/// Validation result for directory scanning
/// Note: Renamed to avoid conflict with weapons::ValidationResult
#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DirectoryValidationResult {
    pub valid: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error_code: Option<DirectoryErrorCode>,
    pub message: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub details: Option<ValidationDetails>,
    /// Number of package subdirectories found in media/
    #[serde(skip_serializing_if = "Option::is_none")]
    pub package_count: Option<usize>,
}

/// Error codes for directory validation
#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum DirectoryErrorCode {
    PathNotFound,
    NotADirectory,
    AccessDenied,
    MissingMediaSubdirectory,
    PackagesNotFound,
}

/// Detailed validation information
#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ValidationDetails {
    pub path_exists: bool,
    pub is_directory: bool,
    pub is_readable: bool,
    #[serde(rename = "hasMediaSubdirectory")]
    pub has_media_subdirectory: bool,
}

/// Validate a directory path for game data scanning
///
/// Performs 4 validation checks:
/// 1. Path exists on filesystem
/// 2. Path is a directory (not a file)
/// 3. Path is readable (no permission denied)
/// 4. Path contains a `media` subdirectory
/// 5. Counts package subdirectories in media/
#[tauri::command]
pub fn validate_directory(path: String) -> DirectoryValidationResult {
    let path_obj = Path::new(&path);

    // Check 1: Path exists
    if !path_obj.exists() {
        return DirectoryValidationResult {
            valid: false,
            error_code: Some(DirectoryErrorCode::PathNotFound),
            message: "The specified path does not exist".to_string(),
            details: Some(ValidationDetails {
                path_exists: false,
                is_directory: false,
                is_readable: false,
                has_media_subdirectory: false,
            }),
            package_count: None,
        };
    }

    // Check 2: Is a directory
    if !path_obj.is_dir() {
        return DirectoryValidationResult {
            valid: false,
            error_code: Some(DirectoryErrorCode::NotADirectory),
            message: "The path is not a directory".to_string(),
            details: Some(ValidationDetails {
                path_exists: true,
                is_directory: false,
                is_readable: false,
                has_media_subdirectory: false,
            }),
            package_count: None,
        };
    }

    // Check 3: Is readable (platform-specific)
    let is_readable = is_readable(path_obj);
    if !is_readable {
        return DirectoryValidationResult {
            valid: false,
            error_code: Some(DirectoryErrorCode::AccessDenied),
            message: "Access to the directory is denied".to_string(),
            details: Some(ValidationDetails {
                path_exists: true,
                is_directory: true,
                is_readable: false,
                has_media_subdirectory: false,
            }),
            package_count: None,
        };
    }

    // Check 4: Has media subdirectory
    let media_path = path_obj.join("media");
    let has_media = media_path.exists() && media_path.is_dir();
    if !has_media {
        return DirectoryValidationResult {
            valid: false,
            error_code: Some(DirectoryErrorCode::MissingMediaSubdirectory),
            message: "Directory must contain a 'media' subdirectory".to_string(),
            details: Some(ValidationDetails {
                path_exists: true,
                is_directory: true,
                is_readable: true,
                has_media_subdirectory: false,
            }),
            package_count: None,
        };
    }

    // Count package subdirectories in media/
    let package_count = count_subdirs(&media_path);

    // All checks passed
    DirectoryValidationResult {
        valid: true,
        error_code: None,
        message: "Directory is valid".to_string(),
        details: Some(ValidationDetails {
            path_exists: true,
            is_directory: true,
            is_readable: true,
            has_media_subdirectory: true,
        }),
        package_count: Some(package_count),
    }
}

/// Count immediate subdirectories.
fn count_subdirs(path: &Path) -> usize {
    match std::fs::read_dir(path) {
        Ok(entries) => entries
            .filter_map(|entry| entry.ok())
            .filter(|entry| entry.path().is_dir())
            .count(),
        Err(_) => 0,
    }
}

/// Check if a path is readable (platform-specific)
fn candidate_packages_dirs(base: &Path) -> Vec<std::path::PathBuf> {
    use std::path::PathBuf;

    if base.ends_with("packages") {
        return vec![base.to_path_buf()];
    }

    let mut roots: Vec<PathBuf> = Vec::new();

    // Common layouts
    roots.push(base.join("media").join("packages"));
    roots.push(base.join("packages"));

    // macOS Steam install: base points to a Steam folder containing the app bundle.
    roots.push(
        base.join("RunningWithRifles.app")
            .join("Contents")
            .join("Resources")
            .join("media")
            .join("packages"),
    );

    // If base is the app bundle itself.
    if base
        .file_name()
        .is_some_and(|n| n.to_string_lossy() == "RunningWithRifles.app")
    {
        roots.push(
            base.join("Contents")
                .join("Resources")
                .join("media")
                .join("packages"),
        );
    }

    // If base is already inside the app bundle resources.
    if base.ends_with("Resources") {
        roots.push(base.join("media").join("packages"));
    }

    // If base is media/ inside the app bundle.
    if base.ends_with("media") {
        roots.push(base.join("packages"));
    }

    // De-dupe while preserving order
    let mut deduped: Vec<PathBuf> = Vec::new();
    for r in roots {
        if !deduped.contains(&r) {
            deduped.push(r);
        }
    }

    deduped
}

/// Validate a game installation directory (base game) for loading content.
///
/// Unlike `validate_directory`, this accepts multiple layouts:
/// - `<dir>/media/packages`
/// - `<dir>/packages`
/// - `<dir>/RunningWithRifles.app/Contents/Resources/media/packages` (macOS)
///
/// It is considered valid if we can locate at least one existing `packages` root.
#[tauri::command]
pub fn validate_game_install_directory(path: String) -> DirectoryValidationResult {
    let path_obj = Path::new(&path);

    if !path_obj.exists() {
        return DirectoryValidationResult {
            valid: false,
            error_code: Some(DirectoryErrorCode::PathNotFound),
            message: "The specified path does not exist".to_string(),
            details: Some(ValidationDetails {
                path_exists: false,
                is_directory: false,
                is_readable: false,
                has_media_subdirectory: false,
            }),
            package_count: None,
        };
    }

    if !path_obj.is_dir() {
        return DirectoryValidationResult {
            valid: false,
            error_code: Some(DirectoryErrorCode::NotADirectory),
            message: "The path is not a directory".to_string(),
            details: Some(ValidationDetails {
                path_exists: true,
                is_directory: false,
                is_readable: false,
                has_media_subdirectory: false,
            }),
            package_count: None,
        };
    }

    let readable = is_readable(path_obj);
    if !readable {
        return DirectoryValidationResult {
            valid: false,
            error_code: Some(DirectoryErrorCode::AccessDenied),
            message: "Access to the directory is denied".to_string(),
            details: Some(ValidationDetails {
                path_exists: true,
                is_directory: true,
                is_readable: false,
                has_media_subdirectory: false,
            }),
            package_count: None,
        };
    }

    let candidates = candidate_packages_dirs(path_obj);
    let existing: Vec<std::path::PathBuf> = candidates
        .into_iter()
        .filter(|p| p.exists() && p.is_dir())
        .collect();

    if existing.is_empty() {
        return DirectoryValidationResult {
            valid: false,
            error_code: Some(DirectoryErrorCode::PackagesNotFound),
            message: "No packages folder found under the selected directory".to_string(),
            details: Some(ValidationDetails {
                path_exists: true,
                is_directory: true,
                is_readable: true,
                // Not applicable here, but keep the shape consistent for the frontend.
                has_media_subdirectory: false,
            }),
            package_count: None,
        };
    }

    let package_count: usize = existing.iter().map(|p| count_subdirs(p)).sum();

    DirectoryValidationResult {
        valid: true,
        error_code: None,
        message: "Directory is valid".to_string(),
        details: Some(ValidationDetails {
            path_exists: true,
            is_directory: true,
            is_readable: true,
            has_media_subdirectory: true,
        }),
        package_count: Some(package_count),
    }
}

fn is_readable(path: &Path) -> bool {
    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        match path.metadata() {
            Ok(meta) => {
                let permissions = meta.permissions();
                // Check if owner or group or others have read permission
                permissions.mode() & 0o444 != 0
            }
            Err(_) => false,
        }
    }

    #[cfg(windows)]
    {
        // On Windows, try to read the directory entries
        std::fs::read_dir(path).is_ok()
    }
}
