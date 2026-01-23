//! Utility functions for RWR toolbox
//!
//! Contains shared helper functions used across multiple modules.

use std::path::{Path, PathBuf};

/// Resolve packages directories for game/workshop paths
///
/// Supports multiple installation layouts:
/// - Direct `packages` directory
/// - macOS app bundle: `<base>/RunningWithRifles.app/Contents/Resources/media/packages`
/// - Workshop/custom: `<base>/media/packages`
/// - Direct packages: `<base>/packages`
///
/// # Arguments
/// * `base` - Base path to resolve packages from
///
/// # Returns
/// Vector of possible packages directories, deduplicated and ordered
pub fn resolve_packages_dirs(base: &Path) -> Vec<PathBuf> {
    if base.ends_with("packages") {
        return vec![base.to_path_buf()];
    }

    let mut roots: Vec<PathBuf> = Vec::new();

    // macOS Steam installs often keep base game resources inside the app bundle.
    let app_bundle_packages = base
        .join("RunningWithRifles.app")
        .join("Contents")
        .join("Resources")
        .join("media")
        .join("packages");
    if app_bundle_packages.exists() {
        roots.push(app_bundle_packages);
    }

    // Workshop/custom content is typically under `media/packages` next to the executable.
    let media_packages = base.join("media").join("packages");
    if media_packages.exists() {
        roots.push(media_packages);
    }

    // Some setups pass a game root where `packages/` exists directly.
    let direct_packages = base.join("packages");
    if direct_packages.exists() {
        roots.push(direct_packages);
    }

    if roots.is_empty() {
        roots.push(base.join("packages"));
    }

    // De-dupe while keeping order.
    let mut deduped: Vec<PathBuf> = Vec::new();
    for root in roots {
        if !deduped.contains(&root) {
            deduped.push(root);
        }
    }

    deduped
}
