import { Ordering } from "../../../models/Ordering";
import { SortDirection } from "../../../models/SortDirection";

export interface TagSearchParams {
  page: number;
  pageSize: number;
  queryString: string | null;
  ordering: { orderBy: string; sortDirection: SortDirection } | null;
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
        ordering: new Ordering(sortField ?? "value", sortDirection ?? "asc").serialize(),
        queryString: !!queryString && queryString.length > 0 ? queryString : null,
    };
}