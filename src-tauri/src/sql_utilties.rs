// use sqlx::{sqlite::SqliteRow, Execute, Pool, QueryBuilder, Row, Sqlite};

// use crate::{PagedData, SortDirection};

// #[derive(Debug, Clone, Eq, PartialEq)]
// pub enum Operator {
//     GreaterThan,
//     LessThan,
//     GreaterThanOrEqualTo,
//     LessThanOrEqualTo,
//     Equal,
//     Like,
//     StartsWith,
//     EndsWith,
//     In,
// }

// pub struct SearchQueryBuilder<'a> {
//     /// The main builder which executes the primary query.
//     builder: QueryBuilder<'a, Sqlite>,
//     /// A query builder that is used to get the count of related records.
//     count_builder: QueryBuilder<'a, Sqlite>,
//     /// A list of allowed fields to prevent sql injection attacks.
//     allowed_fields: Vec<String>,
// }

// impl SearchQueryBuilder<'_> {
//     pub fn new(init: impl Into<String>, allowed_fields: Vec<impl Into<String>>) -> Self {
//         let init: String = init.into();

//         Self {
//             builder: QueryBuilder::new(init.clone()),
//             count_builder: QueryBuilder::new(format!("SELECT COUNT(1) FROM ({}", init)),
//             allowed_fields: allowed_fields.into_iter().map(|f| f.into()).collect(),
//         }
//     }

//     fn bind_operation(
//         builder: &mut QueryBuilder<'_, Sqlite>,
//         operator: Operator,
//         value: impl Into<String>,
//         values: Vec<impl Into<String>>,
//     ) {
//         let value: String = value.into();
//         let values: Vec<String> = values.into_iter().map(|v| v.into()).collect();
//         let len = &values.len();
//         match operator {
//             Operator::GreaterThan => builder.push(" > ").push_bind(value),
//             Operator::GreaterThanOrEqualTo => builder.push(" >= ").push_bind(value),
//             Operator::LessThan => builder.push(" < ").push_bind(value),
//             Operator::LessThanOrEqualTo => builder.push(" <= ").push_bind(value),
//             Operator::Equal => builder.push(" = ").push_bind(value),
//             Operator::Like => builder
//                 .push(" LIKE '%' || ")
//                 .push_bind(value)
//                 .push(" || '%'"),
//             Operator::StartsWith => builder.push(" LIKE '%' || ").push_bind(value),
//             Operator::EndsWith => builder.push(" LIKE ").push_bind(value).push(" || '%'"),
//             Operator::In => {
//                 builder
//                     .push(" IN")
//                     .push_tuples(values.into_iter().take(*len), |mut b, item| {
//                         b.push_bind(item);
//                     })
//             }
//         };
//     }

//     pub fn with_where(
//         mut self,
//         field: impl Into<String>,
//         operator: Operator,
//         condition: impl Into<String>,
//         in_condition: Vec<impl Into<String>>,
//     ) -> Self {
//         let field: String = field.into();
//         let condition: String = condition.into();
//         let in_condition: Vec<String> = in_condition.into_iter().map(|i| i.into()).collect();
//         // determine if field is allowed.
//         if !self.allowed_fields.contains(&field) {
//             return self;
//         }

//         if operator == Operator::In {
//             self.builder.push(format!(" WHERE ({})", field));
//             self.count_builder.push(format!(" WHERE ({})", field));
//         } else {
//             self.builder.push(format!(" WHERE {}", field));
//             self.count_builder.push(format!(" WHERE {}", field));
//         }
//         let builder = &mut self.builder;
//         SearchQueryBuilder::bind_operation(
//             builder,
//             operator.clone(),
//             condition.clone(),
//             in_condition.clone(),
//         );
//         let count_builder = &mut self.count_builder;
//         SearchQueryBuilder::bind_operation(count_builder, operator, condition, in_condition);

//         self
//     }

