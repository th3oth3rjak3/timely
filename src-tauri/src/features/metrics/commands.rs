use super::models::UpsertAddable;
use super::{models::MetricsSummary, MetricsBucket, MetricsSearchCriteria, StatisticalSummary};
use crate::{
    features::tasks::{Task, TaskWorkHistory},
    query_utils::add_in_expression,
    Data,
};
use anyhow_tauri::{bail, IntoTAResult, TAResult};
use chrono::{DateTime, Duration, Utc};
use sqlx::QueryBuilder;
use std::collections::HashMap;
use tap::{Pipe, Tap};
use tauri::State;

#[tauri::command]
pub async fn get_metrics(
    search_criteria: MetricsSearchCriteria,
    db: State<'_, Data>,
) -> TAResult<MetricsSummary> {
    if search_criteria.buckets.is_empty() || search_criteria.tags.is_empty() {
        bail!("The search criteria must have at least one tag and one bucket");
    }

    let tag_ids: &Vec<i64> = &search_criteria.tags.iter().map(|tag| tag.id).collect();

    // get daily work history for all the items worked during the time period.
    let history = get_work_history(tag_ids, &search_criteria.buckets, &db)
        .await
        .into_ta_result()?;

    let start_date = &search_criteria.buckets.iter().next().unwrap().start_date;
    let end_date = &search_criteria.buckets.iter().last().unwrap().end_date;

    let summary = get_statistical_summary(tag_ids, &start_date, &end_date, &history, &db)
        .await
        .into_ta_result()?;

    MetricsSummary::new(
        *start_date,
        *end_date,
        search_criteria.tags,
        summary,
        history,
    )
    .pipe(anyhow::Ok)
    .into_ta_result()
}

async fn get_statistical_summary(
    tag_ids: &Vec<i64>,
    start_date: &DateTime<Utc>,
    end_date: &DateTime<Utc>,
    work_history: &Vec<MetricsBucket>,
    db: &State<'_, Data>,
) -> TAResult<StatisticalSummary> {
    let tasks_started = count_started_tasks(tag_ids, start_date, end_date, db)
        .await
        .into_ta_result()?;

    let tasks_completed = count_completed_tasks(tag_ids, start_date, end_date, db)
        .await
        .into_ta_result()?;

    let tasks_worked = count_tasks_worked(tag_ids, start_date, end_date, db)
        .await
        .into_ta_result()?;

    // find all hours worked from the daily history
    let hours_worked: f64 = work_history.iter().map(|hist| hist.hours).sum();

    StatisticalSummary::new(tasks_started, tasks_completed, tasks_worked, hours_worked)
        .pipe(anyhow::Ok)
        .into_ta_result()
}

