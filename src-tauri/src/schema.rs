// @generated automatically by Diesel CLI.

diesel::table! {
    comment (id) {
        id -> Integer,
        task_id -> Integer,
        message -> Text,
        created -> Text,
        modified -> Nullable<Text>,
    }
}

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
    seaql_migrations (version) {
        version -> Text,
        applied_at -> BigInt,
    }
}

diesel::table! {
    tags (id) {
        id -> Integer,
        value -> Text,
    }
}

diesel::table! {
    task (id) {
        id -> Integer,
        description -> Text,
        status -> Text,
        scheduled_start_date -> Nullable<Text>,
        scheduled_complete_date -> Nullable<Text>,
        actual_start_date -> Nullable<Text>,
        actual_complete_date -> Nullable<Text>,
        last_resumed_date -> Nullable<Text>,
        estimated_duration -> Nullable<Integer>,
        elapsed_duration -> Integer,
        title -> Text,
    }
}

diesel::table! {
    task_tags (id) {
        id -> Integer,
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
    }
}

diesel::joinable!(comment -> task (task_id));
diesel::joinable!(comments -> tasks (task_id));
diesel::joinable!(task_tags -> tags (tag_id));
diesel::joinable!(task_tags -> task (task_id));

diesel::allow_tables_to_appear_in_same_query!(
    comment,
    comments,
    seaql_migrations,
    tags,
    task,
    task_tags,
    tasks,
    user_settings,
);
