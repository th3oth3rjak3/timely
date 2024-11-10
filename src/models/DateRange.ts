import dayjs from "dayjs";
import { DateFilter } from "./DateFilter";

export type DateRange = [Date | null, Date | null];

export function toDateFilter(range: DateRange): DateFilter {
  const beforeDate = range[0];
  const afterDate = dayjs(range[1]).endOf("day");

  return {
    before: beforeDate?.toISOString() ?? null,
    after: afterDate?.toISOString() ?? null,
  };
}
