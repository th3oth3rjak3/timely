use std::{env, sync::Arc};

use diesel::{prelude::*, r2d2::ConnectionManager};
use diesel_migrations::{embed_migrations, EmbeddedMigrations, MigrationHarness};

pub const MIGRATIONS: EmbeddedMigrations = embed_migrations!();

pub type Pool = r2d2::Pool<ConnectionManager<SqliteConnection>>;
pub type PooledConn = r2d2::PooledConnection<ConnectionManager<SqliteConnection>>;

pub struct Diesel {
    pub pool: Arc<Pool>,
}

pub fn enable_foreign_keys(conn: &mut SqliteConnection) {
    diesel::sql_query("PRAGMA foreign_keys = ON;")
        .execute(conn)
        .expect("Foreign Keys could not be enabled.");
}

pub fn enable_write_ahead_log(conn: &mut SqliteConnection) {
    diesel::sql_query("PRAGMA journal_mode=WAL;")
        .execute(conn)
        .expect("Failed to set journal mode to WAL.");
}

pub fn enable_query_lock_timeout(conn: &mut SqliteConnection) {
    diesel::sql_query("PRAGMA busy_timeout = 5000;")
        .execute(conn)
        .expect("Failed to set busy timeout.");
}

pub fn establish_connection_pool() -> Pool {
    let env: &str = include_str!("../.env");

    dotenvy::from_read(env.as_bytes()).unwrap();

    let database_url = env::var("DATABASE_URL").expect("DATABASE_URL must be set.");
    let manager = ConnectionManager::<SqliteConnection>::new(&database_url);
    let pool = Pool::builder()
        .build(manager)
        .expect("Failed to create connection pool");

    let mut conn = pool.get().expect("Connection to exist");
    enable_foreign_keys(&mut conn);
    enable_write_ahead_log(&mut conn);
    enable_query_lock_timeout(&mut conn);

    conn.run_pending_migrations(MIGRATIONS)
        .expect("Could not run migrations.");

    pool
}
