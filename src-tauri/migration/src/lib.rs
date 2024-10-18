pub use sea_orm_migration::prelude::*;

mod m20241014_210731_create_task_table;
mod m20241018_003717_add_user_settings;

pub struct Migrator;

#[async_trait::async_trait]
impl MigratorTrait for Migrator {
    fn migrations() -> Vec<Box<dyn MigrationTrait>> {
        vec![
            Box::new(m20241014_210731_create_task_table::Migration),
            Box::new(m20241018_003717_add_user_settings::Migration),
        ]
    }
}
