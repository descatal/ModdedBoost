use tauri::{AppHandle, Window};
use tauri_plugin_shell::process::CommandEvent;
use tauri_plugin_shell::ShellExt;
use std::str;
use tauri::http::status;

pub async fn unpack_psarc(
    app: &AppHandle,
    source_path: &str,
    destination_path: &str,
) -> Result<(), ()>
{
    let sidecar_command = app.shell()
        .sidecar("booststudio")
        .unwrap()
        .args([
            "psarc",
            "unpack",
            "--input",
            &source_path,
            "--output",
            &destination_path
        ]);

    let (mut _rx, mut _child) = sidecar_command
        .spawn()
        .expect("Failed to spawn sidecar");

    tauri::async_runtime::spawn(async move {
        // read events such as stdout
        while let Some(event) = _rx.recv().await {
            if let CommandEvent::Stdout(line) = event {
                let line_str = match str::from_utf8(&line) {
                    Ok(v) => v,
                    Err(e) => panic!("Invalid UTF-8 sequence: {}", e),
                };

                println!("{}", line_str);
            }
        }
    }).await.expect("");

    Ok(())
}

#[tauri::command]
pub async fn pack_psarc_command(
    app_handle: AppHandle,
    source_directory_path: &str,
    output_file_name: &str,
    destination_directory_path: &str,
) -> Result<(), ()> {
    let sidecar_command = app_handle.shell()
        .sidecar("booststudio")
        .unwrap()
        .args([
            "psarc",
            "pack",
            "--input",
            &source_directory_path,
            "--output",
            &destination_directory_path,
            "--file-name",
            &output_file_name
        ]);

    println!("{}", format!("{:?}", sidecar_command).replace("\"", ""));

    let (mut _rx, mut _child) = sidecar_command
        .spawn()
        .expect("Failed to spawn sidecar");

    tauri::async_runtime::spawn(async move {
        // read events such as stdout
        while let Some(event) = _rx.recv().await {
            if let CommandEvent::Stdout(line) = event {
                let line_str = match str::from_utf8(&line) {
                    Ok(v) => v,
                    Err(e) => panic!("Invalid UTF-8 sequence: {}", e),
                };

                println!("{}", line_str);
            }
        }
    }).await.expect("");;

    Ok(())
}
