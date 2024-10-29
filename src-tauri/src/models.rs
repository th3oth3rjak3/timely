use serde::{Deserialize, Serialize};
use serde_repr::{Deserialize_repr, Serialize_repr};

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PagedData<T> {
    pub page: i64,
    pub page_size: i64,
    pub total_item_count: i64,
    pub data: Vec<T>,
}

impl<T> PagedData<T> {
    pub fn new(page: i64, page_size: i64, total_item_count: i64, data: Vec<T>) -> Self {
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

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct QueryCondition {
    pub field: String,
    pub operator: Operator,
    pub condition: QueryConditionType,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum QueryConditionType {
    Single(String),
    Multiple(Vec<String>),
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum QueryOperation {
    Condition(QueryCondition),
    Expression(QueryExpression),
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct QueryExpression {
    pub operation_type: String,
    pub operations: Vec<QueryOperation>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Query {
    pub operation_type: String,
    pub expressions: Vec<QueryExpression>,
    pub page: u64,
    pub page_size: u64,
    pub ordering: Ordering,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum Operator {
    StartsWith,
    EndsWith,
    Contains,
    NotContains,
    Like,
    NotLike,
    Equals,
    NotEquals,
    In,
    NotIn,
    GreaterThan,
    GreaterThanOrEqual,
    LessThan,
    LessThanOrEqual,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Ordering {
    pub order_by: String,
    pub sort_direction: SortDirection,
}
