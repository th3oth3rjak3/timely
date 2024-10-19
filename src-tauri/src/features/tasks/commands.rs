use tauri::State;

use crate::{Db, PagedData};

use super::*;

#[tauri::command]
pub async fn create_task(
    new_task: data_access::NewTask,
    state: State<'_, Db>,
) -> Result<(), String> {
    data_access::create_task(new_task, state).await
}

#[tauri::command]
pub async fn get_tasks(
    params: data_access::TaskSearchParams,
    state: State<'_, Db>,
) -> Result<PagedData<TaskRead>, String> {
    data_access::search_for_tasks(state, params).await
}

#[tauri::command]
pub async fn start_task(task_id: i32, state: State<'_, Db>) -> Result<(), String> {
    data_access::start_task(task_id, state).await
}

#[tauri::command]
pub async fn pause_task(task_id: i32, state: State<'_, Db>) -> Result<(), String> {
    data_access::pause_task(task_id, state).await
}

#[tauri::command]
pub async fn resume_task(task_id: i32, state: State<'_, Db>) -> Result<(), String> {
    data_access::resume_task(task_id, state).await
}

#[tauri::command]
pub async fn finish_task(task_id: i32, state: State<'_, Db>) -> Result<(), String> {
    data_access::finish_task(task_id, state).await
}

#[tauri::command]
pub async fn cancel_task(task_id: i32, state: State<'_, Db>) -> Result<(), String> {
    data_access::cancel_task(task_id, state).await
}

#[tauri::command]
pub async fn reopen_task(task_id: i32, state: State<'_, Db>) -> Result<(), String> {
    data_access::reopen_task(task_id, state).await
}

#[tauri::command]
pub async fn restore_task(task_id: i32, state: State<'_, Db>) -> Result<(), String> {
    data_access::restore_task(task_id, state).await
}

#[tauri::command]
pub async fn delete_task(task_id: i32, state: State<'_, Db>) -> Result<(), String> {
    data_access::delete_task(task_id, state).await
}

#[tauri::command]
pub async fn edit_task(task: data_access::EditTask, state: State<'_, Db>) -> Result<(), String> {
    data_access::edit_task(task, state).await
}

#[tauri::command]
pub async fn add_comment(
    comment: data_access::NewComment,
    state: State<'_, Db>,
) -> Result<(), String> {
    data_access::add_comment(comment, state).await
}

#[tauri::command]
pub async fn update_comment(
    comment: data_access::EditComment,
    state: State<'_, Db>,
) -> Result<(), String> {
    data_access::update_comment(comment, state).await
}

#[tauri::command]
pub async fn delete_comment(id: i64, db: State<'_, Db>) -> Result<(), String> {
    data_access::delete_comment(id, db).await
}
