use std::time::Duration;

use tokio::net::TcpStream;

/// True when something accepts a TCP connection at the URL's host and port.
/// Replaces the browser's no-cors fetch, which the app CSP would block.
#[tauri::command]
pub async fn probe_url(url: String) -> bool {
    let Ok(parsed) = tauri::Url::parse(&url) else { return false };
    if !matches!(parsed.scheme(), "http" | "https") {
        return false;
    }
    let (Some(host), Some(port)) = (parsed.host_str(), parsed.port_or_known_default()) else { return false };
    let host = host.trim_start_matches('[').trim_end_matches(']');
    matches!(tokio::time::timeout(Duration::from_millis(2500), TcpStream::connect((host, port))).await, Ok(Ok(_)))
}
