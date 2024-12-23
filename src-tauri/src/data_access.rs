use sqlx::{migrate::Migrator, sqlite::SqlitePoolOptions, SqlitePool};
use std::env;

static MIGRATOR: Migrator = sqlx::migrate!();

pub struct Data {
    pub pool: SqlitePool,
}

pub async fn establish_connection_pool() -> SqlitePool {
    let env: &str = include_str!("../.env");

    dotenvy::from_read(env.as_bytes()).unwrap();

    // Get the DATABASE_URL from the environment
    let database_url = env::var("DATABASE_URL").expect("DATABASE_URL must be set.");

    // Create a connection pool with SQLx
    let pool = SqlitePoolOptions::new()
        .max_connections(5) // You can adjust the max connections to your needs
        .connect(&database_url)
        .await
        .expect("Failed to create connection pool");

    // Run pending migrations (if any)
    MIGRATOR
        .run(&pool)
        .await
        .expect("Could not run migrations.");

    pool
}
