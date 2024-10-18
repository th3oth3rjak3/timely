pub mod data_access;
pub mod features;
pub mod models;
pub mod sql_utilties;

use data_access::*;
use models::*;
use std::env;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let connection = tauri::async_runtime::block_on(establish_connection())
        .expect("Could not connect to the database.");

    // TODO: add migrations.

    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .manage(Db { connection })
        .invoke_handler(tauri::generate_handler![
            features::tasks::get_tasks,
            features::tasks::create_task,
            features::tasks::start_task,
            features::tasks::pause_task,
            features::tasks::resume_task,
            features::tasks::finish_task,
            features::tasks::cancel_task,
            features::tasks::reopen_task,
            features::tasks::restore_task,
            features::tasks::delete_task,
            features::tasks::edit_task,
            features::settings::get_user_settings,
            features::settings::update_user_settings,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
