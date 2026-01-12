use std::process::Command;

/// Ping a server and return the latency in milliseconds
///
/// # Arguments
/// * `address` - Server IP address or hostname
/// * `_port` - Server port (kept for interface consistency with PingService, unused in ICMP ping)
/// * `timeout_ms` - Timeout in milliseconds
///
/// # Returns
/// * `Ok(u64)` - Ping time in milliseconds
/// * `Err(String)` - Error message if ping failed
#[tauri::command]
pub fn ping_server(address: String, _port: u16, timeout_ms: u64) -> Result<u64, String> {
    let platform = std::env::consts::OS;
    match platform {
        "windows" => ping_windows(&address, timeout_ms),
        "macos" => ping_macos(&address, timeout_ms),
        "linux" => ping_linux(&address, timeout_ms),
        _ => Err(format!("Unsupported platform: {}", platform)),
    }
}

/// Windows ping using cmd
///
/// Windows ping command: `cmd /C ping -n 1 -w <timeout_ms> <address>`
/// The `-w` parameter on Windows uses milliseconds
fn ping_windows(address: &str, timeout_ms: u64) -> Result<u64, String> {
    let output = Command::new("cmd")
        .args([
            "/C",
            "ping",
            "-n",
            "1",
            "-w",
            &timeout_ms.to_string(),
            address,
        ])
        .output()
        .map_err(|e| format!("Failed to execute ping: {}", e))?;

    if !output.status.success() {
        return Err("Ping command failed".to_string());
    }

    let stdout = String::from_utf8_lossy(&output.stdout);
    parse_windows_ping(&stdout)
}

/// Parse Windows ping output for latency
///
/// Example output:
/// ```text
/// Pinging 192.168.1.1 with 32 bytes of data:
/// Reply from 192.168.1.1: bytes=32 time=23ms TTL=64
/// ```
///
/// Looks for lines containing "time=" and extracts the value before "ms"
fn parse_windows_ping(output: &str) -> Result<u64, String> {
    output
        .lines()
        .find(|line| line.contains("time=") && line.contains("ms"))
        .and_then(|line| {
            line.split("time=")
                .nth(1)
                .and_then(|s| s.split("ms").next())
                .and_then(|s| s.trim().parse::<u64>().ok())
        })
        .ok_or_else(|| {
            // Include a snippet of output for debugging
            let preview = output.lines().take(3).collect::<Vec<_>>().join("\n");
            format!(
                "Could not parse ping time from output. Preview:\n{}",
                preview
            )
        })
}

/// macOS ping
///
/// macOS ping command: `ping -c 1 -t <timeout_sec> <address>`
/// The `-t` parameter on macOS uses seconds
fn ping_macos(address: &str, timeout_ms: u64) -> Result<u64, String> {
    let timeout_sec = (timeout_ms / 1000).max(1);
    let output = Command::new("ping")
        .args(["-c", "1", "-t", &timeout_sec.to_string(), address])
        .output()
        .map_err(|e| format!("Failed to execute ping: {}", e))?;

    if !output.status.success() {
        return Err("Ping command failed".to_string());
    }

    let stdout = String::from_utf8_lossy(&output.stdout);
    parse_unix_ping(&stdout)
}

/// Linux ping
///
/// Linux ping command: `ping -c 1 -W <timeout_sec> <address>`
/// The `-W` parameter on Linux uses seconds
fn ping_linux(address: &str, timeout_ms: u64) -> Result<u64, String> {
    let timeout_sec = (timeout_ms / 1000).max(1);
    let output = Command::new("ping")
        .args(["-c", "1", "-W", &timeout_sec.to_string(), address])
        .output()
        .map_err(|e| format!("Failed to execute ping: {}", e))?;

    if !output.status.success() {
        return Err("Ping command failed".to_string());
    }

    let stdout = String::from_utf8_lossy(&output.stdout);
    parse_unix_ping(&stdout)
}

/// Parse Unix (macOS/Linux) ping output for latency
///
/// Example output (macOS):
/// ```text
/// PING example.com (192.168.1.1): 56 data bytes
/// 64 bytes from 192.168.1.1: icmp_seq=0 ttl=64 time=23.4 ms
/// ```
///
/// Example output (Linux):
/// ```text
/// PING example.com (192.168.1.1) 56(84) bytes of data.
/// 64 bytes from 192.168.1.1: icmp_seq=1 ttl=64 time=23.4 ms
/// ```
///
/// Looks for lines containing "time=" and extracts the numeric value
fn parse_unix_ping(output: &str) -> Result<u64, String> {
    output
        .lines()
        .find(|line| line.contains("time="))
        .and_then(|line| {
            line.split("time=")
                .nth(1)
                .and_then(|s| s.split_whitespace().next())
                .and_then(|s| s.trim().parse::<f64>().ok())
                .map(|ms| ms as u64)
        })
        .ok_or_else(|| {
            // Include a snippet of output for debugging
            let preview = output.lines().take(3).collect::<Vec<_>>().join("\n");
            format!(
                "Could not parse ping time from output. Preview:\n{}",
                preview
            )
        })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_windows_ping() {
        let output = r#"Pinging 192.168.1.1 with 32 bytes of data:
Reply from 192.168.1.1: bytes=32 time=23ms TTL=64
Reply from 192.168.1.1: bytes=32 time=45ms TTL=64"#;
        assert_eq!(parse_windows_ping(output).unwrap(), 23);
    }

    #[test]
    fn test_parse_windows_ping_failure() {
        let output = "Ping request could not find host";
        assert!(parse_windows_ping(output).is_err());
    }

    #[test]
    fn test_parse_unix_ping_macos() {
        let output = r#"PING example.com (192.168.1.1): 56 data bytes
64 bytes from 192.168.1.1: icmp_seq=0 ttl=64 time=23.4 ms"#;
        assert_eq!(parse_unix_ping(output).unwrap(), 23);
    }

    #[test]
    fn test_parse_unix_ping_linux() {
        let output = r#"PING example.com (192.168.1.1) 56(84) bytes of data.
64 bytes from 192.168.1.1: icmp_seq=1 ttl=64 time=45.6 ms"#;
        assert_eq!(parse_unix_ping(output).unwrap(), 45);
    }

    #[test]
    fn test_parse_unix_ping_failure() {
        let output = "ping: cannot resolve example.com: Unknown host";
        assert!(parse_unix_ping(output).is_err());
    }
}
