use std::{
    collections::HashMap,
    ops::{Add, AddAssign},
};

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

use crate::features::tags::Tag;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MetricsBucket {
    pub start_date: DateTime<Utc>,
    pub end_date: DateTime<Utc>,
    pub hours: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct StatisticalSummary {
    pub tasks_started: i64,
    pub tasks_completed: i64,
    pub tasks_worked: i64,
    pub hours_worked: f64,
}

impl StatisticalSummary {
    pub fn new(
        tasks_started: i64,
        tasks_completed: i64,
        tasks_worked: i64,
        hours_worked: f64,
    ) -> Self {
        Self {
            tasks_started,
            tasks_completed,
            tasks_worked,
            hours_worked,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MetricsSearchCriteria {
    pub tags: Vec<Tag>,
    pub buckets: Vec<MetricsBucket>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MetricsSummary {
    pub start_date: DateTime<Utc>,
    pub end_date: DateTime<Utc>,
    pub selected_tags: Vec<Tag>,
    pub summary: StatisticalSummary,
    pub work_history: Vec<MetricsBucket>,
}

impl MetricsSummary {
    pub fn new(
        start_date: DateTime<Utc>,
        end_date: DateTime<Utc>,
        selected_tags: Vec<Tag>,
        summary: StatisticalSummary,
        work_history: Vec<MetricsBucket>,
    ) -> Self {
        Self {
            start_date,
            end_date,
            selected_tags,
            summary,
            work_history,
        }
    }
}

pub trait Upsertable<K, V>
where
    K: Eq + std::hash::Hash,
{
    fn upsert(&mut self, key: K, value: V);
}

pub trait UpsertAddable<K, V>
where
    K: Eq + std::hash::Hash,
    V: Add + AddAssign + Default,
{
    fn upsert_add(&mut self, key: K, value: V);
}

impl<K, V> Upsertable<K, V> for HashMap<K, V>
where
    K: Eq + std::hash::Hash,
{
    fn upsert(&mut self, key: K, value: V) {
        if self.contains_key(&key) {
            let existing = self.get_mut(&key).unwrap();
            *existing = value;
        } else {
            self.insert(key, value);
        }
    }
}

impl<K, V> UpsertAddable<K, V> for HashMap<K, V>
where
    K: Eq + std::hash::Hash,
    V: Add + AddAssign + Default,
{
    fn upsert_add(&mut self, key: K, value: V) {
        let existing = self.entry(key).or_default();
        *existing += value;
    }
}
