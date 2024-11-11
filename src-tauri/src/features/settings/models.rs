use serde::{Deserialize, Serialize};
use sqlx::prelude::FromRow;

#[derive(Debug, Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateUserSettings {
    pub home_page: String,
    pub page_size: i64,
    pub color_scheme: String,
    pub button_variant: String,
    pub gradient_to: String,
    pub gradient_from: String,
    pub gradient_degrees: i64,
    pub navbar_opened: bool,
    pub notification_settings: Vec<NotificationSetting>,
}

#[derive(
    Debug, Clone, Serialize, Deserialize,
)]
#[serde(rename_all = "camelCase")]
pub struct UserSetting {
    pub id: i64,
    pub page_size: i64,
    pub home_page: String,
    pub color_scheme: String,
    pub button_variant: String,
    pub gradient_to: String,
    pub gradient_from: String,
    pub gradient_degrees: i64,
    pub navbar_opened: bool,
}

impl UserSetting {
    pub fn with_update(self, update: UpdateUserSettings) -> UserSetting {
        UserSetting {
            id: self.id,
            page_size: update.page_size,
            home_page: update.home_page,
            color_scheme: update.color_scheme,
            button_variant: update.button_variant,
            gradient_to: update.gradient_to,
            gradient_from: update.gradient_from,
            gradient_degrees: update.gradient_degrees,
            navbar_opened: update.navbar_opened,
        }
    }
}

impl From<UserSetting> for UserSettingRead {
    fn from(value: UserSetting) -> Self {
        Self {
            id: value.id,
            page_size: value.page_size,
            home_page: value.home_page,
            color_scheme: value.color_scheme,
            button_variant: value.button_variant,
            gradient_to: value.gradient_to,
            gradient_from: value.gradient_from,
            gradient_degrees: value.gradient_degrees,
            notification_settings: Vec::new(),
            navbar_opened: value.navbar_opened,
        }
    }
}

impl From<UserSettingRead> for UserSetting {
    fn from(value: UserSettingRead) -> Self {
        Self {
            id: value.id,
            page_size: value.page_size,
            home_page: value.home_page,
            color_scheme: value.color_scheme,
            button_variant: value.button_variant,
            gradient_to: value.gradient_to,
            gradient_from: value.gradient_from,
            gradient_degrees: value.gradient_degrees,
            navbar_opened: value.navbar_opened,
        }
    }
}

#[derive(Debug, Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct UserSettingRead {
    pub id: i64,
    pub page_size: i64,
    pub home_page: String,
    pub color_scheme: String,
    pub button_variant: String,
    pub gradient_to: String,
    pub gradient_from: String,
    pub gradient_degrees: i64,
    pub navbar_opened: bool,
    pub notification_settings: Vec<NotificationSetting>,
}

#[derive(
    Debug,
    Clone,
    Serialize,
    Deserialize,
    FromRow
)]
#[serde(rename_all = "camelCase")]
pub struct NotificationSetting {
    pub id: i64,
    pub user_setting_id: i64,
    pub name: String,
    pub enabled: bool,
}
