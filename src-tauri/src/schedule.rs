use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use tauri::{AppHandle, Manager};

#[derive(Clone, Debug, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub enum ScheduleStatus {
    Scheduled,
    Published,
    Failed,
    Cancelled,
}

impl Default for ScheduleStatus {
    fn default() -> Self {
        ScheduleStatus::Scheduled
    }
}

#[derive(Clone, Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ScheduleItem {
    pub id: String,
    pub content_id: String,
    pub scheduled_at: DateTime<Utc>,
    pub platform: String,
    #[serde(default)]
    pub pages: Vec<String>,
    pub status: ScheduleStatus,
    pub retry_count: u32,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

fn schedule_dir(app: &AppHandle) -> Result<PathBuf, String> {
    let dir = app
        .path()
        .app_data_dir()
        .map_err(|e| e.to_string())?
        .join("schedule");
    fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    Ok(dir)
}

fn schedule_index_path(app: &AppHandle) -> Result<PathBuf, String> {
    Ok(schedule_dir(app)?.join("schedule-index.json"))
}

fn read_schedule_index(app: &AppHandle) -> Result<Vec<ScheduleItem>, String> {
    let path = schedule_index_path(app)?;
    if !path.exists() {
        return Ok(Vec::new());
    }
    let contents = fs::read_to_string(&path).map_err(|e| e.to_string())?;
    if contents.trim().is_empty() {
        return Ok(Vec::new());
    }
    serde_json::from_str(&contents).map_err(|e| e.to_string())
}

fn write_schedule_index(app: &AppHandle, items: &[ScheduleItem]) -> Result<(), String> {
    let path = schedule_index_path(app)?;
    let tmp = path.with_extension("json.tmp");
    let json = serde_json::to_string_pretty(items).map_err(|e| e.to_string())?;
    fs::write(&tmp, json).map_err(|e| e.to_string())?;
    fs::rename(&tmp, &path).map_err(|e| e.to_string())
}

#[cfg(test)]
fn write_schedule_at(path: &std::path::Path, items: &[ScheduleItem]) -> Result<(), String> {
    let tmp = path.with_extension("json.tmp");
    let json = serde_json::to_string_pretty(items).map_err(|e| e.to_string())?;
    fs::write(&tmp, json).map_err(|e| e.to_string())?;
    fs::rename(&tmp, path).map_err(|e| e.to_string())
}

