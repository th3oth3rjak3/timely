use std::collections::HashMap;

use sea_orm::{prelude::*, *};
use sea_query::SimpleExpr;
use serde::{Deserialize, Serialize};
use serde_repr::{Deserialize_repr, Serialize_repr};

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PagedData<T> {
    pub page: i64,
    pub page_size: i64,
    pub total_item_count: i64,
    pub data: Vec<T>,
}

impl<T> PagedData<T> {
    pub fn new(page: i64, page_size: i64, total_item_count: i64, data: Vec<T>) -> Self {
        Self {
            page,
            page_size,
            total_item_count,
            data,
        }
    }
}

#[derive(Debug, Clone, Default, Eq, PartialEq, Serialize_repr, Deserialize_repr)]
#[repr(u8)]
pub enum SortDirection {
    #[default]
    Ascending,
    Descending,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct QueryCondition {
    pub field: String,
    pub operator: Operator,
    pub condition: QueryConditionType,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum QueryConditionType {
    Single(String),
    Multiple(Vec<String>),
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum QueryOperation {
    Condition(QueryCondition),
    Expression(QueryExpression),
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct QueryExpression {
    pub operation_type: String,
    pub operations: Vec<QueryOperation>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Query {
    pub operation_type: String,
    pub expressions: Vec<QueryExpression>,
    pub page: u64,
    pub page_size: u64,
    pub ordering: Ordering,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum Operator {
    StartsWith,
    EndsWith,
    Contains,
    NotContains,
    Like,
    NotLike,
    Equals,
    NotEquals,
    In,
    NotIn,
    GreaterThan,
    GreaterThanOrEqual,
    LessThan,
    LessThanOrEqual,
}

pub trait Queryable<T: EntityTrait> {
    fn evaluate_condition(condition: &QueryCondition, configured: &T)
        -> Result<SimpleExpr, String>;
    fn to_sea_orm_expression(
        expression: &QueryExpression,
        configured: &T,
    ) -> Result<Condition, String>;
    fn to_sea_orm_query(&self, configured: T) -> Result<Select<T>, String>;
}

pub trait QueryConfiguration {
    fn columns(&self) -> HashMap<String, impl ColumnTrait>;
}

pub fn parse_condition(
    column: &impl ColumnTrait,
    operator: &Operator,
    condition: &QueryConditionType,
) -> Result<SimpleExpr, String> {
    match condition {
        QueryConditionType::Single(single) => {
            let expr = match operator {
                Operator::Contains => column.contains(single),
                Operator::NotContains => column.contains(single).not(),
                Operator::StartsWith => column.starts_with(single),
                Operator::EndsWith => column.ends_with(single),
                Operator::Equals => column.eq(single),
                Operator::NotEquals => column.eq(single).not(),
                Operator::Like => column.like(single),
                Operator::NotLike => column.not_like(single),
                Operator::In => column.is_in(vec![single]),
                Operator::NotIn => column.is_not_in(vec![single]),
                Operator::GreaterThan => column.gt(single),
                Operator::GreaterThanOrEqual => column.gte(single),
                Operator::LessThan => column.lt(single),
                Operator::LessThanOrEqual => column.lte(single),
            };

            Ok(expr)
        }
        QueryConditionType::Multiple(multiple) => {
            let expr = match operator {
                Operator::In => Ok(column.is_in(multiple)),
                Operator::NotIn => Ok(column.is_not_in(multiple)),
                _ => Err(format!(
                    "Operator {:?} not defined for multiple conditions.",
                    operator
                )),
            };

            expr
        }
    }
}

impl<T: QueryConfiguration + EntityTrait + EntityName> Queryable<T> for Query {
    fn evaluate_condition(
        condition: &QueryCondition,
        configured: &T,
    ) -> Result<SimpleExpr, String> {
        let columns = configured.columns();
        let column = columns.get(&condition.field);

        match column {
            Some(col) => parse_condition(col, &condition.operator, &condition.condition),
            None => Err(format!(
                "Column {} does not exist for type Task",
                condition.field
            )),
        }
    }

    fn to_sea_orm_expression(
        expression: &QueryExpression,
        configured: &T,
    ) -> Result<Condition, String> {
        let mut condition = match expression.operation_type.as_str() {
            "and" => Condition::all(),
            _ => Condition::any(),
        };

        for op in expression.operations.iter() {
            match op {
                QueryOperation::Condition(cond) => {
                    let c = Query::evaluate_condition(&cond, configured)?;
                    condition = condition.add(c);
                }
                QueryOperation::Expression(expr) => {
                    let ex = Query::to_sea_orm_expression(&expr, configured)?;
                    condition = condition.add(ex);
                }
            }
        }

        Ok(condition)
    }

    fn to_sea_orm_query(&self, configured: T) -> Result<Select<T>, String> {
        let mut condition = match self.operation_type.as_str() {
            "and" => Condition::all(),
            _ => Condition::any(),
        };

        let mut expressions = Vec::new();

        for expr in self.expressions.iter() {
            let result = Query::to_sea_orm_expression(expr, &configured)?;
            expressions.push(result);
        }

        for cond in expressions.into_iter() {
            condition = condition.add(cond);
        }

        let mut query: Select<T> = T::find().filter(condition);

        let columns = configured.clone().columns();
        let col = match columns.get(&self.ordering.order_by) {
            Some(value) => Ok(value),
            None => Err(format!("Column {} not found.", &self.ordering.order_by)),
        }?;

        match self.ordering.sort_direction {
            SortDirection::Ascending => query = query.order_by_asc(*col),
            SortDirection::Descending => query = query.order_by_desc(*col),
        };

        Ok(query)
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Ordering {
    pub order_by: String,
    pub sort_direction: SortDirection,
}
