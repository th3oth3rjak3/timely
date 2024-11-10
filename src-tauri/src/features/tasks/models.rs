use chrono::{DateTime, NaiveDateTime, Utc};
use diesel::{
    deserialize::FromSqlRow,
    expression::AsExpression,
    prelude::*,
    sql_types::{self},
};
use serde::{Deserialize, Serialize};
use timely_macros::SqliteTextEnum;

use crate::{features::tags::Tag, Ordering};

/// The status of a task.
#[derive(
    Serialize,
    Deserialize,
    Default,
    Debug,
    PartialEq,
    Eq,
    Clone,
    AsExpression,
    SqliteTextEnum,
    FromSqlRow,
)]
#[diesel(sql_type = sql_types::Text)]
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

#[derive(
    Debug,
    Clone,
    Identifiable,
    Queryable,
    Selectable,
    AsChangeset,
    Deserialize,
    Serialize,
    PartialEq,
)]
#[diesel(table_name = crate::schema::tasks)]
#[diesel(check_for_backend(diesel::sqlite::Sqlite))]
#[diesel(treat_none_as_null = true)]
#[diesel(primary_key(id))]
pub struct Task {
    pub id: i32,
    pub title: String,
    pub description: String,
    pub status: Status,
    pub scheduled_start_date: Option<NaiveDateTime>,
    pub scheduled_complete_date: Option<NaiveDateTime>,
    pub actual_start_date: Option<NaiveDateTime>,
    pub actual_complete_date: Option<NaiveDateTime>,
    pub last_resumed_date: Option<NaiveDateTime>,
    pub estimated_duration: Option<i32>,
    pub elapsed_duration: i32,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct TaskRead {
    pub id: i32,
    pub title: String,
    pub description: String,
    pub status: Status,
    pub scheduled_start_date: Option<DateTime<Utc>>,
    pub scheduled_complete_date: Option<DateTime<Utc>>,
    pub actual_start_date: Option<DateTime<Utc>>,
    pub actual_complete_date: Option<DateTime<Utc>>,
    pub last_resumed_date: Option<DateTime<Utc>>,
    pub estimated_duration: Option<i32>,
    pub elapsed_duration: i32,
    pub comments: Vec<CommentRead>,
    pub tags: Vec<Tag>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct EditComment {
    pub id: i32,
    pub message: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, Insertable)]
#[diesel(table_name = crate::schema::comments)]
#[serde(rename_all = "camelCase")]
pub struct NewComment {
    pub task_id: i32,
    pub message: String,
    pub created: NaiveDateTime,
    pub modified: Option<NaiveDateTime>,
}

/// Required because I don't want the user passing date times.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateComment {
    pub task_id: i32,
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

#[derive(
    Debug,
    Clone,
    Queryable,
    Selectable,
    Identifiable,
    AsChangeset,
    Serialize,
    Deserialize,
    Associations,
)]
#[diesel(table_name = crate::schema::comments)]
#[diesel(check_for_backend(diesel::sqlite::Sqlite))]
#[diesel(belongs_to(Task))]
#[diesel(primary_key(id))]
#[diesel(treat_none_as_null = true)]
#[serde(rename_all = "camelCase")]
pub struct Comment {
    pub id: i32,
    pub task_id: i32,
    pub message: String,
    pub created: NaiveDateTime,
    pub modified: Option<NaiveDateTime>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CommentRead {
    pub id: i32,
    pub task_id: i32,
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
    pub id: i32,
    pub title: String,
    pub description: String,
    pub status: Status,
    pub scheduled_start_date: Option<DateTime<Utc>>,
    pub scheduled_complete_date: Option<DateTime<Utc>>,
    pub actual_start_date: Option<DateTime<Utc>>,
    pub actual_complete_date: Option<DateTime<Utc>>,
    pub estimated_duration: Option<i32>,
    pub elapsed_duration: Option<i32>,
}

/// Model for the database which requires NaiveDateTime
#[derive(Debug, Clone, Default, Deserialize, Serialize, Insertable)]
#[diesel(table_name = crate::schema::tasks)]
#[diesel(check_for_backend(diesel::sqlite::Sqlite))]
#[diesel(treat_none_as_null = true)]
#[serde(rename_all = "camelCase")]
pub struct NewTask {
    pub title: String,
    pub description: String,
    pub status: Status,
    pub scheduled_start_date: Option<NaiveDateTime>,
    pub scheduled_complete_date: Option<NaiveDateTime>,
    pub estimated_duration: Option<i32>,
    pub elapsed_duration: i32,
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
    pub estimated_duration: Option<i32>,
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
            elapsed_duration: 0,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TaskSearchParams {
    pub page: i64,
    pub page_size: i64,
    pub query_string: Option<String>,
    pub statuses: Vec<String>,
    pub tags: Option<Vec<String>>,
    pub ordering: Ordering,
    pub start_by_filter: Option<DateFilter>,
    pub due_by_filter: Option<DateFilter>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DateFilter {
    pub before: Option<DateTime<Utc>>,
    pub after: Option<DateTime<Utc>>
}

#[derive(
    Associations,
    Identifiable,
    Insertable,
    Selectable,
    Queryable,
    Debug,
    Clone,
    Serialize,
    Deserialize,
)]
#[diesel(belongs_to(Task))]
#[diesel(belongs_to(Tag))]
#[diesel(table_name = crate::schema::task_tags)]
#[diesel(check_for_backend(diesel::sqlite::Sqlite))]
#[diesel(primary_key(task_id, tag_id))]
pub struct TaskTag {
    pub task_id: i32,
    pub tag_id: i32,
}