//     pub fn with_or(
//         mut self,
//         field: impl Into<String>,
//         operator: Operator,
//         condition: impl Into<String>,
//         in_condition: Vec<impl Into<String>>,
//     ) -> Self {
//         let field: String = field.into();
//         let condition: String = condition.into();
//         let in_condition: Vec<String> = in_condition.into_iter().map(|i| i.into()).collect();

//         if !self.allowed_fields.contains(&field) {
//             return self;
//         }

//         if operator == Operator::In {
//             self.builder.push(format!(" OR ({})", field));
//             self.count_builder.push(format!(" OR ({})", field));
//         } else {
//             self.builder.push(format!(" OR {}", field));
//             self.count_builder.push(format!(" OR {}", field));
//         }
//         let builder = &mut self.builder;
//         SearchQueryBuilder::bind_operation(
//             builder,
//             operator.clone(),
//             condition.clone(),
//             in_condition.clone(),
//         );
//         let count_builder = &mut self.count_builder;
//         SearchQueryBuilder::bind_operation(count_builder, operator, condition, in_condition);

//         self
//     }

//     pub fn with_and(
//         mut self,
//         field: impl Into<String>,
//         operator: Operator,
//         condition: impl Into<String>,
//         in_condition: Vec<impl Into<String>>,
//     ) -> Self {
//         let field: String = field.into();
//         let condition: String = condition.into();
//         let in_condition: Vec<String> = in_condition.into_iter().map(|i| i.into()).collect();

//         if !self.allowed_fields.contains(&field) {
//             return self;
//         }

//         if operator == Operator::In {
//             self.builder.push(format!(" AND ({})", field));
//             self.count_builder.push(format!(" AND ({})", field));
//         } else {
//             self.builder.push(format!(" AND {}", field));
//             self.count_builder.push(format!(" AND {}", field));
//         }
//         let builder = &mut self.builder;
//         SearchQueryBuilder::bind_operation(
//             builder,
//             operator.clone(),
//             condition.clone(),
//             in_condition.clone(),
//         );
//         let count_builder = &mut self.count_builder;
//         SearchQueryBuilder::bind_operation(count_builder, operator, condition, in_condition);

//         self
//     }

//     pub fn order_by(mut self, field: impl Into<String>, direction: SortDirection) -> Self {
//         let field: String = field.into();

//         if !self.allowed_fields.contains(&field) {
//             return self;
//         }

//         let dir = match direction {
//             SortDirection::Ascending => "ASC",
//             SortDirection::Descending => "DESC",
//         };

//         self.builder
//             .push(format!(" ORDER BY {} {}", field.clone(), dir));

//         self.count_builder
//             .push(format!(" ORDER BY {} {}", field, dir));

//         self
//     }

//     fn paged(&mut self, page: u32, page_size: u32) {
//         let skip = (page - 1) * page_size;

//         self.builder
//             .push(" LIMIT ")
//             .push_bind(page_size)
//             .push(" OFFSET ")
//             .push_bind(skip);
//     }

//     pub async fn fetch_all<'a, T: Send + Sync + Unpin + for<'r> sqlx::FromRow<'r, SqliteRow>>(
//         mut self,
//         pool: &Pool<Sqlite>,
//         page: u32,
//         page_size: u32,
//     ) -> Result<PagedData<T>, String> {
//         // get record count for filtering operation
//         let count_row = self
//             .count_builder
//             .push(")")
//             .build()
//             .fetch_one(pool)
//             .await
//             .map_err(|err| err.to_string())?;

//         let total_item_count: u32 = count_row.get(0);

//         // get all records with limit and offset applied
//         self.paged(page, page_size);

//         // construct a PagedData object
//         let data: Vec<T> = self
//             .builder
//             .build_query_as()
//             .fetch_all(pool)
//             .await
//             .map_err(|err| err.to_string())?;

//         Ok(PagedData::<T> {
//             page,
//             page_size,
//             total_item_count,
//             data,
//         })
//     }
// }
