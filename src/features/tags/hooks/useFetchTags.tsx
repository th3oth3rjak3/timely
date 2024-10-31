import { useState } from "react";
import { Tag } from "../types/Tag";
import { TagSearchParams } from "../types/TagSearchParams";
import useTagService from "./useTagService";

const useFetchTags = (searchParams: TagSearchParams) => {
    const { searchForTags } = useTagService();
    const [loadingTags, setLoadingTags] = useState(false);
    const [recordCount, setRecordCount] = useState(0);
    const [tags, setTags] = useState<Tag[]>([]);

    const fetchTags = async () => {
        setLoadingTags(true);
        const paged = await searchForTags(searchParams);
        setLoadingTags(false);
        if (!paged) return;
        setTags(paged.data);
        setRecordCount(paged.totalItemCount);
    }
    return {
        tags,
        recordCount,
        loadingTags,
        fetchTags,
    };
}

export default useFetchTags;