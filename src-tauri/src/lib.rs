pub mod data_access;
pub mod features;
pub mod models;

use data_access::*;
use models::*;
use tauri::async_runtime::block_on;
use std::env;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let pool = block_on(establish_connection_pool());

    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .manage(Data { pool })
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
            features::tasks::add_comment,
            features::tasks::update_comment,
            features::tasks::delete_comment,
            features::tasks::remove_tag_from_task,
            features::tasks::get_all_tags,
            features::tasks::add_tag_to_task,
            features::tasks::add_new_tag,
            features::tags::get_tags,
            features::tags::edit_tag,
            features::tags::delete_tag,
            features::settings::get_user_settings,
            features::settings::update_user_settings,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