async fn get_work_history(
    tag_ids: &Vec<i64>,
    buckets: &Vec<MetricsBucket>,
    db: &State<'_, Data>,
) -> TAResult<Vec<MetricsBucket>> {
    // SELECT twh.*
    // FROM task_work_history twh
    // WHERE twh.end_date >= '2024-12-01 08:00:00'
    // AND twh.start_date <= '2024-12-09 08:00:00'
    // AND (
    //     SELECT COUNT(DISTINCT tt2.tag_id)
    //     FROM task_tags tt2
    //     WHERE tt2.task_id = twh.task_id
    //     AND tt2.tag_id IN (3, 4)
    // ) = 2

    let start_date = buckets.iter().next().unwrap().start_date;
    let end_date = buckets.iter().last().unwrap().end_date;

    let mut builder = QueryBuilder::<sqlx::Sqlite>::new(
        r#"
        SELECT twh.*
        FROM task_work_history twh
        WHERE twh.end_date >= "#,
    );

    builder.push_bind(start_date.naive_utc());

    builder.push(" AND twh.start_date <= ");

    builder.push_bind(end_date.naive_utc());
    builder.push(
        r#"
        AND (
            SELECT COUNT(DISTINCT tt2.tag_id)
            FROM task_tags tt2
            WHERE tt2.task_id = twh.task_id
            AND tt2.tag_id "#,
    );

    add_in_expression(&mut builder, tag_ids);
    builder.push(" ) = ");
    builder.push_bind(tag_ids.len() as i32);

    let query = builder.build_query_as::<TaskWorkHistory>();

    let task_work_history = query.fetch_all(&db.pool).await.into_ta_result()?;

    // this only gets total hours for a given task during the period.
    // It needs to get hours per task per day for a given period.
    let mut seconds_per_task_per_day: HashMap<(i64, DateTime<Utc>, DateTime<Utc>), i32> =
        HashMap::new();

    for record in task_work_history.iter() {
        let values = collect_work_history(
            &record.task_id,
            &record.start_date.and_utc(),
            &record.end_date.and_utc(),
            &buckets,
        );

        values
            .iter()
            .for_each(|(id, start_date, end_date, seconds)| {
                seconds_per_task_per_day.upsert_add((*id, *start_date, *end_date), *seconds)
            });
    }

    // if any of the tasks are in a "DOING" status, then they probably have a
    // last_resumed_date set. In that case, for every day that an item has been in that
    // status, we need to add those hours since work history entries only get generated
    // when the status is paused or finished.

    // SELECT t.*
    // FROM tasks t
    // INNER JOIN task_tags tt ON t.id = tt.task_id
    // WHERE tt.tag_id in (3, 4)
    // AND t.last_resumed_date IS NOT NULL
    // AND t.status = 'Doing'
    // AND (
    //     SELECT COUNT(DISTINCT tt2.tag_id)
    //     FROM task_tags tt2
    //     WHERE tt2.task_id = t.id
    //     AND tt2.tag_id in (3, 4)
    // ) = 2

    let mut builder = QueryBuilder::<sqlx::Sqlite>::new(
        r#"
        SELECT t.*
        FROM tasks t
        INNER JOIN task_tags tt on t.id = tt.task_id
        WHERE tt.tag_id "#,
    );

    add_in_expression(&mut builder, &tag_ids);
    builder.push(
        r#"
        AND t.last_resumed_date IS NOT NULL
        AND t.status = 'Doing'
        AND (
            SELECT COUNT(DISTINCT tt2.tag_id)
            FROM task_tags tt2
            WHERE tt2.task_id = t.id
            AND tt2.tag_id "#,
    );

    add_in_expression(&mut builder, &tag_ids);
    builder.push(" ) = ");
    builder.push_bind(tag_ids.len() as i32);

    let query = builder.build_query_as::<Task>();

    let tasks = query.fetch_all(&db.pool).await.into_ta_result()?;

    let now = Utc::now();
    for record in tasks.iter() {
        let values = collect_work_history(
            &record.id,
            &record
                .last_resumed_date
                .expect("The sql query should have produced only records with non-null dates")
                .and_utc(),
            &now,
            &buckets,
        );

        values
            .iter()
            .for_each(|(id, start_date, end_date, seconds)| {
                seconds_per_task_per_day.upsert_add((*id, *start_date, *end_date), *seconds)
            });
    }

    let mut aggregated_data: HashMap<(DateTime<Utc>, DateTime<Utc>), f64> = HashMap::new();

    seconds_per_task_per_day
        .iter()
        .for_each(|((_id, start_date, end_date), seconds)| {
            aggregated_data.upsert_add((*start_date, *end_date), f64::from(*seconds) / 3_600f64)
        });

    aggregated_data
        .into_iter()
        .map(|((start_date, end_date), hours)| MetricsBucket {
            start_date,
            end_date,
            hours,
        })
        .collect::<Vec<_>>()
        .tap_mut(|values| values.sort_by_key(|bucket| bucket.start_date))
        .pipe(anyhow::Ok)
        .into_ta_result()
}

async fn count_started_tasks(
    tag_ids: &Vec<i64>,
    start_date: &DateTime<Utc>,
    end_date: &DateTime<Utc>,
    db: &State<'_, Data>,
) -> TAResult<i64> {
    // Tasks Started
    // SELECT COUNT(distinct twh.task_id)
    // FROM task_work_history twh
    // INNER JOIN task_tags tt on twh.task_id = tt.task_id
    // WHERE tt.tag_id in (3, 4)
    // AND EXISTS (
    //     -- Ensure the task has entries within the specified date range
    //     SELECT 1
    //     FROM task_work_history twh2
    //     WHERE twh2.task_id = twh.task_id
    //     AND twh2.start_date >= '2024-12-01 08:00:00'
    //     AND twh2.start_date < '2024-12-09 08:00:00'
    // )
    // AND NOT EXISTS (
    //     -- Ensure the task does not have entries before '2024-12-01 08:00:00'
    //     SELECT 1
    //     FROM task_work_history twh2
    //     WHERE twh2.task_id = twh.task_id
    //     AND twh2.start_date < '2024-12-01 08:00:00'
    // )
    // AND twh.task_id IN (
    //     -- Ensure the minimum start_date for each task is within the specified range
    //     SELECT twh2.task_id
    //     FROM task_work_history twh2
    //     WHERE twh2.task_id = twh.task_id
    //     GROUP BY twh2.task_id
    //     HAVING MIN(twh2.start_date) >= '2024-12-01 08:00:00'
    //     AND MIN(twh2.start_date) < '2024-12-09 08:00:00'
    // )
    // AND (
    //     SELECT COUNT(DISTINCT tt2.tag_id)
    //     FROM task_tags tt2
    //     WHERE tt2.task_id = twh.task_id
    //     AND tt2.tag_id IN (3, 4)
    // ) = 2
    let mut builder = QueryBuilder::<sqlx::Sqlite>::new(
        r#"
        SELECT COUNT(DISTINCT twh.task_id)
        FROM task_work_history twh
        INNER JOIN task_tags tt on twh.task_id = tt.task_id
        WHERE tt.tag_id
    "#,
    );

    add_in_expression(&mut builder, tag_ids);

    builder.push(
        r#"
        AND EXISTS (
            SELECT 1
            FROM task_work_history twh2
            WHERE twh2.task_id = twh.task_id
            AND twh2.start_date >= "#,
    );

    builder.push_bind(start_date.naive_utc());

    builder.push(" AND twh2.start_date < ");
    builder.push_bind((*end_date + Duration::days(1)).naive_utc());
    builder.push(
        r#" 
        )
        AND NOT EXISTS (
            SELECT 1
            FROM task_work_history twh2
            WHERE twh2.task_id = twh.task_id
            and twh2.start_date < "#,
    );

    builder.push_bind(start_date.naive_utc());
    builder.push(
        r#" 
        )
        AND twh.task_id IN (
            SELECT twh2.task_id
            FROM task_work_history twh2
            WHERE twh2.task_id = twh.task_id
            GROUP BY twh2.task_id
            HAVING MIN(twh2.start_date) >=
        "#,
    );

    builder.push_bind(start_date.naive_utc());
    builder.push(" AND MIN(twh2.start_date) < ");
    builder.push_bind((*end_date + Duration::days(1)).naive_utc());
    builder.push(
        r#" 
        ) 
        AND (
            SELECT COUNT(DISTINCT tt2.tag_id)
            FROM task_tags tt2
            WHERE tt2.task_id = twh.task_id
            AND tt2.tag_id "#,
    );
    add_in_expression(&mut builder, tag_ids);
    builder.push(" ) = ");
    builder.push_bind(tag_ids.len() as i32);

    let query = builder.build_query_scalar::<i64>();

    query.fetch_one(&db.pool).await.into_ta_result()
}

async fn count_completed_tasks(
    tag_ids: &Vec<i64>,
    start_date: &DateTime<Utc>,
    end_date: &DateTime<Utc>,
    db: &State<'_, Data>,
) -> TAResult<i64> {
    // Tasks Completed
    // SELECT COUNT(DISTINCT twh.task_id)
    // FROM task_work_history twh
    // INNER JOIN tasks t ON t.id = twh.task_id
    // INNER JOIN task_tags tt on twh.task_id = tt.task_id
    // WHERE t.status = 'Done'
    // AND tt.tag_id in (3, 4)
    // AND twh.end_date >= '2024-12-01 08:00:00'  -- Ensure the last entry is after the given start date
    // AND twh.end_date < '2024-12-09 08:00:00'  -- Ensure the last entry is before or on the given end date
    // AND NOT EXISTS (
    //     -- Ensure there are no entries after the date range
    //     SELECT 1
    //     FROM task_work_history twh2
    //     WHERE twh2.task_id = twh.task_id
    //     AND twh2.start_date > '2024-12-09 08:00:00'  -- Entries that happen after the date range
    // )
    // AND (
    //     -- Ensure the task has all the tags (3, 4)
    //     SELECT COUNT(DISTINCT tt2.tag_id)
    //     FROM task_tags tt2
    //     WHERE tt2.task_id = twh.task_id
    //     AND tt2.tag_id IN (3, 4)
    // ) = 2

    let mut builder = QueryBuilder::<sqlx::Sqlite>::new(
        r#"
        SELECT COUNT(DISTINCT twh.task_id)
        FROM task_work_history twh
        INNER JOIN tasks t ON t.id = twh.task_id
        INNER JOIN task_tags tt on twh.task_id = tt.task_id
        WHERE t.status = 'Done'
        AND tt.tag_id
    "#,
    );

    add_in_expression(&mut builder, tag_ids);

    builder.push(" AND twh.end_date >= ");
    builder.push_bind(start_date.naive_utc());
    builder.push(" AND twh.end_date < ");
    builder.push_bind((*end_date + Duration::days(1)).naive_utc());

    builder.push(
        r#"
        AND NOT EXISTS (
            SELECT 1
            FROM task_work_history twh2
            WHERE twh2.task_id = twh.task_id
            AND twh2.start_date > "#,
    );

    builder.push_bind((*end_date + Duration::days(1)).naive_utc());

    builder.push(
        r#"
        )
        AND (
            SELECT COUNT(DISTINCT tt2.tag_id)
            FROM task_tags tt2
            WHERE tt2.task_id = twh.task_id
            AND tt2.tag_id "#,
    );

    add_in_expression(&mut builder, tag_ids);

    builder.push(" ) = ");
    builder.push_bind(tag_ids.len() as i32);

    let query = builder.build_query_scalar::<i64>();

    query.fetch_one(&db.pool).await.into_ta_result()
}

async fn count_tasks_worked(
    tag_ids: &Vec<i64>,
    start_date: &DateTime<Utc>,
    end_date: &DateTime<Utc>,
    db: &State<'_, Data>,
) -> TAResult<i64> {
    // SELECT COUNT(DISTINCT twh.task_id)
    // FROM task_work_history twh
    // WHERE twh.end_date >= '2024-12-01 08:00:00'
    // AND twh.start_date <= '2024-12-09 08:00:00'
    // AND (
    //     SELECT COUNT(DISTINCT tt2.tag_id)
    //     FROM task_tags tt2
    //     WHERE tt2.task_id = twh.task_id
    //     AND tt2.tag_id IN (3, 4)
    // ) = 2
    let mut builder = QueryBuilder::<sqlx::Sqlite>::new(
        r#"
        SELECT COUNT(DISTINCT twh.task_id)
        FROM task_work_history twh
        WHERE twh.end_date >= "#,
    );

    builder.push_bind(start_date.naive_utc());

    builder.push(" AND twh.start_date <= ");

    builder.push_bind((*end_date + Duration::days(1)).naive_utc());
    builder.push(
        r#"
        AND (
            SELECT COUNT(DISTINCT tt2.tag_id)
            FROM task_tags tt2
            WHERE tt2.task_id = twh.task_id
            AND tt2.tag_id "#,
    );

    add_in_expression(&mut builder, tag_ids);
    builder.push(" ) = ");
    builder.push_bind(tag_ids.len() as i32);

    let query = builder.build_query_scalar::<i64>();

    query.fetch_one(&db.pool).await.into_ta_result()
}

/// This function gets the work history
fn collect_work_history(
    task_id: &i64,
    entry_start: &DateTime<Utc>,
    entry_end: &DateTime<Utc>,
    buckets: &Vec<MetricsBucket>,
) -> Vec<(i64, DateTime<Utc>, DateTime<Utc>, i32)> {
    let mut values: Vec<(i64, DateTime<Utc>, DateTime<Utc>, i32)> = Vec::new();

    for bucket in buckets.iter() {
        // need to figure out how many of the seconds happened each day.
        let start_of_day = bucket.start_date;
        let end_of_day = bucket.end_date;

        let history_start = *entry_start;
        let history_end = *entry_end;
        // case 1: The task was started midway through the day and ended later than today.
        if history_start >= start_of_day && history_start <= end_of_day && history_end > end_of_day
        {
            let elapsed_this_day: i32 =
                i32::try_from(end_of_day.timestamp() - history_start.timestamp())
                    .expect("i32 should be big enough to hold the number of seconds in a day.");

            values.push((*task_id, start_of_day, end_of_day, elapsed_this_day));
        }
        // case 2: The task was started midway through the day and ended during the same day.
        else if history_start >= start_of_day && history_end <= end_of_day {
            let elapsed_this_day: i32 =
                i32::try_from(history_end.timestamp() - history_start.timestamp())
                    .expect("i32 should be big enough to hold the number of seconds in a day.");

            values.push((*task_id, start_of_day, end_of_day, elapsed_this_day));
        }
        // case 3: The task ran for the entire day.
        else if history_start < start_of_day && history_end > end_of_day {
            let elapsed_this_day: i32 =
                i32::try_from(end_of_day.timestamp() - start_of_day.timestamp())
                    .expect("i32 should be big enough to hold the number of seconds in a day.");

            values.push((*task_id, start_of_day, end_of_day, elapsed_this_day));
        }
        // case 4: The task started before the start of the day and ended midday.
        else if history_start <= start_of_day
            && history_end >= start_of_day
            && history_end <= end_of_day
        {
            let elapsed_this_day: i32 =
                i32::try_from(history_end.timestamp() - start_of_day.timestamp())
                    .expect("i32 should be big enough to hold the number of seconds in a day.");

            values.push((*task_id, start_of_day, end_of_day, elapsed_this_day));
        }
        // case 5: No work done this day, still need an entry
        else {
            values.push((*task_id, start_of_day, end_of_day, 0));
        }
    }

    values
}
