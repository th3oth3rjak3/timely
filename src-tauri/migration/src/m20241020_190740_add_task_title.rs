use sea_orm_migration::{prelude::*, schema::*};

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .alter_table(
                sea_query::Table::alter()
                    .table(Task::Table)
                    .add_column(string(Task::Title).default("Untitled"))
                    .to_owned(),
            )
            .await
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .alter_table(
                sea_query::Table::alter()
                    .table(Task::Table)
                    .drop_column(Task::Title)
                    .to_owned(),
            )
            .await
    }
}

#[derive(DeriveIden)]
pub enum Task {
    Table,
    Title,
}
