use sqlx::QueryBuilder;
use tauri::State;

use crate::{features::tags::Tag, Data, PagedData, SortDirection};

use super::TagSearchParams;

fn generate_search_query<'a>(mut builder: QueryBuilder<'a, sqlx::Sqlite>, params: &'a TagSearchParams) -> QueryBuilder<'a, sqlx::Sqlite> {
    builder.push("SELECT * FROM tags");

    if let Some(query) = &params.query_string {
        builder.push(" WHERE tags.value LIKE ").push_bind(format!("'%{}%'", query));
    }

    match params.ordering.sort_direction {
        SortDirection::Ascending => match params.ordering.order_by.as_str() {
            "value" => builder.push(" ORDER BY tags.value ASC"),
            _ => &mut builder
        },
        SortDirection::Descending => match params.ordering.order_by.as_str() {
            "value" => builder.push(" ORDER BY tags.value DESC"),
            _ => &mut builder
        },
    };

    builder
}

/// Search for all tags which match the search parameters.
///
/// ### Args
/// * state - The database state used to query a connection.
/// * params - The search parameters used to filter/sort the results.
#[tauri::command]
pub async fn get_tags(params: TagSearchParams, db: State<'_, Data>) -> Result<PagedData<Tag>, String> {
    let count_builder = QueryBuilder::new("SELECT COUNT(DISTINCT id) FROM(");
    let mut count_query = generate_search_query(count_builder, &params);
    count_query.push(")");

    let count: i64 = count_query.build_query_scalar::<i64>().fetch_one(&db.pool).await.map_err(|err| err.to_string())?;
    let mut tag_query = generate_search_query(QueryBuilder::new(""), &params);

    tag_query.push(format!(" LIMIT {} OFFSET {} ", params.page_size, (params.page - 1) * params.page_size));
    let all_tags = tag_query.build_query_as::<Tag>().fetch_all(&db.pool).await.map_err(|err| err.to_string())?;
    
    Ok(PagedData::<Tag>::new(
        params.page,
        params.page_size,
        count,
        all_tags,
    ))

}

#[tauri::command]
pub async fn edit_tag(tag: Tag, db: State<'_, Data>) -> Result<(), String> {
    sqlx::query!("UPDATE tags SET value = ? WHERE id = ?", tag.value, tag.id)
    .execute(&db.pool)
    .await
    .map(|_|())
    .map_err(|err| err.to_string())
}

#[tauri::command]
pub async fn delete_tag(tag_id: i64, db: State<'_, Data>) -> Result<(), String> {
    sqlx::query!("DELETE FROM tags WHERE tags.id = ?", tag_id)
    .execute(&db.pool)
    .await
    .map(|_|())
    .map_err(|err| err.to_string())
}
