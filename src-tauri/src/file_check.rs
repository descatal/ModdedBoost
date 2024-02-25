use std::collections::HashMap;
use std::fs::File;
use std::path::Path;

use relative_path::RelativePath;
use tauri::Manager;

use crate::file_handler::get_file_system_entries;
use crate::os::{get_os, OS};

#[derive(Clone, serde::Serialize)]
pub struct FullBoostVersions {
    pub bljs: bool,
    pub npjb: bool,
}

#[tauri::command]
pub async fn check_game_versions(
    app: tauri::AppHandle,
    full_path: &str,
) -> Result<FullBoostVersions, ()> {
    let mut fullboost_versions: FullBoostVersions = FullBoostVersions {
        bljs: false,
        npjb: false,
    };

    // Don't need to continue parsing if the specified executable is invalid
    let path: &Path = Path::new(full_path);
    if !path.exists() {
        return Err(())
    } 
    
    let rpcs3_directory = match get_os() {
        OS::Windows => {
            match path.parent() {
                Some(parent_path) => parent_path.to_str().unwrap().to_string(),
                None => return Err(()),
            }
        }
        OS::Linux => { 
            let home_dir = app.path().home_dir().unwrap().as_path().display().to_string();
            let config_rpcs3_relative_path = RelativePath::new(".config/rpcs3");
            let path_buf = config_rpcs3_relative_path.to_path(&home_dir);
            let path_str = path_buf.to_str().unwrap();
            let path_string = path_str.to_string();
            path_string
        },
        OS::Macos => String::from("~/Library/Application Support/rpcs3")
    };

    let dev_hdd0_relative_path = RelativePath::new("dev_hdd0");
    let game_directory_string = dev_hdd0_relative_path.to_path(&rpcs3_directory).display().to_string();
    let game_directory = &game_directory_string;
    
    // Check if NPJB00512 game version (Digital) exist
    // rpcs3 checks all of the param.sfo directories under "dev_hdd0/game", 
    // NPJB00512 is the default folder that the game is installed in
    // TODO: Use https://github.com/hippie68/sfo to read the param.sfo's game metadata instead of checking directory only
    let npjb_relative_path = RelativePath::new("npjb00512/param.sfo");
    let npjb_directory = npjb_relative_path.to_path("").display().to_string();
    let npjb_sfo_paths = get_file_system_entries(game_directory, Some(&npjb_directory));
    if let Some(_first_item) = npjb_sfo_paths.first() {
        fullboost_versions.npjb = true;
    }

    // Check if NPJB00512 game version (Disc) exist
    // For disc version since it might be possible the game was never installed (loaded from disc directly), 
    // BLJS directory under "dev_hdd0/game/" might not exist. 
    // rpcs3 uses games.yml to record down disc games like these.
    let game_yml_paths = get_file_system_entries(&rpcs3_directory, Some(r"games.yml"));
    if let Some(game_yaml_path) = game_yml_paths.first() {
        let game_yaml_path = game_yaml_path.clone();

        let yaml_file = File::open(game_yaml_path).unwrap();
        let yaml_map: HashMap<String, String> = serde_yaml::from_reader(yaml_file).unwrap();

        // Try to check if there's any key with 'BLJS10250'
        if let Some(_value) = yaml_map.get("BLJS10250") {
            fullboost_versions.bljs = true;
        }
    }

    Ok(fullboost_versions)
}

#[tauri::command]
pub async fn check_directory_exist(
    full_path: &str,
) -> Result<(bool), ()> {
    let path: &Path = Path::new(&full_path);
    Ok(path.exists())
}