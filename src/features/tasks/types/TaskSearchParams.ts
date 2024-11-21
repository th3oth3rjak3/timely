import { DateRangeFilter } from "../../../models/DateRangeFilter";
import { Ordering } from "../../../models/Ordering";
import { SortDirection } from "../../../models/SortDirection";
import { TaskStatus } from "../../../models/TaskStatus";

export type TaskSearchParams = {
  page: number;
  pageSize: number;
  queryString: string | null;
  ordering: { orderBy: string; sortDirection: SortDirection } | null;
  statuses: TaskStatus[];
  tags: string[] | null;
  tagOperation: string | null;
  startByFilter: DateRangeFilter | null;
  dueByFilter: DateRangeFilter | null;
};

export function taskSearchParams(
  page: number,
  pageSize: number,
  statuses: string[],
  tags?: string[],
  queryString?: string,
  sortField?: string,
  sortDirection?: string,
  startByFilter?: DateRangeFilter,
  dueByFilter?: DateRangeFilter,
  tagOperation?: string
): TaskSearchParams {
  return {
    page,
    pageSize,
    statuses: statuses.map((st) => st as TaskStatus),
    ordering: new Ordering(
      sortField ?? "scheduledCompleteDate",
      sortDirection ?? "asc"
    ).serialize(),
    tags: tags ?? null,
    tagOperation: tagOperation ?? null,
    queryString: !!queryString && queryString.length > 0 ? queryString : null,
    startByFilter: startByFilter ?? null,
    dueByFilter: dueByFilter ?? null,
  };
}
