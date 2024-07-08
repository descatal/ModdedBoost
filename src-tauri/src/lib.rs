use tauri::Manager;

use crate::app_initialize::initialize_resources;
use crate::commands::{
    clear_cached_metadata_command, get_file_metadata_command, get_file_modified_epoch_command,
    pack_psarc_command, rclone_command,
};
use crate::downloader::custom_downloader;
use crate::file_check::{check_game_versions, check_path_exist};
use crate::file_handler::get_file_system_entries;
use crate::game::{auto_find_path_and_run_game, launch_game};
use crate::initialize::{check_initialized, initialize};
use crate::notify::notify;
use crate::patches::{activate_patch, check_patch_activated};
use crate::request::get_is_success;
use crate::rpcs3::{check_rpcs3_running, validate_rpcs3_executable};
use crate::updater::update_tauri;
use window_vibrancy::{apply_blur, apply_vibrancy, NSVisualEffectMaterial};

mod app_initialize;
mod commands;
mod downloader;
mod file_check;
mod file_handler;
mod file_metadata;
mod game;
mod initialize;
mod notify;
mod os;
mod patches;
mod psarc;
mod rclone;
mod request;
mod rpcs3;
mod updater;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_os::init())
        .setup(|app| {
            let window = app.get_window("main").unwrap();

            #[cfg(desktop)]
            app.handle()
                .plugin(tauri_plugin_updater::Builder::new().build())?;

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
            check_path_exist,
            auto_find_path_and_run_game,
            launch_game,
            update_tauri,
            get_file_metadata_command,
            get_file_modified_epoch_command,
            clear_cached_metadata_command,
            custom_downloader,
            rclone_command,
            check_rpcs3_running,
            validate_rpcs3_executable,
            initialize,
            check_initialized,
            pack_psarc_command,
            initialize_resources,
            check_patch_activated,
            activate_patch,
            get_is_success
        ])
        .plugin(tauri_plugin_upload::init())
        .plugin(tauri_plugin_store::Builder::default().build())
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
