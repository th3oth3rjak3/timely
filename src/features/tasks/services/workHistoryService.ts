import {useMutation} from "@tanstack/react-query";
import {invoke} from "@tauri-apps/api/core";
import {TimelyAction} from "../../../models/TauriAction";
import {UserSettings} from "../../../models/ZodModels";
import {showErrorNotification, showSuccessNotification,} from "../../../utilities/notificationUtilities";
import {EditTaskWorkHistory, NewTaskWorkHistory} from "../types/Task";

export function useAddWorkHistory(userSettings: UserSettings) {
  return useMutation({
    mutationFn: async (history: NewTaskWorkHistory) => {
      await invoke("add_task_work_history", {newTaskWorkHistory: history});
    },
    onSuccess: () => {
      showSuccessNotification(
        TimelyAction.AddNewWorkHistory,
        userSettings,
        "Added new work history successfully."
      );
    },
    onError: (error) => showErrorNotification(error),
  });
}

export function useEditWorkHistory(userSettings: UserSettings) {
  return useMutation({
    mutationFn: async (history: EditTaskWorkHistory) => {
      await invoke("edit_task_work_history", {editTaskWorkHistory: history});
    },
    onSuccess: () =>
      showSuccessNotification(
        TimelyAction.EditWorkHistory,
        userSettings,
        "Updated work history successfully."
      ),
    onError: (error) => showErrorNotification(error),
  });
}

export function useDeleteWorkHistory(userSettings: UserSettings) {
  return useMutation({
    mutationFn: async (historyId: number) => {
      await invoke("delete_task_work_history", {historyId});
    },
    onSuccess: () =>
      showSuccessNotification(
        TimelyAction.DeleteWorkHistory,
        userSettings,
        "Deleted work history successfully."
      ),
    onError: (error) => showErrorNotification(error),
  });
}
