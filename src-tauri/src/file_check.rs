use std::collections::HashMap;
use std::fs::File;

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

    let npjb_sfo_paths = get_file_system_entries(full_path, Some(r"npjb00512\param.sfo"));
    if let Some(_first_item) = npjb_sfo_paths.first() {
        game_payload.npjb = true;
    }

    let game_yml_paths = get_file_system_entries(full_path, Some(r"games.yml"));
    if let Some(game_yaml_path) = game_yml_paths.first() {
        let game_yaml_path = game_yaml_path.clone();

        let yaml_file = File::open(game_yaml_path).unwrap();
        let yaml_map: HashMap<String, String> = serde_yaml::from_reader(yaml_file).unwrap();

        // Try to check if there's any key with 'BLJS10250'
        if let Some(_value) = yaml_map.get("BLJS10250") {
            game_payload.bljs = true;
        }

        // Try to check if there's any key with 'NPJB00512'
        if let Some(_value) = yaml_map.get("NPJB00512") {
            game_payload.npjb = true;
        }
    }

    Ok(app.emit_all("directory-changed", game_payload).unwrap())
}
