import { useEffect, useState } from "react";

const useTaskPage = (initialPage: number, selectedStatuses: string[], debouncedSearchQuery: string) => {
    const [page, setPage] = useState(1);

    useEffect(() => {
        setPage(1);
    }, [selectedStatuses, debouncedSearchQuery]);

    useEffect(() => {
        setPage(initialPage);
    }, [initialPage]);

    return page;
};

export default useTaskPage;
