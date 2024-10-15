pub mod data_access;
pub mod models;
pub mod sql_utilties;

use data_access::*;
use entity::task;
use models::*;
use std::env;
use tauri::State;

#[tauri::command]
async fn create_task(
    new_task: NewTask,
    params: TaskSearchParams,
    state: State<'_, DatabaseWrapper>,
) -> Result<PagedData<task::Model>, String> {
    data_access::create_new_task(state, new_task, params).await
}

#[tauri::command]
async fn get_tasks(
    params: TaskSearchParams,
    state: State<'_, DatabaseWrapper>,
) -> Result<PagedData<task::Model>, String> {
    data_access::search_for_tasks(state, params).await
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let connection = tauri::async_runtime::block_on(establish_connection())
        .expect("Could not connect to the database.");

    //tauri::async_runtime::block_on(run_migrations(&client));

    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .manage(DatabaseWrapper { connection })
        .invoke_handler(tauri::generate_handler![get_tasks, create_task])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
