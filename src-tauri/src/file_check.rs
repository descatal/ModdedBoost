use std::collections::HashMap;
use std::ffi::OsStr;
use std::fs::File;
use std::path::Path;
use relative_path::RelativePath;

use tauri::Manager;

use crate::file_handler::get_file_system_entries;

#[derive(Clone, serde::Serialize)]
struct FullBoostVersions {
    bljs: bool,
    npjb: bool,
}

#[tauri::command]
pub async fn check_full_boost_game_version(
    app: tauri::AppHandle,
    full_path: &str,
) -> Result<(), ()> {
    let mut game_payload: FullBoostVersions = FullBoostVersions {
        bljs: false,
        npjb: false,
    };
    
    // Don't need to continue parsing if the specified executable is invalid
    let path: &Path = Path::new(full_path);
    if !path.exists() {
        return Err(());
    }
    
    let file_ext: Option<&str> = path.extension().and_then(OsStr::to_str);
    let mut rpcs3_directory = match file_ext {
        Some(extension) => {
            let extension = extension.to_lowercase();
            match extension.as_str() {
                "exe" => {
                    match path.parent() {
                        Some(parent_path) => parent_path.to_str().unwrap().to_string(),
                        None => String::from(""),
                    }
                }
                "appimage" => String::from("~/.config/rpcs3/"),
                "app" => String::from("~/Library/Application Support/rpcs3/"),
                _ => String::from(""),
            }
        }
        None => String::from(""),
    };

    let relative_path = RelativePath::new("/dev_hdd0/");
    let game_directory_string = relative_path.to_path(&rpcs3_directory).display().to_string();
    let game_directory = &game_directory_string;
    
    println!("{}", game_directory);
    
    // Check if NPJB00512 game version (Digital) exist
    // rpcs3 checks all of the param.sfo directories under "dev_hdd0/game", 
    // NPJB00512 is the default folder that the game is installed in
    // TODO: Use https://github.com/hippie68/sfo to read the param.sfo's game metadata instead of checking directory only
    let npjb_sfo_paths = get_file_system_entries(game_directory, Some(r"npjb00512\param.sfo"));
    if let Some(_first_item) = npjb_sfo_paths.first() {
        game_payload.npjb = true;
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
            game_payload.bljs = true;
        }
    }

    Ok(app.emit_all("rpcs3-games", game_payload).unwrap())
}
