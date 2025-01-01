use jiff::Timestamp;
use serde::{Deserialize, Serialize};

use super::{OptionalUnixTimestamp, UnixTimestamp};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Comment {
    pub id: i64,
    pub task_id: i64,
    pub message: String,
    pub created: UnixTimestamp,
    pub modified: OptionalUnixTimestamp,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CommentRead {
    pub id: i64,
    pub task_id: i64,
    pub message: String,
    pub created: Timestamp,
    pub modified: Option<Timestamp>,
}

impl From<Comment> for CommentRead {
    fn from(value: Comment) -> Self {
        Self {
            id: value.id,
            task_id: value.task_id,
            message: value.message,
            created: value.created.into(),
            modified: value.modified.into(),
        }
    }
}

/// Required because I don't want the user passing date times.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateComment {
    pub task_id: i64,
    pub message: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NewComment {
    pub task_id: i64,
    pub message: String,
    pub created: UnixTimestamp,
    pub modified: Option<UnixTimestamp>,
}

impl From<CreateComment> for NewComment {
    fn from(value: CreateComment) -> Self {
        NewComment {
            task_id: value.task_id,
            message: value.message,
            created: UnixTimestamp::now(),
            modified: None,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct EditComment {
    pub id: i64,
    pub message: String,
}