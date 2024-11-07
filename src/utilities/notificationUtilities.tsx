import { notifications } from "@mantine/notifications";
import { UserSettings } from "../features/settings/UserSettings";
import { TimelyAction } from "../models/TauriAction";
import { Stringer } from "./formUtilities";

export function showSuccessNotification<T extends Stringer>(
  settingType: TimelyAction,
  userSettings: UserSettings,
  message: T,
  callback?: () => void,
  duration: number = 4000
) {
  if (shouldShowSuccessNotification(settingType, userSettings)) {
    notifications.show({
      title: "Success",
      message: message.toString(),
      autoClose: duration === 0 ? false : duration,
      color: "green",
      withBorder: true,
      onClose: () => callback?.(),
    });
  }
}

export function shouldShowSuccessNotification(
  actionType: TimelyAction,
  userSettings: UserSettings
): boolean {
  const settingName = actionType.toString();
  const notificationSetting = userSettings.notificationSettings.find(
    (s) => s.name === settingName
  );
  return notificationSetting === undefined || notificationSetting.enabled;
}

export function showErrorNotification<T extends Stringer>(
  error: T,
  duration: number = 8000
) {
  notifications.show({
    title: "Failure",
    message: `Error: '${error.toString()}'`,
    autoClose: duration,
    color: "red",
    withBorder: true,
  });
}
