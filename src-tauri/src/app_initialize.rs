use tauri::{AppHandle, Manager};
use tauri::path::BaseDirectory;
use dircpy::*;

#[tauri::command]
pub fn initialize_resources(
    app: AppHandle
) -> Result<(), ()> {
    let resources_path = app.path()
        .resolve("resources", BaseDirectory::Resource)
        .expect("failed to resolve resource");

    let appdata_path = app.path()
        .resolve("", BaseDirectory::AppData)
        .expect("failed to resolve resource");

    // Copy recursively, only including certain files:
    CopyBuilder::new(resources_path, appdata_path)
        .overwrite_if_newer(true)
        .overwrite_if_size_differs(true)
        .with_exclude_filter("icon.ico")
        .run()
        .expect("dir copy failed");
    
    Ok(())
}