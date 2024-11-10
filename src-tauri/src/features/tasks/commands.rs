use super::models::Task;
use chrono::Utc;
use diesel::{dsl::*, prelude::*, sqlite::Sqlite};
use tauri::State;

use crate::{
    features::tags::Tag,
    schema::{comments, tags, task_tags, tasks},
    Diesel, PagedData, SortDirection,
};

use super::*;

#[tauri::command]
pub async fn create_task(new_task: CreateTask, db: State<'_, Diesel>) -> Result<(), String> {
    let mut connection = db.pool.get().map_err(|err| err.to_string())?;
    let tags = new_task.tags.clone();
    let new_task = NewTask::from(new_task);
    
    let task = diesel::insert_into(tasks::table)
        .values(&new_task)
        .get_result::<Task>(&mut connection)
        .map_err(|err| format!("Error creating new task: {}", err.to_string()))?;

    if let Some(tags) = tags {
        diesel::insert_into(task_tags::table)
            .values(tags.into_iter().map(|tag| TaskTag { tag_id: tag.id, task_id: task.id }).collect::<Vec<_>>())
            .execute(&mut connection)
            .map(|_|())
            .map_err(|err| err.to_string())?;
    }

    Ok(())
}

#[diesel::dsl::auto_type(no_type_alias)]
fn generate_search_query<'a>(params: &'a TaskSearchParams) -> _ {
    let mut task_query = tasks::table
        .left_join(task_tags::table.on(task_tags::task_id.eq(tasks::id)))
        .left_join(tags::table.on(task_tags::tag_id.eq(tags::id)))
        .into_boxed::<Sqlite>();

    task_query = task_query.filter(tasks::status.eq_any(&params.statuses));

    if let Some(tags) = &params.tags {
        task_query = task_query.filter(tags::value.eq_any(tags));
    }

    if let Some(query) = &params.query_string {
        task_query = task_query.filter(
            tasks::title
                .like(format!("%{}%", &query))
                .or(tasks::description.like(format!("%{}%", &query))),
        );
    }

    if let Some(DateFilter { start: Some(start), end: Some(end) }) = &params.start_by_filter {
            task_query = task_query.filter(tasks::scheduled_start_date.between(start.naive_utc(), end.naive_utc()))
    }


    if let Some(DateFilter { start: Some(start), end: Some(end) }) = &params.due_by_filter {
        task_query = task_query.filter(tasks::scheduled_complete_date.between(start.naive_utc(), end.naive_utc()))
    }
 
    match params.ordering.sort_direction {
        SortDirection::Ascending => match params.ordering.order_by.as_str() {
            "title" => task_query = task_query.order_by(tasks::title.asc()),
            "status" => task_query = task_query.order_by(tasks::status.asc()),
            "description" => task_query = task_query.order_by(tasks::description.asc()),
            "scheduled_start_date" => {
                task_query = task_query.order_by((
                    tasks::scheduled_start_date.is_null(),
                    tasks::scheduled_start_date.asc(),
                ))
            }
            "scheduled_complete_date" => {
                task_query = task_query.order_by((
                    tasks::scheduled_complete_date.is_null(),
                    tasks::scheduled_complete_date.asc(),
                ))
            }
            _ => {}
        },
        SortDirection::Descending => match params.ordering.order_by.as_str() {
            "title" => task_query = task_query.order_by(tasks::title.desc()),
            "status" => task_query = task_query.order_by(tasks::status.desc()),
            "description" => task_query = task_query.order_by(tasks::description.desc()),
            "scheduled_start_date" => {
                task_query = task_query.order_by((
                    tasks::scheduled_start_date.is_null(),
                    tasks::scheduled_start_date.desc(),
                ))
            }
            "scheduled_complete_date" => {
                task_query = task_query.order_by((
                    tasks::scheduled_complete_date.is_null(),
                    tasks::scheduled_complete_date.desc(),
                ))
            }
            _ => {}
        },
    }

    task_query
}

