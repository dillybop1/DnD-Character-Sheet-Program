use anyhow::{anyhow, Context, Result};
use base64::{engine::general_purpose::STANDARD, Engine as _};
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use std::{
    ffi::OsStr,
    fs::{self, File},
    io::Write,
    path::{Path, PathBuf},
};
use tauri::{AppHandle, Manager};
use uuid::Uuid;
use walkdir::WalkDir;
use zip::{write::SimpleFileOptions, CompressionMethod, ZipArchive, ZipWriter};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct CharacterSummary {
    id: String,
    name: String,
    class_summary: String,
    subtitle: String,
    updated_at: String,
    has_portrait: bool,
    theme_id: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct AttachedAsset {
    id: String,
    slot: String,
    file_name: String,
    mime_type: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct LoadedCharacterDocument {
    document: Value,
    recovered_from_backup: bool,
}

fn into_command_error(error: anyhow::Error) -> String {
    error.to_string()
}

fn characters_root(app: &AppHandle) -> Result<PathBuf> {
    let app_data = app
        .path()
        .app_data_dir()
        .context("Unable to resolve the app data directory.")?;
    let root = app_data.join("characters");
    fs::create_dir_all(&root).context("Unable to create the characters directory.")?;
    Ok(root)
}

fn character_dir(app: &AppHandle, id: &str) -> Result<PathBuf> {
    Ok(characters_root(app)?.join(id))
}

fn character_json_path(app: &AppHandle, id: &str) -> Result<PathBuf> {
    Ok(character_dir(app, id)?.join("character.json"))
}

fn character_backup_path(app: &AppHandle, id: &str) -> Result<PathBuf> {
    Ok(character_dir(app, id)?.join("character.json.bak"))
}

fn character_assets_dir(app: &AppHandle, id: &str) -> Result<PathBuf> {
    Ok(character_dir(app, id)?.join("assets"))
}

fn extract_string(value: &Value, path: &[&str]) -> String {
    let mut current = value;

    for segment in path {
        match current.get(segment) {
            Some(next) => current = next,
            None => return String::new(),
        }
    }

    current.as_str().unwrap_or_default().to_string()
}

fn extract_u64(value: &Value, path: &[&str]) -> u64 {
    let mut current = value;

    for segment in path {
        match current.get(segment) {
            Some(next) => current = next,
            None => return 0,
        }
    }

    current.as_u64().unwrap_or_default()
}

fn summary_from_value(value: &Value) -> Result<CharacterSummary> {
    let id = extract_string(value, &["id"]);
    let name = extract_string(value, &["metadata", "name"]);
    let class_name = extract_string(value, &["build", "className"]);
    let species = extract_string(value, &["build", "species"]);
    let level = extract_u64(value, &["build", "level"]);
    let player_name = extract_string(value, &["metadata", "playerName"]);
    let campaign = extract_string(value, &["metadata", "campaign"]);
    let ruleset = extract_string(value, &["ruleset"]);
    let updated_at = extract_string(value, &["metadata", "updatedAt"]);
    let theme_id = extract_string(value, &["theme", "id"]);
    let has_portrait = value
        .get("art")
        .and_then(|art| art.as_array())
        .map(|entries| {
            entries.iter().any(|entry| {
                entry
                    .get("slot")
                    .and_then(Value::as_str)
                    .map(|slot| slot == "portrait")
                    .unwrap_or(false)
            })
        })
        .unwrap_or(false);

    if id.is_empty() || name.is_empty() {
        return Err(anyhow!("Character bundle is missing required summary fields."));
    }

    let class_summary = [format!("Level {level}"), class_name, species]
        .into_iter()
        .filter(|part| !part.trim().is_empty())
        .collect::<Vec<_>>()
        .join(" • ");

    let subtitle = if !player_name.is_empty() {
        format!("Player: {player_name}")
    } else if !campaign.is_empty() {
        format!("Campaign: {campaign}")
    } else {
        ruleset
    };

    Ok(CharacterSummary {
        id,
        name,
        class_summary,
        subtitle,
        updated_at,
        has_portrait,
        theme_id,
    })
}

fn read_json_value(path: &Path) -> Result<Value> {
    let bytes = fs::read(path)
        .with_context(|| format!("Unable to read character file at {}", path.display()))?;
    let value = serde_json::from_slice::<Value>(&bytes)
        .with_context(|| format!("Unable to parse character file at {}", path.display()))?;

    Ok(value)
}

fn read_character_value_from_paths(
    primary: &Path,
    fallback: &Path,
) -> Result<LoadedCharacterDocument> {
    if primary.exists() {
        match read_json_value(primary) {
            Ok(document) => {
                return Ok(LoadedCharacterDocument {
                    document,
                    recovered_from_backup: false,
                });
            }
            Err(primary_error) => {
                if fallback.exists() {
                    let document = read_json_value(fallback).with_context(|| {
                        format!(
                            "Unable to recover character data from backup file {}.",
                            fallback.display()
                        )
                    })?;

                    return Ok(LoadedCharacterDocument {
                        document,
                        recovered_from_backup: true,
                    });
                }

                return Err(primary_error.context("No backup file was available for recovery."));
            }
        }
    }

    if fallback.exists() {
        let document = read_json_value(fallback)?;
        return Ok(LoadedCharacterDocument {
            document,
            recovered_from_backup: true,
        });
    }

    Err(anyhow!(
        "Character file is missing. No primary or backup file exists."
    ))
}

fn read_character_document(app: &AppHandle, id: &str) -> Result<LoadedCharacterDocument> {
    let primary = character_json_path(app, id)?;
    let fallback = character_backup_path(app, id)?;
    read_character_value_from_paths(&primary, &fallback)
}

fn write_json_value_with_backup(target: &Path, backup: &Path, value: &Value) -> Result<()> {
    let temporary = target.with_extension("json.tmp");
    let serialized =
        serde_json::to_vec_pretty(value).context("Unable to serialize character data.")?;
    fs::write(&temporary, serialized)
        .with_context(|| format!("Unable to write temporary file {}", temporary.display()))?;

    if target.exists() {
        fs::remove_file(target).with_context(|| format!("Unable to replace {}", target.display()))?;
    }

    fs::rename(&temporary, target)
        .with_context(|| format!("Unable to move temporary file into {}", target.display()))?;
    fs::copy(target, backup).with_context(|| {
        format!(
            "Unable to refresh backup file {} from {}",
            backup.display(),
            target.display()
        )
    })?;

    Ok(())
}

fn write_character_value(app: &AppHandle, value: &Value) -> Result<CharacterSummary> {
    let summary = summary_from_value(value)?;
    let character_dir = character_dir(app, &summary.id)?;
    let assets_dir = character_assets_dir(app, &summary.id)?;
    fs::create_dir_all(&character_dir)
        .with_context(|| format!("Unable to create directory {}", character_dir.display()))?;
    fs::create_dir_all(&assets_dir)
        .with_context(|| format!("Unable to create directory {}", assets_dir.display()))?;

    let target = character_json_path(app, &summary.id)?;
    let backup = character_backup_path(app, &summary.id)?;
    write_json_value_with_backup(&target, &backup, value)?;

    Ok(summary)
}

fn copy_directory(source: &Path, destination: &Path) -> Result<()> {
    if !source.exists() {
        return Ok(());
    }

    for entry in WalkDir::new(source) {
        let entry = entry?;
        let relative = entry
            .path()
            .strip_prefix(source)
            .context("Unable to calculate the relative asset path.")?;
        let target = destination.join(relative);

        if entry.file_type().is_dir() {
            fs::create_dir_all(&target)
                .with_context(|| format!("Unable to create asset directory {}", target.display()))?;
        } else {
            if let Some(parent) = target.parent() {
                fs::create_dir_all(parent).with_context(|| {
                    format!("Unable to create parent asset directory {}", parent.display())
                })?;
            }
            fs::copy(entry.path(), &target).with_context(|| {
                format!(
                    "Unable to copy asset from {} to {}",
                    entry.path().display(),
                    target.display()
                )
            })?;
        }
    }

    Ok(())
}

fn ensure_unique_character_id(app: &AppHandle, value: &mut Value) -> Result<String> {
    let existing_id = extract_string(value, &["id"]);
    let mut final_id = if existing_id.is_empty() {
        Uuid::new_v4().to_string()
    } else {
        existing_id
    };

    while character_dir(app, &final_id)?.exists() {
        final_id = Uuid::new_v4().to_string();
    }

    value["id"] = json!(final_id.clone());
    Ok(final_id)
}

fn safe_file_name(source_path: &Path) -> String {
    source_path
        .file_name()
        .and_then(OsStr::to_str)
        .unwrap_or("asset")
        .chars()
        .map(|character| match character {
            'a'..='z' | 'A'..='Z' | '0'..='9' | '.' | '_' | '-' => character,
            _ => '-',
        })
        .collect::<String>()
}

fn infer_mime(path: &Path) -> &'static str {
    match path
        .extension()
        .and_then(OsStr::to_str)
        .unwrap_or_default()
        .to_ascii_lowercase()
        .as_str()
    {
        "png" => "image/png",
        "jpg" | "jpeg" => "image/jpeg",
        "webp" => "image/webp",
        "gif" => "image/gif",
        _ => "application/octet-stream",
    }
}

fn asset_path_for_id(app: &AppHandle, character_id: &str, asset_id: &str) -> Result<PathBuf> {
    let assets_dir = character_assets_dir(app, character_id)?;
    for entry in fs::read_dir(&assets_dir)
        .with_context(|| format!("Unable to read assets directory {}", assets_dir.display()))?
    {
        let entry = entry?;
        let path = entry.path();
        if path
            .file_stem()
            .and_then(OsStr::to_str)
            .map(|stem| stem == asset_id)
            .unwrap_or(false)
        {
            return Ok(path);
        }
    }

    Err(anyhow!("Asset {asset_id} is missing from character {character_id}."))
}

fn zip_directory(source_dir: &Path, destination_path: &Path) -> Result<()> {
    if let Some(parent) = destination_path.parent() {
        fs::create_dir_all(parent).with_context(|| {
            format!(
                "Unable to create export directory {}",
                parent.display()
            )
        })?;
    }

    let file = File::create(destination_path)
        .with_context(|| format!("Unable to create export bundle {}", destination_path.display()))?;
    let mut zip = ZipWriter::new(file);
    let options = SimpleFileOptions::default().compression_method(CompressionMethod::Deflated);

    for entry in WalkDir::new(source_dir) {
        let entry = entry?;
        let path = entry.path();
        let relative = path
            .strip_prefix(source_dir)
            .context("Unable to calculate export relative path.")?;

        if relative.as_os_str().is_empty() {
            continue;
        }

        let name = relative.to_string_lossy().replace('\\', "/");

        if entry.file_type().is_dir() {
            zip.add_directory(name, options)
                .context("Unable to add bundle directory.")?;
            continue;
        }

        zip.start_file(name, options)
            .context("Unable to add file to export bundle.")?;
        let bytes = fs::read(path)
            .with_context(|| format!("Unable to read export file {}", path.display()))?;
        zip.write_all(&bytes)
            .context("Unable to write bytes to export bundle.")?;
    }

    zip.finish().context("Unable to finalize export bundle.")?;
    Ok(())
}

fn unzip_bundle(bundle_path: &Path, destination_dir: &Path) -> Result<()> {
    let file = File::open(bundle_path)
        .with_context(|| format!("Unable to open bundle {}", bundle_path.display()))?;
    let mut archive = ZipArchive::new(file).context("Unable to read bundle archive.")?;

    fs::create_dir_all(destination_dir).with_context(|| {
        format!(
            "Unable to create temporary import directory {}",
            destination_dir.display()
        )
    })?;

    for index in 0..archive.len() {
        let mut entry = archive.by_index(index)?;
        let enclosed = entry
            .enclosed_name()
            .map(PathBuf::from)
            .ok_or_else(|| anyhow!("Bundle contains an unsafe path."))?;
        let output_path = destination_dir.join(enclosed);

        if entry.is_dir() {
            fs::create_dir_all(&output_path).with_context(|| {
                format!("Unable to create import directory {}", output_path.display())
            })?;
            continue;
        }

        if let Some(parent) = output_path.parent() {
            fs::create_dir_all(parent).with_context(|| {
                format!("Unable to create import directory {}", parent.display())
            })?;
        }

        let mut output = File::create(&output_path).with_context(|| {
            format!("Unable to create import file {}", output_path.display())
        })?;
        std::io::copy(&mut entry, &mut output)
            .with_context(|| format!("Unable to extract {}", output_path.display()))?;
    }

    Ok(())
}

#[tauri::command]
fn list_characters(app: AppHandle) -> Result<Vec<CharacterSummary>, String> {
    let result = (|| -> Result<Vec<CharacterSummary>> {
        let root = characters_root(&app)?;
        let mut summaries = Vec::new();

        for entry in fs::read_dir(&root)? {
            let entry = entry?;
            let path = entry.path();
            if !path.is_dir() {
                continue;
            }

            let id = path
                .file_name()
                .and_then(OsStr::to_str)
                .ok_or_else(|| anyhow!("Character directory is missing an id."))?;

            let loaded = match read_character_document(&app, id) {
                Ok(loaded) => loaded,
                Err(_) => continue,
            };

            if let Ok(summary) = summary_from_value(&loaded.document) {
                summaries.push(summary);
            }
        }

        summaries.sort_by(|left, right| right.updated_at.cmp(&left.updated_at));
        Ok(summaries)
    })();

    result.map_err(into_command_error)
}

#[tauri::command]
fn load_character(app: AppHandle, id: String) -> Result<LoadedCharacterDocument, String> {
    read_character_document(&app, &id).map_err(into_command_error)
}

#[tauri::command]
fn save_character(app: AppHandle, doc: Value) -> Result<CharacterSummary, String> {
    write_character_value(&app, &doc).map_err(into_command_error)
}

#[tauri::command]
fn delete_character(app: AppHandle, id: String) -> Result<(), String> {
    let result = (|| -> Result<()> {
        let directory = character_dir(&app, &id)?;
        if directory.exists() {
          fs::remove_dir_all(&directory)
              .with_context(|| format!("Unable to delete {}", directory.display()))?;
        }
        Ok(())
    })();

    result.map_err(into_command_error)
}

#[tauri::command]
fn duplicate_character(app: AppHandle, id: String) -> Result<CharacterSummary, String> {
    let result = (|| -> Result<CharacterSummary> {
        let original = read_character_document(&app, &id)?;
        let mut duplicate = original.document.clone();
        let duplicate_id = Uuid::new_v4().to_string();
        let name = extract_string(&duplicate, &["metadata", "name"]);
        let now = chrono_like_now();

        duplicate["id"] = json!(duplicate_id.clone());
        duplicate["metadata"]["name"] = json!(format!("{name} Copy"));
        duplicate["metadata"]["createdAt"] = json!(now.clone());
        duplicate["metadata"]["updatedAt"] = json!(now);

        let original_assets = character_assets_dir(&app, &id)?;
        let duplicate_assets = character_assets_dir(&app, &duplicate_id)?;
        fs::create_dir_all(&duplicate_assets)?;
        copy_directory(&original_assets, &duplicate_assets)?;

        write_character_value(&app, &duplicate)
    })();

    result.map_err(into_command_error)
}

#[tauri::command]
fn import_character_bundle(app: AppHandle, bundle_path: String) -> Result<CharacterSummary, String> {
    let result = (|| -> Result<CharacterSummary> {
        let temporary_dir = std::env::temp_dir().join(format!("wyrdsheet-import-{}", Uuid::new_v4()));
        unzip_bundle(Path::new(&bundle_path), &temporary_dir)?;

        let bundle_json = temporary_dir.join("character.json");
        if !bundle_json.exists() {
            return Err(anyhow!("The selected bundle does not include character.json."));
        }

        let mut value = serde_json::from_slice::<Value>(&fs::read(&bundle_json)?)?;
        let new_id = ensure_unique_character_id(&app, &mut value)?;
        let now = chrono_like_now();
        value["metadata"]["updatedAt"] = json!(now);

        let assets_source = temporary_dir.join("assets");
        let assets_destination = character_assets_dir(&app, &new_id)?;
        fs::create_dir_all(&assets_destination)?;
        copy_directory(&assets_source, &assets_destination)?;

        let summary = write_character_value(&app, &value)?;
        let _ = fs::remove_dir_all(&temporary_dir);
        Ok(summary)
    })();

    result.map_err(into_command_error)
}

#[tauri::command]
fn export_character_bundle(
    app: AppHandle,
    character_id: String,
    destination_path: String,
) -> Result<(), String> {
    let result = (|| -> Result<()> {
        let directory = character_dir(&app, &character_id)?;
        if !directory.exists() {
            return Err(anyhow!("Character {character_id} does not exist."));
        }

        zip_directory(&directory, Path::new(&destination_path))
    })();

    result.map_err(into_command_error)
}

#[tauri::command]
fn attach_art_asset(
    app: AppHandle,
    character_id: String,
    source_path: String,
    slot: String,
) -> Result<AttachedAsset, String> {
    let result = (|| -> Result<AttachedAsset> {
        let source = Path::new(&source_path);
        if !source.exists() {
            return Err(anyhow!("Selected art asset does not exist."));
        }

        let asset_id = Uuid::new_v4().to_string();
        let extension = source
            .extension()
            .and_then(OsStr::to_str)
            .map(|value| format!(".{}", value))
            .unwrap_or_default();
        let assets_dir = character_assets_dir(&app, &character_id)?;
        fs::create_dir_all(&assets_dir)?;
        let destination = assets_dir.join(format!("{asset_id}{extension}"));
        fs::copy(source, &destination).with_context(|| {
            format!(
                "Unable to copy art asset from {} to {}",
                source.display(),
                destination.display()
            )
        })?;

        Ok(AttachedAsset {
            id: asset_id,
            slot,
            file_name: safe_file_name(source),
            mime_type: infer_mime(source).to_string(),
        })
    })();

    result.map_err(into_command_error)
}

#[tauri::command]
fn remove_art_asset(app: AppHandle, character_id: String, asset_id: String) -> Result<(), String> {
    let result = (|| -> Result<()> {
        let asset_path = asset_path_for_id(&app, &character_id, &asset_id)?;
        if asset_path.exists() {
            fs::remove_file(&asset_path).with_context(|| {
                format!("Unable to remove art asset {}", asset_path.display())
            })?;
        }
        Ok(())
    })();

    result.map_err(into_command_error)
}

#[tauri::command]
fn load_art_asset(
    app: AppHandle,
    character_id: String,
    asset_id: String,
    mime_type: String,
) -> Result<String, String> {
    let result = (|| -> Result<String> {
        let asset_path = asset_path_for_id(&app, &character_id, &asset_id)?;
        let bytes = fs::read(&asset_path).with_context(|| {
            format!("Unable to read art asset {}", asset_path.display())
        })?;
        Ok(format!("data:{mime_type};base64,{}", STANDARD.encode(bytes)))
    })();

    result.map_err(into_command_error)
}

fn chrono_like_now() -> String {
    use std::time::{SystemTime, UNIX_EPOCH};

    let now = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs();
    let datetime = time::OffsetDateTime::from_unix_timestamp(now as i64)
        .unwrap_or(time::OffsetDateTime::UNIX_EPOCH);
    datetime
        .format(&time::format_description::well_known::Rfc3339)
        .unwrap_or_else(|_| "1970-01-01T00:00:00Z".to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            list_characters,
            load_character,
            save_character,
            delete_character,
            duplicate_character,
            import_character_bundle,
            export_character_bundle,
            attach_art_asset,
            remove_art_asset,
            load_art_asset
        ])
        .run(tauri::generate_context!())
        .expect("error while running wyrdsheet");
}

