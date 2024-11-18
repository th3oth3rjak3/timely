-- Add migration script here
INSERT INTO notification_settings (id, user_setting_id, name, enabled)
VALUES 
    (21, 1, 'Edit Work History', 1),
    (22, 1, 'Add New Work History', 1),
    (23, 1, 'Delete Work History', 1);
