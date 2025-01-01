use serde::{Deserialize, Serialize};
use sqlx::prelude::Type;

#[derive(Debug, Clone, Deserialize, Serialize, PartialEq, Type)]
#[sqlx(transparent)]
pub struct DurationInSeconds(i64);

impl From<i64> for DurationInSeconds {
    fn from(value: i64) -> Self {
        DurationInSeconds(value)
    }
}

impl From<DurationInSeconds> for i64 {
    fn from(value: DurationInSeconds) -> Self {
        value.0
    }
}

#[derive(Debug, Clone, Type, PartialEq, Deserialize, Serialize)]
#[sqlx(transparent)]
pub struct OptionalDurationInSeconds(Option<i64>);

impl OptionalDurationInSeconds {
    pub fn none() -> Self {
        OptionalDurationInSeconds(None)
    }
}

impl From<Option<i64>> for OptionalDurationInSeconds {
    fn from(value: Option<i64>) -> Self {
        OptionalDurationInSeconds(value)
    }
}

impl From<OptionalDurationInSeconds> for Option<i64> {
    fn from(value: OptionalDurationInSeconds) -> Self {
        value.0
    }
}