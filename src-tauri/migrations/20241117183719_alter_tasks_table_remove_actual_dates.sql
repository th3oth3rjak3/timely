-- Add migration script here
-- Create the tasks_backup table
CREATE TABLE IF NOT EXISTS tasks_backup (
    id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Todo',
    scheduled_start_date DATETIME,
    scheduled_complete_date DATETIME,
    last_resumed_date DATETIME,
    estimated_duration INTEGER
);

-- Insert data from tasks into tasks_backup
INSERT INTO tasks_backup
SELECT id, title, description, status, scheduled_start_date, scheduled_complete_date, last_resumed_date, estimated_duration
FROM tasks;

-- Drop the tasks table if it exists
DROP TABLE IF EXISTS tasks;

-- Rename tasks_backup to tasks
ALTER TABLE tasks_backup RENAME TO tasks;