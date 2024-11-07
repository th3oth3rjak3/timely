import { useMantineTheme } from "@mantine/core";
import StyledButton from "../../components/StyledButton";
import * as Mantine from "../../mantine";
import { TimeSpan } from "../../models/TimeSpan";
import { useAppDispatch, useAppSelector } from "../../redux/hooks";
import {
  pauseTimer,
  resetTimer,
  startTimer,
} from "../../redux/reducers/timerSlice";
import useColorService from "../settings/hooks/useColorService";

function CountdownTimer() {
  const dispatch = useAppDispatch();
  const { time, isActive, isPaused } = useAppSelector((state) => state.timer);
  const userSettings = useAppSelector((state) => state.settings.userSettings);
  const theme = useMantineTheme();
  const { colorPalette } = useColorService(theme, userSettings);

  const displayTime = TimeSpan.fromSeconds(time).toString();

  const handleTimerToggle = () => {
    if (!isActive || isPaused || time === 0) {
      dispatch(startTimer());
    } else {
      dispatch(pauseTimer());
    }
  };

  const handleTimerReset = () => {
    dispatch(resetTimer());
  };

  return (
    <div>
      <Mantine.Text size="lg">{displayTime}</Mantine.Text>
      <StyledButton
        label={isActive ? "Pause" : "Start"}
        colorPalette={colorPalette}
        onClick={handleTimerToggle}
      />
      <StyledButton
        label="Reset"
        colorPalette={colorPalette}
        onClick={handleTimerReset}
      />
    </div>
  );
}

export default CountdownTimer;
