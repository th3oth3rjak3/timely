CREATE TABLE IF NOT EXISTS notification_settings (
    id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    user_setting_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    enabled BOOLEAN NOT NULL DEFAULT 1,
    FOREIGN KEY (user_setting_id) REFERENCES user_settings(id) ON DELETE CASCADE
);
INSERT INTO notification_settings (id, user_setting_id, name, enabled)
VALUES (1, 1, 'Add New Tag', 1),
    (2, 1, 'Delete Tag', 1),
    (3, 1, 'Edit Tag', 1),
    (4, 1, 'Add Tag To Task', 1),
    (5, 1, 'Remove Tag From Task', 1),
    (6, 1, 'Add New Task', 1),
    (7, 1, 'Edit Task', 1),
    (8, 1, 'Start Task', 1),
    (9, 1, 'Pause Task', 1),
    (10, 1, 'Finish Task', 1),
    (11, 1, 'Cancel Task', 1),
    (12, 1, 'Restore Cancelled Task', 1),
    (13, 1, 'Reopen Finished Task', 1),
    (14, 1, 'Delete Task', 1),
    (15, 1, 'Edit Settings', 1),
    (16, 1, 'Refresh Tasks', 1),
    (17, 1, 'Resume Task', 1),
    (18, 1, 'Add New Comment', 1),
    (19, 1, 'Edit Comment', 1),
    (20, 1, 'Delete Comment', 1);