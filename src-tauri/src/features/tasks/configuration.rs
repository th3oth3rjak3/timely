use ::entity::task::{self, Column};
use sea_orm::prelude::*;
use std::collections::HashMap;

use crate::QueryConfiguration;

impl QueryConfiguration for task::Entity {
    fn columns(&self) -> HashMap<String, impl ColumnTrait> {
        let mut columns: HashMap<String, Column> = HashMap::new();
        columns.insert("title".into(), task::Column::Title);
        columns.insert("description".into(), task::Column::Description);
        columns.insert("status".into(), task::Column::Status);
        columns.insert(
            "scheduled_start_date".into(),
            task::Column::ScheduledStartDate,
        );
        columns.insert(
            "scheduled_complete_date".into(),
            task::Column::ScheduledCompleteDate,
        );
        columns.insert("actual_start_date".into(), task::Column::ActualStartDate);
        columns.insert(
            "actual_complete_date".into(),
            task::Column::ActualCompleteDate,
        );
        columns.insert("estimated_duration".into(), task::Column::EstimatedDuration);
        columns.insert("elapsed_duration".into(), task::Column::ElapsedDuration);
        columns
    }
}
