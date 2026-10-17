// Wrappers around adb and the Android emulator. Every call runs the binary directly (no shell),
// and callers validate serials, AVD names and input before anything reaches here.

use std::collections::HashMap;
use std::ffi::OsStr;
use std::path::{Path, PathBuf};
use std::process::Stdio;
use std::time::Duration;

use serde::Serialize;
use tokio::process::Command;

use crate::error::{msg, AppResult};

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Tools {
    pub sdk_path: Option<String>,
    pub adb: Option<String>,
    pub emulator: Option<String>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AvdInfo {
    pub name: String,
    pub display_name: String,
    pub foldable: bool,
    pub device: Option<String>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AdbDevice {
    pub serial: String,
    pub state: String,
    pub model: Option<String>,
    pub emulator: bool,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SdkStatus {
    #[serde(flatten)]
    pub tools: Tools,
    pub avds: Vec<AvdInfo>,
    pub devices: Vec<AdbDevice>,
    pub error: Option<String>,
}

fn charset(value: &str, extra: &[char]) -> bool {
    (1..=64).contains(&value.len()) && value.chars().all(|c| c.is_ascii_alphanumeric() || c == '_' || extra.contains(&c))
}

pub fn valid_serial(value: &str) -> bool {
    charset(value, &['.', ':', '-'])
}

pub fn valid_avd(value: &str) -> bool {
    charset(value, &['.', '-'])
}

fn exe(name: &str) -> String {
    if cfg!(windows) {
        format!("{name}.exe")
    } else {
        name.to_string()
    }
}

fn on_path(bin: &str) -> Option<PathBuf> {
    let paths = std::env::var_os("PATH")?;
    std::env::split_paths(&paths).map(|dir| dir.join(bin)).find(|p| p.is_file())
}

fn env_path(var: &str) -> Option<PathBuf> {
    std::env::var_os(var).filter(|v| !v.is_empty()).map(PathBuf::from)
}

pub fn resolve_tools(home: Option<&Path>) -> Tools {
    let candidates = [
        env_path("ANDROID_HOME"),
        env_path("ANDROID_SDK_ROOT"),
        home.map(|h| h.join("Android").join("Sdk")),
        Some(PathBuf::from("/opt/android-sdk")),
    ];
    let sdk = candidates.into_iter().flatten().find(|p| p.exists());
    let from_sdk = |dir: &str, bin: &str| sdk.as_ref().map(|s| s.join(dir).join(exe(bin))).filter(|p| p.is_file());
    let to_string = |p: PathBuf| p.to_string_lossy().into_owned();

    Tools {
        adb: from_sdk("platform-tools", "adb").or_else(|| on_path(&exe("adb"))).map(to_string),
        emulator: from_sdk("emulator", "emulator").or_else(|| on_path(&exe("emulator"))).map(to_string),
        sdk_path: sdk.map(to_string),
    }
}

/// Runs a binary to completion with a timeout and returns stdout. Non-zero exit is an error.
pub async fn run<I, S>(program: &str, args: I, timeout: Duration) -> AppResult<Vec<u8>>
where
    I: IntoIterator<Item = S>,
    S: AsRef<OsStr>,
{
    let mut cmd = Command::new(program);
    cmd.args(args).stdin(Stdio::null()).kill_on_drop(true);
    let name = Path::new(program).file_name().map(|n| n.to_string_lossy().into_owned()).unwrap_or_default();
    let output = tokio::time::timeout(timeout, cmd.output()).await.map_err(|_| msg(format!("{name} timed out")))??;
    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr).trim().to_string();
        return Err(msg(if stderr.is_empty() { format!("{name} exited with {}", output.status) } else { stderr }));
    }
    Ok(output.stdout)
}

fn avd_home(home: Option<&Path>) -> Option<PathBuf> {
    env_path("ANDROID_AVD_HOME").or_else(|| home.map(|h| h.join(".android").join("avd")))
}

async fn read_avd_config(home: Option<&Path>, name: &str) -> HashMap<String, String> {
    let Some(dir) = avd_home(home) else { return HashMap::new() };
    let Ok(raw) = tokio::fs::read_to_string(dir.join(format!("{name}.avd")).join("config.ini")).await else {
        return HashMap::new();
    };
    raw.lines().filter_map(|line| line.split_once('=')).map(|(k, v)| (k.trim().to_string(), v.trim().to_string())).collect()
}

pub async fn list_avds(emulator: &str, home: Option<&Path>) -> AppResult<Vec<AvdInfo>> {
    let stdout = run(emulator, ["-list-avds"], Duration::from_secs(10)).await?;
    let mut avds = Vec::new();
    for name in String::from_utf8_lossy(&stdout).lines().map(str::trim).filter(|l| valid_avd(l)) {
        let mut cfg = read_avd_config(home, name).await;
        avds.push(AvdInfo {
            name: name.to_string(),
            display_name: cfg.remove("avd.ini.displayname").unwrap_or_else(|| name.replace('_', " ")),
            foldable: cfg.get("hw.sensor.hinge").is_some_and(|v| v == "yes"),
            device: cfg.remove("hw.device.name"),
        });
    }
    Ok(avds)
}

pub async fn list_devices(adb: &str) -> AppResult<Vec<AdbDevice>> {
    let stdout = run(adb, ["devices", "-l"], Duration::from_secs(10)).await?;
    Ok(String::from_utf8_lossy(&stdout)
        .lines()
        .skip(1)
        .filter_map(|line| {
            let mut parts = line.split_whitespace();
            let serial = parts.next()?.to_string();
            let state = parts.next()?.to_string();
            let model = parts.find_map(|p| p.strip_prefix("model:")).map(|m| m.replace('_', " "));
            Some(AdbDevice { emulator: serial.starts_with("emulator-"), serial, state, model })
        })
        .filter(|d| valid_serial(&d.serial))
        .collect())
}

pub async fn status(tools: Tools, home: Option<&Path>) -> SdkStatus {
    let mut status = SdkStatus { tools, avds: Vec::new(), devices: Vec::new(), error: None };
    if let Some(emulator) = status.tools.emulator.clone() {
        match list_avds(&emulator, home).await {
            Ok(avds) => status.avds = avds,
            Err(e) => status.error = Some(e.to_string()),
        }
    }
    if let Some(adb) = status.tools.adb.clone() {
        match list_devices(&adb).await {
            Ok(devices) => status.devices = devices,
            Err(e) => status.error = Some(e.to_string()),
        }
    }
    status
}

/// Starts the emulator headless in its own process group so it outlives the Lab window.
pub fn boot_avd(emulator: &str, avd: &str) -> AppResult<()> {
    let mut cmd = Command::new(emulator);
    cmd.args(["-avd", avd, "-no-window", "-no-audio", "-no-boot-anim"]).stdin(Stdio::null()).stdout(Stdio::null()).stderr(Stdio::null());
    #[cfg(unix)]
    cmd.process_group(0);
    let mut child = cmd.spawn()?;
    // Reap the process when it exits so it never lingers as a zombie.
    tokio::spawn(async move {
        let _ = child.wait().await;
    });
    Ok(())
}

pub async fn screencap(adb: &str, serial: &str) -> AppResult<Vec<u8>> {
    run(adb, ["-s", serial, "exec-out", "screencap", "-p"], Duration::from_secs(10)).await
}

pub async fn adb(adb: &str, serial: &str, args: &[String]) -> AppResult<String> {
    let full = ["-s", serial].into_iter().map(String::from).chain(args.iter().cloned());
    let stdout = run(adb, full, Duration::from_secs(15)).await?;
    Ok(String::from_utf8_lossy(&stdout).trim().to_string())
}

/// `adb shell` joins its arguments into one command line for the device shell, so quote for sh.
pub fn shell_quote(value: &str) -> String {
    format!("'{}'", value.replace('\'', r"'\''"))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn validates_serials_and_avds() {
        assert!(valid_serial("emulator-5554"));
        assert!(valid_serial("192.168.1.4:5555"));
        assert!(!valid_serial("emulator-5554; rm -rf /"));
        assert!(!valid_serial(""));
        assert!(valid_avd("Pixel_Fold"));
        assert!(!valid_avd("../evil"));
    }

    #[test]
    fn quotes_for_sh() {
        assert_eq!(shell_quote("it's"), r"'it'\''s'");
    }
}
