CREATE TABLE IF NOT EXISTS comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
    task_id INTEGER NOT NULL,
    message TEXT NOT NULL,
    created INTEGER NOT NULL,
    modified INTEGER,
    FOREIGN KEY(task_id) REFERENCES tasks(id) ON DELETE CASCADE ON UPDATE CASCADE
);