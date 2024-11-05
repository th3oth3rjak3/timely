import { notifications } from "@mantine/notifications";
import { UserSettings } from "../features/settings/UserSettings";
import { TauriAction } from "../models/TauriAction";
import { Stringer } from "./formUtilities";

export function showSuccessNotification<T extends Stringer>(
  settingType: TauriAction,
  userSettings: UserSettings,
  message: T,
  duration: number = 4000
) {
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

export function shouldShowSuccessNotification(
  actionType: TauriAction,
  userSettings: UserSettings
): boolean {
  const settingName = actionType.toString();
  const notificationSetting = userSettings.notificationSettings.find(
    (s) => s.name === settingName
  );
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