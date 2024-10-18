use sea_orm::*;
use serde_repr::{Deserialize_repr, Serialize_repr};
/// A wrapper around a sqlite connection pool.
pub struct DatabaseWrapper {
    /// The connection pool used to execute SQL queries.
    pub connection: DatabaseConnection,
}

/// Connect to the database.
///
/// ### Returns
/// * A sqlite connection pool used for executing queries.
pub async fn establish_connection() -> Result<DatabaseConnection, DbErr> {
    let env: &str = include_str!("../.env");

    dotenvy::from_read(env.as_bytes()).unwrap();

    let db_url =
        std::env::var("DATABASE_URL").expect("Unable to read DATABASE_URL from environment.");

    Database::connect(ConnectOptions::new(db_url)).await
}

#[derive(Debug, Clone, Default, Eq, PartialEq, Serialize_repr, Deserialize_repr)]
#[repr(u8)]
pub enum SortDirection {
    #[default]
    Ascending,
    Descending,
}
