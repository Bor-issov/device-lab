// Frames moved outside the Lab into their own borderless windows on the desktop. The main window
// stays the source of truth: an external window renders one frame from the state the Lab pushes
// over events and sends every action (rotate, reload, bring back, close) back to it.

use serde::Serialize;
use tauri::{AppHandle, Emitter, Manager, WebviewUrl, WebviewWindowBuilder, WindowEvent};

use crate::db::is_id;
use crate::error::{msg, AppResult};

const PREFIX: &str = "external-";

#[derive(Clone, Serialize)]
struct Action {
    id: String,
    action: &'static str,
}

#[tauri::command]
pub async fn external_open(app: AppHandle, id: String, title: String, width: f64, height: f64) -> AppResult<()> {
    if !is_id(&id) {
        return Err(msg("Invalid device id"));
    }
    let valid = |n: f64| n.is_finite() && (100.0..=10_000.0).contains(&n);
    if !valid(width) || !valid(height) {
        return Err(msg("Invalid window size"));
    }
    let label = format!("{PREFIX}{id}");
    if let Some(window) = app.get_webview_window(&label) {
        window.set_focus()?;
        return Ok(());
    }

    let builder = WebviewWindowBuilder::new(&app, &label, WebviewUrl::App(format!("external/{id}").into()))
        .title(title.chars().take(80).collect::<String>())
        .inner_size(width, height)
        .resizable(false)
        .decorations(false)
        .shadow(false);
    // Transparent windows need macOS private API; there the window keeps the Lab background.
    #[cfg(not(target_os = "macos"))]
    let builder = builder.transparent(true);
    #[cfg(target_os = "macos")]
    let builder = builder.background_color(tauri::window::Color(0x44, 0x42, 0x3e, 0xff));
    let window = builder.build()?;

    // Closed by the window manager (Alt+F4 and friends): the frame goes back into the Lab.
    let handle = app.clone();
    let closed = id.clone();
    window.on_window_event(move |event| {
        if let WindowEvent::Destroyed = event {
            let _ = handle.emit_to("main", "external:closed", &closed);
        }
    });

    let handle = app.clone();
    platform::replace_frame_item(&window, "Bring back", move |_, _| {
        let _ = handle.emit_to("main", "external:action", Action { id: id.clone(), action: "dock" });
    })?;
    Ok(())
}

#[tauri::command]
pub async fn external_close(app: AppHandle, id: String) -> AppResult<()> {
    if let Some(window) = app.get_webview_window(&format!("{PREFIX}{id}")) {
        window.destroy()?;
    }
    Ok(())
}

#[tauri::command]
pub async fn external_close_all(app: AppHandle) -> AppResult<()> {
    close_all(&app);
    Ok(())
}

fn close_all(app: &AppHandle) {
    for (label, window) in app.webview_windows() {
        if label.starts_with(PREFIX) {
            let _ = window.destroy();
        }
    }
}

/// Main window: right click inside a frame offers "Move outside", and closing the Lab closes
/// every external window with it.
pub fn setup(app: &AppHandle) -> tauri::Result<()> {
    let Some(main) = app.get_webview_window("main") else { return Ok(()) };
    let handle = app.clone();
    main.on_window_event(move |event| {
        if let WindowEvent::Destroyed = event {
            close_all(&handle);
        }
    });
    let handle = app.clone();
    platform::replace_frame_item(&main, "Move outside", move |x, y| {
        let _ = handle.emit_to("main", "external:menu", (x, y));
    })
}

#[cfg(target_os = "linux")]
mod platform {
    use gtk::gio;
    use webkit2gtk::{ContextMenuAction, ContextMenuExt, ContextMenuItem, ContextMenuItemExt, WebViewExt};

    /// Swaps WebKitGTK's "Open Frame in New Window" for our own item. `on_pick` gets the pointer
    /// position in CSS pixels of the window that was right clicked.
    pub fn replace_frame_item(
        window: &tauri::WebviewWindow,
        label: &'static str,
        on_pick: impl Fn(f64, f64) + Clone + Send + 'static,
    ) -> tauri::Result<()> {
        window.with_webview(move |webview| {
            webview.inner().connect_context_menu(move |_, menu, event, _| {
                let found = menu.items().into_iter().enumerate().find(|(_, item)| item.stock_action() == ContextMenuAction::OpenFrameInNewWindow);
                let Some((position, item)) = found else { return false };
                menu.remove(&item);
                // Keyboard-opened menus carry no pointer position, so there is no frame to pick.
                if let Some((x, y)) = event.coords() {
                    let action = gio::SimpleAction::new("device-lab-frame", None);
                    let on_pick = on_pick.clone();
                    action.connect_activate(move |_, _| on_pick(x, y));
                    menu.insert(&ContextMenuItem::from_gaction(&action, label, None), position as i32);
                }
                false
            });
        })
    }
}

#[cfg(not(target_os = "linux"))]
mod platform {
    // WebView2 and WKWebView show no "open frame" item; the frame caption button covers them.
    pub fn replace_frame_item(
        _window: &tauri::WebviewWindow,
        _label: &'static str,
        _on_pick: impl Fn(f64, f64) + Clone + Send + 'static,
    ) -> tauri::Result<()> {
        Ok(())
    }
}
