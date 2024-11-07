import { InvokeArgs, invoke as tauriInvoke } from "@tauri-apps/api/core";
import { UserSettings } from "../features/settings/UserSettings";
import {
  showErrorNotification,
  showSuccessNotification,
} from "../utilities/notificationUtilities";
import { TimelyAction } from "../models/TauriAction";

const useTauri = () => {
  type Props = {
    command: string;
    params?: InvokeArgs;
    successMessage?: string;
    notificationType?: TimelyAction;
    userSettings?: UserSettings;
    callback?: () => void | Promise<void>;
  };

  async function invoke<T>({
    command,
    params,
    successMessage,
    notificationType,
    userSettings,
    callback,
  }: Props): Promise<T | undefined> {
    try {
      const result = await tauriInvoke<T>(command, params);
      if (callback !== undefined) {
        await callback();
      }
      if (
        successMessage !== undefined &&
        notificationType !== undefined &&
        userSettings !== undefined
      ) {
        showSuccessNotification(notificationType, userSettings, successMessage);
      }

      return result;
    } catch (error: any) {
      showErrorNotification(error);
    }
  }

  return { invoke };
};

export default useTauri;