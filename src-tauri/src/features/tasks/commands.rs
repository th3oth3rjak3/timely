use super::models::Task;
use chrono::Utc;
use sqlx::{QueryBuilder, Row};
use tauri::State;

use crate::{
    features::tags::Tag, Data, PagedData, SortDirection
};

use super::*;

#[tauri::command]
pub async fn create_task(new_task: CreateTask, db: State<'_, Data>) -> Result<(), String> {
    let tags = new_task.tags.clone();
    let new_task = NewTask::from(new_task);
    
    let result = sqlx::query!(r#"
        INSERT INTO tasks (title, description, status, scheduled_start_date, scheduled_complete_date, estimated_duration, elapsed_duration) 
        VALUES (?, ?, ?, ?, ?, ?, ?)"#,
        new_task.title,
        new_task.description,
        new_task.status,
        new_task.scheduled_start_date,
        new_task.scheduled_complete_date,
        new_task.estimated_duration,
        new_task.elapsed_duration
    ).execute(&db.pool)
    .await
    .map_err(|err| err.to_string())?;


    if let Some(tags) = tags {
        let mut builder = QueryBuilder::new("INSERT INTO task_tags (tag_id, task_id) ");
        builder.push_values(tags, |mut b, tag| {
            b.push_bind(tag.id).push_bind(result.last_insert_rowid());
        });
        
        builder.build().execute(&db.pool).await.map(|_|()).map_err(|err| err.to_string())?;
    }

    Ok(())
}


