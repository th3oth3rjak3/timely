use migration::{Migrator, MigratorTrait};
use sea_orm::*;
/// A wrapper around a sqlite connection pool.
pub struct Db {
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

    let db = Database::connect(ConnectOptions::new(db_url)).await?;

    Migrator::up(&db, None).await?;

    Ok(db)
}
