use crate::file_handler::get_file_system_entries;
use std::process::Command;

#[tauri::command]
pub fn auto_find_path_and_run_game(full_path: &str, game_type: &str) {
    //find the game path first
    //if gameType is npjb then npjb00512, else bljs10250
    let game_type_path: &str = match game_type {
        "npjb" => r"npjb00512\usrdir\eboot.bin",
        "bljs" => r"BLJS10250\usrdir\eboot.bin",
        _ => "",
    };
    // find by game_type_path
    // 1. we don't need the rpcs3.exe in path, so we need remove it
    let find_eboot_path_string: &String = &full_path.replace("rpcs3.exe", "");

    // eg. C:\rpcs3\rpcs3.exe => C:\rpcs3
    let find_eboot_path = get_file_system_entries(find_eboot_path_string, Some(game_type_path));
    // change to &str
    let eboot_path: &str = match find_eboot_path.first() {
        Some(path) => path,
        None => "",
    };

    println!("{}", full_path);

    // if eboot_path is empty then return
    if eboot_path.is_empty() {
        return;
    }
    //create new command to execute the game
    let _command = Command::new("cmd")
        .args(["/C", full_path, eboot_path])
        .spawn()
        .expect("failed to execute process");

    // exit the app
    std::process::exit(0);
}
