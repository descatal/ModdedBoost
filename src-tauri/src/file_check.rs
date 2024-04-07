use std::collections::HashMap;
use std::fs::File;
use std::path::Path;

use relative_path::RelativePath;
use tauri::Manager;

use crate::file_handler::get_file_system_entries;
use crate::os::{get_os, OS};

#[derive(Clone, serde::Serialize)]
pub struct FullBoostVersions {
    pub BLJS10250: bool,
    pub NPJB00512: bool,
}

#[tauri::command]
pub async fn check_game_versions(
    app: tauri::AppHandle,
    full_path: &str,
) -> Result<FullBoostVersions, ()> {
    let mut fullboost_versions: FullBoostVersions = FullBoostVersions {
        BLJS10250: false,
        NPJB00512: false,
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

    let dev_hdd0_relative_path = RelativePath::new("dev_hdd0/game");
    let game_directory_string = dev_hdd0_relative_path.to_path(&rpcs3_directory).display().to_string();
    let game_directory = &game_directory_string;
    
    // Check if NPJB00512 game version (Digital) exist
    // rpcs3 checks all of the param.sfo directories under "dev_hdd0/game", 
    // NPJB00512 is the default folder that the game is installed in
    // TODO: Use https://github.com/hippie68/sfo to read the param.sfo's game metadata instead of checking directory only
    let npjb_param_sfo_relative_path = RelativePath::new("npjb00512/param.sfo");
    let npjb_eboot_relative_path = RelativePath::new("npjb00512/usrdir/eboot.bin");
    let npjb_sfo_directory = npjb_param_sfo_relative_path.to_path("").display().to_string();
    let npjb_eboot_relative_path = npjb_eboot_relative_path.to_path("").display().to_string();
    let npjb_sfo_paths = get_file_system_entries(game_directory, Some(&npjb_sfo_directory));
    let npjb_eboot_paths = get_file_system_entries(game_directory, Some(&npjb_eboot_relative_path));
    let mut sfo_exists = false;
    let mut eboot_exists = false;
    if let Some(_first_item) = npjb_sfo_paths.first() {
        sfo_exists = true;
    }
    if let Some(_first_item) = npjb_eboot_paths.first() {
        eboot_exists = true;
    }

    if sfo_exists && eboot_exists {
        fullboost_versions.NPJB00512 = true;
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
            let bljs_game_path = Path::new(_value);
            let bljs_param_sfo_path = bljs_game_path.join("PS3_GAME").join("PARAM.sfo");
            if Path::exists(&bljs_param_sfo_path) {
                fullboost_versions.BLJS10250 = true;
            }
        }
    }

    Ok(fullboost_versions)
}

#[tauri::command]
pub async fn check_path_exist(
    full_path: &str,
) -> Result<(bool), ()> {
    let path: &Path = Path::new(&full_path);
    Ok(path.exists())
}