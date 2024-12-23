use crate::{features::tags::Tag, FilterOption, Ordering};
use chrono::{DateTime, NaiveDateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::prelude::FromRow;
use timely_macros::EnumFromString;

/// The status of a task.
#[derive(Default, Debug, PartialEq, Eq, Clone, sqlx::Type, EnumFromString)]
#[sqlx(type_name = "TEXT")]
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
}

impl Serialize for Status {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        let value = match *self {
            Status::Todo => "To Do",
            Status::Doing => "Doing",
            Status::Done => "Done",
            Status::Cancelled => "Cancelled",
            Status::Paused => "Paused",
        };

        serializer.serialize_str(value)
    }
}

impl<'de> Deserialize<'de> for Status {
    fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
    where
        D: serde::Deserializer<'de>,
    {
        let s = String::deserialize(deserializer)?;

        match s.as_str() {
            "To Do" => Ok(Status::Todo),
            "Doing" => Ok(Status::Doing),
            "Done" => Ok(Status::Done),
            "Paused" => Ok(Status::Paused),
            "Cancelled" => Ok(Status::Cancelled),
            _ => Err(serde::de::Error::unknown_variant(
                &s,
                &["To Do", "Doing", "Done", "Paused", "Cancelled"],
            )),
        }
    }
}

#[derive(Debug, Clone, Deserialize, Serialize, PartialEq, FromRow)]
pub struct Task {
    pub id: i64,
    pub title: String,
    pub description: String,
    pub status: Status,
    pub scheduled_start_date: Option<NaiveDateTime>,
    pub scheduled_complete_date: Option<NaiveDateTime>,
    pub last_resumed_date: Option<NaiveDateTime>,
    pub estimated_duration: Option<i64>,
}

#[derive(Debug, Clone, FromRow, PartialEq)]

pub struct TaskWorkHistory {
    pub id: i64,
    pub task_id: i64,
    pub start_date: NaiveDateTime,
    pub end_date: NaiveDateTime,
}

#[derive(Debug, Clone, PartialEq, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct TaskWorkHistoryRead {
    pub id: i64,
    pub task_id: i64,
    pub start_date: DateTime<Utc>,
    pub end_date: DateTime<Utc>,
    pub elapsed_duration: i64,
}

#[derive(Debug, Clone, PartialEq, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct NewTaskWorkHistory {
    pub task_id: i64,
    pub start_date: DateTime<Utc>,
    pub end_date: DateTime<Utc>,
}

#[derive(Debug, Clone, PartialEq, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct EditTaskWorkHistory {
    pub id: i64,
    pub task_id: i64,
    pub start_date: DateTime<Utc>,
    pub end_date: DateTime<Utc>,
}

impl From<TaskWorkHistory> for TaskWorkHistoryRead {
    fn from(value: TaskWorkHistory) -> Self {
        let delta = value.end_date - value.start_date;

        Self {
            id: value.id,
            task_id: value.task_id,
            start_date: value.start_date.and_utc(),
            end_date: value.end_date.and_utc(),
            elapsed_duration: delta.num_seconds(),
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
    pub scheduled_start_date: Option<DateTime<Utc>>,
    pub scheduled_complete_date: Option<DateTime<Utc>>,
    pub actual_start_date: Option<DateTime<Utc>>,
    pub actual_complete_date: Option<DateTime<Utc>>,
    pub last_resumed_date: Option<DateTime<Utc>>,
    pub estimated_duration: Option<i64>,
    pub elapsed_duration: i64,
    pub comments: Vec<CommentRead>,
    pub tags: Vec<Tag>,
    pub work_history: Vec<TaskWorkHistoryRead>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct EditComment {
    pub id: i64,
    pub message: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct NewComment {
    pub task_id: i64,
    pub message: String,
    pub created: NaiveDateTime,
    pub modified: Option<NaiveDateTime>,
}

/// Required because I don't want the user passing date times.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateComment {
    pub task_id: i64,
    pub message: String,
}

impl From<CreateComment> for NewComment {
    fn from(value: CreateComment) -> Self {
        NewComment {
            task_id: value.task_id,
            message: value.message,
            created: Utc::now().naive_utc(),
            modified: None,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Comment {
    pub id: i64,
    pub task_id: i64,
    pub message: String,
    pub created: NaiveDateTime,
    pub modified: Option<NaiveDateTime>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CommentRead {
    pub id: i64,
    pub task_id: i64,
    pub message: String,
    pub created: DateTime<Utc>,
    pub modified: Option<DateTime<Utc>>,
}

impl From<Comment> for CommentRead {
    fn from(value: Comment) -> Self {
        Self {
            id: value.id,
            task_id: value.task_id,
            message: value.message,
            created: value.created.and_utc(),
            modified: value.modified.map(|v| v.and_utc()),
        }
    }
}

impl From<CommentRead> for Comment {
    fn from(value: CommentRead) -> Self {
        Self {
            id: value.id,
            task_id: value.task_id,
            message: value.message,
            created: value.created.naive_utc(),
            modified: value.modified.map(|dt| dt.naive_utc()),
        }
    }
}

#[derive(Debug, Clone, Default, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct EditTask {
    pub id: i64,
    pub title: String,
    pub description: String,
    pub status: Status,
    pub scheduled_start_date: Option<DateTime<Utc>>,
    pub scheduled_complete_date: Option<DateTime<Utc>>,
    pub estimated_duration: Option<i64>,
}

/// Model for the database which requires NaiveDateTime
#[derive(Debug, Clone, Default, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct NewTask {
    pub title: String,
    pub description: String,
    pub status: Status,
    pub scheduled_start_date: Option<NaiveDateTime>,
    pub scheduled_complete_date: Option<NaiveDateTime>,
    pub estimated_duration: Option<i64>,
}

/// Required to serialize the datetime as Local
#[derive(Debug, Clone, Default, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateTask {
    pub title: String,
    pub description: String,
    pub status: Status,
    pub scheduled_start_date: Option<DateTime<Utc>>,
    pub scheduled_complete_date: Option<DateTime<Utc>>,
    pub estimated_duration: Option<i64>,
    pub tags: Option<Vec<Tag>>,
}

impl From<CreateTask> for NewTask {
    fn from(value: CreateTask) -> Self {
        NewTask {
            title: value.title,
            description: value.description,
            status: value.status,
            scheduled_start_date: value.scheduled_start_date.map(|dt| dt.naive_utc()),
            scheduled_complete_date: value.scheduled_complete_date.map(|dt| dt.naive_utc()),
            estimated_duration: value.estimated_duration,
        }
    }
}

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
    pub start: Option<DateTime<Utc>>,
    pub end: Option<DateTime<Utc>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TaskTag {
    pub task_id: i64,
    pub tag_id: i64,
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
