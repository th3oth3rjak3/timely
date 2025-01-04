use anyhow_tauri::{IntoTAResult, TAResult};
use tauri::State;

use crate::Data;

use super::{models::UpdateUserSettings, NotificationSetting, UserSetting, UserSettingRead};

#[tauri::command]
pub async fn get_user_settings(db: State<'_, Data>) -> TAResult<UserSettingRead> {
    let settings = sqlx::query_as!(
        UserSetting,
        r#"
            SELECT *
            FROM user_settings
            LIMIT 1
        "#
    )
    .fetch_one(&db.pool)
    .await
    .into_ta_result()?;

    let notification_settings: Vec<NotificationSetting> = sqlx::query_as!(
        NotificationSetting,
        r#"
            SELECT *
            FROM notification_settings
            WHERE notification_settings.user_setting_id = ?
            ORDER BY notification_settings.name ASC
        "#,
        settings.id
    )
    .fetch_all(&db.pool)
    .await
    .into_ta_result()?;

    let mut settings_read: UserSettingRead = settings.into();
    settings_read.notification_settings = notification_settings;
    Ok(settings_read)
}

#[tauri::command]
pub async fn update_user_settings(
    settings: UpdateUserSettings,
    db: State<'_, Data>,
) -> TAResult<UserSettingRead> {
    let mut found = sqlx::query_as!(UserSetting, "SELECT * FROM user_settings LIMIT 1")
        .fetch_one(&db.pool)
        .await
        .into_ta_result()?;

    let notification_settings = &settings.notification_settings.clone();

    found = found.with_update(settings);

    sqlx::query!(
        r#"
            UPDATE user_settings
            SET page_size = ?,
            home_page = ?,
            color_scheme = ?,
            button_variant = ?,
            gradient_to = ?,
            gradient_from = ?,
            gradient_degrees = ?,
            navbar_opened = ?,
            default_timer = ?
            WHERE id = ?
        "#,
        found.page_size,
        found.home_page,
        found.color_scheme,
        found.button_variant,
        found.gradient_to,
        found.gradient_from,
        found.gradient_degrees,
        found.navbar_opened,
        found.default_timer,
        found.id
    )
    .execute(&db.pool)
    .await
    .map(|_| ())
    .into_ta_result()?;

    for notification_setting in notification_settings.into_iter() {
        sqlx::query!(
            r#"UPDATE notification_settings 
            SET name = ?,
            enabled = ?
            WHERE user_setting_id = ?
            AND id = ?
            "#,
            notification_setting.name,
            notification_setting.enabled,
            found.id,
            notification_setting.id
        )
        .execute(&db.pool)
        .await
        .map(|_| ())
        .into_ta_result()?;
    }

    get_user_settings(db).await
}
