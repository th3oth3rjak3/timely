use entity::task;
use tauri::State;

use crate::{DatabaseWrapper, PagedData};

use super::*;

#[tauri::command]
pub async fn create_task(
    new_task: data_access::NewTask,
    state: State<'_, DatabaseWrapper>,
) -> Result<(), String> {
    data_access::create_task(new_task, state).await
}

#[tauri::command]
pub async fn get_tasks(
    params: data_access::TaskSearchParams,
    state: State<'_, DatabaseWrapper>,
) -> Result<PagedData<task::Model>, String> {
    data_access::search_for_tasks(state, params).await
}

#[tauri::command]
pub async fn start_task(task_id: i32, state: State<'_, DatabaseWrapper>) -> Result<(), String> {
    data_access::start_task(task_id, state).await
}

#[tauri::command]
pub async fn pause_task(task_id: i32, state: State<'_, DatabaseWrapper>) -> Result<(), String> {
    data_access::pause_task(task_id, state).await
}

#[tauri::command]
pub async fn resume_task(task_id: i32, state: State<'_, DatabaseWrapper>) -> Result<(), String> {
    data_access::resume_task(task_id, state).await
}

#[tauri::command]
pub async fn finish_task(task_id: i32, state: State<'_, DatabaseWrapper>) -> Result<(), String> {
    data_access::finish_task(task_id, state).await
}

#[tauri::command]
pub async fn cancel_task(task_id: i32, state: State<'_, DatabaseWrapper>) -> Result<(), String> {
    data_access::cancel_task(task_id, state).await
}

#[tauri::command]
pub async fn reopen_task(task_id: i32, state: State<'_, DatabaseWrapper>) -> Result<(), String> {
    data_access::reopen_task(task_id, state).await
}

#[tauri::command]
pub async fn restore_task(task_id: i32, state: State<'_, DatabaseWrapper>) -> Result<(), String> {
    data_access::restore_task(task_id, state).await
}

#[tauri::command]
pub async fn delete_task(task_id: i32, state: State<'_, DatabaseWrapper>) -> Result<(), String> {
    data_access::delete_task(task_id, state).await
}

#[tauri::command]
pub async fn edit_task(
    task: data_access::EditTask,
    state: State<'_, DatabaseWrapper>,
) -> Result<(), String> {
    data_access::edit_task(task, state).await
}
