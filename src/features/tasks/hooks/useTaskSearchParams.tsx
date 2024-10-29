import { useDebouncedValue } from "@mantine/hooks";
import { useEffect, useState } from "react";
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
    const [params, setParams] = useState(taskSearchParams(page, pageSize, selectedStatuses, tags, debouncedSearchQuery, sortStatus.columnAccessor, sortStatus.direction));

    useEffect(() => {
        setParams(taskSearchParams(page, pageSize, selectedStatuses, tags, debouncedSearchQuery, sortStatus.columnAccessor, sortStatus.direction));
    }, [page, pageSize, debouncedSearchQuery, tags, sortStatus, selectedStatuses]);

    type updateParams = {
        queryString?: string,
        selectedStatuses?: string[],
        tags?: string[]
    }

    const updateTaskParams = (input: updateParams) => {
        setParams(taskSearchParams(
            1,
            params.pageSize,
            input.selectedStatuses ?? params.statuses,
            input.tags ?? (params.tags !== null ? params.tags : undefined),
            input.queryString ?? (params.queryString !== null ? params.queryString : undefined)));
    }

    return { params, updateTaskParams };
};

export default useTaskSearchParams;
