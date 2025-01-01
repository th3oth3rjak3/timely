import { notifications } from "@mantine/notifications";
import { ColorPalette } from "../hooks/useColorPalette.tsx";
import { TimelyAction } from "../models/TauriAction";
import { UserSettings } from "../models/ZodModels";
import { Stringer } from "./formUtilities";

export function showTimerNotification<T extends Stringer>(
  colorPalette: ColorPalette,
  message: T,
  callback: () => void
) {
  notifications.show({
    title: "Time's Up!",
    message: message.toString(),
    autoClose: false,
    color: colorPalette.colorName,
    withBorder: true,
    onClose: callback,
  });
}

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

export function showErrorNotification<T extends Stringer>(error: T) {
  notifications.show({
    title: "Failure",
    message: `Error: '${error.toString()}'`,
    autoClose: false,
    color: "red",
    withBorder: true,
  });
}

export function showInfoNotification<T extends Stringer>(message: T) {
  notifications.show({
    title: "Info",
    message: message.toString(),
    autoClose: false,
    color: "cyan",
    withBorder: true,
  });
}
