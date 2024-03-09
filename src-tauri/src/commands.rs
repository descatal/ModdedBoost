use tauri::AppHandle;

use crate::file_metadata::{clear_cached_metadata, FileMetadata, get_cached_metadata, get_file_modified_epoch};
use crate::psarc::pack_psarc;
use crate::rclone::rclone;

#[tauri::command]
pub async fn rclone_command(
    app: AppHandle,
    command: &str,
    remote: &str,
    remote_path: &str,
    target_path: &str,
    additional_flags: &str,
    exclude_items: Vec<String>,
    listener_id: &str,
) -> Result<bool, ()> {
    rclone(&app, command, remote, remote_path, target_path, additional_flags, exclude_items, listener_id).await
}

#[tauri::command]
pub async fn get_file_metadata_command(
    app: AppHandle,
    file_paths: Vec<String>,
) -> Result<(Vec<FileMetadata>), ()> {
    get_cached_metadata(&app, file_paths).await
}

#[tauri::command]
pub async fn clear_cached_metadata_command(
    app: AppHandle,
) -> Result<(), ()> {
    clear_cached_metadata(&app).await
}

#[tauri::command]
pub async fn get_file_modified_epoch_command(
    full_path: &str,
) -> Result<(u64), ()> {
    get_file_modified_epoch(full_path).await
}

#[tauri::command]
pub async fn pack_psarc_command(
    app: AppHandle,
    source_directory_path: &str,
    output_file_name: &str,
    destination_directory_path: &str
) -> Result<(), ()> {
    pack_psarc(&app, source_directory_path, output_file_name, destination_directory_path).await
}