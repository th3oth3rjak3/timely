import { useMantineTheme } from "@mantine/core";
import useColorService from "../features/settings/hooks/useColorService";
import { useUserSettings } from "../features/settings/settingsService";

const useColorPalette = () => {
  const theme = useMantineTheme();
  const { data: userSettings } = useUserSettings();
  const { colorPalette } = useColorService(theme, userSettings);

  return colorPalette;
};

export default useColorPalette;
