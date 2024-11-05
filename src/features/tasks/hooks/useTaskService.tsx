import { Text } from "@mantine/core";
import { modals } from "@mantine/modals";
import { useMemo } from "react";
import useTauri from "../../../hooks/useTauri";
import { PagedData } from "../../../models/PagedData";
import { TaskStatus } from "../../../models/TaskStatus";
import { TauriAction } from "../../../models/TauriAction";
import { useAppDispatch, useAppSelector } from "../../../redux/hooks";
import { setCurrentTaskPage } from "../../../redux/reducers/settingsSlice";
import { findLastPage } from "../../../utilities/dataTableUtilities";
import { ColorPalette } from "../../settings/hooks/useColorService";
import { UserSettings } from "../../settings/UserSettings";
import { EditTask, NewTask, Task } from "../types/Task";
import { TaskSearchParams } from "../types/TaskSearchParams";

/** Create a task service to interact with tauri data. */
const useTaskService = (colorPalette: ColorPalette, userSettings: UserSettings, recordCount: number, fetchAllData?: () => Promise<void> | void) => {
    const { invoke } = useTauri();
    const taskSearchParams = useAppSelector(state => state.settings.taskListSettings.params);
    const dispatch = useAppDispatch();


    /** Search for tasks that meet the search parameters.
     * @param params - The search parameters to use to find tasks.
     */
    const searchForTasks = async (params: TaskSearchParams): Promise<PagedData<Task> | undefined> => {
        const tasks = await invoke<PagedData<Task>>({
            command: "get_tasks",
            params: { params },
        });

        return tasks;
    }

    const lastPage = useMemo(() => {
        return findLastPage(recordCount - 1, taskSearchParams.pageSize);
    }, [recordCount, taskSearchParams]);

    const handleDataFetch = (task: TaskLike, action: TauriAction): () => Promise<void> => async () => {
        if (pageShouldChange(task, action, recordCount, taskSearchParams)) {
            dispatch(setCurrentTaskPage(lastPage));
        } else {
            await fetchAllData?.();
        }
    }

    interface TaskLike {
        elapsedDuration: number | null;
        actualStartDate: Date | null;
        title: string;
        description: string;
    }

    const pageShouldChange = (task: TaskLike, action: TauriAction, recordCount: number, taskSearchParams: TaskSearchParams) : boolean => {
        const remainder = recordCount % taskSearchParams.pageSize;
        const lastItemOnThePage = remainder === 1 && taskSearchParams.page > 1;

        switch (action) {
            case TauriAction.CancelTask: 
                return lastItemOnThePage && !taskSearchParams.statuses.includes(TaskStatus.Cancelled);
            case TauriAction.DeleteTask: 
                return lastItemOnThePage;
            case TauriAction.StartTask:
            case TauriAction.ResumeTask:
            case TauriAction.ReopenFinishedTask:
                return lastItemOnThePage && !taskSearchParams.statuses.includes(TaskStatus.Doing);
            case TauriAction.PauseTask:
                return lastItemOnThePage && !taskSearchParams.statuses.includes(TaskStatus.Paused);
            case TauriAction.FinishTask:
                return lastItemOnThePage && !taskSearchParams.statuses.includes(TaskStatus.Done);
            case TauriAction.RestoreCancelledTask: 
                return lastItemOnThePage && (
                    (task.elapsedDuration !== null 
                        && task.elapsedDuration > 0 
                        && !taskSearchParams.statuses.includes(TaskStatus.Paused) 
                        && task.actualStartDate !== null) 
                    || (task.elapsedDuration === 0 && !taskSearchParams.statuses.includes(TaskStatus.Todo)));
            case TauriAction.EditTask:
                return lastItemOnThePage 
                    && taskSearchParams.queryString !== null 
                    && !(
                        task.title.includes(taskSearchParams.queryString) 
                        || task.description.includes(taskSearchParams.queryString)
                    );
            default:
                return false;
        }   
    }





    /** Create a new task. 
     * @param task - The task to create.
    */
    const createTask = async (task: NewTask) => {
        await invoke<void>({
            command: "create_task",
            params: { newTask: task },
            successMessage: "New task added successfully.",
            notificationType: TauriAction.AddNewTask,
            userSettings,
            callback: fetchAllData
        });
    }

    /** Start a task.
     * @param task - The task to start.
     */
    const startTask = async (task: Task) => {
        await invoke<void>({
            command: "start_task",
            params: { taskId: task.id },
            successMessage: "Task started successfully.",
            notificationType: TauriAction.StartTask,
            userSettings,
            callback: handleDataFetch(task, TauriAction.StartTask)
        });
    }

    /** Pause a task that's in progress. 
     * @param task - The task to pause.
    */
    const pauseTask = async (task: Task) => {
        await invoke<void>({
            command: "pause_task",
            params: { taskId: task.id },
            successMessage: "Task paused successfully.",
            notificationType: TauriAction.PauseTask,
            userSettings,
            callback: handleDataFetch(task, TauriAction.PauseTask)
        });
    }

    /** Resume a paused task.
     * @param task - The task to resume.
     */
    const resumeTask = async (task: Task) => {
        await invoke<void>({
            command: "resume_task",
            params: { taskId: task.id },
            successMessage: "Task resumed successfully.",
            notificationType: TauriAction.ResumeTask,
            userSettings,
            callback: handleDataFetch(task, TauriAction.ResumeTask)
        });
    }

    /** Finish a task that's in progress. 
     * @param task - The task to finish.
    */
    const finishTask = async (task: Task) => {
        await invoke<void>({
            command: "finish_task",
            params: { taskId: task.id },
            successMessage: "Task finished successfully.",
            notificationType: TauriAction.FinishTask,
            userSettings,
            callback: handleDataFetch(task, TauriAction.FinishTask)
        });
    }

    /** Cancel a task because it won't be needed. 
     * @param task - The task to cancel.
    */
    const cancelTask = async (task: Task) => {
        modals.openConfirmModal({
            title: 'Cancel Task',
            children: (
                <Text>Are you sure you want to cancel this task?</Text>
            ),
            labels: { confirm: "Confirm", cancel: "Deny" },
            confirmProps: {
                variant: colorPalette.variant, color: "red", gradient: { ...colorPalette.gradient, from: "red" }
            },
            cancelProps: { variant: colorPalette.variant, color: colorPalette.colorName, gradient: colorPalette.gradient },
            onCancel: () => { },
            onConfirm: async () => await invoke<void>({
                command: "cancel_task",
                params: { taskId: task.id },
                successMessage: "Task cancelled successfully.",
                notificationType: TauriAction.CancelTask,
                userSettings,
                callback: handleDataFetch(task, TauriAction.CancelTask)
            })
        });
    }

    /** Restore a cancelled task.
     * @param task - The task to restore.
     */
    const restoreTask = async (task: Task) => {
        await invoke<void>({
            command: "restore_task",
            params: { taskId: task.id },
            successMessage: "Task restored successfully.",
            notificationType: TauriAction.RestoreCancelledTask,
            userSettings,
            callback: handleDataFetch(task, TauriAction.RestoreCancelledTask)
        });
    }

    /** Reopen a task that has been finished. 
     * @param task - The task to reopen.
    */
    const reopenTask = async (task: Task) => {
        await invoke<void>({
            command: "reopen_task",
            params: { taskId: task.id },
            successMessage: "Task reopened successfully.",
            notificationType: TauriAction.ReopenFinishedTask,
            userSettings,
            callback: handleDataFetch(task, TauriAction.ReopenFinishedTask)
        });
    }

    /** Delete a task completely.
     * @param task - The task to be deleted.
     */
    const deleteTask = async (task: Task) => {
        modals.openConfirmModal({
            title: "Delete Task",
            children: (
                <Text>Are you sure you want to delete this task?</Text>
            ),
            confirmProps: {
                variant: colorPalette.variant, color: "red", gradient: { ...colorPalette.gradient, from: "red" }
            },
            cancelProps: { variant: colorPalette.variant, color: colorPalette.colorName, gradient: colorPalette.gradient },
            labels: { confirm: "Confirm", cancel: "Deny" },
            onCancel: () => { },
            onConfirm: async () => await invoke<void>({
                command: "delete_task",
                params: { taskId: task.id },
                successMessage: "Task deleted successfully.",
                notificationType: TauriAction.DeleteTask,
                userSettings,
                callback: handleDataFetch(task, TauriAction.DeleteTask)
            })
        });
    }

    /** Edit a task.
     * @param previousTask - The previous version of the same task before it was edited to make data comparisons.
     * @param task - The updated task to save.
     * @param callback - A void function to update any external state after the fact.
     */
    const editTask = async (previousTask: Task | null, task: EditTask, callback?: () => void) => {
        if (!!previousTask && previousTask !== null && previousTask.elapsedDuration === task.elapsedDuration) {
            task.elapsedDuration = null;
        }

        await invoke<void>({
            command: "edit_task",
            params: { task },
            successMessage: "Task updated successfully.",
            notificationType: TauriAction.EditTask,
            userSettings,
            callback: handleDataFetch(task, TauriAction.EditTask)
        });
        callback?.();
    }



    return {
        searchForTasks,
        createTask,
        editTask,
        startTask,
        pauseTask,
        resumeTask,
        finishTask,
        cancelTask,
        restoreTask,
        reopenTask,
        deleteTask,
    };
}

export default useTaskService;