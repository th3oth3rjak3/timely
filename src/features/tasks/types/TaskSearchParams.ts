import { Ordering } from "../../../models/Ordering";
import { SortDirection } from "../../../models/SortDirection";
import { getSqlColumnFromPropertyName } from "../../../utilities/dataTableUtilities";

export type TaskSearchParams = {
    page: number;
    pageSize: number;
    queryString: string | null;
    ordering: Ordering | null;
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
        ordering: {
            orderBy: getSqlColumnFromPropertyName(sortField ?? "scheduledCompleteDate"),
            sortDirection: !!sortDirection && sortDirection === "desc" ? SortDirection.Descending : SortDirection.Ascending
        },
        tags: tags ?? null,
        queryString: !!queryString && queryString.length > 0 ? queryString : null,
    };
}