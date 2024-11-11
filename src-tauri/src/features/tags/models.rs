use serde::{Deserialize, Serialize};
use sqlx::prelude::FromRow;

use crate::Ordering;

#[derive(
    Debug,
    Clone,
    Serialize,
    Deserialize,
    PartialEq,
    FromRow
)]
pub struct Tag {
    pub id: i64,
    pub value: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TagSearchParams {
    pub page: i64,
    pub page_size: i64,
    pub query_string: Option<String>,
    pub ordering: Ordering,
}
