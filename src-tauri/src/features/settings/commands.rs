use entity::user_settings;
use tauri::State;

use crate::Db;

use super::data_access;

#[tauri::command]
pub async fn get_user_settings(db: State<'_, Db>) -> Result<Option<user_settings::Model>, String> {
    data_access::get_user_settings(db).await
}
