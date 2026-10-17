use std::time::{SystemTime, UNIX_EPOCH};

use serde::{Deserialize, Serialize};
use sqlx::sqlite::{SqliteConnectOptions, SqliteJournalMode, SqlitePoolOptions};
use sqlx::{Row, SqlitePool};
use tauri::{AppHandle, Manager, State};

use crate::error::{msg, AppResult};
use crate::state::AppState;

const SETTINGS_KEYS: &[&str] = &["device-lab"];
const MAX_SETTINGS_BYTES: usize = 256 * 1024;
const MAX_LOG_ROWS: i64 = 5000;
const MAX_LOG_CHARS: usize = 4000;

pub async fn connect(app: &AppHandle) -> AppResult<SqlitePool> {
    let dir = app.path().app_data_dir()?;
    tokio::fs::create_dir_all(&dir).await?;
    let options =
        SqliteConnectOptions::new().filename(dir.join("device-lab.db")).create_if_missing(true).journal_mode(SqliteJournalMode::Wal);
    let pool = SqlitePoolOptions::new().max_connections(4).connect_with(options).await?;
    sqlx::migrate!("./migrations").run(&pool).await?;
    Ok(pool)
}

pub fn now_ms() -> i64 {
    SystemTime::now().duration_since(UNIX_EPOCH).map(|d| d.as_millis() as i64).unwrap_or(0)
}

pub fn is_id(value: &str) -> bool {
    (1..=64).contains(&value.len()) && value.chars().all(|c| c.is_ascii_alphanumeric() || c == '-' || c == '_')
}

// Settings: the frontend Zustand store persists through these as one JSON document.

fn check_key(key: &str) -> AppResult<()> {
    if SETTINGS_KEYS.contains(&key) {
        Ok(())
    } else {
        Err(msg("Unknown settings key"))
    }
}

#[tauri::command]
pub async fn settings_load(state: State<'_, AppState>, key: String) -> AppResult<Option<String>> {
    check_key(&key)?;
    let row = sqlx::query("SELECT value FROM settings WHERE key = ?").bind(&key).fetch_optional(&state.db).await?;
    Ok(row.map(|r| r.get("value")))
}

#[tauri::command]
pub async fn settings_save(state: State<'_, AppState>, key: String, value: String) -> AppResult<()> {
    check_key(&key)?;
    if value.len() > MAX_SETTINGS_BYTES {
        return Err(msg("Settings too large"));
    }
    serde_json::from_str::<serde_json::Value>(&value)?;
    sqlx::query(
        "INSERT INTO settings (key, value, updated_at) VALUES (?, ?, ?)
         ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at",
    )
    .bind(&key)
    .bind(&value)
    .bind(now_ms())
    .execute(&state.db)
    .await?;
    Ok(())
}

#[tauri::command]
pub async fn settings_remove(state: State<'_, AppState>, key: String) -> AppResult<()> {
    check_key(&key)?;
    sqlx::query("DELETE FROM settings WHERE key = ?").bind(&key).execute(&state.db).await?;
    Ok(())
}

