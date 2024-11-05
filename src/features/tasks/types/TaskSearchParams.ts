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
};

export function taskSearchParams(
  page: number,
  pageSize: number,
  statuses: string[],
  tags?: string[],
  queryString?: string,
  sortField?: string,
  sortDirection?: string
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
    queryString: !!queryString && queryString.length > 0 ? queryString : null,
  };
}