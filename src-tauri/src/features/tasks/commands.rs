use ::entity::{comment, prelude::*, tags, task, task_tags};
use chrono::Utc;
use migration::Expr;
use sea_orm::{prelude::*, *};
use tauri::State;

use crate::{Db, PagedData, SortDirection};

use super::*;

#[tauri::command]
pub async fn create_task(new_task: NewTask, db: State<'_, Db>) -> Result<(), String> {
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
        .insert(&db.connection)
        .await
        .map(|_| ())
        .map_err(|err| err.to_string())
}

/// Search for all tasks which match the search parameters.
///
/// ### Args
/// * state - The database state used to query a connection.
/// * params - The search parameters used to filter/sort the results.
#[tauri::command]
pub async fn get_tasks(
    params: TaskSearchParams,
    db: State<'_, Db>,
) -> Result<PagedData<TaskRead>, String> {
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

    let paginator = task_query.paginate(&db.connection, params.page_size);

    let count = paginator.num_items().await.map_err(|err| err.to_string())?;

    let tasks: Vec<task::Model> = paginator
        .fetch_page(params.page - 1)
        .await
        .map(|tasks| {
            tasks
                .into_iter()
                .map(|mut task| {
                    if let Some(last_resumed) = task.last_resumed_date {
                        let diff = Utc::now() - last_resumed;
                        task.elapsed_duration += diff.num_seconds();
                    };
                    task
                })
                .collect()
        })
        .map_err(|err| err.to_string())?;

    let comments = tasks
        .load_many(Comment, &db.connection)
        .await
        .map_err(|err| err.to_string())?;

    let tags = tasks
        .load_many_to_many(tags::Entity, task_tags::Entity, &db.connection)
        .await
        .map_err(|err| err.to_string())?;

    let tasks_with_tags: Vec<(task::Model, Vec<tags::Model>)> =
        tasks.into_iter().zip(tags.into_iter()).collect();

    let tasks_with_comments: Vec<TaskRead> = tasks_with_tags
        .into_iter()
        .zip(comments.into_iter())
        .map(|((task, tags), mut comments)| {
            comments.sort_by(|a, b| a.created.cmp(&b.created));
            TaskRead {
                id: task.id,
                description: task.description,
                status: task.status.into(),
                scheduled_start_date: task.scheduled_start_date,
                scheduled_complete_date: task.scheduled_complete_date,
                actual_start_date: task.actual_start_date,
                actual_complete_date: task.actual_complete_date,
                last_resumed_date: task.last_resumed_date,
                estimated_duration: task.estimated_duration,
                elapsed_duration: task.elapsed_duration,
                comments,
                tags,
            }
        })
        .collect();

    Ok(PagedData::<TaskRead> {
        data: tasks_with_comments,
        page: params.page,
        page_size: params.page_size,
        total_item_count: count,
    })
}

#[tauri::command]
pub async fn start_task(task_id: i32, db: State<'_, Db>) -> Result<(), String> {
    match find_task(task_id, &db).await? {
        Some(model) => {
            let mut task = set_task_model_active(model, Status::Doing);
            task.actual_start_date = Set(Some(Utc::now()));
            save_task(task, &db).await
        }
        None => Err(not_found_message(task_id)),
    }
}

#[tauri::command]
pub async fn pause_task(task_id: i32, db: State<'_, Db>) -> Result<(), String> {
    match find_task(task_id, &db).await? {
        Some(model) => {
            let task = set_task_model_inactive(model, Status::Paused);
            save_task(task, &db).await
        }
        None => Err(not_found_message(task_id)),
    }
}

#[tauri::command]
pub async fn resume_task(task_id: i32, db: State<'_, Db>) -> Result<(), String> {
    match find_task(task_id, &db).await? {
        Some(model) => {
            let task = set_task_model_active(model, Status::Doing);
            save_task(task, &db).await
        }
        None => Err(not_found_message(task_id)),
    }
}

#[tauri::command]
pub async fn finish_task(task_id: i32, db: State<'_, Db>) -> Result<(), String> {
    match find_task(task_id, &db).await? {
        Some(model) => {
            let mut task = set_task_model_inactive(model, Status::Done);
            task.actual_complete_date = Set(Some(Utc::now()));
            save_task(task, &db).await
        }
        None => Err(not_found_message(task_id)),
    }
}

#[tauri::command]
pub async fn cancel_task(task_id: i32, db: State<'_, Db>) -> Result<(), String> {
    match find_task(task_id, &db).await? {
        Some(model) => {
            let task = set_task_model_inactive(model, Status::Cancelled);
            save_task(task, &db).await
        }
        None => Err(not_found_message(task_id)),
    }
}

