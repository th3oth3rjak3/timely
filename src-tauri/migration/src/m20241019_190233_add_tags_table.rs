use sea_orm_migration::{prelude::*, schema::*};

use crate::m20241014_210731_create_task_table::Task;

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .create_table(
                Table::create()
                    .table(Tags::Table)
                    .if_not_exists()
                    .col(pk_auto(Tags::Id))
                    .col(string(Tags::Value))
                    .to_owned(),
            )
            .await?;

        manager
            .create_table(
                Table::create()
                    .table(TaskTags::Table)
                    .if_not_exists()
                    .col(pk_auto(TaskTags::Id))
                    .col(integer(TaskTags::TaskId))
                    .col(integer(TaskTags::TagId))
                    .foreign_key(
                        ForeignKey::create()
                            .name("fk-task-tags-task_id")
                            .from(TaskTags::Table, TaskTags::TaskId)
                            .to(Task::Table, Task::Id)
                            .on_delete(ForeignKeyAction::Cascade)
                            .on_update(ForeignKeyAction::Cascade),
                    )
                    .foreign_key(
                        ForeignKey::create()
                            .name("fk-task-tags-tag_id")
                            .from(TaskTags::Table, TaskTags::TagId)
                            .to(Tags::Table, Tags::Id)
                            .on_delete(ForeignKeyAction::Cascade)
                            .on_update(ForeignKeyAction::Cascade),
                    )
                    .to_owned(),
            )
            .await
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .drop_table(Table::drop().table(Tags::Table).to_owned())
            .await?;

        manager
            .drop_table(Table::drop().table(TaskTags::Table).to_owned())
            .await
    }
}

#[derive(DeriveIden)]
enum Tags {
    Table,
    Id,
    Value,
}

#[derive(DeriveIden)]
enum TaskTags {
    Table,
    Id,
    TaskId,
    TagId,
}
