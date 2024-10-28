import { useDebouncedValue } from "@mantine/hooks";
import { useMemo } from "react";
import { taskSearchParams } from "../types/TaskSearchParams";

const useTaskSearchParams = (
    page: number,
    pageSize: number,
    selectedStatuses: string[],

    searchQuery: string,
    sortStatus: { columnAccessor: string; direction: 'asc' | 'desc' },
    tags?: string[]
) => {
    const [debouncedSearchQuery] = useDebouncedValue(searchQuery, 200);
    return useMemo(() => {
        return taskSearchParams(page, pageSize, selectedStatuses, tags, debouncedSearchQuery, sortStatus.columnAccessor, sortStatus.direction);
    }, [page, pageSize, selectedStatuses, debouncedSearchQuery, sortStatus]);
};

export default useTaskSearchParams;