// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::time::Duration;

use tauri::Manager;
use tokio::time::sleep;
use window_vibrancy::apply_blur;

use crate::file_check::{check_file_md5, check_full_boost_game_version, get_file_modified_epoch};
use crate::file_handler::get_file_system_entries;
use crate::game::{auto_find_path_and_run_game, launch_game};
use crate::notify::notify;
use crate::updater::update_tauri;

mod file_handler;
mod notify;
mod file_check;
mod game;
mod updater;

// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
#[tauri::command]
async fn greet() -> String {
    sleep(Duration::from_millis(2000)).await;
    "Hello from Rust!".into()
}

fn main() {
    tauri::Builder::default()
        .setup(|app| {
            let window = app.get_window("main").unwrap();

            // #[cfg(target_os = "macos")]
            // apply_vibrancy(&window, NSVisualEffectMaterial::HudWindow, None, None)
            //     .expect("Unsupported platform! 'apply_vibrancy' is only supported on macOS");
            // 
            // Vibrancy causes lag, disable for now
            // #[cfg(target_os = "windows")]
            // apply_blur(&window, Some((18, 18, 18, 125)))
            //     .expect("Unsupported platform! 'apply_blur' is only supported on Windows");

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            greet,
            notify,
            get_file_system_entries,
            check_full_boost_game_version,
            auto_find_path_and_run_game,
            launch_game,
            update_tauri,
            check_file_md5,
            get_file_modified_epoch
        ])
        .plugin(tauri_plugin_upload::init())
        .plugin(tauri_plugin_store::Builder::default().build())
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
