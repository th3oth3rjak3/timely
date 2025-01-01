use std::ops::Sub;

use jiff::{Timestamp, Zoned};
use serde::{Deserialize, Serialize};
use sqlx::prelude::{FromRow, Type};

#[derive(Debug, Copy, Clone, Deserialize, Serialize, PartialEq, Type, PartialOrd, Ord, Eq, FromRow)]
#[sqlx(transparent)]
pub struct UnixTimestamp(i64);


impl UnixTimestamp {
    pub fn new() -> Self {
        let epoch = Timestamp::UNIX_EPOCH;
        UnixTimestamp(epoch.as_second())
    }

    pub fn now() -> Self {
        UnixTimestamp(Timestamp::now().as_second())
    }

    pub fn as_seconds(&self) -> i64 {
        self.0
    }
}

impl From<i64> for UnixTimestamp {
    fn from(value: i64) -> Self {
        UnixTimestamp(value)
    }
}

impl From<UnixTimestamp> for i64 {
    fn from(value: UnixTimestamp) -> Self {
        value.0
    }
}

impl From<Option<i64>> for UnixTimestamp {

    fn from(value: Option<i64>) -> Self {
        let value = value.unwrap_or(0);
        UnixTimestamp(value)
    }
}

impl From<UnixTimestamp> for Timestamp {
    fn from(value: UnixTimestamp) -> Self {
        Timestamp::from_second(value.0).expect("timestamp to be valid")
    }
}

impl From<&Timestamp> for UnixTimestamp {
    fn from(value: &Timestamp) -> Self {
        UnixTimestamp(value.as_second())
    }
}

impl From<&Zoned> for UnixTimestamp {
    fn from(value: &Zoned) -> Self {
        UnixTimestamp(value.timestamp().as_second())
    }
}


impl Sub for UnixTimestamp {
    type Output = i64;

    fn sub(self, rhs: Self) -> Self::Output {
        self.as_seconds() - rhs.as_seconds()
    }
}

#[derive(Debug, Copy, Clone, Deserialize, Serialize, PartialEq, Type, PartialOrd, Ord, Eq, FromRow)]
#[sqlx(transparent)]
pub struct OptionalUnixTimestamp(Option<i64>);

impl OptionalUnixTimestamp {
    pub fn unwrap_or_now(&self) -> UnixTimestamp {
        match self.0 {
            Some(value) => UnixTimestamp(value),
            None => UnixTimestamp::now()
        }
    }

    pub fn now() -> Self {
        let ts: i64 = UnixTimestamp::now().into();
        OptionalUnixTimestamp(Some(ts))
    }

    pub fn some(time_stamp: Timestamp) -> Self {
        OptionalUnixTimestamp(Some(time_stamp.as_second()))
    }

    pub fn none() -> Self {
        OptionalUnixTimestamp(None)
    }
}

impl From<OptionalUnixTimestamp> for Option<UnixTimestamp> {
    fn from(value: OptionalUnixTimestamp) -> Self {
        value.0.map(|value| UnixTimestamp(value))
    }
}

impl From<Option<UnixTimestamp>> for OptionalUnixTimestamp {
    fn from(value: Option<UnixTimestamp>) -> Self {
        match value {
            Some(ts) => OptionalUnixTimestamp(Some(ts.0)),
            None => OptionalUnixTimestamp::none(),
        }
    }
}

impl Into<OptionalUnixTimestamp> for Option<i64> {
    fn into(self) -> OptionalUnixTimestamp {
        OptionalUnixTimestamp(self)
    }
}

impl From<OptionalUnixTimestamp> for Option<Timestamp> {
    fn from(value: OptionalUnixTimestamp) -> Self {
        match value.0 {
            Some(value) => Some(Timestamp::from_second(value).expect("this should have succeeded")),
            None => None,
        }
    }
}

impl From<Option<Timestamp>> for OptionalUnixTimestamp {
    fn from(value: Option<Timestamp>) -> Self {
        match value {
            Some(ts) => OptionalUnixTimestamp::some(ts),
            None => OptionalUnixTimestamp::none(),
        }
    }
}

impl Sub<OptionalUnixTimestamp> for UnixTimestamp {
    type Output = Option<i64>;

    fn sub(self, rhs: OptionalUnixTimestamp) -> Self::Output {
        match rhs.0 {
            Some(rhs) => {
                let lhs: i64 = self.as_seconds();
                Some(lhs - rhs)
            }
            None => None
        }
    }
}

impl Sub<UnixTimestamp> for OptionalUnixTimestamp {
    type Output = Option<i64>;

    fn sub(self, rhs: UnixTimestamp) -> Self::Output {
        match self.0 {
            Some(lhs) => Some(lhs - i64::from(rhs)),
            None => None
        }
    }
}