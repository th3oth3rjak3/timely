// @generated automatically by Diesel CLI.

diesel::table! {
    comments (id) {
        id -> Integer,
        task_id -> Integer,
        message -> Text,
        created -> Timestamp,
        modified -> Nullable<Timestamp>,
    }
}

diesel::table! {
    notification_settings (id) {
        id -> Integer,
        user_setting_id -> Integer,
        name -> Text,
        enabled -> Bool,
    }
}

diesel::table! {
    tags (id) {
        id -> Integer,
        value -> Text,
    }
}

diesel::table! {
    task_tags (task_id, tag_id) {
        task_id -> Integer,
        tag_id -> Integer,
    }
}

diesel::table! {
    tasks (id) {
        id -> Integer,
        title -> Text,
        description -> Text,
        status -> Text,
        scheduled_start_date -> Nullable<Timestamp>,
        scheduled_complete_date -> Nullable<Timestamp>,
        actual_start_date -> Nullable<Timestamp>,
        actual_complete_date -> Nullable<Timestamp>,
        last_resumed_date -> Nullable<Timestamp>,
        estimated_duration -> Nullable<Integer>,
        elapsed_duration -> Integer,
    }
}

diesel::table! {
    user_settings (id) {
        id -> Integer,
        page_size -> Integer,
        home_page -> Text,
        color_scheme -> Text,
        button_variant -> Text,
        gradient_from -> Text,
        gradient_to -> Text,
        gradient_degrees -> Integer,
        navbar_opened -> Bool,
    }
}

diesel::joinable!(comments -> tasks (task_id));
diesel::joinable!(notification_settings -> user_settings (user_setting_id));
diesel::joinable!(task_tags -> tags (tag_id));
diesel::joinable!(task_tags -> tasks (task_id));

diesel::allow_tables_to_appear_in_same_query!(
    comments,
    notification_settings,
    tags,
    task_tags,
    tasks,
    user_settings,
);
