use serde::{Deserialize, Serialize};
use serde_repr::{Deserialize_repr, Serialize_repr};

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

#[derive(Debug, Clone, Default, Eq, PartialEq, Serialize_repr, Deserialize_repr)]
#[repr(u8)]
pub enum SortDirection {
    #[default]
    Ascending,
    Descending,
}