// Custom device presets.

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PresetInsets {
    pub top: u32,
    pub bottom: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Preset {
    pub id: String,
    pub name: String,
    pub os: String,
    pub kind: String,
    pub size: [u32; 2],
    pub dpr: f64,
    pub radius: u32,
    pub bezel: u32,
    pub cutout: String,
    pub insets: PresetInsets,
}

impl Preset {
    fn validate(&self) -> AppResult<()> {
        let name = self.name.trim();
        let ok = self.id.starts_with("custom-")
            && is_id(&self.id)
            && !name.is_empty()
            && name.chars().count() <= 64
            && !name.chars().any(char::is_control)
            && ["ios", "android"].contains(&self.os.as_str())
            && ["phone", "tablet"].contains(&self.kind.as_str())
            && ["island", "notch", "punch", "none"].contains(&self.cutout.as_str())
            && self.size.iter().all(|s| (200..=3000).contains(s))
            && (1.0..=5.0).contains(&self.dpr)
            && self.radius <= 120
            && self.bezel <= 60
            && self.insets.top <= 200
            && self.insets.bottom <= 200;
        if ok {
            Ok(())
        } else {
            Err(msg("Invalid device preset"))
        }
    }
}

#[tauri::command]
pub async fn presets_list(state: State<'_, AppState>) -> AppResult<Vec<Preset>> {
    let rows = sqlx::query("SELECT spec FROM presets ORDER BY created_at").fetch_all(&state.db).await?;
    Ok(rows.iter().filter_map(|r| serde_json::from_str::<Preset>(r.get("spec")).ok()).filter(|p| p.validate().is_ok()).collect())
}

#[tauri::command]
pub async fn preset_save(state: State<'_, AppState>, preset: Preset) -> AppResult<Preset> {
    let preset = Preset { name: preset.name.trim().to_string(), ..preset };
    preset.validate()?;
    sqlx::query(
        "INSERT INTO presets (id, name, spec, created_at) VALUES (?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET name = excluded.name, spec = excluded.spec",
    )
    .bind(&preset.id)
    .bind(&preset.name)
    .bind(serde_json::to_string(&preset)?)
    .bind(now_ms())
    .execute(&state.db)
    .await?;
    Ok(preset)
}

#[tauri::command]
pub async fn preset_delete(state: State<'_, AppState>, id: String) -> AppResult<()> {
    if !is_id(&id) {
        return Err(msg("Invalid preset id"));
    }
    sqlx::query("DELETE FROM presets WHERE id = ?").bind(&id).execute(&state.db).await?;
    Ok(())
}

// Log history.

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct LogRow {
    pub id: i64,
    pub device_id: String,
    pub level: String,
    pub message: String,
    pub at: i64,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct NewLog {
    pub device_id: String,
    pub level: String,
    pub message: String,
    pub at: i64,
}

#[tauri::command]
pub async fn logs_recent(state: State<'_, AppState>, limit: u32) -> AppResult<Vec<LogRow>> {
    let rows = sqlx::query("SELECT id, device_id, level, message, at FROM logs ORDER BY id DESC LIMIT ?")
        .bind(limit.min(1000) as i64)
        .fetch_all(&state.db)
        .await?;
    let mut logs: Vec<LogRow> = rows
        .iter()
        .map(|r| LogRow {
            id: r.get("id"),
            device_id: r.get("device_id"),
            level: r.get("level"),
            message: r.get("message"),
            at: r.get("at"),
        })
        .collect();
    logs.reverse();
    Ok(logs)
}

#[tauri::command]
pub async fn logs_append(state: State<'_, AppState>, entries: Vec<NewLog>) -> AppResult<()> {
    if entries.len() > 500 {
        return Err(msg("Too many log entries"));
    }
    let mut tx = state.db.begin().await?;
    for entry in entries.iter().filter(|e| is_id(&e.device_id) && ["log", "warn", "error"].contains(&e.level.as_str())) {
        let message: String = entry.message.chars().take(MAX_LOG_CHARS).collect();
        sqlx::query("INSERT INTO logs (device_id, level, message, at) VALUES (?, ?, ?, ?)")
            .bind(&entry.device_id)
            .bind(&entry.level)
            .bind(message)
            .bind(entry.at)
            .execute(&mut *tx)
            .await?;
    }
    sqlx::query("DELETE FROM logs WHERE id <= (SELECT MAX(id) FROM logs) - ?").bind(MAX_LOG_ROWS).execute(&mut *tx).await?;
    tx.commit().await?;
    Ok(())
}

#[tauri::command]
pub async fn logs_clear(state: State<'_, AppState>) -> AppResult<()> {
    sqlx::query("DELETE FROM logs").execute(&state.db).await?;
    Ok(())
}