/// Search for all tasks which match the search parameters.
///
/// ### Args
/// * state - The database state used to query a connection.
/// * params - The search parameters used to filter/sort the results.
#[tauri::command]
pub async fn get_tasks(
    params: TaskSearchParams,
    db: State<'_, Diesel>,
) -> Result<PagedData<TaskRead>, String> {
    let mut connection = db.pool.get().map_err(|err| err.to_string())?;

    let count_query = generate_search_query(&params);
    let task_query = generate_search_query(&params);

    let count: i64 = count_query
        .select(count_distinct(tasks::id))
        .first(&mut connection)
        .map_err(|err| err.to_string())?;

    let all_tasks: Vec<Task> = task_query
        .distinct()
        .limit(params.page_size)
        .offset((params.page - 1) * params.page_size)
        .select(Task::as_select())
        .load(&mut connection)
        .map_err(|err| err.to_string())?;

    let all_comments: Vec<Comment> = Comment::belonging_to(&all_tasks)
        .select(Comment::as_select())
        .load(&mut connection)
        .map_err(|err| err.to_string())?;

    let loaded_tags: Vec<(TaskTag, Tag)> = TaskTag::belonging_to(&all_tasks)
        .inner_join(tags::table)
        .select((TaskTag::as_select(), Tag::as_select()))
        .load(&mut connection)
        .map_err(|err| err.to_string())?;

    let tasks_with_tags: Vec<(Task, Vec<Tag>)> = loaded_tags
        .grouped_by(&all_tasks)
        .into_iter()
        .zip(all_tasks)
        .map(|(t, task)| (task.clone(), t.into_iter().map(|(_, tag)| tag).collect()))
        .collect();

    let tasks_with_tags_and_comments: Vec<(Task, Vec<Tag>, Vec<Comment>)> = all_comments
        .grouped_by(
            &tasks_with_tags
                .iter()
                .map(|a| a.0.clone())
                .collect::<Vec<Task>>(),
        )
        .into_iter()
        .zip(tasks_with_tags)
        .map(|(t, a)| ((a.0, a.1, t)))
        .collect();

    let task_read: Vec<TaskRead> = tasks_with_tags_and_comments
        .into_iter()
        .map(|(task, tags, comments)| {
            let mut elapsed_duration = task.elapsed_duration;

            if let Some(last_resumed) = task.last_resumed_date {
                let diff = Utc::now().naive_utc() - last_resumed;
                elapsed_duration += diff.num_seconds() as i32;
            }

            TaskRead {
                id: task.id,
                title: task.title,
                description: task.description,
                status: task.status,
                scheduled_start_date: task.scheduled_start_date.map(|dt| dt.and_utc()),
                scheduled_complete_date: task.scheduled_complete_date.map(|dt| dt.and_utc()),
                actual_start_date: task.actual_start_date.map(|dt| dt.and_utc()),
                actual_complete_date: task.actual_complete_date.map(|dt| dt.and_utc()),
                last_resumed_date: task.last_resumed_date.map(|dt| dt.and_utc()),
                estimated_duration: task.estimated_duration,
                elapsed_duration,
                comments: comments
                    .into_iter()
                    .map(|c| c.into())
                    .collect::<Vec<CommentRead>>(),
                tags,
            }
        })
        .collect();

    Ok(PagedData::<TaskRead>::new(
        params.page,
        params.page_size,
        count.clone(),
        task_read,
    ))
}

#[tauri::command]
pub fn start_task(task_id: i32, db: State<'_, Diesel>) -> Result<(), String> {
    match find_task(task_id, &db)? {
        Some(model) => {
            let mut task = set_task_model_active(model, Status::Doing);
            task.actual_start_date = Some(Utc::now().naive_utc());
            save_task(task, &db)
        }
        None => Err(not_found_message(task_id)),
    }
}

#[tauri::command]
pub fn pause_task(task_id: i32, db: State<'_, Diesel>) -> Result<(), String> {
    match find_task(task_id, &db)? {
        Some(model) => {
            let task = set_task_model_inactive(model, Status::Paused);
            save_task(task, &db)
        }
        None => Err(not_found_message(task_id)),
    }
}

#[tauri::command]
pub fn resume_task(task_id: i32, db: State<'_, Diesel>) -> Result<(), String> {
    match find_task(task_id, &db)? {
        Some(model) => {
            let task = set_task_model_active(model, Status::Doing);
            save_task(task, &db)
        }
        None => Err(not_found_message(task_id)),
    }
}

#[tauri::command]
pub fn finish_task(task_id: i32, db: State<'_, Diesel>) -> Result<(), String> {
    match find_task(task_id, &db)? {
        Some(model) => {
            let mut task = set_task_model_inactive(model, Status::Done);
            task.actual_complete_date = Some(Utc::now().naive_utc());
            save_task(task, &db)
        }
        None => Err(not_found_message(task_id)),
    }
}

#[tauri::command]
pub fn cancel_task(task_id: i32, db: State<'_, Diesel>) -> Result<(), String> {
    match find_task(task_id, &db)? {
        Some(model) => {
            let task = set_task_model_inactive(model, Status::Cancelled);
            save_task(task, &db)
        }
        None => Err(not_found_message(task_id)),
    }
}

#[tauri::command]
pub fn reopen_task(task_id: i32, db: State<'_, Diesel>) -> Result<(), String> {
    match find_task(task_id, &db)? {
        Some(model) => {
            let mut task = set_task_model_active(model, Status::Doing);
            task.actual_complete_date = None;
            save_task(task, &db)
        }
        None => Err(not_found_message(task_id)),
    }
}

