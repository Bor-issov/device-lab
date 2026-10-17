use std::path::PathBuf;
use std::sync::atomic::Ordering;
use std::time::Duration;

use serde::Deserialize;
use tauri::ipc::{Channel, Response};
use tauri::{AppHandle, Manager, State};

use super::sdk::{self, shell_quote, valid_avd, valid_serial, SdkStatus, Tools};
use crate::error::{msg, AppResult};
use crate::state::AppState;

fn home(app: &AppHandle) -> Option<PathBuf> {
    app.path().home_dir().ok()
}

fn tools(app: &AppHandle) -> Tools {
    sdk::resolve_tools(home(app).as_deref())
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum AndroidKey {
    Back,
    Home,
    Recents,
    Power,
    VolumeUp,
    VolumeDown,
}

impl AndroidKey {
    fn code(&self) -> &'static str {
        match self {
            Self::Back => "4",
            Self::Home => "3",
            Self::Recents => "187",
            Self::Power => "26",
            Self::VolumeUp => "24",
            Self::VolumeDown => "25",
        }
    }
}

#[derive(Debug, Deserialize)]
#[serde(tag = "action", rename_all = "camelCase")]
pub enum AndroidInput {
    Tap { x: f64, y: f64 },
    Swipe { x: f64, y: f64, x2: f64, y2: f64, duration: Option<f64> },
    Key { key: AndroidKey },
    Text { text: String },
    Rotate,
    Fold,
    Unfold,
    Kill,
    OpenUrl { url: String },
}

fn coord(n: f64) -> Option<String> {
    n.is_finite().then(|| (n.round().clamp(0.0, 100_000.0) as i64).to_string())
}

/// Same shape as the old HTTP route: exp/exps/http(s) with a conservative character set.
fn valid_open_url(url: &str) -> bool {
    ["exp://", "exps://", "http://", "https://"]
        .iter()
        .find_map(|prefix| url.strip_prefix(prefix))
        .is_some_and(|rest| (1..=256).contains(&rest.len()) && rest.chars().all(|c| c.is_ascii_alphanumeric() || "_.:/?&=%-".contains(c)))
}

fn to_args(input: AndroidInput) -> Option<Vec<String>> {
    let strs = |items: &[&str]| items.iter().map(|s| s.to_string()).collect::<Vec<_>>();
    Some(match input {
        AndroidInput::Tap { x, y } => {
            let mut args = strs(&["shell", "input", "tap"]);
            args.extend([coord(x)?, coord(y)?]);
            args
        }
        AndroidInput::Swipe { x, y, x2, y2, duration } => {
            let mut args = strs(&["shell", "input", "swipe"]);
            args.extend([coord(x)?, coord(y)?, coord(x2)?, coord(y2)?]);
            args.push(coord(duration.unwrap_or(250.0).min(5000.0)).unwrap_or_else(|| "250".into()));
            args
        }
        AndroidInput::Key { key } => strs(&["shell", "input", "keyevent", key.code()]),
        AndroidInput::Text { text } => {
            let len = text.chars().count();
            if len == 0 || len > 500 {
                return None;
            }
            let mut args = strs(&["shell", "input", "text"]);
            args.push(shell_quote(&text.replace(' ', "%s")));
            args
        }
        AndroidInput::Rotate => strs(&["emu", "rotate"]),
        AndroidInput::Fold => strs(&["emu", "fold"]),
        AndroidInput::Unfold => strs(&["emu", "unfold"]),
        AndroidInput::Kill => strs(&["emu", "kill"]),
        AndroidInput::OpenUrl { url } => {
            if !valid_open_url(&url) {
                return None;
            }
            let mut args = strs(&["shell", "am", "start", "-a", "android.intent.action.VIEW", "-d"]);
            args.push(shell_quote(&url));
            args
        }
    })
}

#[tauri::command]
pub async fn android_status(app: AppHandle) -> SdkStatus {
    let home = home(&app);
    sdk::status(sdk::resolve_tools(home.as_deref()), home.as_deref()).await
}

#[tauri::command]
pub async fn android_boot(app: AppHandle, avd: String) -> AppResult<()> {
    if !valid_avd(&avd) {
        return Err(msg("Invalid AVD name"));
    }
    let emulator = tools(&app).emulator.ok_or_else(|| msg("Android emulator binary not found"))?;
    sdk::boot_avd(&emulator, &avd)
}

#[tauri::command]
pub async fn android_input(app: AppHandle, serial: String, input: AndroidInput) -> AppResult<String> {
    if !valid_serial(&serial) {
        return Err(msg("Invalid serial"));
    }
    let args = to_args(input).ok_or_else(|| msg("Invalid action"))?;
    let adb = tools(&app).adb.ok_or_else(|| msg("adb not found"))?;
    sdk::adb(&adb, &serial, &args).await
}

/// Streams PNG frames from `adb exec-out screencap` as fast as the device produces them.
/// Frames go over a Tauri channel as raw bytes; returns an id for `android_screen_stop`.
#[tauri::command]
pub async fn android_screen_start(
    app: AppHandle,
    state: State<'_, AppState>,
    serial: String,
    on_frame: Channel<Response>,
) -> AppResult<u32> {
    if !valid_serial(&serial) {
        return Err(msg("Invalid serial"));
    }
    let adb = tools(&app).adb.ok_or_else(|| msg("adb not found"))?;
    let id = state.next_stream.fetch_add(1, Ordering::Relaxed);

    let task = tokio::spawn(async move {
        loop {
            match sdk::screencap(&adb, &serial).await {
                Ok(png) => {
                    // The webview dropped the channel (reload or closed panel): stop.
                    if on_frame.send(Response::new(png)).is_err() {
                        break;
                    }
                }
                Err(_) => tokio::time::sleep(Duration::from_secs(1)).await,
            }
        }
        if let Ok(mut streams) = app.state::<AppState>().streams.lock() {
            streams.remove(&id);
        }
    });

    state.streams.lock().map_err(|_| msg("Stream registry poisoned"))?.insert(id, task.abort_handle());
    Ok(id)
}

#[tauri::command]
pub fn android_screen_stop(state: State<'_, AppState>, id: u32) {
    if let Some(handle) = state.streams.lock().ok().and_then(|mut s| s.remove(&id)) {
        handle.abort();
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn open_url_allowlist() {
        assert!(valid_open_url("exp://10.0.2.2:8081"));
        assert!(valid_open_url("https://example.com/path?a=1"));
        assert!(!valid_open_url("javascript:alert(1)"));
        assert!(!valid_open_url("exp://host/$(reboot)"));
        assert!(!valid_open_url("exp://"));
    }

    #[test]
    fn text_is_quoted_and_bounded() {
        let args = to_args(AndroidInput::Text { text: "it's me".into() }).unwrap();
        assert_eq!(args.last().unwrap(), r"'it'\''s%sme'");
        assert!(to_args(AndroidInput::Text { text: String::new() }).is_none());
        assert!(to_args(AndroidInput::Text { text: "x".repeat(501) }).is_none());
    }

    #[test]
    fn coords_reject_non_finite() {
        assert!(to_args(AndroidInput::Tap { x: f64::NAN, y: 1.0 }).is_none());
        assert_eq!(to_args(AndroidInput::Tap { x: -5.0, y: 10.4 }).unwrap()[3..], ["0".to_string(), "10".to_string()]);
    }
}
