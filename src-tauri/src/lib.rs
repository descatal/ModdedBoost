use tauri::Manager;

use crate::commands::{get_file_metadata_command, get_file_modified_epoch_command, rclone_command, pack_psarc_command};
use crate::downloader::custom_downloader;
use crate::file_check::{check_game_versions, check_directory_exist};
use crate::file_handler::get_file_system_entries;
use crate::game::{auto_find_path_and_run_game, launch_game};
use crate::notify::notify;
use crate::updater::update_tauri;
use crate::rpcs3::{validate_rpcs3_executable, check_rpcs3_running};
use crate::initialize::{initialize, check_initialized};
use window_vibrancy::{apply_blur, apply_vibrancy, NSVisualEffectMaterial};

mod os;
mod notify;
mod game;
mod file_handler;
mod file_check;
mod updater;
mod downloader;
mod rclone;
mod commands;
mod file_metadata;
mod psarc;
mod initialize;
mod rpcs3;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            let window = app.get_window("main").unwrap();
            
            #[cfg(desktop)]
            app.handle().plugin(tauri_plugin_updater::Builder::new().build())?;
            
            // #[cfg(target_os = "macos")]
            // apply_vibrancy(&window, NSVisualEffectMaterial::HudWindow, None, None)
            //     .expect("Unsupported platform! 'apply_vibrancy' is only supported on macOS");
            // 
            // // Vibrancy causes lag, disable for now
            // #[cfg(target_os = "windows")]
            // apply_blur(&window, Some((18, 18, 18, 125)))
            //     .expect("Unsupported platform! 'apply_blur' is only supported on Windows");
            
            Ok(())
        })
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_store::Builder::default().build())
        .plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![
            notify,
            get_file_system_entries,
            check_game_versions,
            check_directory_exist,
            auto_find_path_and_run_game,
            launch_game,
            update_tauri,
            get_file_metadata_command,
            get_file_modified_epoch_command,
            custom_downloader,
            rclone_command,
            check_rpcs3_running,
            validate_rpcs3_executable,
            initialize,
            check_initialized,
            pack_psarc_command
        ])
        .plugin(tauri_plugin_upload::init())
        .plugin(tauri_plugin_store::Builder::default().build())
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