#[tauri::command]
pub fn restore_task(task_id: i32, db: State<'_, Diesel>) -> Result<(), String> {
    match find_task(task_id, &db)? {
        Some(model) => {
            let mut task: Task;
            if model.elapsed_duration > 0 && model.actual_start_date.is_some() {
                task = set_task_model_inactive(model, Status::Paused);
            } else {
                task = set_task_model_inactive(model, Status::Todo);
                task.actual_start_date = None;
                task.elapsed_duration = 0;
            }
            save_task(task, &db)
        }
        None => Err(not_found_message(task_id)),
    }
}

#[tauri::command]
pub fn delete_task(task_id: i32, db: State<'_, Diesel>) -> Result<(), String> {
    match find_task(task_id, &db)? {
        Some(model) => {
            let mut connection = db.pool.get().map_err(|err| err.to_string())?;
            diesel::delete(tasks::table)
                .filter(tasks::id.eq(model.id))
                .execute(&mut connection)
                .map(|_| ())
                .map_err(|err| err.to_string())
        }
        None => Err(not_found_message(task_id)),
    }
}

#[tauri::command]
pub fn edit_task(task: EditTask, db: State<'_, Diesel>) -> Result<(), String> {
    match find_task(task.id, &db)? {
        Some(model) => {
            let mut connection = db.pool.get().map_err(|err| err.to_string())?;

            let mut existing_task = model.clone();

            existing_task.title = task.title;
            existing_task.description = task.description;
            existing_task.scheduled_start_date = task.scheduled_start_date.map(|dt| dt.naive_utc());
            existing_task.scheduled_complete_date =
                task.scheduled_complete_date.map(|dt| dt.naive_utc());
            existing_task.estimated_duration = task.estimated_duration;
            existing_task.actual_start_date = task.actual_start_date.map(|dt| dt.naive_utc());
            existing_task.actual_complete_date = task.actual_complete_date.map(|dt| dt.naive_utc());

            match model.status {
                Status::Cancelled => {
                    existing_task = update_inactive_elapsed(existing_task, task.elapsed_duration);
                }
                Status::Doing => {
                    if let None = task.actual_start_date {
                        existing_task.actual_start_date = Some(Utc::now().naive_utc());
                    }
                    existing_task.actual_complete_date = None;
                    existing_task = update_active_elapsed(existing_task, task.elapsed_duration);
                }
                Status::Done => {
                    if let None = task.actual_start_date {
                        existing_task.actual_start_date = Some(Utc::now().naive_utc());
                    }
                    existing_task.actual_complete_date = Some(Utc::now().naive_utc());
                    existing_task = update_inactive_elapsed(existing_task, task.elapsed_duration);
                }
                Status::Paused => {
                    if let None = task.actual_start_date {
                        existing_task.actual_start_date = Some(Utc::now().naive_utc());
                    }
                    existing_task.actual_complete_date = None;
                    existing_task = update_inactive_elapsed(existing_task, task.elapsed_duration);
                }
                Status::Todo => {
                    existing_task.actual_start_date = None;
                    existing_task.actual_complete_date = None;
                    existing_task = update_inactive_elapsed(existing_task, task.elapsed_duration);
                }
            }

            existing_task
                .save_changes::<Task>(&mut connection)
                .map(|_| ())
                .map_err(|err| err.to_string())
        }
        None => Err(not_found_message(task.id)),
    }
}

#[tauri::command]
pub fn add_comment(comment: CreateComment, db: State<'_, Diesel>) -> Result<(), String> {
    let mut connection = db.pool.get().map_err(|err| err.to_string())?;

    let model = NewComment::from(comment);

    diesel::insert_into(comments::table)
        .values(&model)
        .execute(&mut connection)
        .map(|_| ())
        .map_err(|err| err.to_string())
}

#[tauri::command]
pub async fn update_comment(comment: EditComment, db: State<'_, Diesel>) -> Result<(), String> {
    let mut connection = db.pool.get().map_err(|err| err.to_string())?;

    let mut found: Comment = comments::table
        .filter(comments::id.eq(comment.id))
        .select(Comment::as_select())
        .first(&mut connection)
        .map_err(|err| err.to_string())?;

    found.message = comment.message;
    found.modified = Some(Utc::now().naive_utc());

    found
        .save_changes::<Comment>(&mut connection)
        .map(|_| ())
        .map_err(|err| err.to_string())
}

#[tauri::command]
pub fn delete_comment(id: i32, db: State<'_, Diesel>) -> Result<(), String> {
    let mut connection = db.pool.get().map_err(|err| err.to_string())?;

    diesel::delete(comments::table)
        .filter(comments::id.eq(id))
        .execute(&mut connection)
        .map(|_| ())
        .map_err(|err| err.to_string())
}

