import { useMantineTheme } from "@mantine/core";
import useColorService from "../features/settings/hooks/useColorService";
import { useAppSelector } from "../redux/hooks";

const useColorPalette = () => {
  const theme = useMantineTheme();
  const userSettings = useAppSelector((state) => state.settings.userSettings);
  const { colorPalette } = useColorService(theme, userSettings);

  return colorPalette;
};

export default useColorPalette;
