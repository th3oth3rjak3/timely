import dayjs from "dayjs";
import { DateRangeFilter } from "./DateRangeFilter";

export type DateRange = [Date | null, Date | null];

export function toDateFilter(range: DateRange): DateRangeFilter {
  const beforeDate = range[0];
  const afterDate = dayjs(range[1]).endOf("day");

  return {
    start: beforeDate?.toISOString() ?? null,
    end: afterDate?.toISOString() ?? null,
  };
}
