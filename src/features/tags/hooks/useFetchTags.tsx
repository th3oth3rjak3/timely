import { useMantineTheme } from "@mantine/core";
import { useState } from "react";
import { useAppSelector } from "../../../redux/hooks";
import useColorService from "../../settings/hooks/useColorService";
import { Tag } from "../types/Tag";
import { TagSearchParams } from "../types/TagSearchParams";
import useTagService from "./useTagService";

const useFetchTags = (searchParams: TagSearchParams) => {
    const userSettings = useAppSelector(state => state.settings.userSettings);
    const theme = useMantineTheme();
    const { colorPalette } = useColorService(theme, userSettings);
    const [loadingTags, setLoadingTags] = useState(false);
    const [recordCount, setRecordCount] = useState(0);
    const [tags, setTags] = useState<Tag[]>([]);
    const { searchForTags } = useTagService(
      userSettings,
      colorPalette,
      recordCount
    );

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