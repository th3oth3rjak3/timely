use sea_orm::{EnumIter, Iterable};
use sea_orm_migration::{prelude::*, schema::*};

#[derive(DeriveMigrationName)]
pub struct Migration;

#[derive(Iden, EnumIter)]
pub enum Status {
    #[iden = "Cancelled"]
    Cancelled,
    #[iden = "Doing"]
    Doing,
    #[iden = "Done"]
    Done,
    #[iden = "Paused"]
    Paused,
    #[iden = "Todo"]
    Todo,
}

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .create_table(
                Table::create()
                    .table(Task::Table)
                    .if_not_exists()
                    .col(pk_auto(Task::Id))
                    .col(string(Task::Description))
                    .col(enumeration(
                        Task::Status,
                        Alias::new("status"),
                        Status::iter(),
                    ))
                    .col(date_time_null(Task::ScheduledStartDate))
                    .col(date_time_null(Task::ScheduledCompleteDate))
                    .col(date_time_null(Task::ActualStartDate))
                    .col(date_time_null(Task::ActualCompleteDate))
                    .col(date_time_null(Task::LastResumedDate))
                    .col(integer_null(Task::EstimatedDuration))
                    .col(integer(Task::ElapsedDuration))
                    .to_owned(),
            )
            .await
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .drop_table(Table::drop().table(Task::Table).to_owned())
            .await
    }
}

#[derive(DeriveIden)]
pub enum Task {
    Table,
    Id,
    Description,
    Status,
    ScheduledStartDate,
    ScheduledCompleteDate,
    ActualStartDate,
    ActualCompleteDate,
    LastResumedDate,
    EstimatedDuration,
    ElapsedDuration,
}
