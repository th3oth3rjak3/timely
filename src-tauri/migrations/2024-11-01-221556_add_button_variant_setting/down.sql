CREATE TABLE IF NOT EXISTS user_settings_copy (
    id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
    page_size INTEGER NOT NULL,
    home_page TEXT NOT NULL,
    color_scheme TEXT NOT NULL DEFAULT 'blue'
);
INSERT INTO user_settings_copy (id, page_size, home_page, color_scheme)
SELECT id,
    page_size,
    home_page,
    color_scheme
FROM user_settings;
DROP TABLE user_settings;
ALTER TABLE user_settings_copy
    RENAME TO user_settings;