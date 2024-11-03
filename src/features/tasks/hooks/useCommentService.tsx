import useTauri from "../../../hooks/useTauri";
import { NotificationType } from "../../../utilities/notificationUtilities";
import { UserSettings } from "../../settings/UserSettings";

const useCommentService = (userSettings: UserSettings) => {
    const { invoke } = useTauri();

    const addComment = async (taskId: number, message: string, callback: () => void | Promise<void>) => {
        await invoke<void>({
            command: "add_comment",
            params: { comment: { taskId, message } },
            successMessage: "Added comment successfully.",
            notificationType: NotificationType.AddNewComment,
            userSettings,
            callback
        });
    }

    const editComment = async (commentId: number, message: string, callback: () => void | Promise<void>) => {
        await invoke<void>({
            command: "update_comment",
            params: { comment: { id: commentId, message } },
            successMessage: "Updated comment successfully.",
            notificationType: NotificationType.EditComment,
            userSettings,
            callback
        });
    }

    const deleteComment = async (commentId: number, callback: () => void | Promise<void>) => {
        await invoke<void>({
            command: "delete_comment",
            params: { id: commentId },
            successMessage: "Deleted comment successfully.",
            notificationType: NotificationType.DeleteComment,
            userSettings,
            callback
        });
    }

    return {
        addComment,
        editComment,
        deleteComment,
    }
}

export default useCommentService;