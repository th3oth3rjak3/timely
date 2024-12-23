import { DateRangeFilter } from "../../../models/DateRangeFilter";
import { Ordering } from "../../../models/Ordering";
import { SortDirection } from "../../../models/SortDirection";
import { TaskStatus } from "../../../models/TaskStatus";

export interface TagFilter {
  tags: string[];
  filterOption: "any" | "all";
}

export enum FilterName {
  Tagged = "tagged",
  Untagged = "untagged",
  Unplanned = "unplanned",
  Planned = "planned",
  Overdue = "overdue",
  LateStart = "lateStart",
}

export class QuickFilter {
  kind: FilterName;
  tags: string[] | null = null;
  tagFilter: string | null = null;

  constructor(kind: FilterName) {
    this.kind = kind;
  }

  static tagged(tags: string[] | null, tagFilter: string | null): QuickFilter {
    let filter = new QuickFilter(FilterName.Tagged);
    filter.tags = tags;
    filter.tagFilter = tagFilter;
    return filter;
  }

  serialize() {
    if (this.kind === FilterName.Tagged) {
      return {
        tagged: {
          tags: this.tags,
          tagFilter: this.tagFilter,
        },
      };
    } else {
      return this.kind.toString();
    }
  }
}

export interface TaskSearchParams {
  page: number;
  pageSize: number;
  queryString: string | null;
  statuses: TaskStatus[];
  ordering: { orderBy: string; sortDirection: SortDirection } | null;
  startByFilter: DateRangeFilter | null;
  dueByFilter: DateRangeFilter | null;
  quickFilter: any | null;
};

export function taskSearchParams(
  page: number,
  pageSize: number,
  statuses: string[],
  queryString: string | null,
  sortField: string | null,
  sortDirection: string | null,
  startByFilter: DateRangeFilter | null,
  dueByFilter: DateRangeFilter | null,
  quickFilter: QuickFilter | null
): TaskSearchParams {
  return {
    page,
    pageSize,
    statuses: statuses.map((st) => st as TaskStatus),
    ordering: new Ordering(
      sortField ?? "scheduledCompleteDate",
      sortDirection ?? "asc"
    ).serialize(),
    quickFilter: quickFilter?.serialize() ?? null,
    queryString: !!queryString && queryString.length > 0 ? queryString : null,
    startByFilter: startByFilter ?? null,
    dueByFilter: dueByFilter ?? null,
  };
}
