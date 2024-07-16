use dircpy::*;
use tauri::path::BaseDirectory;
use tauri::{AppHandle, Manager};

#[tauri::command]
pub fn initialize_resources(app: AppHandle) -> Result<(), ()> {
    let resources_path = app
        .path()
        .resolve("resources", BaseDirectory::Resource)
        .expect("failed to resolve resource");
    
    println!("Resource path: {}", &resources_path.display());
    
    let appdata_path = app
        .path()
        .resolve("", BaseDirectory::AppData)
        .expect("failed to resolve resource");

    println!("AppData path: {}", &appdata_path.display());

    if resources_path.exists() && appdata_path.exists() {
        // Copy recursively, only including certain files:
        CopyBuilder::new(resources_path, appdata_path)
            .overwrite(true)
            .with_exclude_filter("icon.ico")
            .run()
            .expect("dir copy failed");
    }
    
    Ok(())
}
