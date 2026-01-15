use anyhow::{anyhow, Result as AnyhowResult};
use serde::{Deserialize, Serialize};
use std::fs;
use std::fs::File;
use std::io::{self, BufReader, Read, Write};
use std::path::{Path, PathBuf};
use walkdir::WalkDir;
use zip::write::SimpleFileOptions;

pub mod constants;
pub mod templates;
use constants::*;
use templates::*;

/// Mod installer config (read from config.json)
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ModInstallerConfig {
    pub title: String,
    pub description: String,
    pub authors: Vec<String>,
    pub version: String,
    pub game_version: String,
}

/// Output config (sent to webview)
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct OutputConfig {
    pub title: String,
    pub description: String,
    pub authors: Vec<String>,
    pub version: String,
    pub game_version: String,
    pub file_log_info: Vec<String>,
    pub file_path_list: Vec<String>,
    pub readme_content: String,
    pub changelog_content: String,
}

/// Get output file name from config
fn get_output_file_name(folder_path: &str) -> AnyhowResult<String> {
    let base_folder = folder_path;
    let target_file_path = format!("{}/{}", base_folder, CONFIG_FILE);

    let file_content = fs::read_to_string(target_file_path)?;

    let config = serde_json::from_str::<ModInstallerConfig>(&file_content)
        .map_err(|e| anyhow!("Get mod config file error: {}", e))?;

    let output_file_name = format!(
        "[RWRMI][{}]{} v{}.zip",
        config.game_version, config.title, config.version
    );

    Ok(output_file_name)
}

/// Get backup path
fn get_backup_path() -> AnyhowResult<PathBuf> {
    let data_dir = dirs::data_dir().ok_or(anyhow!("Can't find data_dir"))?;
    let path = Path::new(&data_dir).join(format!("{}/{}", CACHE_FOLDER, BACKUP_FILE));
    Ok(path)
}

/// Write mod to zip file
fn write_zip(folder_path: &str, output_file_name: &str) -> AnyhowResult<()> {
    let base_folder = folder_path;
    let output_path = format!("{}/{}", base_folder, output_file_name);
    let path = std::path::Path::new(&output_path);
    let file = std::fs::File::create(path)?;

    let mut zip = zip::ZipWriter::new(file);

    let options = SimpleFileOptions::default()
        .compression_method(zip::CompressionMethod::Stored)
        .unix_permissions(0o775);

    let config_file_path = format!("{}/{}", base_folder, CONFIG_FILE);
    println!("adding file {:?}", config_file_path);
    zip.start_file(CONFIG_FILE, options)?;
    let config_content = fs::read(config_file_path)?;
    zip.write_all(&config_content)?;

    let readme_file_path = format!("{}/{}", base_folder, README_FILE);
    println!("adding file {:?}", readme_file_path);
    zip.start_file(README_FILE, options)?;
    let readme_content = fs::read(readme_file_path)?;
    zip.write_all(&readme_content)?;

    let changelog_file_path = format!("{}/{}", base_folder, CHANGELOG_FILE);
    println!("adding file {:?}", changelog_file_path);
    zip.start_file(CHANGELOG_FILE, options)?;
    let changelog_content = fs::read(changelog_file_path)?;
    zip.write_all(&changelog_content)?;

    // mod content
    let mod_file_path = format!("{}/{}", base_folder, MOD_FOLDER);
    let walkdir = WalkDir::new(mod_file_path);
    let it = walkdir.into_iter();

    let it = it.filter_map(|e| e.ok());

    let mut buffer = Vec::new();

    for entry in it {
        let path = entry.path();
        let path_str = path.to_str().unwrap();
        let clipped_path = path_str.replace(base_folder, "");
        let name = Path::new(&clipped_path);

        println!("it name {:?}", name);

        if path.is_file() {
            println!("adding file {:?}", path);
            zip.start_file_from_path(name, options)?;
            let mut f = File::open(path)?;

            f.read_to_end(&mut buffer)?;
            zip.write_all(&buffer)?;
            buffer.clear();
        } else if !name.as_os_str().is_empty() {
            println!("adding dir {:?}", path);
            zip.add_directory_from_path(name, options)?;
        }
    }

    zip.finish()?;

    Ok(())
}

