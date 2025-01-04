CREATE TABLE IF NOT EXISTS user_settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
    page_size INTEGER NOT NULL DEFAULT 5,
    home_page TEXT NOT NULL DEFAULT '/tasks',
    color_scheme TEXT NOT NULL DEFAULT 'blue',
    button_variant TEXT NOT NULL DEFAULT 'filled',
    gradient_from TEXT NOT NULL DEFAULT 'blue',
    gradient_to TEXT NOT NULL DEFAULT 'grape',
    gradient_degrees INTEGER NOT NULL DEFAULT 0,
    navbar_opened BOOL NOT NULL DEFAULT 0,
    default_timer INTEGER NOT NULL DEFAULT 3600
);

INSERT INTO user_settings (id) VALUES (1);