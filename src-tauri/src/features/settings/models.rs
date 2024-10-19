use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateUserSettings {
    pub home_page: String,
    pub page_size: i32,
}
