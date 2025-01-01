use super::models::Task;
use anyhow_tauri::{IntoTAResult, TAResult};
use sqlx::{QueryBuilder, Sqlite, Transaction};
use tauri::State;

use crate::{
    features::tags::Tag, option_utils::has_contents, query_utils::add_in_expression, Data,
    FilterOption, PagedData, SortDirection,
};

use super::*;

#[tauri::command]
pub async fn create_task(new_task: CreateTask, db: State<'_, Data>) -> TAResult<()> {
    let mut transaction = db.pool.begin().await.into_ta_result()?;
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
    ).execute(&mut *transaction)
    .await
    .into_ta_result()?;

    if has_contents(tags.as_ref()) {
        let tags = tags.unwrap();
        let mut builder = QueryBuilder::new("INSERT INTO task_tags (tag_id, task_id) ");
        builder.push_values(tags, |mut b, tag| {
            b.push_bind(tag.id).push_bind(result.last_insert_rowid());
        });

        builder
            .build()
            .execute(&mut *transaction)
            .await
            .map(|_| ())
            .into_ta_result()?;
    }

    transaction.commit().await.into_ta_result()
}

fn generate_search_query<'a>(
    mut builder: QueryBuilder<'a, sqlx::Sqlite>,
    params: &'a TaskSearchParams,
) -> QueryBuilder<'a, sqlx::Sqlite> {
    builder.push(
        r#"
        SELECT DISTINCT tasks.* 
        FROM tasks
        LEFT JOIN task_tags on tasks.id = task_tags.task_id
        LEFT JOIN tags on tags.id = task_tags.tag_id
    "#,
    );

    builder.push(" WHERE 1=1 ");

    builder.push(" AND tasks.status ");
    add_in_expression(&mut builder, &params.statuses);

    if let Some(query) = &params.query_string {
        builder
            .push(" AND (tasks.title LIKE ")
            .push(format!("'%{}%'", query))
            .push(" OR tasks.description LIKE ")
            .push(format!("'%{}%'", query))
            .push(") ");
    }

    if let Some(DateFilter {
        start: Some(start),
        end: Some(end),
    }) = &params.start_by_filter
    {
        builder
            .push(" AND tasks.scheduled_start_date BETWEEN ")
            .push_bind(UnixTimestamp::from(start))
            .push(" AND ")
            .push_bind(UnixTimestamp::from(end));
    }

    if let Some(DateFilter {
        start: Some(start),
        end: Some(end),
    }) = &params.due_by_filter
    {
        builder
            .push(" AND tasks.scheduled_complete_date BETWEEN ")
            .push_bind(UnixTimestamp::from(start))
            .push(" AND ")
            .push_bind(UnixTimestamp::from(end));
    }

    if let Some(ref quick_filter) = &params.quick_filter {
        match quick_filter {
            QuickFilter::Untagged => {
                builder.push(" AND task_tags.task_id IS NULL ");
            }
            QuickFilter::Tagged(tag_filter) => {
                builder.push(" AND tags.value ");

                add_in_expression(&mut builder, &tag_filter.tags);

                if &tag_filter.tag_filter == &FilterOption::All {
                    let tag_count: i32 =
                        tag_filter.tags.len().try_into().expect(
                            "The list of filtered tags should never be greater than i32::MAX",
                        );

                    builder
                        .push(" GROUP BY tasks.id HAVING COUNT(DISTINCT tags.value) = ")
                        .push_bind(tag_count);
                }
            }
            QuickFilter::Planned => {
                builder.push(
                    r#" 
                    AND tasks.estimated_duration IS NOT NULL 
                    AND tasks.scheduled_start_date IS NOT NULL 
                    AND tasks.scheduled_complete_date IS NOT NULL 
                "#,
                );
            }
            QuickFilter::Unplanned => {
                builder.push(
                    r#"
                    AND (
                        tasks.estimated_duration IS NULL
                        OR tasks.scheduled_start_date IS NULL
                        OR tasks.scheduled_complete_date IS NULL) 
                "#,
                );
            }
            QuickFilter::LateStart => {
                builder.push(
                    r#" 
                    AND tasks.scheduled_start_date IS NOT NULL
                    AND tasks.last_resumed_date IS NULL
                    AND (tasks.scheduled_start_date < 
                "#,
                );
                builder.push_bind(UnixTimestamp::now());
                builder.push(
                    r#" AND tasks.id NOT IN (
                    SELECT DISTINCT t.id
                    FROM tasks t
                    INNER JOIN task_work_history twh ON t.id = twh.task_id))
                "#,
                );
            }
            QuickFilter::Overdue => {
                builder.push(
                    r#"
                    AND tasks.scheduled_complete_date IS NOT NULL
                    AND (tasks.scheduled_complete_date < 
                "#,
                );
                builder.push_bind(UnixTimestamp::now());
                builder.push(" AND tasks.status <> 'Done') ");
            }
        }
    }

    match params.ordering.sort_direction {
        SortDirection::Ascending => match params.ordering.order_by.as_str() {
            "title" => builder.push(" ORDER BY LOWER(tasks.title) ASC"),
            "status" => builder.push(" ORDER BY LOWER(tasks.status) ASC"),
            "description" => builder.push(" ORDER BY LOWER(tasks.description) ASC"),
            "scheduled_start_date" => builder.push(" ORDER BY tasks.scheduled_start_date IS NULL ASC, tasks.scheduled_start_date ASC"),
            "scheduled_complete_date" => builder.push(" ORDER BY tasks.scheduled_complete_date IS NULL ASC, tasks.scheduled_complete_date ASC"),
            _ => &mut builder
        },
        SortDirection::Descending => match params.ordering.order_by.as_str() {
            "title" => builder.push(" ORDER BY LOWER(tasks.title) DESC"),
            "status" => builder.push(" ORDER BY LOWER(tasks.status) DESC"),
            "description" => builder.push(" ORDER BY LOWER(tasks.description) DESC"),
            "scheduled_start_date" => builder.push(" ORDER BY tasks.scheduled_start_date IS NULL DESC, tasks.scheduled_start_date DESC"),
            "scheduled_complete_date" => builder.push(" ORDER BY tasks.scheduled_complete_date IS NULL DESC, tasks.scheduled_complete_date DESC"),
            _ => &mut builder
        },
    };

    builder
}

