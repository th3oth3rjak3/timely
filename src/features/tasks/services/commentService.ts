import { useMutation } from "@tanstack/react-query";
import { invoke } from "@tauri-apps/api/core";
import { TimelyAction } from "../../../models/TauriAction";
import { UserSettings } from "../../../models/ZodModels";
import {
  showErrorNotification,
  showSuccessNotification,
} from "../../../utilities/notificationUtilities";

export function useAddComment(userSettings: UserSettings) {
  return useMutation({
    mutationFn: async (values: { taskId: number; message: string }) => {
      const { taskId, message } = values;
      await invoke("add_comment", { comment: { taskId, message } });
    },
    onSuccess: () => {
      showSuccessNotification(
        TimelyAction.AddNewComment,
        userSettings,
        "Added comment successfully."
      );
    },
    onError: (error) => {
      showErrorNotification(error);
    },
  });
}

export function useEditComment(userSettings: UserSettings) {
  return useMutation({
    mutationFn: async (values: { commentId: number; message: string }) => {
      const { commentId, message } = values;
      await invoke("update_comment", { comment: { id: commentId, message } });
    },
    onSuccess: () => {
      showSuccessNotification(
        TimelyAction.EditComment,
        userSettings,
        "Updated comment successfully."
      );
    },
    onError: (error) => {
      showErrorNotification(error);
    },
  });
}

export function useDeleteComment(userSettings: UserSettings) {
  return useMutation({
    mutationFn: async (commentId: number) => {
      await invoke("delete_comment", { id: commentId });
    },
    onSuccess: () => {
      showSuccessNotification(
        TimelyAction.DeleteComment,
        userSettings,
        "Deleted comment successfully."
      );
    },
    onError: (error) => showErrorNotification(error),
  });
}
