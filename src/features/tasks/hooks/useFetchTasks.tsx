import { useState } from "react";
import useColorPalette from "../../../hooks/useColorPalette";
import { useAppDispatch, useAppSelector } from "../../../redux/hooks";
import {
  setCurrentTaskPage,
  setTaskPageSize,
} from "../../../redux/reducers/settingsSlice";
import useTagService from "../../tags/hooks/useTagService";
import { Tag } from "../../tags/types/Tag";
import { Task } from "../types/Task";
import { TaskSearchParams } from "../types/TaskSearchParams";
import useTaskService from "./useTaskService";

const useFetchTasks = (searchParams: TaskSearchParams) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [taskRecordCount, setTaskRecordCount] = useState(0);
  const [tagRecordCount, setTagRecordCount] = useState(0);
  const [isFetchingTasks, setIsFetchingTasks] = useState(false);
  const [tagOptions, setTagOptions] = useState<Tag[]>([]);
  const [isFetchingTags, setIsFetchingTags] = useState(false);
  const userSettings = useAppSelector((state) => state.settings.userSettings);
  const colorPalette = useColorPalette();

  const dispatch = useAppDispatch();

  const { searchForTasks } = useTaskService(
    colorPalette,
    userSettings,
    taskRecordCount
  );
  const { getAllTags } = useTagService(
    userSettings,
    colorPalette,
    tagRecordCount
  );

  const fetchTags = async () => {
    setIsFetchingTags(false);
    const data = await getAllTags();
    setIsFetchingTags(false);
    if (!data) return;
    setTagOptions(data);
    setTagRecordCount(data.length);
  };

  const fetchTasks = async () => {
    setIsFetchingTasks(true);
    const paged = await searchForTasks(searchParams);
    setIsFetchingTasks(false);
    if (!paged) return;
    setTasks(paged.data);
    setTaskRecordCount(paged.totalItemCount);
    dispatch(setCurrentTaskPage(paged.page));
    dispatch(setTaskPageSize(paged.pageSize));
  };

  const fetchAllData = async () => {
    await fetchTasks();
    await fetchTags();
  };

  return {
    tasks,
    recordCount: taskRecordCount,
    tagOptions,
    isFetchingTags,
    isFetchingTasks,
    fetchTasks,
    fetchTags,
    fetchAllData,
  };
};

export default useFetchTasks;
