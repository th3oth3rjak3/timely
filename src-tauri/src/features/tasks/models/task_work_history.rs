use jiff::Timestamp;
use serde::{Deserialize, Serialize};
use sqlx::prelude::FromRow;

use super::UnixTimestamp;


#[derive(Debug, Clone, FromRow, PartialEq)]
pub struct TaskWorkHistory {
    pub id: i64,
    pub task_id: i64,
    pub start_date: UnixTimestamp,
    pub end_date: UnixTimestamp,
}

#[derive(Debug, Clone, PartialEq, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct TaskWorkHistoryRead {
    pub id: i64,
    pub task_id: i64,
    pub start_date: Timestamp,
    pub end_date: Timestamp,
    pub elapsed_duration: i64,
}

#[derive(Debug, Clone, PartialEq, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct NewTaskWorkHistory {
    pub task_id: i64,
    pub start_date: Timestamp,
    pub end_date: Timestamp,
}

#[derive(Debug, Clone, PartialEq, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct EditTaskWorkHistory {
    pub id: i64,
    pub task_id: i64,
    pub start_date: Timestamp,
    pub end_date: Timestamp,
}

impl From<TaskWorkHistory> for TaskWorkHistoryRead {
    fn from(value: TaskWorkHistory) -> Self {
        let delta = value.end_date - value.start_date;

        Self {
            id: value.id,
            task_id: value.task_id,
            start_date: value.start_date.into(),
            end_date: value.end_date.into(),
            elapsed_duration: delta,
        }
    }
}