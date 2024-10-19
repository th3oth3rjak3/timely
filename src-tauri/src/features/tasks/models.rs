use entity::comment;
use sea_orm::prelude::DateTimeUtc;
use serde::{Deserialize, Serialize};

/// The status of a task.
#[derive(Serialize, Deserialize, Default, Debug, PartialEq, Eq, Clone)]
pub enum Status {
    /// When a task has been cancelled and will not be worked.
    Cancelled,
    /// A task that is in progress.
    Doing,
    /// A completed task.
    Done,
    /// A task that has more work to be done, but is currently paused.
    Paused,
    /// A task that has not yet been started.
    #[default]
    Todo,
    /// Any other task status.
    Unknown,
}

impl From<String> for Status {
    fn from(value: String) -> Self {
        match value.as_str() {
            "Todo" => Status::Todo,
            "Doing" => Status::Doing,
            "Done" => Status::Done,
            "Paused" => Status::Paused,
            "Cancelled" => Status::Cancelled,
            _ => Status::Unknown,
        }
    }
}

impl From<Status> for String {
    fn from(value: Status) -> Self {
        match value {
            Status::Cancelled => "Cancelled".to_string(),
            Status::Doing => "Doing".to_string(),
            Status::Done => "Done".to_string(),
            Status::Paused => "Paused".to_string(),
            Status::Todo => "Todo".to_string(),
            Status::Unknown => "Unknown".to_string(),
        }
    }
}

#[derive(Debug, Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct TaskRead {
    pub id: i64,
    pub description: String,
    pub status: Status,
    pub scheduled_start_date: Option<DateTimeUtc>,
    pub scheduled_complete_date: Option<DateTimeUtc>,
    pub actual_start_date: Option<DateTimeUtc>,
    pub actual_complete_date: Option<DateTimeUtc>,
    pub last_resumed_date: Option<DateTimeUtc>,
    pub estimated_duration: Option<i64>,
    pub elapsed_duration: i64,
    pub comments: Vec<comment::Model>,
}
