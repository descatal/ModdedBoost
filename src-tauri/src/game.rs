use std::process::Command;

#[tauri::command]
pub fn auto_find_path_and_run_game(full_path: &str) {
    println!(
        "full_path: {} {}",
        full_path, r"L:\o_rpcs3\dev_hdd0\game\NPJB00512\USRDIR\EBOOT.BIN",
    );

    //create new command
    let mut command = Command::new("cmd")
        .args([
            "/C",
            full_path,
            r"L:\o_rpcs3\dev_hdd0\game\NPJB00512\USRDIR\EBOOT.BIN",
        ])
        .output()
        .expect("failed to execute process");
}
