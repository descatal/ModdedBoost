use std::collections::HashMap;
use std::fs::{create_dir_all, metadata};
use std::path::Path;

use relative_path::RelativePath;
use tauri::AppHandle;

use crate::file_handler::get_file_system_entries;
use crate::psarc::unpack_psarc;
use crate::rpcs3::validate_rpcs3_executable;

#[tauri::command]
pub async fn check_initialized(
    full_path: &str
) -> Result<bool, ()> {
    let rpcs3_path = Path::new(full_path);
    let rpcs3_directory = rpcs3_path.parent().unwrap();
    let cache_path_str = rpcs3_directory.join(".moddedboost").join("psarc");

    let required_folders = vec![
        "patch_01_00",
        "patch_02_00",
        "patch_03_00",
        "patch_04_00",
        "patch_05_00",
        "patch_06_00",
    ];

    for expected_folder in required_folders {
        let relative_path = RelativePath::new(expected_folder);
        let expected_path = relative_path.to_path(&cache_path_str);
        
        if !Path::exists(&expected_path) {
            return Ok(false)
        }
    }

    Ok(true)
}

#[tauri::command]
pub async fn initialize(
    app: AppHandle,
    rpcs3_executable: &str,
) -> Result<(), ()> {
    let valid_rpcs3 = validate_rpcs3_executable(rpcs3_executable).await.unwrap();

    if !valid_rpcs3 {
        return Err(());
    }

    let rpcs3_path = Path::new(rpcs3_executable);
    let rpcs3_directory = rpcs3_path.parent().unwrap();

    // Path to the cache folder is the ".moddedboost" folder.
    let cache_path_str = rpcs3_directory.join(".moddedboost").join("psarc");
    let cache_path = Path::new(&cache_path_str);

    create_dir_all(cache_path).unwrap();

    // Check if there are existing game versions in the game, if yes automatically do migrations.
    let dev_hdd0_relative_path = RelativePath::new("dev_hdd0");
    let game_directory_string = dev_hdd0_relative_path.to_path(&rpcs3_directory).display().to_string();
    let game_directory = &game_directory_string;

    let files_to_extract = vec![
        "patch_01_00.psarc",
        "patch_02_00.psarc",
        "patch_03_00.psarc",
        "patch_04_00.psarc",
        "patch_05_00.psarc",
        "patch_06_00.psarc",
    ];

    let npjb_files: Vec<String> = get_extract_files(game_directory, "npjb00512/usrdir", files_to_extract.clone());
    let bljs_files: Vec<String> = get_extract_files(game_directory, "bljs10250/usrdir", files_to_extract.clone());

    let map: HashMap<String, String> = npjb_files.into_iter().filter_map(|s| {
        Path::new(&s).file_name().and_then(|os_str| os_str.to_str()).map(|file_name| (file_name.to_string(), s.clone()))
    }).collect();

    // Create a new vector to store the results of the inner join
    let mut patches_path: HashMap<String, String> = map.clone();

    // Iterate over the second vector and check any item exists in the HashMap
    for bljs_path in &bljs_files {
        let file_name = Path::new(&bljs_path).file_name().and_then(|os_str| os_str.to_str()).map(|file_name| file_name.to_string()).unwrap();
        if map.contains_key(&file_name) {
            let npjb_path = map.get(&file_name).unwrap();
            let npjb_metadata = metadata(&npjb_path).unwrap();
            let bljs_metadata = metadata(&bljs_path).unwrap();

            let npjb_last_modified = npjb_metadata.modified().unwrap();
            let bljs_last_modified = bljs_metadata.modified().unwrap();

            if npjb_last_modified > bljs_last_modified {
                patches_path.insert(file_name, npjb_path.clone());
            } else {
                patches_path.insert(file_name, bljs_path.clone());
            }
        }
    }

    for extract_file_name in files_to_extract {
        let extract_file_name_path = Path::new(extract_file_name);
        let extract_file_stem = extract_file_name_path.file_stem().unwrap().to_str().unwrap();
        let extract_directory = cache_path.join(extract_file_stem).to_str().unwrap().to_owned();
        create_dir_all(&extract_directory.clone()).unwrap();
        
        if patches_path.contains_key(extract_file_name) {
            let path = patches_path.get(extract_file_name).unwrap();
            unpack_psarc(&app, &path, &extract_directory.clone()).await.unwrap();
        } 
    }

    Ok(())
}

fn get_extract_files(
    game_directory: &str,
    relative_path_str: &str,
    filter_file_names: Vec<&str>,
) -> Vec<String> {
    let mut extract_file_paths: Vec<String> = Vec::new();

    let relative_path = RelativePath::new(relative_path_str);
    let directory = relative_path.to_path("").display().to_string();
    let file_paths = get_file_system_entries(game_directory, Some(&directory));

    for file_paths in file_paths.iter() {
        let file_path = Path::new(file_paths);
        let path_file_name = file_path.file_name();

        // Convert to a &str and check if it exists in the target_file_names vector
        if let Some(file_name) = path_file_name {
            let file_name_str = file_name.to_str().unwrap_or("");
            if filter_file_names.contains(&file_name_str) {

                // let path_string = file_paths.to_string();
                extract_file_paths.push(file_paths.to_string())
            }
        }
    }

    extract_file_paths.clone()
}