use chrono::{DateTime, NaiveDateTime, Utc};
use diesel::{
    backend::Backend,
    deserialize::{FromSql, FromSqlRow},
    expression::AsExpression,
    prelude::*,
    serialize::{self, ToSql},
    sql_types::Text,
    sqlite::Sqlite,
};
use serde::{Deserialize, Serialize};

use crate::Ordering;

/// The status of a task.
#[derive(
    Serialize, Deserialize, Default, Debug, PartialEq, Eq, Clone, AsExpression, FromSqlRow,
)]
#[diesel(sql_type = diesel::sql_types::Text)]
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

impl ToSql<Text, Sqlite> for Status {
    fn to_sql<'b>(&'b self, out: &mut serialize::Output<'b, '_, Sqlite>) -> serialize::Result {
        let output: String = self.to_owned().into();
        out.set_value(output);
        Ok(serialize::IsNull::No)
    }
}

impl FromSql<Text, Sqlite> for Status {
    fn from_sql(bytes: <Sqlite as Backend>::RawValue<'_>) -> diesel::deserialize::Result<Self> {
        let value: Result<Status, String> =
            <String as FromSql<Text, Sqlite>>::from_sql(bytes).map(|value| value.try_into())?;
        value.map_err(|err| err.into())
    }
}

impl TryFrom<String> for Status {
    type Error = String;

    fn try_from(value: String) -> Result<Self, Self::Error> {
        match value.as_str() {
            "Todo" => Ok(Status::Todo),
            "Doing" => Ok(Status::Doing),
            "Done" => Ok(Status::Done),
            "Paused" => Ok(Status::Paused),
            "Cancelled" => Ok(Status::Cancelled),
            unsupported => Err(format!("Unsupported Status: {unsupported}")),
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
    pub scheduled_start_date: Option<NaiveDateTime>,
    pub scheduled_complete_date: Option<NaiveDateTime>,
    pub actual_start_date: Option<NaiveDateTime>,
    pub actual_complete_date: Option<NaiveDateTime>,
    pub last_resumed_date: Option<NaiveDateTime>,
    pub estimated_duration: Option<i32>,
    pub elapsed_duration: i32,
    pub comments: Vec<Comment>,
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

/// Required to serialize the datetime as UTC
#[derive(Debug, Clone, Default, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateTask {
    pub title: String,
    pub description: String,
    pub status: Status,
    pub scheduled_start_date: Option<DateTime<Utc>>,
    pub scheduled_complete_date: Option<DateTime<Utc>>,
    pub estimated_duration: Option<i32>,
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
}

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
