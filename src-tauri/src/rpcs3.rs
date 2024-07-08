use async_process::Command;
use same_file::is_same_file;
use std::path::Path;
use sysinfo::System;
use tauri::utils::platform::current_exe;

use crate::os::{get_os, OS};

// Two ways of checking.
// If the process is running, check if the process's executing path is the same as the path passed in.
// If it is not running, try run the --version command, and see if it fails.
#[tauri::command]
pub async fn validate_rpcs3_executable(full_path: &str) -> Result<bool, ()> {
    let exe_path = current_exe().unwrap();
    let rpcs3_path = Path::new(full_path);

    // Check if rpcs3_path is the same as exe_path
    if (!rpcs3_path.exists() || is_same_file(&rpcs3_path, &exe_path).unwrap_or(false)) {
        return Ok(false);
    }

    let s = System::new_all();
    for process in s.processes_by_name("rpcs3") {
        let exe_path = process.exe().unwrap_or(Path::new(""));
        let is_same_file = is_same_file(rpcs3_path, exe_path).unwrap_or(false);
        return Ok(is_same_file);
    }

    let valid_rpcs3 = match get_os() {
        OS::Windows => match Command::new(full_path).arg("--version").output().await {
            Ok(_) => true,
            Err(_) => false,
        },
        OS::Linux => {
            let chmod_valid = match Command::new("chmod")
                .arg("+x")
                .arg(full_path)
                .output()
                .await
            {
                Ok(_) => true,
                Err(_) => false,
            };

            let rpcs3_valid = match Command::new(full_path).arg("--version").output().await {
                Ok(_) => true,
                Err(_) => false,
            };

            chmod_valid && rpcs3_valid
        }
        OS::Macos => {
            println!("macOS is not supported");
            false
        }
        _ => {
            println!("Unsupported OS type");
            false
        }
    };

    Ok(valid_rpcs3)
}

#[tauri::command]
pub async fn check_rpcs3_running() -> Result<bool, ()> {
    let s = System::new_all();
    for process in s.processes_by_name("rpcs3") {
        return Ok(true);
    }
    Ok(false)
}