#[cfg(test)]
mod tests {
    use super::*;

    fn create_temp_dir(label: &str) -> PathBuf {
        let path = std::env::temp_dir().join(format!("wyrdsheet-{label}-{}", Uuid::new_v4()));
        fs::create_dir_all(&path).unwrap();
        path
    }

    #[test]
    fn reads_backup_when_primary_file_is_corrupt() {
        let dir = create_temp_dir("recover-corrupt");
        let primary = dir.join("character.json");
        let backup = dir.join("character.json.bak");

        fs::write(&primary, "{ not valid json").unwrap();
        fs::write(&backup, r#"{ "id": "hero-1", "metadata": { "name": "Iris Vale" } }"#).unwrap();

        let loaded = read_character_value_from_paths(&primary, &backup).unwrap();

        assert!(loaded.recovered_from_backup);
        assert_eq!(loaded.document["id"], json!("hero-1"));

        fs::remove_dir_all(dir).unwrap();
    }

    #[test]
    fn reads_backup_when_primary_file_is_missing() {
        let dir = create_temp_dir("recover-missing");
        let primary = dir.join("character.json");
        let backup = dir.join("character.json.bak");

        fs::write(&backup, r#"{ "id": "hero-2", "metadata": { "name": "Rowan" } }"#).unwrap();

        let loaded = read_character_value_from_paths(&primary, &backup).unwrap();

        assert!(loaded.recovered_from_backup);
        assert_eq!(loaded.document["id"], json!("hero-2"));

        fs::remove_dir_all(dir).unwrap();
    }

    #[test]
    fn writes_a_fresh_backup_after_successful_save() {
        let dir = create_temp_dir("write-backup");
        let primary = dir.join("character.json");
        let backup = dir.join("character.json.bak");
        let document = json!({
            "id": "hero-3",
            "metadata": { "name": "Aster" }
        });

        fs::write(&primary, "{ broken json").unwrap();
        fs::write(&backup, r#"{ "id": "old-backup" }"#).unwrap();

        write_json_value_with_backup(&primary, &backup, &document).unwrap();

        assert_eq!(read_json_value(&primary).unwrap(), document);
        assert_eq!(read_json_value(&backup).unwrap(), document);

        fs::remove_dir_all(dir).unwrap();
    }
}
