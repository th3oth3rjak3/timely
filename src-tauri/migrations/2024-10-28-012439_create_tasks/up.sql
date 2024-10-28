CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    status TEXT NOT NULL,
    scheduled_start_date DATETIME,
    scheduled_complete_date DATETIME,
    actual_start_date DATETIME,
    actual_complete_date DATETIME,
    last_resumed_date DATETIME,
    estimated_duration INTEGER,
    elapsed_duration INTEGER NOT NULL
);