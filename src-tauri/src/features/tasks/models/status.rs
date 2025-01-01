use serde::{Deserialize, Serialize};
use timely_macros::EnumFromString;

/// The status of a task.
#[derive(Default, Debug, PartialEq, Eq, Clone, sqlx::Type, EnumFromString)]
#[sqlx(type_name = "TEXT")]
pub enum Status {
    /// When a task has been cancelled and will not be worked.
    Cancelled,
    /// A task that is in progress.
    Doing,
    /// A completed task.
    Done,
    /// A task that has more work to be done, but is currently paused.
    Paused,
    /// A task that has not yet been started.
    #[default]
    Todo,
}

impl Serialize for Status {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        let value = match *self {
            Status::Todo => "To Do",
            Status::Doing => "Doing",
            Status::Done => "Done",
            Status::Cancelled => "Cancelled",
            Status::Paused => "Paused",
        };

        serializer.serialize_str(value)
    }
}

impl<'de> Deserialize<'de> for Status {
    fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
    where
        D: serde::Deserializer<'de>,
    {
        let s = String::deserialize(deserializer)?;

        match s.as_str() {
            "To Do" => Ok(Status::Todo),
            "Doing" => Ok(Status::Doing),
            "Done" => Ok(Status::Done),
            "Paused" => Ok(Status::Paused),
            "Cancelled" => Ok(Status::Cancelled),
            _ => Err(serde::de::Error::unknown_variant(
                &s,
                &["To Do", "Doing", "Done", "Paused", "Cancelled"],
            )),
        }
    }
}