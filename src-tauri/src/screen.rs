// Physical size of the monitor showing a window, so zoom 100% can draw devices at their real size.

/// CSS pixels per millimetre on the monitor that shows `window`, or None when the system does not
/// report a believable physical size (the frontend then assumes 96 px per inch).
#[tauri::command]
pub async fn screen_px_per_mm(window: tauri::WebviewWindow) -> Option<f64> {
    platform::px_per_mm(window).await.filter(|v| (2.0..=12.0).contains(v))
}

#[cfg(target_os = "linux")]
mod platform {
    use gtk::prelude::*;

    // GDK reports the monitor in logical pixels (what a CSS px is at zoom 1) and in millimetres
    // from EDID. GTK only runs on the main thread.
    pub async fn px_per_mm(window: tauri::WebviewWindow) -> Option<f64> {
        let (tx, rx) = tokio::sync::oneshot::channel();
        let target = window.clone();
        window
            .run_on_main_thread(move || {
                let measured = (|| {
                    let gdk_window = target.gtk_window().ok()?.window()?;
                    let monitor = gdk_window.display().monitor_at_window(&gdk_window)?;
                    let mm = monitor.width_mm();
                    (mm > 0).then(|| f64::from(monitor.geometry().width()) / f64::from(mm))
                })();
                let _ = tx.send(measured);
            })
            .ok()?;
        rx.await.ok().flatten()
    }
}

#[cfg(not(target_os = "linux"))]
mod platform {
    // Tauri exposes no physical monitor size on Windows or macOS.
    pub async fn px_per_mm(_window: tauri::WebviewWindow) -> Option<f64> {
        None
    }
}
