use entity::user_settings;
use tauri::State;

use crate::Db;

use super::data_access;

#[tauri::command]
pub async fn get_user_settings(db: State<'_, Db>) -> Result<user_settings::Model, String> {
    data_access::get_user_settings(db).await
}

#[tauri::command]
pub async fn update_user_settings(
    settings: data_access::UpdateUserSettings,
    db: State<'_, Db>,
) -> Result<user_settings::Model, String> {
    data_access::update_user_settings(settings, db).await
}
