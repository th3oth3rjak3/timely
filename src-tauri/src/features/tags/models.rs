use diesel::prelude::*;
use serde::{Deserialize, Serialize};

use crate::Ordering;

#[derive(
    Debug,
    Clone,
    Queryable,
    Selectable,
    AsChangeset,
    Identifiable,
    Serialize,
    Deserialize,
    PartialEq,
)]
#[diesel(table_name = crate::schema::tags)]
#[diesel(check_for_backend(diesel::sqlite::Sqlite))]
pub struct Tag {
    pub id: i32,
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
