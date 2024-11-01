//use ::entity::user_settings::{self, Entity as UserSettings};
use diesel::prelude::*;
use tauri::State;

use crate::{schema::user_settings, Diesel};

use super::{models::UpdateUserSettings, UserSettings};

#[tauri::command]
pub fn get_user_settings(db: State<'_, Diesel>) -> Result<UserSettings, String> {
    let mut connection = db.pool.get().map_err(|err| err.to_string())?;
    user_settings::table
        .select(UserSettings::as_select())
        .first(&mut connection)
        .map_err(|err| err.to_string())
}

#[tauri::command]
pub fn update_user_settings(
    settings: UpdateUserSettings,
    db: State<'_, Diesel>,
) -> Result<UserSettings, String> {
    let mut connection = db.pool.get().map_err(|err| err.to_string())?;

    let mut found = user_settings::table
        .select(UserSettings::as_select())
        .first(&mut connection)
        .map_err(|err| err.to_string())?;

    found.home_page = settings.home_page;
    found.page_size = settings.page_size;
    found.color_scheme = settings.color_scheme;

    found
        .save_changes::<UserSettings>(&mut connection)
        .map(|_| ())
        .map_err(|err| err.to_string())?;

    Ok(found)
}
