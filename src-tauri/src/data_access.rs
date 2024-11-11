use std::env;
use sqlx::{migrate::Migrator, sqlite::SqlitePoolOptions, SqlitePool};

static MIGRATOR: Migrator = sqlx::migrate!();

pub struct Data {
    pub pool: SqlitePool,
}

// pub fn enable_foreign_keys(conn: &mut SqliteConnection) {
//     diesel::sql_query("PRAGMA foreign_keys = ON;")
//         .execute(conn)
//         .expect("Foreign Keys could not be enabled.");
// }

// pub fn enable_write_ahead_log(conn: &mut SqliteConnection) {
//     diesel::sql_query("PRAGMA journal_mode=WAL;")
//         .execute(conn)
//         .expect("Failed to set journal mode to WAL.");
// }

// pub fn enable_query_lock_timeout(conn: &mut SqliteConnection) {
//     diesel::sql_query("PRAGMA busy_timeout = 5000;")
//         .execute(conn)
//         .expect("Failed to set busy timeout.");
// }

// pub fn establish_connection_pool() -> Pool {
//     let env: &str = include_str!("../.env");

//     dotenvy::from_read(env.as_bytes()).unwrap();

//     let database_url = env::var("DATABASE_URL").expect("DATABASE_URL must be set.");
//     let manager = ConnectionManager::<SqliteConnection>::new(&database_url);
//     let pool = Pool::builder()
//         .build(manager)
//         .expect("Failed to create connection pool");

//     let mut conn = pool.get().expect("Connection to exist");
//     enable_foreign_keys(&mut conn);
//     enable_write_ahead_log(&mut conn);
//     enable_query_lock_timeout(&mut conn);

//     conn.run_pending_migrations(MIGRATIONS)
//         .expect("Could not run migrations.");

//     pool
// }

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