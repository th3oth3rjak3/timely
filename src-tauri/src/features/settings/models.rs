use diesel::prelude::*;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateUserSettings {
    pub home_page: String,
    pub page_size: i32,
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
}

#[derive(Debug, Clone)]
pub enum ColorScheme {
    Cyan,
}
