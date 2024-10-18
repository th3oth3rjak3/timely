use entity::prelude::*;
use entity::*;
use sea_orm::EntityTrait;
use tauri::State;

use crate::Db;

pub async fn get_user_settings(db: State<'_, Db>) -> Result<Option<user_settings::Model>, String> {
    UserSettings::find()
        .one(&db.connection)
        .await
        .map_err(|err| err.to_string())
}