fn elapsed_duration(history: &Vec<TaskWorkHistory>) -> i64 {
    history.iter().fold(0, |acc, el| {
        acc + (el.end_date - el.start_date)
    })
}

fn get_actual_start(history: &Vec<TaskWorkHistory>) -> OptionalUnixTimestamp {
    history.iter().map(|hist| hist.start_date).min().into()
}

fn get_actual_complete(status: &Status, history: &Vec<TaskWorkHistory>) -> Option<UnixTimestamp> {
    if status != &Status::Done {
        return None;
    }

    history.iter().map(|hist| hist.end_date).max()
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

    task_query.push(format!(
        " LIMIT {} OFFSET {}",
        params.page_size,
        (params.page - 1) * params.page_size
    ));

    let all_tasks: Vec<Task> = task_query
        .build_query_as::<Task>()
        .fetch_all(&db.pool)
        .await
        .into_ta_result()?;

    let mut comments: Vec<Vec<Comment>> = Vec::new();
    let mut tags: Vec<Vec<Tag>> = Vec::new();
    let mut work_history: Vec<Vec<TaskWorkHistory>> = Vec::new();

    for task in all_tasks.iter() {
        let task_comments = sqlx::query_as!(
            Comment,
            r#"
            SELECT *
            FROM comments
            WHERE comments.task_id = ?
        "#,
            task.id
        )
        .fetch_all(&db.pool)
        .await
        .into_ta_result()?;

        comments.push(task_comments);

        let task_tags = sqlx::query_as!(
            Tag,
            r#"
            SELECT tags.*
            FROM tags
            INNER JOIN task_tags on task_tags.tag_id = tags.id
            WHERE task_tags.task_id = ?
        "#,
            task.id
        )
        .fetch_all(&db.pool)
        .await
        .into_ta_result()?;

        tags.push(task_tags);

        let task_work_history = sqlx::query_as!(
            TaskWorkHistory,
            r#"
            SELECT twh.id, twh.task_id, twh.start_date, COALESCE(twh.end_date, CAST(strftime('%s', 'now') as INTEGER)) AS end_date
            FROM task_work_history twh
            WHERE twh.task_id = ?
            ORDER BY twh.start_date DESC
        "#,
            task.id
        )
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
            let elapsed_duration: i64 = elapsed_duration(&history);
            let actual_start = get_actual_start(&history);
            let actual_complete = get_actual_complete(&task.status, &history);

            TaskRead {
                id: task.id,
                title: task.title,
                description: task.description,
                status: task.status,
                scheduled_start_date: task.scheduled_start_date.into(),
                scheduled_complete_date: task.scheduled_complete_date.into(),
                actual_start_date: actual_start.into(),
                actual_complete_date: actual_complete.map(|value| value.into()),
                estimated_duration: task.estimated_duration.into(),
                elapsed_duration,
                comments: comments
                    .into_iter()
                    .map(|c| c.into())
                    .collect::<Vec<CommentRead>>(),
                tags,
                work_history: history
                    .into_iter()
                    .map(|hist| hist.into())
                    .collect::<Vec<_>>(),
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
        None => anyhow_tauri::bail!(not_found_message(task_id)),
    }
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
                .map(|_| ())
                .into_ta_result()?;

            delete_work_history_by_task_id(&task_id, &db).await
        }
        None => anyhow_tauri::bail!(not_found_message(task_id)),
    }
}

