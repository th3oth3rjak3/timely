import { useMantineTheme } from "@mantine/core";
import { useState } from "react";
import { useAppDispatch, useAppSelector } from "../../../redux/hooks";
import { setCurrentTaskPage, setTaskPageSize } from "../../../redux/reducers/settingsSlice";
import useColorService from "../../settings/hooks/useColorService";
import useTagService from "../../tags/hooks/useTagService";
import { Tag } from "../../tags/types/Tag";
import { Task } from "../types/Task";
import { TaskSearchParams } from "../types/TaskSearchParams";
import useTaskService from "./useTaskService";

const useFetchTasks = (searchParams: TaskSearchParams) => {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [recordCount, setRecordCount] = useState(0);
    const [isFetchingTasks, setIsFetchingTasks] = useState(false);
    const [tagOptions, setTagOptions] = useState<Tag[]>([]);
    const [isFetchingTags, setIsFetchingTags] = useState(false);
    const theme = useMantineTheme();
    const userSettings = useAppSelector(state => state.settings.userSettings);
    const { colorPalette } = useColorService(theme, userSettings);

    const dispatch = useAppDispatch();


    const { searchForTasks } = useTaskService(colorPalette, userSettings);
    const { getAllTags } = useTagService(userSettings, colorPalette);

    const fetchTags = async () => {
        setIsFetchingTags(false);
        const data = await getAllTags();
        setIsFetchingTags(false);
        if (!data) return;
        setTagOptions(data);
    }

    const fetchTasks = async () => {
        setIsFetchingTasks(true);
        const paged = await searchForTasks(searchParams);
        setIsFetchingTasks(false);
        if (!paged) return;
        setTasks(paged.data);
        setRecordCount(paged.totalItemCount);
        dispatch(setCurrentTaskPage(paged.page));
        dispatch(setTaskPageSize(paged.pageSize));
    }

    const fetchAllData = async () => {
        await fetchTasks();
        await fetchTags();
    }

    return {
        tasks,
        recordCount,
        tagOptions,
        isFetchingTags,
        isFetchingTasks,
        fetchTasks,
        fetchTags,
        fetchAllData,
    };
}

export default useFetchTasks;