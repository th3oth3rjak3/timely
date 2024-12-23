import {QueryClient, useMutation, useQuery} from "@tanstack/react-query";
import {invoke} from "@tauri-apps/api/core";
import {DataTableSortStatus} from "mantine-datatable";
import {create} from "zustand";
import {DateRangeFilter} from "../../../models/DateRangeFilter";
import {PagedData} from "../../../models/PagedData";
import {TaskStatus} from "../../../models/TaskStatus";
import {TimelyAction} from "../../../models/TauriAction";
import {PagedTaskData, Task, UserSettings} from "../../../models/ZodModels";
import {showErrorNotification, showSuccessNotification,} from "../../../utilities/notificationUtilities";
import {EditTask, NewTask} from "../types/Task";
import {QuickFilter, TaskSearchParams} from "../types/TaskSearchParams";

export interface TaskStore {
  page: number;
  setPage: (page: number) => void;
  pageSize: number;
  setPageSize: (pageSize: number) => void;
  sortStatus: DataTableSortStatus<Task>;
  setSortStatus: (status: DataTableSortStatus<Task>) => void;
  query: string | null;
  setQuery: (query: string | null) => void;
  selectedStatuses: TaskStatus[];
  setSelectedStatuses: (statuses: TaskStatus[]) => void;
  startByFilter: DateRangeFilter | null;
  setStartByFilter: (filter: DateRangeFilter | null) => void;
  dueByFilter: DateRangeFilter | null;
  setDueByFilter: (filter: DateRangeFilter | null) => void;
  quickFilter: QuickFilter | null;
  setQuickFilter: (filter: QuickFilter | null) => void;
  selectedTasks: Task[];
  setSelectedTasks: (tasks: Task[]) => void;
}

export const useTaskStore = create<TaskStore>((set) => ({
  page: 1,
  setPage: (page) => set({page}),
  pageSize: 5,
  setPageSize: (pageSize) => set({pageSize}),
  sortStatus: {columnAccessor: "scheduledCompleteDate", direction: "asc"},
  setSortStatus: (sortStatus) => set({sortStatus}),
  query: null,
  setQuery: (query) => set({query}),
  selectedStatuses: [TaskStatus.Todo, TaskStatus.Doing, TaskStatus.Paused],
  setSelectedStatuses: (selectedStatuses) => set({selectedStatuses}),
  startByFilter: null,
  setStartByFilter: (startByFilter) => set({startByFilter}),
  dueByFilter: null,
  setDueByFilter: (dueByFilter) => set({dueByFilter}),
  quickFilter: null,
  setQuickFilter: (quickFilter) => set({quickFilter}),
  selectedTasks: [],
  setSelectedTasks: (selectedTasks) => set({selectedTasks}),
}));

export interface TaskLike {
  elapsedDuration: number | null;
  actualStartDate: Date | null;
  title: string;
  description: string;
}

type DataFetch = (task: TaskLike, action: TimelyAction) => void;
type DataFetchMany = (tasks: TaskLike[]) => void;

export function useSearchTasks(params: TaskSearchParams) {
  return useQuery({
    queryKey: ["searchTasks", params],
    queryFn: async (): Promise<PagedData<Task>> => {
      const tasks = await invoke<PagedData<Task>>("get_tasks", {params});
      if (tasks !== null) {
        return PagedTaskData.parse(tasks);
      }

      return {
        totalItemCount: 0,
        data: [],
      };
    },
    initialData: {
      totalItemCount: 0,
      data: [],
    },
    // refetchInterval: 1000, // TODO: not sure if this is a good idea or not.
  });
}

export function useCreateTask(
  userSettings: UserSettings,
  queryClient: QueryClient
) {
  return useMutation({
    mutationFn: async (task: NewTask) => {
      await invoke("create_task", {newTask: task});
    },
    onSuccess: async () => {
      showSuccessNotification(
        TimelyAction.AddNewTask,
        userSettings,
        "New task added successfully."
      );
      await queryClient.invalidateQueries({queryKey: ["searchTasks"]});
    },
    onError: (error) => showErrorNotification(error),
  });
}

export function useStartTask(
  userSettings: UserSettings,
  fetchData: DataFetch,
  queryClient: QueryClient
) {
  return useMutation({
    mutationFn: async (task: Task) => {
      await invoke("start_task", {taskId: task.id});
    },
    onSuccess: async (_, task) => {
      showSuccessNotification(
        TimelyAction.StartTask,
        userSettings,
        "Task started successfully."
      );
      fetchData(task, TimelyAction.StartTask);
      await queryClient.invalidateQueries({queryKey: ["searchTasks"]});
    },
    onError: (error) => {
      showErrorNotification(error);
    },
  });
}

export function usePauseTask(
  userSettings: UserSettings,
  fetchData: DataFetch,
  queryClient: QueryClient
) {
  return useMutation({
    mutationFn: async (task: Task) => {
      await invoke("pause_task", {taskId: task.id});
    },
    onSuccess: async (_, task) => {
      showSuccessNotification(
        TimelyAction.PauseTask,
        userSettings,
        "Task paused successfully."
      );
      fetchData(task, TimelyAction.PauseTask);
      await queryClient.invalidateQueries({queryKey: ["searchTasks"]});
    },
    onError: (error) => {
      showErrorNotification(error);
    },
  });
}