#[tauri::command]
pub async fn reopen_task(task_id: i32, db: State<'_, Db>) -> Result<(), String> {
    match find_task(task_id, &db).await? {
        Some(model) => {
            let mut task = set_task_model_active(model, Status::Doing);
            task.actual_complete_date = Set(None);
            save_task(task, &db).await
        }
        None => Err(not_found_message(task_id)),
    }
}

#[tauri::command]
pub async fn restore_task(task_id: i32, db: State<'_, Db>) -> Result<(), String> {
    match find_task(task_id, &db).await? {
        Some(model) => {
            let mut task: task::ActiveModel;
            if model.elapsed_duration > 0 && model.actual_start_date.is_some() {
                task = set_task_model_inactive(model, Status::Paused);
            } else {
                task = set_task_model_inactive(model, Status::Todo);
                task.actual_start_date = Set(None);
                task.elapsed_duration = Set(0);
            }
            save_task(task, &db).await
        }
        None => Err(not_found_message(task_id)),
    }
}

#[tauri::command]
pub async fn delete_task(task_id: i32, db: State<'_, Db>) -> Result<(), String> {
    match find_task(task_id, &db).await? {
        Some(model) => {
            let task = model.into_active_model();
            task.delete(&db.connection)
                .await
                .map(|_| ())
                .map_err(|err| err.to_string())
        }
        None => Err(not_found_message(task_id)),
    }
}

#[tauri::command]
pub async fn edit_task(task: EditTask, db: State<'_, Db>) -> Result<(), String> {
    match find_task(task.id, &db).await? {
        Some(model) => {
            let mut existing_task = model.clone().into_active_model();

            existing_task.description = Set(task.description);
            existing_task.scheduled_start_date = Set(task.scheduled_start_date);
            existing_task.scheduled_complete_date = Set(task.scheduled_complete_date);
            existing_task.estimated_duration = Set(task.estimated_duration);
            existing_task.actual_start_date = Set(task.actual_start_date);
            existing_task.actual_complete_date = Set(task.actual_complete_date);

            match model.status.into() {
                Status::Cancelled => {
                    existing_task = update_inactive_elapsed(existing_task, task.elapsed_duration);
                }
                Status::Doing => {
                    if let None = task.actual_start_date {
                        existing_task.actual_start_date = Set(Some(Utc::now()));
                    }
                    existing_task.actual_complete_date = Set(None);
                    existing_task = update_active_elapsed(existing_task, task.elapsed_duration);
                }
                Status::Done => {
                    if let None = task.actual_start_date {
                        existing_task.actual_start_date = Set(Some(Utc::now()));
                    }
                    existing_task.actual_complete_date = Set(Some(Utc::now()));
                    existing_task = update_inactive_elapsed(existing_task, task.elapsed_duration);
                }
                Status::Paused => {
                    if let None = task.actual_start_date {
                        existing_task.actual_start_date = Set(Some(Utc::now()));
                    }
                    existing_task.actual_complete_date = Set(None);
                    existing_task = update_inactive_elapsed(existing_task, task.elapsed_duration);
                }
                Status::Todo => {
                    existing_task.actual_start_date = Set(None);
                    existing_task.actual_complete_date = Set(None);
                    existing_task = update_inactive_elapsed(existing_task, task.elapsed_duration);
                }
                Status::Unknown => unimplemented!(),
            }

            existing_task
                .save(&db.connection)
                .await
                .map(|_| ())
                .map_err(|err| err.to_string())
        }
        None => Err(not_found_message(task.id)),
    }
}

#[tauri::command]
pub async fn add_comment(comment: NewComment, db: State<'_, Db>) -> Result<(), String> {
    let model = comment::ActiveModel {
        id: ActiveValue::NotSet,
        task_id: ActiveValue::Set(comment.task_id),
        message: ActiveValue::Set(comment.message),
        created: ActiveValue::Set(Utc::now()),
        modified: ActiveValue::Set(None),
    };

    model
        .save(&db.connection)
        .await
        .map(|_| ())
        .map_err(|err| err.to_string())
}

#[tauri::command]
pub async fn update_comment(comment: EditComment, db: State<'_, Db>) -> Result<(), String> {
    let maybe_comment = Comment::find_by_id(comment.id)
        .one(&db.connection)
        .await
        .map_err(|err| err.to_string())?;

    match maybe_comment {
        Some(model) => {
            let mut existing = model.into_active_model();
            existing.message = Set(comment.message);
            existing.modified = Set(Some(Utc::now()));
            existing
                .save(&db.connection)
                .await
                .map(|_| ())
                .map_err(|err| err.to_string())
        }
        None => Err(format!("Comment with id {} not found.", comment.id)),
    }
}

