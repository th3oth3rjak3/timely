import { getSqlColumnFromPropertyName } from "../utilities/dataTableUtilities";
import { SortDirection } from "./SortDirection";

export type TaskSearchParams = {
    page: number;
    pageSize: number;
    queryString: string | null;
    sortField: string | null;
    sortDirection: SortDirection | null;
    statuses: string[];
}

export function taskSearchParams(
    page: number,
    pageSize: number,
    statuses: string[],
    queryString?: string,
    sortField?: string,
    sortDirection?: string,
): TaskSearchParams {
    return {
        page,
        pageSize,
        statuses,
        queryString: !!queryString && queryString.length > 0 ? queryString : null,
        sortField: getSqlColumnFromPropertyName(sortField ?? "scheduled_complete_date"),
        sortDirection: !!sortDirection && sortDirection === "desc" ? SortDirection.Descending : SortDirection.Ascending
    };
}