export function useResumeTask(
  userSettings: UserSettings,
  fetchData: DataFetch,
  queryClient: QueryClient
) {
  return useMutation({
    mutationFn: async (task: Task) => {
      await invoke("resume_task", {taskId: task.id});
    },
    onSuccess: async (_, task) => {
      showSuccessNotification(
        TimelyAction.ResumeTask,
        userSettings,
        "Task resumed successfully."
      );
      fetchData(task, TimelyAction.ResumeTask);
      await queryClient.invalidateQueries({queryKey: ["searchTasks"]});
    },
    onError: (error) => {
      showErrorNotification(error);
    },
  });
}

export function useFinishTask(
  userSettings: UserSettings,
  fetchData: DataFetch,
  queryClient: QueryClient
) {
  return useMutation({
    mutationFn: async (task: Task) => {
      await invoke("finish_task", {taskId: task.id});
    },
    onSuccess: async (_, task) => {
      showSuccessNotification(
        TimelyAction.FinishTask,
        userSettings,
        "Task finished successfully."
      );
      fetchData(task, TimelyAction.FinishTask);
      await queryClient.invalidateQueries({queryKey: ["searchTasks"]});
    },
    onError: (error) => {
      showErrorNotification(error);
    },
  });
}

export function useCancelTask(
  userSettings: UserSettings,
  fetchData: DataFetch,
  queryClient: QueryClient
) {
  return useMutation({
    mutationFn: async (task: Task) => {
      await invoke("cancel_task", {taskId: task.id});
    },
    onSuccess: async (_, task) => {
      showSuccessNotification(
        TimelyAction.CancelTask,
        userSettings,
        "Task cancelled successfully."
      );
      fetchData(task, TimelyAction.CancelTask);
      await queryClient.invalidateQueries({queryKey: ["searchTasks"]});
    },
    onError: (error) => {
      showErrorNotification(error);
    },
  });
}

export function useRestoreTask(
  userSettings: UserSettings,
  fetchData: DataFetch,
  queryClient: QueryClient
) {
  return useMutation({
    mutationFn: async (task: Task) => {
      await invoke("restore_task", {taskId: task.id});
    },
    onSuccess: async (_, task) => {
      showSuccessNotification(
        TimelyAction.RestoreCancelledTask,
        userSettings,
        "Task restored successfully."
      );
      fetchData(task, TimelyAction.RestoreCancelledTask);
      await queryClient.invalidateQueries({queryKey: ["searchTasks"]});
    },
    onError: (error) => {
      showErrorNotification(error);
    },
  });
}

export function useReopenTask(
  userSettings: UserSettings,
  fetchData: DataFetch,
  queryClient: QueryClient
) {
  return useMutation({
    mutationFn: async (task: Task) => {
      await invoke("reopen_task", {taskId: task.id});
    },
    onSuccess: async (_, task) => {
      showSuccessNotification(
        TimelyAction.ReopenFinishedTask,
        userSettings,
        "Task reopened successfully."
      );
      fetchData(task, TimelyAction.ReopenFinishedTask);
      await queryClient.invalidateQueries({queryKey: ["searchTasks"]});
    },
    onError: (error) => {
      showErrorNotification(error);
    },
  });
}

export function useDeleteTask(
  userSettings: UserSettings,
  fetchData: DataFetch,
  queryClient: QueryClient
) {
  return useMutation({
    mutationFn: async (task: Task) => {
      await invoke("delete_task", {taskId: task.id});
    },
    onSuccess: async (_, task) => {
      showSuccessNotification(
        TimelyAction.DeleteTask,
        userSettings,
        "Task deleted successfully."
      );
      fetchData(task, TimelyAction.DeleteTask);
      await queryClient.invalidateQueries({queryKey: ["searchTasks"]});
    },
    onError: (error) => {
      showErrorNotification(error);
    },
  });
}

export function useDeleteManyTasks(
  userSettings: UserSettings,
  fetchData: DataFetchMany,
  queryClient: QueryClient
) {
  return useMutation({
    mutationFn: async (tasks: Task[]) => {
      await invoke("delete_many_tasks", {taskIds: tasks.map((t) => t.id)});
    },
    onSuccess: async (_, tasks) => {
      showSuccessNotification(
        TimelyAction.DeleteTask,
        userSettings,
        "Selected tasks deleted successfully."
      );
      fetchData(tasks);
      await queryClient.invalidateQueries({queryKey: ["searchTasks"]});
    },
    onError: (error) => {
      showErrorNotification(error);
    },
  });
}

export function useEditTask(
  userSettings: UserSettings,
  previousTask: Task | null,
  fetchData: DataFetch,
  queryClient: QueryClient
) {
  return useMutation({
    mutationFn: async (task: EditTask) => {
      if (
        !!previousTask &&
        previousTask.elapsedDuration === task.elapsedDuration
      ) {
        task.elapsedDuration = null;
      }

      await invoke("edit_task", {task});
    },
    onSuccess: async (_, task) => {
      showSuccessNotification(
        TimelyAction.EditTask,
        userSettings,
        "Task updated successfully."
      );
      fetchData(task, TimelyAction.EditTask);
      await queryClient.invalidateQueries({queryKey: ["searchTasks"]});
    },
    onError: (error) => {
      showErrorNotification(error);
    },
  });
}
