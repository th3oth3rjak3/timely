import dayjs from "dayjs";
import { DateRangeFilter } from "./DateRangeFilter";
import { DatesRangeValue } from "@mantine/dates";

export function toDateFilter(range: DatesRangeValue<string>): DateRangeFilter {
  const beforeDate = dayjs(range[0]);
  const afterDate = dayjs(range[1]).endOf("day");

  return {
    start: beforeDate?.toISOString() ?? null,
    end: afterDate?.toISOString() ?? null,
  };
}
