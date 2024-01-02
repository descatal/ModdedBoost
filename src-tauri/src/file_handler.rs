
use walkdir::WalkDir;

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
