export type DateFilter = {
  before: string | null;
  after: string | null;
};

export function createDateFilter(
  before: Date | null,
  after: Date | null
): DateFilter {
  return {
    before: before?.toISOString() ?? null,
    after: after?.toISOString() ?? null,
  };
}
