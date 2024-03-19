use tauri::AppHandle;
use reqwest;

#[tauri::command]
pub async fn get_is_success(
    app: AppHandle,
    remote: &str,
) -> Result<bool, ()> {
    let response = reqwest::get(remote).await;

    return match response {
        Ok(response) => {
            if response.status().is_success() {
                Ok(true)
            } else {
                Ok(false)
            }
        }
        Err(_) => Ok(false)
    };
}