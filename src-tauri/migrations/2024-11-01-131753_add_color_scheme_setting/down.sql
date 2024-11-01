CREATE TABLE IF NOT EXISTS user_settings_copy (
    id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
    page_size INTEGER NOT NULL,
    home_page TEXT NOT NULL
);
INSERT INTO user_settings_copy (id, page_size, home_page)
SELECT id,
    page_size,
    home_page
FROM user_settings;
DROP TABLE user_settings;
ALTER TABLE user_settings_copy
    RENAME TO user_settings;