fn validate_content_approved(app: &AppHandle, content_id: &str) -> Result<(), String> {
    // Reuse content.rs read logic without circular dep: read file directly
    let content_path = app
        .path()
        .app_data_dir()
        .map_err(|e| e.to_string())?
        .join("content")
        .join("content-index.json");
    if !content_path.exists() {
        return Err(format!("Không tìm thấy nội dung {}", content_id));
    }
    let contents = fs::read_to_string(&content_path).map_err(|e| e.to_string())?;
    if contents.trim().is_empty() {
        return Err(format!("Không tìm thấy nội dung {}", content_id));
    }
    let items: Vec<crate::content::ContentItem> =
        serde_json::from_str(&contents).map_err(|e| e.to_string())?;
    let found = items.iter().find(|c| c.id == content_id);
    match found {
        None => Err(format!("Không tìm thấy nội dung {}", content_id)),
        Some(c) => {
            if c.status != crate::content::ContentStatus::Approved {
                return Err("Chỉ nội dung đã duyệt mới được lên lịch".into());
            }
            Ok(())
        }
    }
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateSchedulePayload {
    pub content_id: String,
    pub scheduled_at: DateTime<Utc>,
    pub platform: String,
    #[serde(default)]
    pub pages: Option<Vec<String>>,
}

#[tauri::command]
pub fn list_schedule(app: AppHandle) -> Result<Vec<ScheduleItem>, String> {
    let mut items = read_schedule_index(&app)?;
    items.sort_by(|a, b| a.scheduled_at.cmp(&b.scheduled_at));
    Ok(items)
}

#[tauri::command]
pub fn get_schedule(app: AppHandle, id: String) -> Result<Option<ScheduleItem>, String> {
    let items = read_schedule_index(&app)?;
    Ok(items.into_iter().find(|s| s.id == id))
}

#[tauri::command]
pub fn create_schedule(app: AppHandle, payload: CreateSchedulePayload) -> Result<ScheduleItem, String> {
    if payload.content_id.trim().is_empty() {
        return Err("Thiếu contentId".into());
    }
    if payload.platform.trim().is_empty() {
        return Err("Vui lòng chọn nền tảng".into());
    }
    let now = Utc::now();
    // Must be at least 5 minutes in future
    if payload.scheduled_at <= now + chrono::Duration::minutes(5) {
        return Err("Thời gian lên lịch phải trong tương lai (tối thiểu 5 phút)".into());
    }
    validate_content_approved(&app, &payload.content_id)?;

    let mut items = read_schedule_index(&app)?;

    let item = ScheduleItem {
        id: uuid::Uuid::new_v4().to_string(),
        content_id: payload.content_id.trim().to_string(),
        scheduled_at: payload.scheduled_at,
        platform: payload.platform.trim().to_string(),
        pages: payload.pages.unwrap_or_default(),
        status: ScheduleStatus::Scheduled,
        retry_count: 0,
        created_at: now,
        updated_at: now,
    };
    items.push(item.clone());
    write_schedule_index(&app, &items)?;
    Ok(item)
}

#[tauri::command]
pub fn delete_schedule(app: AppHandle, id: String) -> Result<(), String> {
    let mut items = read_schedule_index(&app)?;
    let len_before = items.len();
    items.retain(|s| s.id != id);
    if items.len() == len_before {
        return Err(format!("Không tìm thấy lịch {}", id));
    }
    write_schedule_index(&app, &items)
}

#[tauri::command]
pub fn update_schedule_status(
    app: AppHandle,
    id: String,
    status: ScheduleStatus,
) -> Result<ScheduleItem, String> {
    let mut items = read_schedule_index(&app)?;
    let pos = items
        .iter()
        .position(|s| s.id == id)
        .ok_or_else(|| format!("Không tìm thấy {}", id))?;
    items[pos].status = status;
    items[pos].updated_at = Utc::now();
    let updated = items[pos].clone();
    write_schedule_index(&app, &items)?;
    Ok(updated)
}

#[tauri::command]
pub fn reschedule(app: AppHandle, id: String, scheduled_at: DateTime<Utc>) -> Result<ScheduleItem, String> {
    if scheduled_at <= Utc::now() + chrono::Duration::minutes(5) {
        return Err("Thời gian lên lịch phải trong tương lai (tối thiểu 5 phút)".into());
    }
    let mut items = read_schedule_index(&app)?;
    let pos = items
        .iter()
        .position(|s| s.id == id)
        .ok_or_else(|| format!("Không tìm thấy {}", id))?;
    items[pos].scheduled_at = scheduled_at;
    items[pos].updated_at = Utc::now();
    let updated = items[pos].clone();
    write_schedule_index(&app, &items)?;
    Ok(updated)
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::time::{SystemTime, UNIX_EPOCH};

    fn unique_temp_dir(prefix: &str) -> PathBuf {
        let nanos = SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_nanos();
        let dir = std::env::temp_dir().join(format!("{}_{}_{}", prefix, std::process::id(), nanos));
        std::fs::create_dir_all(&dir).unwrap();
        dir
    }

    fn sample_schedule(content_id: &str, minutes_ahead: i64) -> ScheduleItem {
        ScheduleItem {
            id: uuid::Uuid::new_v4().to_string(),
            content_id: content_id.into(),
            scheduled_at: Utc::now() + chrono::Duration::minutes(minutes_ahead),
            platform: "Sống Tích Cực".into(),
            pages: vec!["page1".into()],
            status: ScheduleStatus::Scheduled,
            retry_count: 0,
            created_at: Utc::now(),
            updated_at: Utc::now(),
        }
    }

    #[test]
    fn test_write_schedule_atomic_cleans_tmp() {
        let dir = unique_temp_dir("flowpost_schedule_atomic");
        let path = dir.join("schedule-index.json");
        let tmp = path.with_extension("json.tmp");
        let item = sample_schedule("c1", 10);
        write_schedule_at(&path, &[item]).unwrap();
        assert!(path.exists());
        assert!(!tmp.exists(), "tmp should be cleaned");
        let parsed: Vec<ScheduleItem> = serde_json::from_str(&std::fs::read_to_string(&path).unwrap()).unwrap();
        assert_eq!(parsed.len(), 1);
        std::fs::remove_dir_all(&dir).unwrap();
    }

    #[test]
    fn test_schedule_sort_and_roundtrip() {
        let dir = unique_temp_dir("flowpost_schedule_roundtrip");
        let path = dir.join("schedule-index.json");
        let mut items = vec![
            sample_schedule("c1", 30),
            sample_schedule("c2", 10),
            sample_schedule("c3", 20),
        ];
        write_schedule_at(&path, &items).unwrap();
        let mut parsed: Vec<ScheduleItem> = serde_json::from_str(&std::fs::read_to_string(&path).unwrap()).unwrap();
        parsed.sort_by(|a, b| a.scheduled_at.cmp(&b.scheduled_at));
        assert!(parsed[0].scheduled_at < parsed[1].scheduled_at);
        assert!(parsed[1].scheduled_at < parsed[2].scheduled_at);
        // Delete one
        let id = parsed[1].id.clone();
        items.retain(|s| s.id != id);
        write_schedule_at(&path, &items).unwrap();
        let after: Vec<ScheduleItem> = serde_json::from_str(&std::fs::read_to_string(&path).unwrap()).unwrap();
        assert_eq!(after.len(), 2);
        std::fs::remove_dir_all(&dir).unwrap();
    }

    #[test]
    fn test_schedule_index_empty_handling() {
        let dir = unique_temp_dir("flowpost_schedule_empty");
        let path = dir.join("schedule-index.json");
        // No file -> read would be empty, but write then read
        write_schedule_at(&path, &[]).unwrap();
        let parsed: Vec<ScheduleItem> = serde_json::from_str(&std::fs::read_to_string(&path).unwrap()).unwrap();
        assert_eq!(parsed.len(), 0);
        std::fs::remove_dir_all(&dir).unwrap();
    }
}
