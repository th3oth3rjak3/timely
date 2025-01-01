use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TaskTag {
    pub task_id: i64,
    pub tag_id: i64,
}