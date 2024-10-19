use ::entity::user_settings::{self, Entity as UserSettings};
use sea_orm::{prelude::*, *};
use tauri::State;

use crate::Db;

use super::models::UpdateUserSettings;

#[tauri::command]
pub async fn get_user_settings(db: State<'_, Db>) -> Result<user_settings::Model, String> {
    UserSettings::find()
        .one(&db.connection)
        .await
        .map_err(|err| err.to_string())
        .and_then(|maybe_model| match maybe_model {
            Some(model) => Ok(model),
            None => Err("User Settings not found".into()),
        })
}

#[tauri::command]
pub async fn update_user_settings(
    settings: UpdateUserSettings,
    db: State<'_, Db>,
) -> Result<user_settings::Model, String> {
    let model = UserSettings::find()
        .one(&db.connection)
        .await
        .map_err(|err| err.to_string())
        .and_then(|maybe_model| match maybe_model {
            Some(model) => Ok(model),
            None => Err("User Settings not found".into()),
        })?;

    let mut existing = model.into_active_model();
    existing.home_page = Set(settings.home_page);
    existing.page_size = Set(settings.page_size);
    existing
        .save(&db.connection)
        .await
        .map_err(|err| err.to_string())
        .and_then(|active_model| match active_model.try_into_model() {
            Ok(model) => Ok(model),
            Err(err) => Err(err.to_string()),
        })
}
