//use ::entity::user_settings::{self, Entity as UserSettings};
use diesel::prelude::*;
use tauri::State;

use crate::{
    schema::{notification_settings, user_settings},
    Diesel,
};

use super::{models::UpdateUserSettings, NotificationSetting, UserSetting, UserSettingRead};

#[tauri::command]
pub fn get_user_settings(db: State<'_, Diesel>) -> Result<UserSettingRead, String> {
    let mut connection = db.pool.get().map_err(|err| err.to_string())?;
    let settings = user_settings::table
        .select(UserSetting::as_select())
        .first(&mut connection)
        .map_err(|err| err.to_string())?;

    let notification_settings: Vec<NotificationSetting> =
        NotificationSetting::belonging_to(&settings)
            .order_by(notification_settings::name.asc())
            .select(NotificationSetting::as_select())
            .load(&mut connection)
            .map_err(|err| err.to_string())?;

    let mut settings_read: UserSettingRead = settings.into();
    settings_read.notification_settings = notification_settings;
    Ok(settings_read)
}

#[tauri::command]
pub fn update_user_settings(
    settings: UpdateUserSettings,
    db: State<'_, Diesel>,
) -> Result<UserSettingRead, String> {
    let mut connection = db.pool.get().map_err(|err| err.to_string())?;

    let mut found = user_settings::table
        .select(UserSetting::as_select())
        .first(&mut connection)
        .map_err(|err| err.to_string())?;

    let notification_settings = &settings.notification_settings.clone();

    found = found.with_update(settings);

    found
        .save_changes::<UserSetting>(&mut connection)
        .map(|_| ())
        .map_err(|err| err.to_string())?;

    for notification_setting in notification_settings.into_iter() {
        notification_setting
            .save_changes::<NotificationSetting>(&mut connection)
            .map(|_| ())
            .map_err(|err| err.to_string())?;
    }

    let notification_settings: Vec<NotificationSetting> = NotificationSetting::belonging_to(&found)
        .order_by(notification_settings::name.asc())
        .load(&mut connection)
        .map_err(|err| err.to_string())?;

    let mut updated: UserSettingRead = found.into();
    updated.notification_settings = notification_settings;

    Ok(updated)
}