#[tauri::command]
pub async fn delete_comment(id: i64, db: State<'_, Db>) -> Result<(), String> {
    Comment::delete_by_id(id)
        .exec(&db.connection)
        .await
        .map(|_| ())
        .map_err(|err| err.to_string())
}

fn update_inactive_elapsed(
    mut task: task::ActiveModel,
    maybe_elapsed: Option<i64>,
) -> task::ActiveModel {
    if let Some(elapsed) = maybe_elapsed {
        task.elapsed_duration = Set(elapsed);
        task.last_resumed_date = Set(None);
    }

    task
}

fn update_active_elapsed(
    mut task: task::ActiveModel,
    maybe_elapsed: Option<i64>,
) -> task::ActiveModel {
    if let Some(elapsed) = maybe_elapsed {
        task.elapsed_duration = Set(elapsed);
        task.last_resumed_date = Set(Some(Utc::now()));
    }

    task
}

fn not_found_message(task_id: i32) -> String {
    format!("Task with id '{}' not found.", task_id)
}

async fn save_task(task: task::ActiveModel, state: &State<'_, Db>) -> Result<(), String> {
    task.save(&state.connection)
        .await
        .map(|_| ())
        .map_err(|err| err.to_string())
}

/// Find a task by its id.
async fn find_task(task_id: i32, state: &State<'_, Db>) -> Result<Option<task::Model>, String> {
    Task::find_by_id(task_id)
        .one(&state.connection)
        .await
        .map_err(|err| err.to_string())
}

/// Update the status when transitioning to an active state.
fn set_task_model_active(model: task::Model, status: Status) -> task::ActiveModel {
    let mut task = model.into_active_model();
    task.status = Set(status.into());
    task.last_resumed_date = Set(Some(Utc::now()));
    task
}

/// Update the status when transition to a paused or finished state.
fn set_task_model_inactive(model: task::Model, status: Status) -> task::ActiveModel {
    let mut task = model.clone().into_active_model();
    task.status = Set(status.into());

    if let Some(last_resumed) = model.last_resumed_date {
        let diff = Utc::now() - last_resumed;
        task.elapsed_duration = Set(model.elapsed_duration + diff.num_seconds());
        task.last_resumed_date = Set(None);
    }

    task
}

#[tauri::command]
pub async fn remove_tag_from_task(
    task_id: i64,
    tag_id: i64,
    db: State<'_, Db>,
) -> Result<(), String> {
    TaskTags::delete_many()
        .filter(
            task_tags::Column::TagId
                .eq(tag_id)
                .and(task_tags::Column::TaskId.eq(task_id)),
        )
        .exec(&db.connection)
        .await
        .map(|_| ())
        .map_err(|err| err.to_string())
}

#[tauri::command]
pub async fn get_all_tags(db: State<'_, Db>) -> Result<Vec<tags::Model>, String> {
    Tags::find()
        .order_by_asc(tags::Column::Value)
        .all(&db.connection)
        .await
        .map_err(|err| err.to_string())
}

#[tauri::command]
pub async fn add_tag_to_task(tag_id: i64, task_id: i64, db: State<'_, Db>) -> Result<(), String> {
    let existing_join = TaskTags::find()
        .filter(
            task_tags::Column::TagId
                .eq(tag_id)
                .and(task_tags::Column::TaskId.eq(task_id)),
        )
        .one(&db.connection)
        .await
        .map_err(|err| err.to_string())?;

    match existing_join {
        Some(_) => Ok(()),
        None => {
            let new_join = task_tags::ActiveModel {
                id: ActiveValue::NotSet,
                task_id: ActiveValue::Set(task_id),
                tag_id: ActiveValue::Set(tag_id),
            };

            new_join
                .save(&db.connection)
                .await
                .map(|_| ())
                .map_err(|err| err.to_string())
        }
    }
}

#[tauri::command]
pub async fn add_new_tag(new_tag: String, db: State<'_, Db>) -> Result<tags::Model, String> {
    let model = tags::ActiveModel {
        id: ActiveValue::NotSet,
        value: ActiveValue::Set(new_tag),
    };

    model
        .save(&db.connection)
        .await
        .map(|tag| tag.try_into_model().unwrap())
        .map_err(|err| err.to_string())
}
