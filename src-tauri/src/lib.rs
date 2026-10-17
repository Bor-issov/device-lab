mod android;
mod capture;
mod db;
mod error;
mod external;
mod probe;
mod state;

use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .setup(|app| {
            let pool = tauri::async_runtime::block_on(db::connect(app.handle()))?;
            app.manage(state::AppState::new(pool));
            external::setup(app.handle())?;
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            db::settings_load,
            db::settings_save,
            db::settings_remove,
            db::presets_list,
            db::preset_save,
            db::preset_delete,
            db::logs_recent,
            db::logs_append,
            db::logs_clear,
            capture::capture_devices,
            capture::screenshots_list,
            capture::screenshot_delete,
            probe::probe_url,
            external::external_open,
            external::external_close,
            external::external_close_all,
            android::commands::android_status,
            android::commands::android_boot,
            android::commands::android_input,
            android::commands::android_screen_start,
            android::commands::android_screen_stop,
        ])
        .run(tauri::generate_context!())
        .expect("error while running Device Lab");
}
