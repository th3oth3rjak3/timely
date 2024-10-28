CREATE TABLE IF NOT EXISTS user_settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
    page_size INTEGER NOT NULL,
    home_page TEXT NOT NULL
);
DELETE FROM user_settings;
INSERT INTO user_settings (id, page_size, home_page)
VALUES (1, 5, '/tasks');