use chrono::{DateTime, Utc};
use prelude::Expr;
use sea_orm::*;
use serde::{Deserialize, Serialize};
use serde_repr::{Deserialize_repr, Serialize_repr};
use tauri::State;

use crate::{PagedData, Status};
use ::entity::task::{self, Entity as Task};

/// A wrapper around a sqlite connection pool.
pub struct DatabaseWrapper {
    /// The connection pool used to execute SQL queries.
    pub connection: DatabaseConnection,
}

/// Connect to the database.
///
/// ### Returns
/// * A sqlite connection pool used for executing queries.
pub async fn establish_connection() -> Result<DatabaseConnection, DbErr> {
    let env: &str = include_str!("../.env");

    dotenvy::from_read(env.as_bytes()).unwrap();

    let db_url =
        std::env::var("DATABASE_URL").expect("Unable to read DATABASE_URL from environment.");

    Database::connect(ConnectOptions::new(db_url)).await
}

#[derive(Debug, Clone, Default, Eq, PartialEq, Serialize_repr, Deserialize_repr)]
#[repr(u8)]
pub enum SortDirection {
    #[default]
    Ascending,
    Descending,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct TaskSearchParams {
    pub page: u64,
    pub page_size: u64,
    pub query_string: Option<String>,
    pub statuses: Vec<String>,
    pub sort_field: Option<String>,
    pub sort_direction: Option<SortDirection>,
}

/// Search for all tasks which match the search parameters.
///
/// ### Args
/// * state - The database state used to query a connection.
/// * params - The search parameters used to filter/sort the results.
pub async fn search_for_tasks(
    state: State<'_, DatabaseWrapper>,
    params: TaskSearchParams,
) -> Result<PagedData<task::Model>, String> {
    let mut search_expr = Expr::col(task::Column::Status).is_in(params.statuses);

    if let Some(query) = &params.query_string {
        search_expr = search_expr.and(task::Column::Description.contains(query))
    }

    let mut task_query = Task::find().filter(search_expr);

    if let (Some(field), Some(dir)) = (params.sort_field, params.sort_direction) {
        let col = match field.to_lowercase().as_str() {
            "status" => task::Column::Status,
            "description" => task::Column::Description,
            _ => task::Column::ScheduledCompleteDate,
        };

        match dir {
            SortDirection::Ascending => task_query = task_query.order_by_asc(col),
            SortDirection::Descending => task_query = task_query.order_by_desc(col),
        };
    }

    let paginator = task_query.paginate(&state.connection, params.page_size);

    let tasks = paginator
        .fetch_page(params.page - 1)
        .await
        .map_err(|err| err.to_string())?;

    let count = paginator.num_items().await.map_err(|err| err.to_string())?;

    Ok(PagedData::<task::Model> {
        data: tasks,
        page: params.page,
        page_size: params.page_size,
        total_item_count: count,
    })
}

#[derive(Debug, Clone, Default, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct NewTask {
    pub description: String,
    pub status: Status,
    pub scheduled_start_date: Option<DateTime<Utc>>,
    pub scheduled_complete_date: Option<DateTime<Utc>>,
    pub estimated_duration: Option<i32>,
}

pub async fn create_new_task(
    state: State<'_, DatabaseWrapper>,
    new_task: NewTask,
    params: TaskSearchParams,
) -> Result<PagedData<task::Model>, String> {
    let new_task = task::ActiveModel {
        id: ActiveValue::NotSet,
        description: ActiveValue::Set(new_task.description),
        status: ActiveValue::Set(new_task.status.into()),
        scheduled_start_date: ActiveValue::Set(new_task.scheduled_start_date),
        scheduled_complete_date: ActiveValue::Set(new_task.scheduled_complete_date),
        actual_start_date: ActiveValue::Set(None),
        actual_complete_date: ActiveValue::Set(None),
        last_resumed_date: ActiveValue::Set(None),
        estimated_duration: ActiveValue::Set(new_task.estimated_duration),
        elapsed_duration: ActiveValue::Set(0),
    };

    new_task
        .insert(&state.connection)
        .await
        .map_err(|err| err.to_string())?;

    search_for_tasks(state, params)
        .await
        .map_err(|err| err.to_string())
}
