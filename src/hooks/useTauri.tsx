import { InvokeArgs, invoke as tauriInvoke } from "@tauri-apps/api/core";
import { TimelyAction } from "../models/TauriAction";
import { UserSettings } from "../models/ZodModels";
import {
  showErrorNotification,
  showSuccessNotification,
} from "../utilities/notificationUtilities";

const useTauri = () => {
  interface UseTauriProps {
    command: string;
    params?: InvokeArgs;
    successMessage?: string;
    notificationType?: TimelyAction;
    userSettings?: UserSettings;
    callback?: () => void | Promise<void>;
  }

  async function invoke<T>({
    command,
    params,
    successMessage,
    notificationType,
    userSettings,
    callback,
  }: UseTauriProps): Promise<T | null> {
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
      return null;
    }
  }

  return { invoke };
};

export default useTauri;
