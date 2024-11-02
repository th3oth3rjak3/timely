CREATE TABLE IF NOT EXISTS user_settings_copy (
    id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
    page_size INTEGER NOT NULL,
    home_page TEXT NOT NULL,
    color_scheme TEXT NOT NULL DEFAULT 'blue' button_variant TEXT NOT NULL DEFAULT 'filled'
);
INSERT INTO user_settings_copy (
        id,
        page_size,
        home_page,
        color_scheme,
        button_variant
    )
SELECT id,
    page_size,
    home_page,
    color_scheme,
    button_variant
FROM user_settings;
DROP TABLE user_settings;
ALTER TABLE user_settings_copy
    RENAME TO user_settings;