fn generate_search_query<'a>(mut builder: QueryBuilder<'a, sqlx::Sqlite>, params: &'a TaskSearchParams) -> QueryBuilder<'a, sqlx::Sqlite> {
    builder.push(r#"
        SELECT DISTINCT tasks.* 
        FROM tasks
        LEFT JOIN task_tags on tasks.id = task_tags.task_id
        LEFT JOIN tags on tags.id = task_tags.tag_id
    "#);

    builder.push(" WHERE 1=1 ");

    builder.push(" AND tasks.status IN (");
    for (i, status) in params.statuses.iter().enumerate() {
        builder.push_bind(status);
        if i < params.statuses.len() - 1 {
            builder.push(",");
        }
    }
    builder.push(")");

    if let Some(query) = &params.query_string {
        builder
            .push(" AND (tasks.title LIKE ").push_bind(format!("'%{}%'", query))
            .push(" OR tasks.description LIKE ").push_bind(format!("'%{}%'", query))
            .push(") ");
    }

    if let Some(DateFilter { start: Some(start), end: Some(end) }) = &params.start_by_filter  {
        builder
            .push(" AND tasks.scheduled_start_date BETWEEN ")
            .push_bind(start.naive_utc())
            .push(" AND ")
            .push_bind(end.naive_utc());
    }

    if let Some(DateFilter { start: Some(start), end: Some(end) }) = &params.due_by_filter {
        builder
            .push(" AND tasks.scheduled_complete_date BETWEEN ")
            .push_bind(start.naive_utc())
            .push(" AND ")
            .push_bind(end.naive_utc());
    }

    if let Some(ref tags) = &params.tags {
        if tags.is_empty() {
            builder.push(" AND task_tags.task_id IS NULL ");
        } else {
            builder.push(" AND tags.value IN (");
            for (i, tag) in tags.iter().enumerate() {
                builder.push_bind(tag);
                if i < tags.len() - 1 {
                    builder.push(",");
                }
            }
            builder.push(")");
        }
    }

    match params.ordering.sort_direction {
        SortDirection::Ascending => match params.ordering.order_by.as_str() {
            "title" => builder.push(" ORDER BY tasks.title ASC"),
            "status" => builder.push(" ORDER BY tasks.status ASC"),
            "description" => builder.push(" ORDER BY tasks.description ASC"),
            "scheduled_start_date" => builder.push(" ORDER BY tasks.scheduled_start_date IS NULL ASC, tasks.scheduled_start_date ASC"),
            "scheduled_complete_date" => builder.push(" ORDER BY tasks.scheduled_complete_date IS NULL ASC, tasks.scheduled_complete_date ASC"),
            _ => &mut builder
        },
        SortDirection::Descending => match params.ordering.order_by.as_str() {
            "title" => builder.push(" ORDER BY tasks.title DESC"),
            "status" => builder.push(" ORDER BY tasks.status DESC"),
            "description" => builder.push(" ORDER BY tasks.description DESC"),
            "scheduled_start_date" => builder.push(" ORDER BY tasks.scheduled_start_date IS NULL DESC, tasks.scheduled_start_date DESC"),
            "scheduled_complete_date" => builder.push(" ORDER BY tasks.scheduled_complete_date IS NULL DESC, tasks.scheduled_complete_date DESC"),
            _ => &mut builder
        },
    };

    builder
}

/// Search for all tasks which match the search parameters.
///
/// ### Args
/// * state - The database state used to query a connection.
/// * params - The search parameters used to filter/sort the results.
#[tauri::command]
pub async fn get_tasks(
    params: TaskSearchParams,
    db: State<'_, Data>,
) -> Result<PagedData<TaskRead>, String> {
    let mut count_builder = QueryBuilder::<sqlx::Sqlite>::new("SELECT COUNT(DISTINCT id) FROM (");

    count_builder = generate_search_query(count_builder, &params);
    count_builder.push(")");

    let count_query = count_builder.build_query_scalar::<i64>();
    let count = count_query.fetch_one(&db.pool).await.map_err(|err| err.to_string())?;

    let mut task_query = generate_search_query(QueryBuilder::new(""), &params);

    task_query.push(format!(" LIMIT {} OFFSET {}", params.page_size, (params.page - 1) * params.page_size));

    let all_tasks: Vec<Task> = task_query.build_query_as::<Task>().fetch_all(&db.pool).await.map_err(|err| err.to_string())?;

    let mut comments: Vec<Vec<Comment>> = Vec::new();
    let mut tags: Vec<Vec<Tag>> = Vec::new();
    for task in all_tasks.iter() {
        let task_comments = sqlx::query_as!(Comment, r#"
            SELECT *
            FROM comments
            WHERE comments.task_id = ?
        "#,
        task.id)
        .fetch_all(&db.pool)
        .await
        .map_err(|err| err.to_string())?;

        comments.push(task_comments);

        let task_tags = sqlx::query_as!(Tag, r#"
            SELECT tags.*
            FROM tags
            INNER JOIN task_tags on task_tags.tag_id = tags.id
            WHERE task_tags.task_id = ?
        "#,
        task.id)
        .fetch_all(&db.pool)
        .await
        .map_err(|err| err.to_string())?;

        tags.push(task_tags);
    }

    let task_read = all_tasks
        .into_iter()
        .zip(comments)
        .zip(tags)
        .map(|((task, comments), tags)| {
            let mut elapsed_duration: i64 = task.elapsed_duration;
        
            if let Some(last_resumed) = task.last_resumed_date {
                let diff = Utc::now().naive_utc() - last_resumed;
                elapsed_duration += diff.num_seconds();
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
            count,
            task_read,
    ))
}
                    
#[tauri::command]
pub async fn start_task(task_id: i64, db: State<'_, Data>) -> Result<(), String> {
    match find_task(task_id, &db).await? {
        Some(model) => {
            let mut task = set_task_model_active(model, Status::Doing);
            task.actual_start_date = Some(Utc::now().naive_utc());
            save_task(task, &db).await
        }
        None => Err(not_found_message(task_id)),
    }
}

#[tauri::command]
pub async fn pause_task(task_id: i64, db: State<'_, Data>) -> Result<(), String> {
    match find_task(task_id, &db).await? {
        Some(model) => {
            let task = set_task_model_inactive(model, Status::Paused);
            save_task(task, &db).await
        }
        None => Err(not_found_message(task_id)),
    }
}

#[tauri::command]
pub async fn resume_task(task_id: i64, db: State<'_, Data>) -> Result<(), String> {
    match find_task(task_id, &db).await? {
        Some(model) => {
            let task = set_task_model_active(model, Status::Doing);
            save_task(task, &db).await
        }
        None => Err(not_found_message(task_id)),
    }
}

#[tauri::command]
pub async fn finish_task(task_id: i64, db: State<'_, Data>) -> Result<(), String> {
    match find_task(task_id, &db).await? {
        Some(model) => {
            let mut task = set_task_model_inactive(model, Status::Done);
            task.actual_complete_date = Some(Utc::now().naive_utc());
            save_task(task, &db).await
        }
        None => Err(not_found_message(task_id)),
    }
}

#[tauri::command]
pub async fn cancel_task(task_id: i64, db: State<'_, Data>) -> Result<(), String> {
    match find_task(task_id, &db).await? {
        Some(model) => {
            let task = set_task_model_inactive(model, Status::Cancelled);
            save_task(task, &db).await
        }
        None => Err(not_found_message(task_id)),
    }
}

#[tauri::command]
pub async fn reopen_task(task_id: i64, db: State<'_, Data>) -> Result<(), String> {
    match find_task(task_id, &db).await? {
        Some(model) => {
            let mut task = set_task_model_active(model, Status::Doing);
            task.actual_complete_date = None;
            save_task(task, &db).await
        }
        None => Err(not_found_message(task_id)),
    }
}

#[tauri::command]
pub async fn restore_task(task_id: i64, db: State<'_, Data>) -> Result<(), String> {
    match find_task(task_id, &db).await? {
        Some(model) => {
            let mut task: Task;
            if model.elapsed_duration > 0 && model.actual_start_date.is_some() {
                task = set_task_model_inactive(model, Status::Paused);
            } else {
                task = set_task_model_inactive(model, Status::Todo);
                task.actual_start_date = None;
                task.elapsed_duration = 0;
            }
            save_task(task, &db).await
        }
        None => Err(not_found_message(task_id)),
    }
}

#[tauri::command]
pub async fn delete_task(task_id: i64, db: State<'_, Data>) -> Result<(), String> {
    match find_task(task_id, &db).await? {
        Some(_) => {
            sqlx::query!("DELETE FROM tasks WHERE tasks.id = ?", task_id)
                .execute(&db.pool)
                .await
                .map(|_|())
                .map_err(|err| err.to_string())
        }
        None => Err(not_found_message(task_id)),
    }
}

#[tauri::command]
pub async fn edit_task(task: EditTask, db: State<'_, Data>) -> Result<(), String> {
    match find_task(task.id, &db).await? {
        Some(model) => {
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

            save_task(existing_task, &db).await
        }
        None => Err(not_found_message(task.id)),
    }
}

#[tauri::command]
pub async fn add_comment(comment: CreateComment, db: State<'_, Data>) -> Result<(), String> {
    let model = NewComment::from(comment);

    sqlx::query!(r#"
        INSERT INTO comments (task_id, message, created, modified)
        VALUES (?, ?, ?, ?)
    "#,
        model.task_id,
        model.message,
        model.created,
        model.modified
    )
    .execute(&db.pool)
    .await
    .map(|_|())
    .map_err(|err| err.to_string())
}

#[tauri::command]
pub async fn update_comment(comment: EditComment, db: State<'_, Data>) -> Result<(), String> {
    let mut found: Comment = sqlx::query_as!(
        Comment,
        r#"
            SELECT *
            FROM comments
            WHERE comments.id = ?
        "#,
        comment.id
    )
    .fetch_one(&db.pool)
    .await
    .map_err(|err| err.to_string())?;

    found.message = comment.message;
    found.modified = Some(Utc::now().naive_utc());

    sqlx::query!(r#"
        UPDATE comments 
        SET message = ?, 
        modified = ? 
        WHERE id = ?"#,
        found.message,
        found.modified,
        found.id
    )
    .execute(&db.pool)
    .await
    .map(|_|())
    .map_err(|err| err.to_string())
}

#[tauri::command]
pub async fn delete_comment(id: i64, db: State<'_, Data>) -> Result<(), String> {
    sqlx::query!(r#"
            DELETE FROM comments
            WHERE comments.id = ?
        "#, 
        id)
        .execute(&db.pool)
        .await
        .map(|_|())
        .map_err(|err| err.to_string())
}

fn update_inactive_elapsed(mut task: Task, maybe_elapsed: Option<i64>) -> Task {
    if let Some(elapsed) = maybe_elapsed {
        task.elapsed_duration = elapsed;
        task.last_resumed_date = None;
    }

    task
}

fn update_active_elapsed(mut task: Task, maybe_elapsed: Option<i64>) -> Task {
    if let Some(elapsed) = maybe_elapsed {
        task.elapsed_duration = elapsed;
        task.last_resumed_date = Some(Utc::now().naive_utc());
    }

    task
}

fn not_found_message(task_id: i64) -> String {
    format!("Task with id '{}' not found.", task_id)
}

async fn save_task(task: Task, db: &State<'_, Data>) -> Result<(), String> {
    sqlx::query!(r#"
        UPDATE tasks
        SET title = ?,
        description = ?,
        status = ?,
        scheduled_start_date = ?,
        scheduled_complete_date = ?,
        actual_start_date = ?,
        actual_complete_date = ?,
        last_resumed_date = ?,
        estimated_duration = ?,
        elapsed_duration = ?
        WHERE tasks.id = ?
        "#,
        task.title,
        task.description,
        task.status,
        task.scheduled_start_date,
        task.scheduled_complete_date,
        task.actual_start_date,
        task.actual_complete_date,
        task.last_resumed_date,
        task.estimated_duration,
        task.elapsed_duration,
        task.id)
    .execute(&db.pool)
    .await
    .map(|_|())
    .map_err(|err| err.to_string())
}

/// Find a task by its id.
async fn find_task(task_id: i64, db: &State<'_, Data>) -> Result<Option<Task>, String> {
    sqlx::query_as!(Task, "SELECT * FROM tasks WHERE id = ?", task_id)
        .fetch_optional(&db.pool)
        .await
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
        task.elapsed_duration = model.elapsed_duration + diff.num_seconds();
        task.last_resumed_date = None;
    }

    task
}

#[tauri::command]
pub async fn remove_tag_from_task(
    task_id: i64,
    tag_id: i64,
    db: State<'_, Data>,
) -> Result<(), String> {

    sqlx::query!(r#"
            DELETE FROM task_tags
            WHERE task_tags.task_id = ?
            AND task_tags.tag_id = ?
        "#,
        task_id,
        tag_id
    )
    .execute(&db.pool)
    .await
    .map(|_| ())
    .map_err(|err| err.to_string())
}

#[tauri::command]
pub async fn get_all_tags(db: State<'_, Data>) -> Result<Vec<Tag>, String> {
    sqlx::query_as!(Tag, r#"
        SELECT *
        FROM tags
        ORDER BY tags.value ASC
    "#)
    .fetch_all(&db.pool)
    .await
    .map_err(|err| err.to_string())
}

#[tauri::command]
pub async fn add_tag_to_task(
    tag_id: i64,
    task_id: i64,
    db: State<'_, Data>,
) -> Result<(), String> {
    let maybe_exists = sqlx::query_as!(
        TaskTag, 
        r#"
            SELECT * 
            FROM task_tags 
            WHERE task_tags.task_id = ? 
            AND task_tags.tag_id = ?"#,
        task_id,
        tag_id,    
    )
    .fetch_optional(&db.pool)
    .await
    .map_err(|err| err.to_string())?;

    match maybe_exists {
        Some(_) => Ok(()),
        None => {
            sqlx::query!(
                "INSERT INTO task_tags (task_id, tag_id) VALUES (?, ?)", 
                task_id, 
                tag_id
            )
            .execute(&db.pool)
            .await
            .map(|_|())
            .map_err(|err| err.to_string())
        }
    }
}

#[tauri::command]
pub async fn add_new_tag(new_tag: String, db: State<'_, Data>) -> Result<Tag, String> {
    // If a tag already exists, no need to add it again.
    let maybe_tag: Option<Tag> = sqlx::query_as!(Tag, r#"
            SELECT *
            FROM tags
            WHERE tags.value = ?
            LIMIT 1
        "#,
        new_tag    
    )
    .fetch_optional(&db.pool)
    .await
    .map_err(|err| err.to_string())?;

    match maybe_tag {
        Some(existing) => Ok(existing),
        None => {
            let result = sqlx::query!("INSERT INTO tags (value) VALUES (?)", new_tag)
                .execute(&db.pool)
                .await
                .map_err(|err| err.to_string())?;

            let inserted_id = result.last_insert_rowid();

            sqlx::query_as!(
                Tag, 
                "SELECT * FROM tags WHERE id = ?", 
                inserted_id)
            .fetch_one(&db.pool)
            .await
            .map_err(|err| err.to_string())
        }
    }
}