fn update_inactive_elapsed(mut task: Task, maybe_elapsed: Option<i32>) -> Task {
    if let Some(elapsed) = maybe_elapsed {
        task.elapsed_duration = elapsed;
        task.last_resumed_date = None;
    }

    task
}

fn update_active_elapsed(mut task: Task, maybe_elapsed: Option<i32>) -> Task {
    if let Some(elapsed) = maybe_elapsed {
        task.elapsed_duration = elapsed;
        task.last_resumed_date = Some(Utc::now().naive_utc());
    }

    task
}

fn not_found_message(task_id: i32) -> String {
    format!("Task with id '{}' not found.", task_id)
}

fn save_task(task: Task, db: &State<'_, Diesel>) -> Result<(), String> {
    let mut connection = db.pool.get().map_err(|err| err.to_string())?;

    task.save_changes::<Task>(&mut connection)
        .map(|_| ())
        .map_err(|err| err.to_string())
}

/// Find a task by its id.
fn find_task(task_id: i32, db: &State<'_, Diesel>) -> Result<Option<Task>, String> {
    let mut connection = db.pool.get().map_err(|err| err.to_string())?;

    tasks::table
        .filter(tasks::id.eq(task_id))
        .select(Task::as_select())
        .first(&mut connection)
        .optional()
        .map_err(|err| err.to_string())
}

/// Update the status when transitioning to an active state.
fn set_task_model_active(model: Task, status: Status) -> Task {
    let mut task = model.clone();
    task.status = status;
    task.last_resumed_date = Some(Utc::now().naive_utc());
    task
}

/// Update the status when transition to a paused or finished state.
fn set_task_model_inactive(model: Task, status: Status) -> Task {
    let mut task = model.clone();
    task.status = status;

    if let Some(last_resumed) = model.last_resumed_date {
        let diff = Utc::now().naive_utc() - last_resumed;
        task.elapsed_duration = model.elapsed_duration + diff.num_seconds() as i32;
        task.last_resumed_date = None;
    }

    task
}

#[tauri::command]
pub async fn remove_tag_from_task(
    task_id: i32,
    tag_id: i32,
    db: State<'_, Diesel>,
) -> Result<(), String> {
    let mut connection = db.pool.get().map_err(|err| err.to_string())?;

    diesel::delete(task_tags::table)
        .filter(
            task_tags::task_id
                .eq(task_id)
                .and(task_tags::tag_id.eq(tag_id)),
        )
        .execute(&mut connection)
        .map(|_| ())
        .map_err(|err| err.to_string())
}

#[tauri::command]
pub async fn get_all_tags(db: State<'_, Diesel>) -> Result<Vec<Tag>, String> {
    let mut connection = db.pool.get().map_err(|err| err.to_string())?;

    tags::table
        .order_by(tags::value.asc())
        .select(Tag::as_select())
        .load(&mut connection)
        .map_err(|err| err.to_string())
}

#[tauri::command]
pub async fn add_tag_to_task(
    tag_id: i32,
    task_id: i32,
    db: State<'_, Diesel>,
) -> Result<(), String> {
    let mut connection = db.pool.get().map_err(|err| err.to_string())?;

    let existing_record: Option<TaskTag> = task_tags::table
        .filter(
            task_tags::tag_id
                .eq(tag_id)
                .and(task_tags::task_id.eq(task_id)),
        )
        .select(TaskTag::as_select())
        .first(&mut connection)
        .optional()
        .map_err(|err| err.to_string())?;

    match existing_record {
        Some(_) => Ok(()),
        None => {
            let new_record = TaskTag { task_id, tag_id };
            diesel::insert_into(task_tags::table)
                .values(&new_record)
                .execute(&mut connection)
                .map(|_| ())
                .map_err(|err| err.to_string())
        }
    }
}

#[tauri::command]
pub fn add_new_tag(new_tag: String, db: State<'_, Diesel>) -> Result<Tag, String> {
    let mut connection = db.pool.get().map_err(|err| err.to_string())?;

    // If a tag already exists, no need to add it again.
    let maybe_tag = tags::table
        .filter(tags::value.eq(&new_tag))
        .select(Tag::as_select())
        .first(&mut connection)
        .optional()
        .map_err(|err| err.to_string())?;

    match maybe_tag {
        Some(existing) => Ok(existing),
        None => {
            let tag: Tag = diesel::insert_into(tags::table)
                .values(tags::value.eq(&new_tag))
                .returning(Tag::as_returning())
                .get_result(&mut connection)
                .map_err(|err| err.to_string())?;

            Ok(tag)
        }
    }
}
