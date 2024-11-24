use super::models::Task;
use anyhow_tauri::{IntoTAResult, TAResult};
use chrono::{NaiveDateTime, SubsecRound, Utc};
use sqlx::QueryBuilder;
use tauri::State;

use crate::{
    features::tags::Tag, query_utils::add_in_expression, Data, FilterOption, PagedData, SortDirection
};

use super::*;

#[tauri::command]
pub async fn create_task(new_task: CreateTask, db: State<'_, Data>) -> TAResult<()> {
    let tags = new_task.tags.clone();
    let new_task = NewTask::from(new_task);
    
    let result = sqlx::query!(r#"
        INSERT INTO tasks (title, description, status, scheduled_start_date, scheduled_complete_date, estimated_duration) 
        VALUES (?, ?, ?, ?, ?, ?)"#,
        new_task.title,
        new_task.description,
        new_task.status,
        new_task.scheduled_start_date,
        new_task.scheduled_complete_date,
        new_task.estimated_duration,
    ).execute(&db.pool)
    .await
    .into_ta_result()?;


    if let Some(tags) = tags {
        let mut builder = QueryBuilder::new("INSERT INTO task_tags (tag_id, task_id) ");
        builder.push_values(tags, |mut b, tag| {
            b.push_bind(tag.id).push_bind(result.last_insert_rowid());
        });
        
        builder
            .build()
            .execute(&db.pool)
            .await
            .map(|_|())
            .into_ta_result()?;
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

    builder.push(" AND tasks.status ");
    add_in_expression(&mut builder, &params.statuses);

    if let Some(query) = &params.query_string {
        builder
            .push(" AND (tasks.title LIKE ").push(format!("'%{}%'", query))
            .push(" OR tasks.description LIKE ").push(format!("'%{}%'", query))
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
            builder.push(" AND tags.value ");

            add_in_expression(&mut builder, tags);

            if let Some(FilterOption::All) = &params.tag_filter {
                let tag_count: i32 = tags
                    .len()
                    .try_into()
                    .expect("The list of filtered tags should never be greater than i32::MAX");
    
                builder
                .push(" GROUP BY tasks.id HAVING COUNT(DISTINCT tags.value) = ")
                .push_bind(tag_count);
            }
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

fn elapsed_duration(history: &Vec<TaskWorkHistory>) -> i64 {
    history
        .iter()
        .fold(0, |acc, el| acc + (el.end_date - el.start_date).num_seconds())
}

fn get_actual_start(task: &Task, history: &Vec<TaskWorkHistory>) -> Option<NaiveDateTime> {
    if task.status == Status::Doing {
        return task.last_resumed_date;
    }
    
    history
        .iter()
        .map(|hist| hist.start_date)
        .min()
}

fn get_actual_complete(status: &Status, history: &Vec<TaskWorkHistory>) -> Option<NaiveDateTime> {
    if status != &Status::Done {
        return None;
    }

    history
        .iter()
        .map(|hist| hist.end_date)
        .max()
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
) -> TAResult<PagedData<TaskRead>> {
    let mut count_builder = QueryBuilder::<sqlx::Sqlite>::new("SELECT COUNT(DISTINCT id) FROM (");

    count_builder = generate_search_query(count_builder, &params);
    count_builder.push(")");

    let count_query = count_builder.build_query_scalar::<i64>();
    let count = count_query.fetch_one(&db.pool).await.into_ta_result()?;


    let mut task_query = generate_search_query(QueryBuilder::new(""), &params);

    task_query.push(format!(" LIMIT {} OFFSET {}", params.page_size, (params.page - 1) * params.page_size));

    let all_tasks: Vec<Task> = task_query.build_query_as::<Task>().fetch_all(&db.pool).await.into_ta_result()?;

    let mut comments: Vec<Vec<Comment>> = Vec::new();
    let mut tags: Vec<Vec<Tag>> = Vec::new();
    let mut work_history: Vec<Vec<TaskWorkHistory>> = Vec::new();

    for task in all_tasks.iter() {
        let task_comments = sqlx::query_as!(Comment, r#"
            SELECT *
            FROM comments
            WHERE comments.task_id = ?
        "#,
        task.id)
        .fetch_all(&db.pool)
        .await
        .into_ta_result()?;

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
        .into_ta_result()?;

        tags.push(task_tags);

        let task_work_history = sqlx::query_as!(TaskWorkHistory, r#"
            SELECT task_work_history.*
            FROM task_work_history
            WHERE task_work_history.task_id = ?
            ORDER BY task_work_history.start_date DESC
        "#, 
        task.id)
        .fetch_all(&db.pool)
        .await
        .into_ta_result()?;

        work_history.push(task_work_history);
    }

    let task_read = all_tasks
        .into_iter()
        .zip(comments)
        .zip(tags)
        .zip(work_history)
        .map(|(((task, comments), tags), history)| {
            let mut elapsed_duration: i64 = elapsed_duration(&history);
            let actual_start = get_actual_start(&task, &history);
            let actual_complete = get_actual_complete(&task.status, &history);
        
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
                    actual_start_date: actual_start.map(|dt| dt.and_utc()),
                    actual_complete_date: actual_complete.map(|dt| dt.and_utc()),
                    last_resumed_date: task.last_resumed_date.map(|dt| dt.and_utc()),
                    estimated_duration: task.estimated_duration,
                    elapsed_duration,
                    comments: comments
                        .into_iter()
                        .map(|c| c.into())
                        .collect::<Vec<CommentRead>>(),
                    tags,
                    work_history: history.into_iter().map(|hist| hist.into()).collect::<Vec<_>>(),
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
pub async fn start_task(task_id: i64, db: State<'_, Data>) -> TAResult<()> {
    match find_task(task_id, &db).await? {
        Some(model) => set_task_model_active(model, Status::Doing, &db).await,
        None => anyhow_tauri::bail!(not_found_message(task_id)),
    }
}

#[tauri::command]
pub async fn pause_task(task_id: i64, db: State<'_, Data>) -> TAResult<()> {
    match find_task(task_id, &db).await? {
        Some(model) => set_task_model_inactive(model, Status::Paused, &db).await,
        None => anyhow_tauri::bail!(not_found_message(task_id)),    }
}

#[tauri::command]
pub async fn resume_task(task_id: i64, db: State<'_, Data>) -> TAResult<()> {
    match find_task(task_id, &db).await? {
        Some(model) => set_task_model_active(model, Status::Doing, &db).await,
        None => anyhow_tauri::bail!(not_found_message(task_id)),    
    }
}

#[tauri::command]
pub async fn finish_task(task_id: i64, db: State<'_, Data>) -> TAResult<()> {
    match find_task(task_id, &db).await? {
        Some(model) => set_task_model_inactive(model, Status::Done, &db).await,
        None => anyhow_tauri::bail!(not_found_message(task_id)),    
    }
}

#[tauri::command]
pub async fn cancel_task(task_id: i64, db: State<'_, Data>) -> TAResult<()> {
    match find_task(task_id, &db).await? {
        Some(model) => {
            delete_work_history_by_task_id(&model.id, &db).await?;
            set_task_model_inactive(model, Status::Cancelled, &db).await
        }
        None => anyhow_tauri::bail!(not_found_message(task_id)),    
    }
}

#[tauri::command]
pub async fn reopen_task(task_id: i64, db: State<'_, Data>) -> TAResult<()> {
    match find_task(task_id, &db).await? {
        Some(model) => set_task_model_active(model, Status::Doing, &db).await,
        None => anyhow_tauri::bail!(not_found_message(task_id)),
    }
}

#[tauri::command]
pub async fn restore_task(task_id: i64, db: State<'_, Data>) -> TAResult<()> {
    match find_task(task_id, &db).await? {
        Some(model) => set_task_model_inactive(model, Status::Todo, &db).await,
        None => anyhow_tauri::bail!(not_found_message(task_id)),   
    }
}

#[tauri::command]
pub async fn delete_task(task_id: i64, db: State<'_, Data>) -> TAResult<()> {
    match find_task(task_id, &db).await? {
        Some(_) => {
            sqlx::query!("DELETE FROM tasks WHERE tasks.id = ?", task_id)
                .execute(&db.pool)
                .await
                .map(|_|())
                .into_ta_result()?;

            delete_work_history_by_task_id(&task_id, &db).await
        }
        None => anyhow_tauri::bail!(not_found_message(task_id)),    }
}

#[tauri::command]
pub async fn delete_many_tasks(task_ids: Vec<i64>, db: State<'_, Data>) -> TAResult<()> {
    let mut builder = QueryBuilder::new("DELETE FROM tasks WHERE tasks.id");
    add_in_expression(&mut builder, &task_ids);

    builder
        .build()
        .execute(&db.pool)
        .await
        .map(|_|())
        .into_ta_result()
}

#[tauri::command]
pub async fn edit_task(task: EditTask, db: State<'_, Data>) -> TAResult<()> {
    match find_task(task.id, &db).await? {
        Some(model) => {
            let mut existing_task = model.clone();

            existing_task.title = task.title;
            existing_task.description = task.description;
            existing_task.scheduled_start_date = task.scheduled_start_date.map(|dt| dt.naive_utc());
            existing_task.scheduled_complete_date =
                task.scheduled_complete_date.map(|dt| dt.naive_utc());
            existing_task.estimated_duration = task.estimated_duration;


            save_task(existing_task, &db).await
        }
        None => anyhow_tauri::bail!(not_found_message(task.id)),    }
}

#[tauri::command]
pub async fn add_comment(comment: CreateComment, db: State<'_, Data>) -> TAResult<()> {
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
    .into_ta_result()
}

#[tauri::command]
pub async fn update_comment(comment: EditComment, db: State<'_, Data>) -> TAResult<()> {
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
    .into_ta_result()?;

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
    .into_ta_result()
}

#[tauri::command]
pub async fn delete_comment(id: i64, db: State<'_, Data>) -> TAResult<()> {
    sqlx::query!(r#"
            DELETE FROM comments
            WHERE comments.id = ?
        "#, 
        id)
        .execute(&db.pool)
        .await
        .map(|_|())
        .into_ta_result()
}

fn not_found_message(task_id: i64) -> String {
    format!("Task with id '{}' not found.", task_id)
}

async fn delete_work_history_by_task_id(task_id: &i64, db: &State<'_, Data>) ->  TAResult<()> {
    sqlx::query!(r#"
        DELETE FROM task_work_history
        WHERE task_work_history.task_id = ?
    "#,
    task_id)
    .execute(&db.pool)
    .await
    .map(|_|())
    .into_ta_result()
}

async fn save_task(task: Task, db: &State<'_, Data>) -> TAResult<()> {
    sqlx::query!(r#"
        UPDATE tasks
        SET title = ?,
        description = ?,
        status = ?,
        scheduled_start_date = ?,
        scheduled_complete_date = ?,
        last_resumed_date = ?,
        estimated_duration = ?
        WHERE tasks.id = ?
        "#,
        task.title,
        task.description,
        task.status,
        task.scheduled_start_date,
        task.scheduled_complete_date,
        task.last_resumed_date,
        task.estimated_duration,
        task.id)
    .execute(&db.pool)
    .await
    .map(|_|())
    .into_ta_result()
}

/// Find a task by its id.
async fn find_task(task_id: i64, db: &State<'_, Data>) -> TAResult<Option<Task>> {
    sqlx::query_as!(Task, "SELECT * FROM tasks WHERE id = ?", task_id)
        .fetch_optional(&db.pool)
        .await
        .into_ta_result()
}

/// Update the status when transitioning to an active state.
async fn set_task_model_active(mut task: Task, status: Status, db: &State<'_, Data>) -> TAResult<()> {
    task.status = status;
    task.last_resumed_date = Some(Utc::now().naive_utc());
    save_task(task, db).await
}

/// Update the status when transition to a paused or finished state.
async fn set_task_model_inactive(mut task: Task, status: Status, db: &State<'_, Data>) -> TAResult<()> {
    task.status = status;

    if let Some(last_resumed) = task.last_resumed_date {
        // Add an entry into the work history table.
        let last_resumed = last_resumed.round_subsecs(0);
        let now = Utc::now().naive_utc().round_subsecs(0);
        
        sqlx::query!(r#"
            INSERT INTO task_work_history (task_id, start_date, end_date) 
            VALUES (?, ?, ?);
        "#,
        task.id,
        last_resumed,
        now)
        .execute(&db.pool)
        .await
        .map(|_|())
        .into_ta_result()?;

        task.last_resumed_date = None;
    }

    save_task(task, db).await
}

#[tauri::command]
pub async fn add_task_work_history(new_task_work_history: NewTaskWorkHistory, db: State<'_, Data>) -> TAResult<()> {
    let start_date = new_task_work_history.start_date.naive_utc().round_subsecs(0);
    let end_date = new_task_work_history.end_date.naive_utc().round_subsecs(0);
    sqlx::query!(r#"
            INSERT INTO task_work_history (task_id, start_date, end_date)
            VALUES (?, ?, ?)
        "#,
        new_task_work_history.task_id,
        start_date,
        end_date
    )
        .execute(&db.pool)
        .await
        .map(|_|())
        .into_ta_result()
}

#[tauri::command]
pub async fn delete_task_work_history(history_id: i64, db: State<'_, Data>) -> TAResult<()> {
    sqlx::query!(r#"
            DELETE FROM task_work_history
            WHERE task_work_history.id = ?
        "#,
        history_id)
        .execute(&db.pool)
        .await
        .map(|_|())
        .into_ta_result()
}

#[tauri::command]
pub async fn edit_task_work_history(edit_task_work_history: EditTaskWorkHistory, db: State<'_, Data>) -> TAResult<()> {
    let start_date = edit_task_work_history.start_date.naive_utc().round_subsecs(0);
    let end_date = edit_task_work_history.end_date.naive_utc().round_subsecs(0);
    sqlx::query!(r#"
        UPDATE task_work_history
        SET start_date = ?,
        end_date = ?
        WHERE task_work_history.id = ?
    "#,
    start_date,
    end_date,
    edit_task_work_history.id)
    .execute(&db.pool)
    .await
    .map(|_|())
    .into_ta_result()
}