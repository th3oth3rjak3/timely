import { Ordering } from "../../../models/Ordering";
import { SortDirection } from "../../../models/SortDirection";

export type TaskSearchParams = {
    page: number;
    pageSize: number;
    queryString: string | null;
    ordering: { orderBy: string, sortDirection: SortDirection } | null;
    statuses: string[];
    tags: string[] | null;
}

export function taskSearchParams(
    page: number,
    pageSize: number,
    statuses: string[],
    tags?: string[],
    queryString?: string,
    sortField?: string,
    sortDirection?: string,
): TaskSearchParams {
    return {
        page,
        pageSize,
        statuses,
        ordering: new Ordering(sortField ?? "scheduledCompleteDate", sortDirection ?? "asc").serialize(),
        tags: tags ?? null,
        queryString: !!queryString && queryString.length > 0 ? queryString : null,
    };
}