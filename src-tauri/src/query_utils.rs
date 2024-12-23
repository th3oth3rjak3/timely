use sqlx::{QueryBuilder, Sqlite};

pub fn add_in_expression<'a, T>(builder: &mut QueryBuilder<'a, Sqlite>, elements: &'a Vec<T>)
where
    T: sqlx::Encode<'a, Sqlite> + sqlx::Type<Sqlite>,
{
    if elements.len() == 0 {
        return;
    }

    builder.push(" IN (");
    for (i, element) in elements.iter().enumerate() {
        builder.push_bind(element);
        if i < elements.len() - 1 {
            builder.push(",");
        }
    }

    builder.push(") ");
}
