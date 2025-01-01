use jiff::Timestamp;
use serde::{Deserialize, Serialize};

use crate::{FilterOption, Ordering};

use super::Status;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TaskSearchParams {
    pub page: i64,
    pub page_size: i64,
    pub query_string: Option<String>,
    pub statuses: Vec<Status>,
    pub quick_filter: Option<QuickFilter>,
    pub start_by_filter: Option<DateFilter>,
    pub due_by_filter: Option<DateFilter>,
    pub ordering: Ordering,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DateFilter {
    pub start: Option<Timestamp>,
    pub end: Option<Timestamp>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TagFilter {
    pub tags: Vec<String>,
    pub tag_filter: FilterOption,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum QuickFilter {
    Untagged,
    Tagged(TagFilter),
    Planned,
    Unplanned,
    Overdue,
    LateStart,
}
