//! `SeaORM` Entity, @generated by sea-orm-codegen 1.0.0

use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Eq, Serialize, Deserialize)]
#[sea_orm(table_name = "task")]
#[serde(rename_all = "camelCase")]
pub struct Model {
    #[sea_orm(primary_key)]
    pub id: i64,
    pub description: String,
    #[sea_orm(column_type = "custom(\"enum_text\")")]
    pub status: String,
    pub scheduled_start_date: Option<DateTimeUtc>,
    pub scheduled_complete_date: Option<DateTimeUtc>,
    pub actual_start_date: Option<DateTimeUtc>,
    pub actual_complete_date: Option<DateTimeUtc>,
    pub last_resumed_date: Option<DateTimeUtc>,
    pub estimated_duration: Option<i64>,
    pub elapsed_duration: i64,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {
    #[sea_orm(has_many = "super::comment::Entity")]
    Comment,
}

impl Related<super::comment::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::Comment.def()
    }
}

impl ActiveModelBehavior for ActiveModel {}
