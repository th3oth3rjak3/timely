import useTauri from "../../../hooks/useTauri";
import { TimelyAction } from "../../../models/TauriAction";
import { useAppDispatch } from "../../../redux/hooks";
import { setUserSettings } from "../../../redux/reducers/settingsSlice";
import { tryMap } from "../../../utilities/nullableUtilities";
import { UserSettings } from "../UserSettings";

export interface Settings {
  pageSize: string;
  homePage: string;
  colorScheme: string;
}

function useSettingsService() {
  const { invoke } = useTauri();
  const dispatch = useAppDispatch();

  const getUserSettings = async (): Promise<UserSettings | null> => {
    const settings = await invoke<UserSettings>({
      command: "get_user_settings",
    });

    return tryMap(settings, UserSettings.parse);
  };

  /** Update existing user settings. */
  const updateUserSettings = async (
    settings: UserSettings,
    callback: () => void | Promise<void>
  ) => {
    const updated = await invoke<UserSettings>({
      command: "update_user_settings",
      params: { settings: { ...settings } },
      successMessage: "Successfully updated settings.",
      userSettings: settings,
      notificationType: TimelyAction.EditSettings,
      callback,
    });

    if (updated) {
      dispatch(setUserSettings(updated));
    }
  };

  return {
    getUserSettings,
    updateUserSettings,
  };
}

export default useSettingsService;