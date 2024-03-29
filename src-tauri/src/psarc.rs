use std::process::Stdio;
use tauri::{AppHandle, Manager};
use tauri::path::BaseDirectory;
use tokio::io::{AsyncBufReadExt, BufReader};
use tokio::process::Command;
use crate::os::{get_os, OS};

pub async fn unpack_psarc(
    app: &AppHandle,
    source_path: &str,
    destination_path: &str
) -> Result<(), ()> {
    let rclone_name = match get_os() {
        OS::Windows => "BoostStudio.Console-win-x86.exe",
        OS::Linux => panic!("Not supported"),
        OS::Macos => panic!("Not supported")
    };
    
    let booststudio_path = app.path()
        .resolve(format!("tools/booststudio/{}", rclone_name), BaseDirectory::AppData)
        .expect("failed to resolve resource");

    let mut cmd = Command::new(booststudio_path);
    cmd.arg("psarc").arg("unpack").arg("--input").arg(format!("{}", source_path)).arg("--output").arg(format!("{}", destination_path));
    cmd.stdout(Stdio::piped());

    let mut child = cmd.spawn()
        .expect("failed to spawn command");

    let stdout = child.stdout.take()
        .expect("child did not have a handle to stdout");

    let mut reader = BufReader::new(stdout).lines();
    
    while let Some(line) = reader.next_line().await.expect("") {
        let trimmed_line = line.trim();
        println!("{}", trimmed_line)
    }
    
    Ok(())
}

pub async fn pack_psarc(
    app: &AppHandle,
    source_directory_path: &str,
    output_file_name: &str,
    destination_directory_path: &str
) -> Result<(), ()> {
    let rclone_name = match get_os() {
        OS::Windows => "BoostStudio.Console-win-x86.exe",
        OS::Linux => panic!("Not supported"),
        OS::Macos => panic!("Not supported")
    };

    let booststudio_path = app.path()
        .resolve(format!("tools/booststudio/{}", rclone_name), BaseDirectory::AppData)
        .expect("failed to resolve resource");

    let input_arg = format!("--input {}", source_directory_path);
    let output_arg = format!("--output {}", destination_directory_path);
    let filename_arg = format!("--filename {}", output_file_name);

    let mut cmd = Command::new(booststudio_path);
    cmd.arg("psarc")
        .arg("pack")
        .arg("--input")
        .arg(format!("{}", source_directory_path))
        .arg("--output")
        .arg(format!("{}", destination_directory_path))
        .arg("--filename")
        .arg(format!("{}", output_file_name));
    cmd.stdout(Stdio::piped());

    println!("{}", format!("{:?}", cmd).replace("\"", ""));

    let mut child = cmd.spawn()
        .expect("failed to spawn command");

    let stdout = child.stdout.take()
        .expect("child did not have a handle to stdout");

    let mut reader = BufReader::new(stdout).lines();

    // Ensure the child process is spawned in the runtime, so it can
    // make progress on its own while we await for any output.
    tokio::spawn(async move {
        let status = child.wait().await
            .expect("child process encountered an error");

        println!("child status was: {}", status);
    });
    
    while let Some(line) = reader.next_line().await.expect("") {
        let trimmed_line = line.trim();
        println!("{}", trimmed_line)
    }

    Ok(())
}