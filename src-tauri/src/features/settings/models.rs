use diesel::prelude::*;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateUserSettings {
    pub home_page: String,
    pub page_size: i32,
    pub color_scheme: String,
    pub button_variant: String,
    pub gradient_to: String,
    pub gradient_from: String,
    pub gradient_degrees: i32,
}

#[derive(
    Debug, Clone, Identifiable, Queryable, Selectable, AsChangeset, Serialize, Deserialize,
)]
#[diesel(table_name = crate::schema::user_settings)]
#[diesel(check_for_backend(diesel::sqlite::Sqlite))]
#[serde(rename_all = "camelCase")]
pub struct UserSettings {
    pub id: i32,
    pub page_size: i32,
    pub home_page: String,
    pub color_scheme: String,
    pub button_variant: String,
    pub gradient_to: String,
    pub gradient_from: String,
    pub gradient_degrees: i32,
}

impl UserSettings {
    pub fn with_update(self, update: UpdateUserSettings) -> UserSettings {
        UserSettings {
            id: self.id,
            page_size: update.page_size,
            home_page: update.home_page,
            color_scheme: update.color_scheme,
            button_variant: update.button_variant,
            gradient_to: update.gradient_to,
            gradient_from: update.gradient_from,
            gradient_degrees: update.gradient_degrees,
        }
    }
}
