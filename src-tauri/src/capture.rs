// Native screenshots of the device shells. Cross-origin iframes cannot be drawn to a canvas and
// WebKitGTK has no Screen Capture API, so the webview snapshots itself and Rust crops each shell.

use serde::{Deserialize, Serialize};
use sqlx::Row;
use tauri::{AppHandle, Manager, State, WebviewWindow};

use crate::db::{is_id, now_ms};
use crate::error::{msg, AppResult};
use crate::state::AppState;

/// A device shell in CSS pixels relative to the webview viewport.
#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Region {
    pub device_id: String,
    pub x: f64,
    pub y: f64,
    pub width: f64,
    pub height: f64,
    pub radius: f64,
}

pub struct Shot {
    pub png: Vec<u8>,
    pub width: i32,
    pub height: i32,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Screenshot {
    pub id: i64,
    pub device_id: String,
    pub path: String,
    pub width: i64,
    pub height: i64,
    pub created_at: i64,
}

fn valid_region(r: &Region) -> bool {
    let finite = [r.x, r.y, r.width, r.height, r.radius].iter().all(|n| n.is_finite());
    finite && is_id(&r.device_id) && r.width >= 1.0 && r.height >= 1.0 && r.width <= 10_000.0 && r.height <= 10_000.0 && r.radius >= 0.0
}

#[tauri::command]
pub async fn capture_devices(
    app: AppHandle,
    window: WebviewWindow,
    state: State<'_, AppState>,
    regions: Vec<Region>,
    viewport_width: f64,
) -> AppResult<Vec<Screenshot>> {
    if regions.is_empty() || regions.len() > 32 || !regions.iter().all(valid_region) {
        return Err(msg("Invalid capture regions"));
    }
    if !viewport_width.is_finite() || viewport_width < 1.0 {
        return Err(msg("Invalid viewport width"));
    }

    let shots = platform::capture(&window, regions.clone(), viewport_width).await?;

    let dir = app.path().app_data_dir()?.join("screenshots");
    tokio::fs::create_dir_all(&dir).await?;
    let stamp = now_ms();
    let mut saved = Vec::with_capacity(shots.len());
    for (region, shot) in regions.iter().zip(shots) {
        let path = dir.join(format!("{}-{stamp}.png", region.device_id));
        tokio::fs::write(&path, &shot.png).await?;
        let path = path.to_string_lossy().into_owned();
        let id = sqlx::query("INSERT INTO screenshots (device_id, path, width, height, created_at) VALUES (?, ?, ?, ?, ?)")
            .bind(&region.device_id)
            .bind(&path)
            .bind(shot.width)
            .bind(shot.height)
            .bind(stamp)
            .execute(&state.db)
            .await?
            .last_insert_rowid();
        saved.push(Screenshot {
            id,
            device_id: region.device_id.clone(),
            path,
            width: shot.width.into(),
            height: shot.height.into(),
            created_at: stamp,
        });
    }
    Ok(saved)
}

#[tauri::command]
pub async fn screenshots_list(state: State<'_, AppState>, limit: u32) -> AppResult<Vec<Screenshot>> {
    let rows = sqlx::query("SELECT id, device_id, path, width, height, created_at FROM screenshots ORDER BY id DESC LIMIT ?")
        .bind(limit.min(500) as i64)
        .fetch_all(&state.db)
        .await?;
    Ok(rows
        .iter()
        .map(|r| Screenshot {
            id: r.get("id"),
            device_id: r.get("device_id"),
            path: r.get("path"),
            width: r.get("width"),
            height: r.get("height"),
            created_at: r.get("created_at"),
        })
        .collect())
}

#[tauri::command]
pub async fn screenshot_delete(app: AppHandle, state: State<'_, AppState>, id: i64) -> AppResult<()> {
    let row = sqlx::query("SELECT path FROM screenshots WHERE id = ?").bind(id).fetch_optional(&state.db).await?;
    let Some(row) = row else { return Ok(()) };
    let path = std::path::PathBuf::from(row.get::<String, _>("path"));
    // Only ever delete files inside our own screenshots folder.
    let dir = app.path().app_data_dir()?.join("screenshots");
    if path.parent() == Some(dir.as_path()) {
        let _ = tokio::fs::remove_file(&path).await;
    }
    sqlx::query("DELETE FROM screenshots WHERE id = ?").bind(id).execute(&state.db).await?;
    Ok(())
}

#[cfg(target_os = "linux")]
mod platform {
    use gtk::gio;
    use webkit2gtk::{SnapshotOptions, SnapshotRegion, WebViewExt};