/// Read zip file and extract mod info
fn read_zip(path: &str) -> AnyhowResult<String> {
    let file = File::open(path)?;
    let reader = BufReader::new(file);

    let mut archive = zip::ZipArchive::new(reader)?;
    let mut installer_config_str = String::new();
    let mut file_log_info: Vec<String> = Vec::new();
    let mut file_path_list: Vec<String> = Vec::new();

    let mut readme_content = String::new();
    let mut changelog_content = String::new();

    for i in 0..archive.len() {
        let mut file = archive.by_index(i)?;
        let outpath = match file.enclosed_name() {
            Some(path) => path,
            None => {
                println!("Entry {} has a suspicious path", i);
                continue;
            }
        };

        if (*file.name()).ends_with('/') {
            // Skip directories
            continue;
        }

        let outpath_name = outpath.display().to_string();

        println!(
            "Entry {} is a file with name \"{}\" ({} bytes)",
            i,
            outpath_name,
            file.size()
        );

        match &outpath_name as &str {
            CONFIG_FILE => {
                let mut config_content = String::new();
                file.read_to_string(&mut config_content)?;
                println!("Config file content: {}", config_content);
                installer_config_str = config_content;
            }
            README_FILE => {
                println!("match README");
                file.read_to_string(&mut readme_content)?;
            }
            CHANGELOG_FILE => {
                println!("match CHANGELOG");
                file.read_to_string(&mut changelog_content)?;
            }
            _ => {
                let info_str = format!("{}({} bytes)", outpath_name, file.size());
                file_path_list.push(outpath_name);
                file_log_info.push(info_str);
            }
        }
    }

    let installer_config = serde_json::from_str::<ModInstallerConfig>(&installer_config_str)?;

    let output_struct = OutputConfig {
        title: installer_config.title,
        description: installer_config.description,
        authors: installer_config.authors,
        version: installer_config.version,
        game_version: installer_config.game_version,
        file_log_info,
        file_path_list,
        readme_content,
        changelog_content,
    };

    let output_string = serde_json::to_string(&output_struct)?;

    Ok(output_string)
}

/// Extract zip file to target path
fn extract_zip(path: &str, target_path: &str) -> AnyhowResult<()> {
    let file = File::open(path)?;

    let mut archive = zip::ZipArchive::new(file)?;

    for i in 0..archive.len() {
        let mut file = archive.by_index(i)?;
        let outpath = match file.enclosed_name() {
            Some(path) => path.to_owned(),
            None => continue,
        };

        let target_path_buf = Path::new(target_path);
        let outpath = target_path_buf.join(outpath);

        if (*file.name()).ends_with('/') {
            println!("File {} extracted to \"{}\"", i, outpath.display());
            fs::create_dir_all(&outpath)?;
        } else {
            let full_file_path_str = file.name();
            let full_file_path = Path::new(full_file_path_str);
            if let Some(file_name) = full_file_path.file_name() {
                match file_name.to_str().unwrap() {
                    README_FILE => {
                        continue;
                    }
                    CONFIG_FILE => {
                        continue;
                    }
                    CHANGELOG_FILE => {
                        continue;
                    }
                    _ => {
                        println!("Extract: {:?}", file_name);
                    }
                }
            }

            println!("File name: {}", file.name());
            println!(
                "File {} extracted to \"{}\" ({} bytes)",
                i,
                outpath.display(),
                file.size()
            );

            if let Some(p) = outpath.parent() {
                if !p.exists() {
                    fs::create_dir_all(p)?;
                }
            }
            let mut outfile = fs::File::create(&outpath)?;
            io::copy(&mut file, &mut outfile)?;
        }

        #[cfg(unix)]
        {
            use std::os::unix::fs::PermissionsExt;

            if let Some(mode) = file.unix_mode() {
                fs::set_permissions(&outpath, fs::Permissions::from_mode(mode))?;
            }
        }
    }

    Ok(())
}

