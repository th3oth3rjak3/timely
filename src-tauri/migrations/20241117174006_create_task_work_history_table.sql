-- Create the task_work_history table
CREATE TABLE IF NOT EXISTS task_work_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
    task_id INTEGER NOT NULL,
    start_date INTEGER NOT NULL,
    end_date INTEGER,
    FOREIGN KEY(task_id) REFERENCES tasks(id) ON DELETE CASCADE ON UPDATE CASCADE
);