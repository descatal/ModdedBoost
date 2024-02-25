use std::ffi::OsStr;
use std::path::Path;
use walkdir::WalkDir;
use crate::os::OS;

#[tauri::command]
pub fn get_file_system_entries(full_path: &str, file_path_filter: Option<&str>) -> Vec<String> {
    let mut matched_files = Vec::new();

    for file in WalkDir::new(full_path)
        .into_iter()
        .filter_map(|file| file.ok())
        .filter(|file| match &file_path_filter {
            Some(filter) => file.path().to_string_lossy().to_lowercase().contains(filter),
            None => true,
        })
    {
        matched_files.push(file.path().to_string_lossy().into_owned());
    }

    matched_files
}

pub fn get_rpcs3_os(full_path: &str) -> Result<OS, ()>
{
    let path: &Path = Path::new(full_path);
    if !path.exists() {
        return Err(());
    }

    let file_ext: Option<&str> = path.extension().and_then(OsStr::to_str);
    let rpcs3_os = match file_ext {
        Some(extension) => {
            let extension = extension.to_lowercase();
            match extension.as_str() {
                "exe" => OS::Windows,
                "appimage" => OS::Linux,
                "app" => OS::Macos,
                _ => return Err(())
            }
        }
        None => return Err(()),
    };

    Ok(rpcs3_os)
}
