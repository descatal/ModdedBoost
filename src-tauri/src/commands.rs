use tauri::AppHandle;
use crate::file_metadata::{get_file_modified_epoch, get_cached_metadata, FileMetadata};
use crate::rclone::rclone;

#[tauri::command]
pub async fn rclone_command(
    app: AppHandle,
    command: &str,
    remote: &str,
    remote_path: &str,
    cache_path: &str,
    additional_flags: &str,
    exclude_items: Vec<String>,
    listener_id: &str,
) -> Result<(), ()> {
    let _ = rclone(&app, command, remote, remote_path, cache_path, additional_flags, exclude_items, listener_id).await;
    Ok(())
}

#[tauri::command]
pub async fn get_file_metadata_command(
    app: AppHandle,
    file_paths: Vec<String>,
) -> Result<(Vec<FileMetadata>), ()> {
    get_cached_metadata(&app, file_paths).await
}


#[tauri::command]
pub async fn get_file_modified_epoch_command(
    full_path: &str,
) -> Result<(u64), ()> {
    get_file_modified_epoch(full_path).await
}
