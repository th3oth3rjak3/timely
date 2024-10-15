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

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PagedData<T> {
    pub page: u64,
    pub page_size: u64,
    pub total_item_count: u64,
    pub data: Vec<T>,
}

impl<T> PagedData<T> {
    pub fn new(page: u64, page_size: u64, total_item_count: u64, data: Vec<T>) -> Self {
        Self {
            page,
            page_size,
            total_item_count,
            data,
        }
    }
}