/// Create backup of original files
fn backup(_mod_path: &str, file_path_list: Vec<String>, target_path: &str) -> AnyhowResult<String> {
    // Step1: extract effect file
    let app_cache_dir = dirs::cache_dir().unwrap();
    let _prefix_path = Path::new(app_cache_dir.as_path());
    let prefix_path = _prefix_path.join(CACHE_FOLDER);

    let precheck_path = prefix_path.join(MOD_FOLDER);

    // Remove old backup
    if precheck_path.exists() {
        fs::remove_dir_all(precheck_path)?;
    }

    for file in file_path_list {
        let p = Path::new(target_path);
        println!("in zip file path: {:?}", file);
        let source_path = p.join(format!("./{}", file.clone()));

        if let Some(_file_name) = source_path.file_name() {
            println!("full_path: {:?}", source_path);
            println!("path exists: {:?}", source_path.exists());

            if source_path.exists() {
                // Copy file to temp Folder
                let target_path = prefix_path.join(Path::new(&file));

                let parent_folder_path = target_path
                    .parent()
                    .ok_or(anyhow!("Can't find parent folder"))?;
                fs::create_dir_all(parent_folder_path)?;
                fs::copy(source_path, target_path)?;
            }
        }
    }

    // Step2: write "backup.zip"
    let path = get_backup_path()?;
    let output_path = String::from(path.to_str().unwrap());
    println!("output_path: {}", output_path);

    fs::create_dir_all(path.parent().unwrap())?;
    let file = fs::File::create(path)?;

    let mut zip = zip::ZipWriter::new(file);

    let options = SimpleFileOptions::default()
        .compression_method(zip::CompressionMethod::Stored)
        .unix_permissions(0o775);

    let walkdir = WalkDir::new(prefix_path.clone());
    let it = walkdir.into_iter();

    let it = it.filter_map(|e| e.ok());

    let mut buffer = Vec::new();

    // Loop info, write zip
    for entry in it {
        let path = entry.path();
        let path_str = path.to_str().unwrap();
        let c_prefix_path = prefix_path.clone();
        let clipped_path = path_str.replace(c_prefix_path.to_str().unwrap(), "");
        let name = Path::new(&clipped_path);

        if path.is_file() {
            zip.start_file_from_path(name, options)?;
            let mut f = File::open(path)?;

            f.read_to_end(&mut buffer)?;
            zip.write_all(&buffer)?;
            buffer.clear();
        } else if !name.as_os_str().is_empty() {
            zip.add_directory_from_path(name, options)?;
        }
    }

    zip.finish()?;

    Ok(output_path.to_string())
}

/// Generate default config files
fn generate_default_file(path: &str, content: &str) -> AnyhowResult<String> {
    let target_path = Path::new(path);

    if target_path.exists() {
        return Ok(String::from("已存在文件, 无需创建"));
    }

    fs::write(target_path, content)?;

    Ok(String::from("已创建文件"))
}

/// Tauri command: Bundle mod folder into zip
#[tauri::command]
pub fn bundle_mod(path: String) -> Result<String, String> {
    let output_file_name = get_output_file_name(&path).map_err(|e| e.to_string())?;

    let res = write_zip(&path, &output_file_name);
    match res {
        Ok(_) => Ok(output_file_name),
        Err(e) => Err(e.to_string()),
    }
}

/// Tauri command: Generate default mod config files
#[tauri::command]
pub fn generate_mod_config(path: String) -> Result<String, String> {
    let res_str = String::from(&path);

    let target_file = format!("{}/{}", path, CONFIG_FILE);
    if let Err(e) = generate_default_file(&target_file, TEMPLATE_CONFIG_JSON) {
        return Err(e.to_string());
    }

    let target_file = format!("{}/{}", path, README_FILE);
    if let Err(e) = generate_default_file(&target_file, TEMPLATE_README_MD) {
        return Err(e.to_string());
    }

    let target_file = format!("{}/{}", path, CHANGELOG_FILE);
    if let Err(e) = generate_default_file(&target_file, TEMPLATE_CHANGELOG_MD) {
        return Err(e.to_string());
    }

    Ok(res_str)
}

/// Tauri command: Read mod info from zip
#[tauri::command]
pub fn read_info(path: String) -> Result<String, String> {
    let res = read_zip(&path);
    match res {
        Ok(s) => Ok(s),
        Err(e) => Err(e.to_string()),
    }
}

/// Tauri command: Create backup
#[tauri::command]
pub fn make_backup(
    mod_path: String,
    file_list: Vec<String>,
    target_path: String,
) -> Result<String, String> {
    println!("mod_path: {}", mod_path);
    println!("target_path: {}", target_path);

    let res = backup(&mod_path, file_list, &target_path);

    match res {
        Ok(s) => Ok(s),
        Err(e) => Err(e.to_string()),
    }
}

/// Tauri command: Recover backup
#[tauri::command]
pub fn recover_backup(path: String) -> Result<(), String> {
    let backup_path = get_backup_path().unwrap();
    let backup_path = String::from(backup_path.to_str().unwrap());
    let res = extract_zip(&backup_path, &path);
    match res {
        Ok(_) => Ok(()),
        Err(e) => Err(e.to_string()),
    }
}

/// Tauri command: Install mod
#[tauri::command]
pub fn install_mod(path: String, target_path: String) -> Result<(), String> {
    let res = extract_zip(&path, &target_path);
    match res {
        Ok(_) => Ok(()),
        Err(e) => Err(e.to_string()),
    }
}
