import { useMemo } from "react";
import { taskSearchParams } from "../types/TaskSearchParams";

const useTaskSearchParams = (
    page: number,
    pageSize: number,
    selectedStatuses: string[],
    searchQuery: string,
    sortStatus: { columnAccessor: string; direction: 'asc' | 'desc' }
) => {
    return useMemo(() => {
        return taskSearchParams(page, pageSize, selectedStatuses, searchQuery, sortStatus.columnAccessor, sortStatus.direction);
    }, [page, pageSize, selectedStatuses, searchQuery, sortStatus]);
};

export default useTaskSearchParams;