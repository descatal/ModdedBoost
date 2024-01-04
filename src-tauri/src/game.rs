use crate::file_handler::get_file_system_entries;
use std::process::Command;

#[tauri::command]
pub fn auto_find_path_and_run_game(fullPath: &str, gameType: &str) {
    //find the game path first
    //if gameType is npjb then npjb00512, else bljs10250
    let game_type_path: &str = match gameType {
        "npjb" => r"npjb00512\usrdir\eboot.bin",
        "bljs" => r"BLJS10250\usrdir\eboot.bin",
        _ => "",
    };
    // find by game_type_path
    let find_eboot_path = get_file_system_entries(fullPath, Some(game_type_path));
    // change to &str
    let eboot_path: &str = match find_eboot_path.first() {
        Some(path) => path,
        None => "",
    };

    // setting rpcs3.exe path => fullPath + rpcs3.exe
    let rpcs3_exe_path_string = format!("{}\\rpcs3.exe", fullPath);
    let rpcs3_exe_path: &str = &rpcs3_exe_path_string;

    // if eboot_path is empty then return
    if eboot_path.is_empty() {
        return;
    }
    //create new command to execute the game
    let _command = Command::new("cmd")
        .args(["/C", rpcs3_exe_path, eboot_path])
        .spawn()
        .expect("failed to execute process");
    
    // exit the app
    std::process::exit(0);
}
