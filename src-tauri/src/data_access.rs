use std::{env, sync::Arc};

use diesel::{prelude::*, r2d2::ConnectionManager};
use dotenvy::dotenv;
use migration::{Migrator, MigratorTrait};
use sea_orm::*;

pub type Pool = r2d2::Pool<ConnectionManager<SqliteConnection>>;
pub type PooledConn = r2d2::PooledConnection<ConnectionManager<SqliteConnection>>;

/// A wrapper around a sqlite connection pool.
pub struct Db {
    /// The connection pool used to execute SQL queries.
    pub connection: DatabaseConnection,
}

pub struct Diesel {
    pub pool: Arc<Pool>,
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

pub fn enable_foreign_keys(conn: &mut SqliteConnection) {
    diesel::sql_query("PRAGMA foreign_keys = ON;")
        .execute(conn)
        .expect("Foreign Keys could not be enabled.");
}

pub fn establish_connection_pool() -> Pool {
    dotenv().ok();

    let database_url = env::var("DATABASE_URL").expect("DATABASE_URL must be set.");
    let manager = ConnectionManager::<SqliteConnection>::new(&database_url);
    let pool = Pool::builder()
        .build(manager)
        .expect("Failed to create connection pool");

    let mut conn = pool.get().expect("Connection to exist");
    enable_foreign_keys(&mut conn);

    // TODO: run diesel migrations here.

    pool
}
