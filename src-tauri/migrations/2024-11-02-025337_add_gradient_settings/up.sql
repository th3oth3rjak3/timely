ALTER TABLE user_settings
ADD COLUMN gradient_from TEXT NOT NULL DEFAULT 'blue';
ALTER TABLE user_settings
ADD COLUMN gradient_to TEXT NOT NULL DEFAULT 'grape';
ALTER TABLE user_settings
ADD COLUMN gradient_degrees INTEGER NOT NULL DEFAULT 0;