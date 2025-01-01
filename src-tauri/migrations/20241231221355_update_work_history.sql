-- Create the altered table
CREATE TABLE IF NOT EXISTS task_work_history_backup (
    id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
    task_id INTEGER NOT NULL,
    start_date INTEGER NOT NULL,
    end_date INTEGER,
    FOREIGN KEY(task_id) REFERENCES tasks(id) ON DELETE CASCADE ON UPDATE CASCADE
);

-- Copy existing data
INSERT INTO task_work_history_backup
SELECT id, task_id, 0, NULL
FROM task_work_history;

-- Drop the old table
DROP TABLE IF EXISTS task_work_history;

-- Rename the new table
ALTER TABLE task_work_history_backup RENAME TO task_work_history;

-- Create backup tasks table to remove the last_resumed_date column
CREATE TABLE IF NOT EXISTS tasks_backup (
    id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Todo',
    scheduled_start_date INTEGER,
    scheduled_complete_date INTEGER,
    actual_start_date INTEGER,
    actual_complete_date INTEGER,
    estimated_duration INTEGER
);

-- Insert data from tasks into tasks_backup
INSERT INTO tasks_backup
SELECT id, title, description, status, NULL, NULL, NULL, NULL, estimated_duration
FROM tasks;

-- Drop the tasks table if it exists
DROP TABLE IF EXISTS tasks;

-- Rename tasks_backup to tasks
ALTER TABLE tasks_backup RENAME TO tasks;

-- Create backup comments table
CREATE TABLE IF NOT EXISTS comments_backup (
    id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
    task_id INTEGER NOT NULL,
    message TEXT NOT NULL,
    created INTEGER NOT NULL,
    modified INTEGER,
    FOREIGN KEY(task_id) REFERENCES tasks(id) ON DELETE CASCADE ON UPDATE CASCADE
);

-- Insert comment data into backup table
INSERT INTO comments_backup
SELECT id, task_id, message, 0, NULL
FROM comments;

-- Drop old comments table
DROP TABLE IF EXISTS comments;

-- Alter backup table for rename
ALTER TABLE comments_backup RENAME TO comments;