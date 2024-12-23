import { QueryClient, useMutation, useQuery } from "@tanstack/react-query";
import { invoke } from "@tauri-apps/api/core";
import { TimelyAction } from "../../models/TauriAction";
import { UserSettings } from "../../models/ZodModels";
import {
  showErrorNotification,
  showSuccessNotification,
} from "../../utilities/notificationUtilities";
import { tryMap } from "../../utilities/nullableUtilities";

const defaultUserSettings = {
  homePage: "",
  pageSize: 5,
  colorScheme: "blue",
  buttonVariant: "filled",
  gradientFrom: "",
  gradientTo: "",
  gradientDegrees: 0,
  navbarOpened: true,
  notificationSettings: [],
};

/** Determine if the user settings have actually been gotten from the database yet. */
export function isDefaultSettings(userSettings: UserSettings): boolean {
  return userSettings.homePage === ""; // All homePage paths are set to a real value, not an empty string.
}

/** Fetch the user settings from the backend. */
export function useUserSettings() {
  return useQuery({
    queryKey: ["userSettings"],
    queryFn: async (): Promise<UserSettings> => {
      const settings = await invoke("get_user_settings");
      return tryMap(settings, UserSettings.parse) ?? defaultUserSettings;
    },
    initialData: defaultUserSettings,
  });
}

export function useUpdateUserSettings(queryClient: QueryClient) {
  return useMutation({
    mutationFn: async (userSettings: UserSettings): Promise<void> => {
      await invoke("update_user_settings", { settings: { ...userSettings } });
    },
    onSuccess: (_, variables) => {
      showSuccessNotification(
        TimelyAction.EditSettings,
        variables,
        "Successfully updated settings."
      );
      queryClient.invalidateQueries({ queryKey: ["userSettings"] });
    },
    onError: (error) => {
      showErrorNotification(error);
    },
  });
}
