use jiff::Timestamp;
use serde::{Deserialize, Serialize};
use sqlx::prelude::FromRow;

use crate::features::tags::Tag;

use super::{CommentRead, OptionalDurationInSeconds, OptionalUnixTimestamp, Status, TaskWorkHistoryRead};

#[derive(Debug, Clone, Deserialize, Serialize, PartialEq, FromRow)]
pub struct Task {
    pub id: i64,
    pub title: String,
    pub description: String,
    pub status: Status,
    pub scheduled_start_date: OptionalUnixTimestamp,
    pub scheduled_complete_date: OptionalUnixTimestamp,
    pub estimated_duration: OptionalDurationInSeconds,
}

/// Model for the database which requires NaiveDateTime
#[derive(Debug, Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct NewTask {
    pub title: String,
    pub description: String,
    pub status: Status,
    pub scheduled_start_date: OptionalUnixTimestamp,
    pub scheduled_complete_date: OptionalUnixTimestamp,
    pub estimated_duration: Option<i64>,
}

/// Required to serialize the datetime as Local
#[derive(Debug, Clone, Default, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateTask {
    pub title: String,
    pub description: String,
    pub status: Status,
    pub scheduled_start_date: Option<Timestamp>,
    pub scheduled_complete_date: Option<Timestamp>,
    pub estimated_duration: Option<i64>,
    pub tags: Option<Vec<Tag>>,
}

impl From<CreateTask> for NewTask {
    fn from(value: CreateTask) -> Self {
        NewTask {
            title: value.title,
            description: value.description,
            status: value.status,
            scheduled_start_date: value.scheduled_start_date.into(),
            scheduled_complete_date: value.scheduled_complete_date.into(),
            estimated_duration: value.estimated_duration,
        }
    }
}

#[derive(Debug, Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct TaskRead {
    pub id: i64,
    pub title: String,
    pub description: String,
    pub status: Status,
    pub scheduled_start_date: Option<Timestamp>,
    pub scheduled_complete_date: Option<Timestamp>,
    pub actual_start_date: Option<Timestamp>,
    pub actual_complete_date: Option<Timestamp>,
    pub estimated_duration: Option<i64>,
    pub elapsed_duration: i64,
    pub comments: Vec<CommentRead>,
    pub tags: Vec<Tag>,
    pub work_history: Vec<TaskWorkHistoryRead>,
}

#[derive(Debug, Clone, Default, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct EditTask {
    pub id: i64,
    pub title: String,
    pub description: String,
    pub status: Status,
    pub scheduled_start_date: Option<Timestamp>,
    pub scheduled_complete_date: Option<Timestamp>,
    pub estimated_duration: Option<i64>,
}