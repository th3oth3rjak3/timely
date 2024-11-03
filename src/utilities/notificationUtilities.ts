import { notifications } from "@mantine/notifications";
import { UserSettings } from "../features/settings/UserSettings";
import { Stringer } from "./formUtilities";

export function showSuccessNotification<T extends Stringer>(settingType: NotificationType, userSettings: UserSettings, message: T, duration: number = 4000) {
    if (shouldShowSuccessNotification(settingType, userSettings)) {
        notifications.show({
            title: "Success",
            message: message.toString(),
            autoClose: duration,
            color: "green",
            withBorder: true,
        });
    }
}

export enum NotificationType {
    AddNewComment = "Add New Comment",
    AddNewTag = "Add New Tag",
    AddNewTask = "Add New Task",
    AddTagToTask = "Add Tag To Task",
    CancelTask = "Cancel Task",
    DeleteComment = "Delete Comment",
    DeleteTag = "Delete Tag",
    DeleteTask = "Delete Task",
    EditTag = "Edit Tag",
    FinishTask = "Finish Task",
    PauseTask = "Pause Task",
    RefreshTasks = "Refresh Tasks",
    RemoveTagFromTask = "Remove Tag From Task",
    ReopenFinishedTask = "Reopen Finished Task",
    RestoreCancelledTask = "Restore Cancelled Task",
    ResumeTask = "Resume Task",
    StartTask = "Start Task",
    EditComment = "Edit Comment",
    EditSettings = "Edit Settings",
    EditTask = "Edit Task",
}

export function shouldShowSuccessNotification(settingType: NotificationType, userSettings: UserSettings): boolean {
    const settingName = settingType.toString();
    const notificationSetting = userSettings.notificationSettings.find(s => s.name === settingName);
    return notificationSetting === undefined || notificationSetting.enabled;
}

export function showErrorNotification<T extends Stringer>(error: T, duration: number = 8000) {
    notifications.show({
        title: "Failure",
        message: `Error: '${error.toString()}'`,
        autoClose: duration,
        color: "red",
        withBorder: true,
    });
}