use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use std::{
    fs,
    path::{Path, PathBuf},
};
use tauri::{AppHandle, Manager};

#[derive(Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct MediaItem {
    id: String,
    name: String,
    path: String,
    media_type: String,
    extension: String,
    size: u64,
    imported_at: DateTime<Utc>,
}

fn media_dir(app: &AppHandle) -> Result<PathBuf, String> {
    let directory = app
        .path()
        .app_data_dir()
        .map_err(|e| e.to_string())?
        .join("media");
    fs::create_dir_all(&directory).map_err(|e| e.to_string())?;
    Ok(directory)
}

fn index_path(app: &AppHandle) -> Result<PathBuf, String> {
    Ok(media_dir(app)?.join("media-index.json"))
}

fn read_index(app: &AppHandle) -> Result<Vec<MediaItem>, String> {
    let path = index_path(app)?;
    if !path.exists() {
        return Ok(Vec::new());
    }
    let contents = fs::read_to_string(path).map_err(|e| e.to_string())?;
    serde_json::from_str(&contents).map_err(|e| e.to_string())
}

fn write_index(app: &AppHandle, items: &[MediaItem]) -> Result<(), String> {
    let json = serde_json::to_string_pretty(items).map_err(|e| e.to_string())?;
    fs::write(index_path(app)?, json).map_err(|e| e.to_string())
}

fn kind_for(path: &Path) -> &'static str {
    match path
        .extension()
        .and_then(|e| e.to_str())
        .unwrap_or("")
        .to_lowercase()
        .as_str()
    {
        "mp4" | "mov" | "webm" | "mkv" => "video",
        _ => "image",
    }
}

#[tauri::command]
fn list_media(app: AppHandle) -> Result<Vec<MediaItem>, String> {
    let mut items = read_index(&app)?;
    items.retain(|item| Path::new(&item.path).exists());
    items.sort_by(|a, b| b.imported_at.cmp(&a.imported_at));
    Ok(items)
}

#[tauri::command]
fn import_media(app: AppHandle) -> Result<Vec<MediaItem>, String> {
    let selected = rfd::FileDialog::new()
        .set_title("Chọn ảnh hoặc video cho FlowPost AI")
        .add_filter("Ảnh", &["jpg", "jpeg", "png", "webp", "gif"])
        .add_filter("Video", &["mp4", "mov", "webm", "mkv"])
        .pick_files()
        .unwrap_or_default();
    if selected.is_empty() {
        return Ok(Vec::new());
    }

    let directory = media_dir(&app)?;
    let mut index = read_index(&app)?;
    let mut imported = Vec::new();
    for source in selected {
        let extension = source
            .extension()
            .and_then(|e| e.to_str())
            .unwrap_or("")
            .to_lowercase();
        let original_name = source
            .file_name()
            .and_then(|n| n.to_str())
            .unwrap_or("media")
            .to_string();
        let id = uuid::Uuid::new_v4().to_string();
        let target = directory.join(format!("{}.{}", id, extension));
        fs::copy(&source, &target)
            .map_err(|e| format!("Không thể sao chép {}: {}", original_name, e))?;
        let size = fs::metadata(&target).map_err(|e| e.to_string())?.len();
        let item = MediaItem {
            id,
            name: original_name,
            path: target.to_string_lossy().to_string(),
            media_type: kind_for(&target).into(),
            extension,
            size,
            imported_at: Utc::now(),
        };
        imported.push(item.clone());
        index.push(item);
    }
    write_index(&app, &index)?;
    Ok(imported)
}

#[tauri::command]
fn delete_media(app: AppHandle, id: String) -> Result<(), String> {
    let mut items = read_index(&app)?;
    if let Some(item) = items.iter().find(|item| item.id == id) {
        let path = PathBuf::from(&item.path);
        if path.starts_with(media_dir(&app)?) && path.exists() {
            fs::remove_file(path).map_err(|e| e.to_string())?;
        }
    }
    items.retain(|item| item.id != id);
    write_index(&app, &items)
}

#[tauri::command]
fn media_location(app: AppHandle) -> Result<String, String> {
    Ok(media_dir(&app)?.to_string_lossy().to_string())
}

pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            list_media,
            import_media,
            delete_media,
            media_location
        ])
        .run(tauri::generate_context!())
        .expect("error while running FlowPost AI");
}
