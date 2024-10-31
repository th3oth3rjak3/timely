use diesel::{dsl::count_distinct, prelude::*, sqlite::Sqlite};
use tauri::State;

use crate::{features::tags::Tag, schema::tags, Diesel, PagedData, SortDirection};

use super::TagSearchParams;

#[diesel::dsl::auto_type(no_type_alias)]
fn generate_search_query<'a>(params: &'a TagSearchParams) -> _ {
    let mut tag_query = tags::table.into_boxed::<Sqlite>();

    if let Some(query) = &params.query_string {
        tag_query = tag_query.filter(tags::value.like(format!("%{}%", &query)));
    }

    match params.ordering.sort_direction {
        SortDirection::Ascending => match params.ordering.order_by.as_str() {
            "value" => tag_query = tag_query.order_by(tags::value.asc()),
            _ => {}
        },
        SortDirection::Descending => match params.ordering.order_by.as_str() {
            "value" => tag_query = tag_query.order_by(tags::value.desc()),
            _ => {}
        },
    }

    tag_query
}

/// Search for all tags which match the search parameters.
///
/// ### Args
/// * state - The database state used to query a connection.
/// * params - The search parameters used to filter/sort the results.
#[tauri::command]
pub fn get_tags(params: TagSearchParams, db: State<'_, Diesel>) -> Result<PagedData<Tag>, String> {
    let mut connection = db.pool.get().map_err(|err| err.to_string())?;

    let count_query = generate_search_query(&params);
    let tag_query = generate_search_query(&params);

    let count: i64 = count_query
        .select(count_distinct(tags::id))
        .first(&mut connection)
        .map_err(|err| err.to_string())?;

    let all_tags: Vec<Tag> = tag_query
        .limit(params.page_size)
        .offset((params.page - 1) * params.page_size)
        .select(Tag::as_select())
        .load(&mut connection)
        .map_err(|err| err.to_string())?;

    Ok(PagedData::<Tag>::new(
        params.page,
        params.page_size,
        count.clone(),
        all_tags,
    ))
}

#[tauri::command]
pub fn edit_tag(tag: Tag, db: State<'_, Diesel>) -> Result<(), String> {
    let mut connection = db.pool.get().map_err(|err| err.to_string())?;

    let mut found_tag = tags::table
        .find(tag.id)
        .select(Tag::as_select())
        .first(&mut connection)
        .map_err(|err| err.to_string())?;

    found_tag.value = tag.value;

    found_tag
        .save_changes::<Tag>(&mut connection)
        .map(|_| ())
        .map_err(|err| err.to_string())
}

#[tauri::command]
pub fn delete_tag(tag_id: i32, db: State<'_, Diesel>) -> Result<(), String> {
    let mut connection = db.pool.get().map_err(|err| err.to_string())?;

    diesel::delete(tags::table)
        .filter(tags::id.eq(tag_id))
        .execute(&mut connection)
        .map(|_| ())
        .map_err(|err| err.to_string())
}
