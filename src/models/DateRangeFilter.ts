export interface DateRangeFilter {
  start: string | null;
  end: string | null;
}

export function createDateFilter(
  start: Date | null,
  end: Date | null
): DateRangeFilter {
  return {
    start: start?.toISOString() ?? null,
    end: end?.toISOString() ?? null,
  };
}