#[tauri::command]
pub async fn delete_many_tasks(task_ids: Vec<i64>, db: State<'_, Data>) -> TAResult<()> {
    let mut builder = QueryBuilder::new("DELETE FROM tasks WHERE tasks.id");
    add_in_expression(&mut builder, &task_ids);

    builder
        .build()
        .execute(&db.pool)
        .await
        .map(|_| ())
        .into_ta_result()
}

#[tauri::command]
pub async fn edit_task(task: EditTask, db: State<'_, Data>) -> TAResult<()> {
    match find_task(task.id, &db).await? {
        Some(model) => {
            let mut existing_task = model.clone();

            existing_task.title = task.title;
            existing_task.description = task.description;
            existing_task.scheduled_start_date = task.scheduled_start_date.into();
            existing_task.scheduled_complete_date = task.scheduled_complete_date.into();
            existing_task.estimated_duration = task.estimated_duration.into();
            let mut transaction = db.pool.begin().await.into_ta_result()?;
            save_task(existing_task, &mut transaction).await?;

            transaction.commit().await.into_ta_result()
        }
        None => anyhow_tauri::bail!(not_found_message(task.id)),
    }
}

#[tauri::command]
pub async fn add_comment(comment: CreateComment, db: State<'_, Data>) -> TAResult<()> {
    let model = NewComment::from(comment);

    sqlx::query!(
        r#"
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
    .map(|_| ())
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
    found.modified = OptionalUnixTimestamp::now();

    sqlx::query!(
        r#"
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
    .map(|_| ())
    .into_ta_result()
}

#[tauri::command]
pub async fn delete_comment(id: i64, db: State<'_, Data>) -> TAResult<()> {
    sqlx::query!(
        r#"
            DELETE FROM comments
            WHERE comments.id = ?
        "#,
        id
    )
    .execute(&db.pool)
    .await
    .map(|_| ())
    .into_ta_result()
}

fn not_found_message(task_id: i64) -> String {
    format!("Task with id '{}' not found.", task_id)
}

async fn delete_work_history_by_task_id(task_id: &i64, db: &State<'_, Data>) -> TAResult<()> {
    sqlx::query!(
        r#"
        DELETE FROM task_work_history
        WHERE task_work_history.task_id = ?
    "#,
        task_id
    )
    .execute(&db.pool)
    .await
    .map(|_| ())
    .into_ta_result()
}

async fn save_task(task: Task, transaction: &mut Transaction<'_, Sqlite>) -> TAResult<()> {
    sqlx::query!(
        r#"
        UPDATE tasks
        SET title = ?,
        description = ?,
        status = ?,
        scheduled_start_date = ?,
        scheduled_complete_date = ?,
        estimated_duration = ?
        WHERE tasks.id = ?
        "#,
        task.title,
        task.description,
        task.status,
        task.scheduled_start_date,
        task.scheduled_complete_date,
        task.estimated_duration,
        task.id
    )
    .execute(&mut **transaction)
    .await
    .map(|_| ())
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
async fn set_task_model_active(
    mut task: Task,
    status: Status,
    db: &State<'_, Data>,
) -> TAResult<()> {
    task.status = status;

    let mut transaction = db.pool.begin().await.into_ta_result()?;
    let result = async {

        sqlx::query!("DELETE FROM task_work_history WHERE end_date IS NULL")
        .execute(&mut *transaction)
        .await
        .map(|_|())
        .into_ta_result()?;
    
        let now = OptionalUnixTimestamp::now();
        let duration = OptionalDurationInSeconds::none();
        
        sqlx::query!(
            r#"
            INSERT INTO task_work_history (task_id, start_date, end_date) 
            VALUES (?, ?, ?);
            "#,
            task.id,
            now,
            duration,
        )
        .execute(&mut *transaction)
        .await
        .map(|_|())
        .into_ta_result()?;

        save_task(task, &mut transaction).await
    }.await;

    match result {
        Ok(()) => transaction.commit().await.into_ta_result(),
        Err(e) => {
            transaction.rollback().await.into_ta_result()?;
            Err(e)
        }
    }
}

/// Update the status when transition to a paused or finished state.
async fn set_task_model_inactive(
    mut task: Task,
    status: Status,
    db: &State<'_, Data>,
) -> TAResult<()> {
    task.status = status;

    let mut transaction = db.pool.begin().await.into_ta_result()?;
    let result = async {
        let existing = sqlx::query_as!(
            TaskWorkHistory, 
            r#"
            SELECT * from task_work_history twh
            WHERE twh.task_id = ?
            AND twh.end_date IS NULL
            LIMIT 1
            "#,
            task.id
        )
        .fetch_optional(&mut *transaction)
        .await
        .into_ta_result()?;
    
    
        if let Some(existing) = existing {
            let now = OptionalUnixTimestamp::now();
            
            sqlx::query!(
                r#"
                UPDATE task_work_history 
                SET end_date = ?
                WHERE id = ?
                "#,
                now,
                existing.id,
            )
            .execute(&mut *transaction)
            .await
            .map(|_| ())
            .into_ta_result()?;
        }

        save_task(task, &mut transaction).await
    }.await;

    match result {
        Ok(()) => transaction.commit().await.into_ta_result(),
        Err(e) => {
            transaction.rollback().await.into_ta_result()?;
            Err(e)
        }
    }
}

#[tauri::command]
pub async fn add_task_work_history(
    new_task_work_history: NewTaskWorkHistory,
    db: State<'_, Data>,
) -> TAResult<()> {
    let start_date: UnixTimestamp = UnixTimestamp::from(&new_task_work_history.start_date);
    let end_date: OptionalUnixTimestamp = OptionalUnixTimestamp::some(new_task_work_history.end_date);
    sqlx::query!(
        r#"
            INSERT INTO task_work_history (task_id, start_date, end_date)
            VALUES (?, ?, ?)
        "#,
        new_task_work_history.task_id,
        start_date,
        end_date
    )
    .execute(&db.pool)
    .await
    .map(|_| ())
    .into_ta_result()
}

#[tauri::command]
pub async fn delete_task_work_history(history_id: i64, db: State<'_, Data>) -> TAResult<()> {
    sqlx::query!(
        r#"
            DELETE FROM task_work_history
            WHERE task_work_history.id = ?
        "#,
        history_id
    )
    .execute(&db.pool)
    .await
    .map(|_| ())
    .into_ta_result()
}

#[tauri::command]
pub async fn edit_task_work_history(
    edit_task_work_history: EditTaskWorkHistory,
    db: State<'_, Data>,
) -> TAResult<()> {
    let start_date: UnixTimestamp = UnixTimestamp::from(&edit_task_work_history.start_date);
    let end_date: OptionalUnixTimestamp = OptionalUnixTimestamp::some(edit_task_work_history.end_date);

    sqlx::query!(
        r#"
        UPDATE task_work_history
        SET start_date = ?,
        end_date = ?
        WHERE task_work_history.id = ?
    "#,
        start_date,
        end_date,
        edit_task_work_history.id
    )
    .execute(&db.pool)
    .await
    .map(|_| ())
    .into_ta_result()
}
