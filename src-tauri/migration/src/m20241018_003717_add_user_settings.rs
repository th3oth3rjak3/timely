use sea_orm_migration::{prelude::*, schema::*};

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .create_table(
                Table::create()
                    .table(UserSettings::Table)
                    .if_not_exists()
                    .col(pk_auto(UserSettings::Id))
                    .col(integer(UserSettings::PageSize))
                    .col(string(UserSettings::HomePage))
                    .to_owned(),
            )
            .await?;

        let query = Query::insert()
            .into_table(UserSettings::Table)
            .columns([UserSettings::PageSize, UserSettings::HomePage])
            .values_panic(["10".into(), "/tasks".into()])
            .to_owned();

        manager.exec_stmt(query).await
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .drop_table(Table::drop().table(UserSettings::Table).to_owned())
            .await
    }
}

#[derive(DeriveIden)]
enum UserSettings {
    Table,
    Id,
    PageSize,
    HomePage,
}
