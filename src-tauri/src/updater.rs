use tauri::Manager;

#[tauri::command]
pub async fn update_tauri(app: tauri::AppHandle) -> Result<(), ()> {
    Ok(app.emit("tauri://update", "").unwrap())
}
