import { Text } from "@mantine/core";
import { modals } from "@mantine/modals";
import { useMemo } from "react";
import useTauri from "../../../hooks/useTauri";
import { PagedData } from "../../../models/PagedData";
import { useAppDispatch, useAppSelector } from "../../../redux/hooks";
import { setCurrentTaskPage } from "../../../redux/reducers/settingsSlice";
import { findLastPage } from "../../../utilities/dataTableUtilities";
import { NotificationType } from "../../../utilities/notificationUtilities";
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

    const shouldChangePages = useMemo(() => {
        return lastPage < taskSearchParams.page;
    }, [lastPage, taskSearchParams]);

    const handleDataFetch = async () => {
        if (shouldChangePages) {
            dispatch(setCurrentTaskPage(lastPage));
        } else {
            await fetchAllData?.();
        }
    }

    /** Create a new task. 
     * @param task - The task to create.
    */
    const createTask = async (task: NewTask) => {
        console.log(JSON.stringify(task, undefined, 2));
        await invoke<void>({
            command: "create_task",
            params: { newTask: task },
            successMessage: "New task added successfully.",
            notificationType: NotificationType.AddNewTask,
            userSettings,
            callback: handleDataFetch
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
            notificationType: NotificationType.StartTask,
            userSettings,
            callback: handleDataFetch
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
            notificationType: NotificationType.PauseTask,
            userSettings,
            callback: handleDataFetch
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
            notificationType: NotificationType.ResumeTask,
            userSettings,
            callback: handleDataFetch
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
            notificationType: NotificationType.FinishTask,
            userSettings,
            callback: handleDataFetch
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
                notificationType: NotificationType.CancelTask,
                userSettings,
                callback: handleDataFetch
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
            notificationType: NotificationType.RestoreCancelledTask,
            userSettings,
            callback: handleDataFetch
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
            notificationType: NotificationType.ReopenFinishedTask,
            userSettings,
            callback: handleDataFetch
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
                notificationType: NotificationType.DeleteTask,
                userSettings,
                callback: handleDataFetch
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
            notificationType: NotificationType.EditTask,
            userSettings,
            callback: handleDataFetch
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