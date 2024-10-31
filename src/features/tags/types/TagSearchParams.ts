import { Ordering } from "../../../models/Ordering";
import { SortDirection } from "../../../models/SortDirection";
import { getSqlColumnFromPropertyName } from "../../../utilities/dataTableUtilities";

export type TagSearchParams = {
    page: number;
    pageSize: number;
    queryString: string | null;
    ordering: Ordering | null;
}

export function tagSearchParams(
    page: number,
    pageSize: number,
    queryString?: string,
    sortField?: string,
    sortDirection?: string,
): TagSearchParams {
    return {
        page,
        pageSize,
        ordering: {
            orderBy: getSqlColumnFromPropertyName(sortField ?? "value"),
            sortDirection: !!sortDirection && sortDirection === "desc" ? SortDirection.Descending : SortDirection.Ascending
        },
        queryString: !!queryString && queryString.length > 0 ? queryString : null,
    };
}