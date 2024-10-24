pub mod data_access;
pub mod features;
pub mod models;
pub mod sql_utilties;

use ::entity::prelude::*;
use ::entity::task;
use data_access::*;
use models::Queryable;
use models::*;
use sea_orm::prelude::*;
use sea_orm::query::*;
use std::env;

#[tauri::command]
fn test_query_feature(query: Query) {
    let query_result = Query::to_sea_orm_query(query, task::Entity {});

    match query_result {
        Ok(query) => {
            let sql_query = Task::find()
                .filter(query)
                .build(sea_orm::DatabaseBackend::Sqlite);
            println!("{}", sql_query);
        }
        Err(er) => println!("ERROR: {}", er),
    };
}

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
            features::tasks::add_comment,
            features::tasks::update_comment,
            features::tasks::delete_comment,
            features::tasks::remove_tag_from_task,
            features::tasks::get_all_tags,
            features::tasks::add_tag_to_task,
            features::tasks::add_new_tag,
            features::settings::get_user_settings,
            features::settings::update_user_settings,
            test_query_feature,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
