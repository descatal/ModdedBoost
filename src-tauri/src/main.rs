mod file_handler;
mod notify;
mod file_check;
mod game;

use std::time::Duration;
use tokio::time::sleep;
use crate::notify::notify;
use crate::file_handler::get_file_system_entries;
use crate::file_check::check_full_boost_game_version;
use crate::game::{auto_find_path_and_run_game, launch_game};

// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#[cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
#[tauri::command]
async fn greet() -> String {
    sleep(Duration::from_millis(2000)).await;
    "Hello from Rust!".into()
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            greet,
            notify,
            get_file_system_entries,
            check_full_boost_game_version,
            auto_find_path_and_run_game,
            launch_game])
        .plugin(tauri_plugin_store::Builder::default().build())
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
