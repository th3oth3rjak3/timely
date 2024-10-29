use std::{env, sync::Arc};

use diesel::{prelude::*, r2d2::ConnectionManager};

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

    // TODO: run diesel migrations here.

    pool
}