    use super::{Region, Shot};
    use crate::error::{msg, AppResult};

    pub async fn capture(window: &tauri::WebviewWindow, regions: Vec<Region>, viewport_width: f64) -> AppResult<Vec<Shot>> {
        let (tx, rx) = tokio::sync::oneshot::channel();
        window.with_webview(move |webview| {
            webview.inner().snapshot(SnapshotRegion::Visible, SnapshotOptions::NONE, None::<&gio::Cancellable>, move |result| {
                // cairo surfaces are not Send: crop and encode here on the GTK thread.
                let shots = result.map_err(|e| e.to_string()).and_then(|surface| crop_all(surface, &regions, viewport_width));
                let _ = tx.send(shots);
            });
        })?;
        rx.await.map_err(|_| msg("Snapshot was cancelled"))?.map_err(msg)
    }

    fn crop_all(surface: cairo::Surface, regions: &[Region], viewport_width: f64) -> Result<Vec<Shot>, String> {
        let image = cairo::ImageSurface::try_from(surface).map_err(|_| "Snapshot is not an image surface".to_string())?;
        // Work in raw pixels whatever HiDPI scale WebKit attached to the surface.
        image.set_device_scale(1.0, 1.0);
        let scale = f64::from(image.width()) / viewport_width;
        regions.iter().map(|r| crop(&image, r, scale).map_err(|e| e.to_string())).collect()
    }

    fn crop(image: &cairo::ImageSurface, r: &Region, scale: f64) -> Result<Shot, Box<dyn std::error::Error>> {
        let width = (r.width * scale).round().max(1.0) as i32;
        let height = (r.height * scale).round().max(1.0) as i32;
        let out = cairo::ImageSurface::create(cairo::Format::ARgb32, width, height)?;
        {
            let cr = cairo::Context::new(&out)?;
            rounded_rect(&cr, f64::from(width), f64::from(height), (r.radius * scale).min(f64::from(width.min(height)) / 2.0));
            cr.clip();
            cr.set_source_surface(image, -r.x * scale, -r.y * scale)?;
            cr.paint()?;
        }
        let mut png = Vec::new();
        out.write_to_png(&mut png)?;
        Ok(Shot { png, width, height })
    }

    fn rounded_rect(cr: &cairo::Context, w: f64, h: f64, radius: f64) {
        use std::f64::consts::{FRAC_PI_2, PI};
        cr.new_sub_path();
        cr.arc(w - radius, radius, radius, -FRAC_PI_2, 0.0);
        cr.arc(w - radius, h - radius, radius, 0.0, FRAC_PI_2);
        cr.arc(radius, h - radius, radius, FRAC_PI_2, PI);
        cr.arc(radius, radius, radius, PI, 3.0 * FRAC_PI_2);
        cr.close_path();
    }
}

#[cfg(not(target_os = "linux"))]
mod platform {
    use super::{Region, Shot};
    use crate::error::{msg, AppResult};

    pub async fn capture(_window: &tauri::WebviewWindow, _regions: Vec<Region>, _viewport_width: f64) -> AppResult<Vec<Shot>> {
        Err(msg("Native capture is implemented for Linux (WebKitGTK) so far"))
    }
}
