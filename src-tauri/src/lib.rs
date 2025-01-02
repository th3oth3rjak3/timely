pub mod data_access;
pub mod features;
pub mod models;
pub mod option_utils;
pub mod query_utils;

use data_access::*;
use models::*;
use std::env;
use tauri::{async_runtime::block_on, Manager};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    

    tauri::Builder::default()
        .setup(|app| {
            let path = app.path().app_data_dir().expect("App Data Directory is required to run this application.");
            if !path.exists() {
                std::fs::create_dir(&path).expect("Could not create application bundle location in data directory");
            }
            let pool = block_on(establish_connection_pool(path));
            app.manage(Data { pool });
            Ok(())
        })
        .plugin(tauri_plugin_shell::init())
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
            features::tasks::delete_many_tasks,
            features::tasks::edit_task,
            features::tasks::add_comment,
            features::tasks::update_comment,
            features::tasks::delete_comment,
            features::tasks::add_task_work_history,
            features::tasks::edit_task_work_history,
            features::tasks::delete_task_work_history,
            features::tags::get_tags,
            features::tags::edit_tag,
            features::tags::delete_tag,
            features::tags::delete_many_tags,
            features::tags::remove_tag_from_task,
            features::tags::get_all_tags,
            features::tags::add_tag_to_task,
            features::tags::add_new_tag,
            features::settings::get_user_settings,
            features::settings::update_user_settings,
            features::metrics::get_metrics,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
